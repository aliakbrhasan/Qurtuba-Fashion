import { supabase } from '../db/client';
import { localAuthService } from './local-auth.service';
import { sanitizeArabicText } from '../utils/encoding';

export interface User {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  status: 'ادمن' | 'موظف' | 'محاسب';
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'qurtuba_auth';
  private readonly REMEMBER_KEY = 'qurtuba_remember';
  private schemaCache: { users_has_role?: boolean; users_has_role_id?: boolean } = {};
  private rolesCache: Map<string, string> = new Map();

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Check if user is remembered
      const remembered = localStorage.getItem(this.REMEMBER_KEY);
      if (remembered === 'true') {
        const storedAuth = localStorage.getItem(this.STORAGE_KEY);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          const user = authData.user as User;
          // Sanitize persisted values in case they were saved garbled
          this.currentUser = {
            ...user,
            name: sanitizeArabicText(user.name),
            role: sanitizeArabicText(user.role),
            status: user.status
          };
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  // Hash password using Web Crypto API
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  // Detect if a column exists on a table (cached per session)
  private async tableHasColumn(table: string, column: string): Promise<boolean> {
    const cacheKey = `${table}_has_${column}` as const;
    if ((this.schemaCache as any)[cacheKey] !== undefined) {
      return (this.schemaCache as any)[cacheKey];
    }
    try {
      const { error } = await supabase.from(table).select(column).limit(1);
      const exists = !error || (error as any)?.code !== '42703';
      (this.schemaCache as any)[cacheKey] = exists;
      return exists;
    } catch (err: any) {
      const exists = err?.code !== '42703';
      (this.schemaCache as any)[cacheKey] = exists;
      return exists;
    }
  }

  private async getRoleIdByName(roleName: string): Promise<string | null> {
    const name = sanitizeArabicText(roleName);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id')
        .eq('name', name)
        .single();
      if (error || !data) return null;
      return data.id as string;
    } catch {
      return null;
    }
  }
  private normalizeUserRow(row: any): User {
    const roleName = sanitizeArabicText(row?.role ?? row?.roles?.name ?? '');
    const normalized: User = {
      id: row.id,
      code: row.code,
      name: sanitizeArabicText(row.name),
      email: row.email,
      phone: row.phone,
      status: row.status,
      role: roleName,
      is_active: row.is_active,
      created_at: row.created_at,
      last_login: row.last_login
    };
    return normalized;
  }


  // Reserved for future use when resolving role names from role_id on-demand
  private async getRoleNameById(roleId: string): Promise<string | null> {
    if (!roleId) return null;
    if (this.rolesCache.has(roleId)) return this.rolesCache.get(roleId)!;
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .eq('id', roleId)
        .single();
      if (error || !data) return null;
      const name = sanitizeArabicText((data as any).name);
      this.rolesCache.set(roleId, name);
      return name;
    } catch {
      return null;
    }
  }

  // Login user
  public async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password, rememberMe = false } = credentials;

      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: 'البريد الإلكتروني وكلمة المرور مطلوبان'
        };
      }

      // Try database first, fallback to local auth
      try {
        // Query user from database
        const usersHasRoleId = await this.tableHasColumn('users', 'role_id');

        const selectColumns = usersHasRoleId
          ? 'id, code, name, email, phone, status, is_active, created_at, last_login, role, role_id, roles:role_id(name)'
          : '*';

        const { data: users, error } = await supabase
          .from('users')
          .select(selectColumns)
          .eq('email', email.toLowerCase().trim())
          .eq('is_active', true)
          .single();

        if (error || !users) {
          // Fallback to local auth
          console.log('Database unavailable, using local authentication');
          const localResult = await localAuthService.login(credentials);
          if (localResult.success && localResult.user) {
            this.currentUser = localResult.user;
            if (rememberMe) {
              const authData = { user: localResult.user, timestamp: Date.now() };
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
              localStorage.setItem(this.REMEMBER_KEY, 'true');
            }
          }
          return localResult;
        }

        // Verify password or fallback to local auth for dev setup
        if (!(users as any).password_hash) {
          console.warn('User found without password_hash. Falling back to local auth.');
          const localResult = await localAuthService.login(credentials);
          if (localResult.success && localResult.user) {
            this.currentUser = localResult.user;
            if (rememberMe) {
              const authData = { user: localResult.user, timestamp: Date.now() };
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
              localStorage.setItem(this.REMEMBER_KEY, 'true');
            }
          }
          return localResult;
        }

        const isValidPassword = await this.verifyPassword(password, (users as any).password_hash);
        if (!isValidPassword) {
          console.warn('Password hash mismatch. Falling back to local auth.');
          const localResult = await localAuthService.login(credentials);
          if (localResult.success && localResult.user) {
            this.currentUser = localResult.user;
            if (rememberMe) {
              const authData = { user: localResult.user, timestamp: Date.now() };
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
              localStorage.setItem(this.REMEMBER_KEY, 'true');
            }
          }
          return localResult;
        }

        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', (users as any).id);

        // Normalize role name from join if present
        const normalizedUser: User = this.normalizeUserRow(users as any);

        // Set current user
        this.currentUser = normalizedUser;

        // Store auth data if remember me is checked
        if (rememberMe) {
          const authData = {
            user: users,
            timestamp: Date.now()
          };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
          localStorage.setItem(this.REMEMBER_KEY, 'true');
        }

        return {
          success: true,
          user: normalizedUser
        };

      } catch (dbError) {
        console.log('Database error, using local authentication:', dbError);
        // Fallback to local auth
        const localResult = await localAuthService.login(credentials);
        if (localResult.success && localResult.user) {
          this.currentUser = localResult.user;
          if (rememberMe) {
          const authData = { user: this.normalizeUserRow(localResult.user), timestamp: Date.now() };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
            localStorage.setItem(this.REMEMBER_KEY, 'true');
          }
        }
        return localResult;
      }

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى'
      };
    }
  }

  // Logout user
  public async logout(): Promise<void> {
    try {
      this.currentUser = null;
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.REMEMBER_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Check if user has specific role
  public hasRole(role: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.status === role || this.currentUser.role === role;
  }

  // Check if user is admin
  public isAdmin(): boolean {
    return this.hasRole('ادمن');
  }

  // Create new user (admin only)
  public async createUser(userData: {
    code: string;
    name: string;
    email: string;
    phone?: string;
    password: string;
    status: 'ادمن' | 'موظف' | 'محاسب';
    role: string;
  }): Promise<AuthResult> {
    try {
      if (!this.isAdmin()) {
        return {
          success: false,
          error: 'ليس لديك صلاحية لإنشاء مستخدمين جدد'
        };
      }

      // Try database first, fallback to local auth
      try {
        // Check if email already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', userData.email.toLowerCase().trim())
          .single();

        if (existingUser) {
          return {
            success: false,
            error: 'البريد الإلكتروني مستخدم بالفعل'
          };
        }

        // Check if code already exists
        const { data: existingCode } = await supabase
          .from('users')
          .select('id')
          .eq('code', userData.code)
          .single();

        if (existingCode) {
          return {
            success: false,
            error: 'كود المستخدم مستخدم بالفعل'
          };
        }

        // Hash password
        const passwordHash = await this.hashPassword(userData.password);

        // Decide whether to write role or role_id
        const usersHasRole = await this.tableHasColumn('users', 'role');
        const usersHasRoleId = await this.tableHasColumn('users', 'role_id');

        const insertPayload: any = {
          code: userData.code,
          name: sanitizeArabicText(userData.name),
          email: userData.email.toLowerCase().trim(),
          phone: userData.phone,
          password_hash: passwordHash,
          status: userData.status,
          is_active: true
        };

        if (usersHasRoleId) {
          const roleId = await this.getRoleIdByName(userData.role);
          if (roleId) insertPayload.role_id = roleId;
        }
        if (usersHasRole) {
          insertPayload.role = sanitizeArabicText(userData.role);
        }

        const { data: newUser, error } = await supabase
          .from('users')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          return {
            success: false,
            error: 'فشل في إنشاء المستخدم: ' + error.message
          };
        }

        const normalized: User = this.normalizeUserRow(newUser as any);

        return {
          success: true,
          user: normalized
        };
      } catch (dbError) {
        console.log('Database unavailable, using local authentication for create user');
        // Fallback to local auth
        return await localAuthService.createUser(userData);
      }

    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء إنشاء المستخدم'
      };
    }
  }

  // Update user password
  public async updatePassword(userId: string, newPassword: string): Promise<AuthResult> {
    try {
      // Try database first, fallback to local auth
      try {
        const passwordHash = await this.hashPassword(newPassword);

        const { error } = await supabase
          .from('users')
          .update({ password_hash: passwordHash })
          .eq('id', userId);

        if (error) {
          return {
            success: false,
            error: 'فشل في تحديث كلمة المرور: ' + error.message
          };
        }

        return { success: true };
      } catch (dbError) {
        console.log('Database unavailable, using local authentication for update password');
        // Fallback to local auth
        return await localAuthService.updatePassword(userId, newPassword);
      }

    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء تحديث كلمة المرور'
      };
    }
  }

  // Get all users (admin only)
  public async getUsers(): Promise<User[]> {
    try {
      if (!this.isAdmin()) {
        throw new Error('ليس لديك صلاحية لعرض المستخدمين');
      }

      // Try database first, fallback to local auth
      try {
        const usersHasRoleId = await this.tableHasColumn('users', 'role_id');
        const selectColumns = usersHasRoleId
          ? 'id, code, name, email, phone, status, is_active, created_at, last_login, role, role_id, roles:role_id(name)'
          : '*';

        const { data: users, error } = await supabase
          .from('users')
          .select(selectColumns)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error('فشل في جلب المستخدمين: ' + error.message);
        }

        return (users || []).map((u: any) => this.normalizeUserRow(u));
      } catch (dbError) {
        console.log('Database unavailable, using local authentication for users');
        // Fallback to local auth
        const local = await localAuthService.getUsers();
        return local.map((u: any) => this.normalizeUserRow(u));
      }

    } catch (error) {
      console.error('Get users error:', error);
      // Final fallback to local auth
      try {
        return await localAuthService.getUsers();
      } catch (localError) {
        console.error('Local auth also failed:', localError);
        throw error;
      }
    }
  }

  // Update user
  public async updateUser(userId: string, updates: Partial<User>): Promise<AuthResult> {
    try {
      if (!this.isAdmin() && this.currentUser?.id !== userId) {
        return {
          success: false,
          error: 'ليس لديك صلاحية لتحديث هذا المستخدم'
        };
      }

      // Try database first, fallback to local auth
      try {
        const usersHasRole = await this.tableHasColumn('users', 'role');
        const usersHasRoleId = await this.tableHasColumn('users', 'role_id');

        const payload: any = { ...updates };
        if (updates.name !== undefined) payload.name = sanitizeArabicText(updates.name);
        if (updates.role !== undefined && usersHasRole) payload.role = sanitizeArabicText(updates.role);
        if (updates.role !== undefined && usersHasRoleId) {
          const roleId = await this.getRoleIdByName(updates.role as string);
          if (roleId) payload.role_id = roleId;
        }

        const selectColumns = usersHasRoleId
          ? 'id, code, name, email, phone, status, is_active, created_at, last_login, role, role_id, roles:role_id(name)'
          : '*';

        const { data: updatedUser, error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', userId)
          .select(selectColumns)
          .single();

        if (error) {
          return {
            success: false,
            error: 'فشل في تحديث المستخدم: ' + error.message
          };
        }

        const normalized: User = this.normalizeUserRow(updatedUser as any);

        if (this.currentUser?.id === userId) this.currentUser = normalized;

        return {
          success: true,
          user: normalized
        };
      } catch (dbError) {
        console.log('Database unavailable, using local authentication for update user');
        // Fallback to local auth
        return await localAuthService.updateUser(userId, updates);
      }

    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء تحديث المستخدم'
      };
    }
  }

  // Delete user
  public async deleteUser(userId: string): Promise<AuthResult> {
    try {
      if (!this.isAdmin()) {
        return {
          success: false,
          error: 'ليس لديك صلاحية لحذف المستخدمين'
        };
      }

      if (this.currentUser?.id === userId) {
        return {
          success: false,
          error: 'لا يمكنك حذف حسابك الخاص'
        };
      }

      // Try database first, fallback to local auth
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) {
          return {
            success: false,
            error: 'فشل في حذف المستخدم: ' + error.message
          };
        }

        return { success: true };
      } catch (dbError) {
        console.log('Database unavailable, using local authentication for delete user');
        // Fallback to local auth
        return await localAuthService.deleteUser(userId);
      }

    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء حذف المستخدم'
      };
    }
  }
}

export const authService = AuthService.getInstance();
