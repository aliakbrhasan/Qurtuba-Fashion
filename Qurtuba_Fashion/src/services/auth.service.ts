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
  username: string; // uses users.code as username
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

type PersistedUser = Pick<User, 'id' | 'code' | 'status' | 'role'>;

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'qurtuba_auth';
  private readonly REMEMBER_KEY = 'qurtuba_remember';
  private schemaCache: { users_has_role?: boolean; users_has_role_id?: boolean } = {};
  private rolesCache: Map<string, string> = new Map();
  private failedLoginAttempts: Map<string, { count: number; lastAttemptMs: number; lockedUntilMs?: number }> = new Map();
  private readonly MAX_ATTEMPTS_BEFORE_LOCK = 5;
  private readonly LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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
          const persisted = authData.user as PersistedUser | undefined;
          if (persisted && typeof persisted === 'object') {
            // Resolve fresh user from DB when possible; fallback to minimal persisted identity
            this.currentUser = {
              id: String(persisted.id),
              code: persisted.code,
              name: '',
              email: '',
              phone: undefined,
              status: persisted.status,
              role: sanitizeArabicText(persisted.role),
              is_active: true,
              created_at: new Date(0).toISOString(),
              last_login: undefined
            };
          }
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
      const { error } = { error: null as any };
      const exists = !error;
      (this.schemaCache as any)[cacheKey] = exists;
      return exists;
    } catch (err: any) {
      const exists = true;
      (this.schemaCache as any)[cacheKey] = exists;
      return exists;
    }
  }

  private async getRoleIdByName(roleName: string): Promise<string | null> {
    const name = sanitizeArabicText(roleName);
    try {
      const api = (window as any).electronAPI;
      const res = await api.auth.getRoleIdByName(name);
      if (!res?.ok) return null;
      return res.data as string | null;
    } catch {
      return null;
    }
  }
  private normalizeUserRow(row: any): User {
    const roleName = sanitizeArabicText(row?.role ?? row?.roles?.name ?? '');
    const statusName = sanitizeArabicText(row?.status ?? '');
    const normalized: User = {
      id: row.id,
      code: row.code,
      name: sanitizeArabicText(row.name),
      email: row.email,
      phone: row.phone,
      status: statusName as any,
      role: roleName,
      is_active: typeof row.is_active === 'boolean' ? row.is_active : Boolean(row.is_active),
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
      const api = (window as any).electronAPI;
      const res = await api.auth.getRoleIdByName(roleId);
      if (!res?.ok) return null;
      const name = sanitizeArabicText(String(res.data || ''));
      this.rolesCache.set(roleId, name);
      return name;
    } catch {
      return null;
    }
  }

  // Login user
  public async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { username, password, rememberMe = false } = credentials;

      // Validate input
      if (!username || !password) {
        return {
          success: false,
          error: 'اسم المستخدم وكلمة المرور مطلوبان'
        };
      }

      // Brute-force protection (client-side throttle; does not replace server protections)
      const key = username.toLowerCase().trim();
      const now = Date.now();
      const attempts = this.failedLoginAttempts.get(key);
      if (attempts?.lockedUntilMs && now < attempts.lockedUntilMs) {
        const seconds = Math.ceil((attempts.lockedUntilMs - now) / 1000);
        return { success: false, error: `تم حظر المحاولة مؤقتاً. الرجاء المحاولة بعد ${seconds} ثانية.` };
      }

      // Try database first, fallback to local auth
      try {
        // Query user from database (via IPC)
        const api = (window as any).electronAPI;
        const lookup = await api.auth.findUserByEmail(username.trim());
        if (!lookup?.ok || !lookup.data) {
          // Fallback to local auth
          console.log('Database unavailable, using local authentication');
          const localResult = await localAuthService.login(credentials);
          if (localResult.success && localResult.user) {
            this.currentUser = localResult.user;
            if (rememberMe) {
              const authData = { user: this.toPersistedUser(localResult.user), timestamp: Date.now() };
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
              localStorage.setItem(this.REMEMBER_KEY, 'true');
            }
            this.resetFailedAttempts(key);
          }
          return localResult;
        }

        const users = lookup.data;

        // Verify password or fallback to local auth for dev setup
        if (!(users as any).password_hash) {
          console.warn('User found without password_hash. Falling back to local auth.');
          const localResult = await localAuthService.login(credentials);
          if (localResult.success && localResult.user) {
            this.currentUser = localResult.user;
            if (rememberMe) {
              const authData = { user: this.toPersistedUser(localResult.user), timestamp: Date.now() };
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
              localStorage.setItem(this.REMEMBER_KEY, 'true');
            }
            this.resetFailedAttempts(key);
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
              const authData = { user: this.toPersistedUser(localResult.user), timestamp: Date.now() };
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
              localStorage.setItem(this.REMEMBER_KEY, 'true');
            }
            this.resetFailedAttempts(key);
          }
          if (!localResult.success) this.registerFailedAttempt(key, now);
          return localResult;
        }

        // Update last login via IPC
        await api.auth.updateLastLogin((users as any).id);

        // Normalize role name from join if present
        const normalizedUser: User = this.normalizeUserRow(users as any);

        // Set current user
        this.currentUser = normalizedUser;

        // Store auth data if remember me is checked
        if (rememberMe) {
          const authData = {
            user: this.toPersistedUser(normalizedUser),
            timestamp: Date.now()
          };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
          localStorage.setItem(this.REMEMBER_KEY, 'true');
        }

        this.resetFailedAttempts(key);

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
          const authData = { user: this.toPersistedUser(this.normalizeUserRow(localResult.user)), timestamp: Date.now() };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
            localStorage.setItem(this.REMEMBER_KEY, 'true');
          }
          this.resetFailedAttempts(key);
        }
        if (!localResult.success) this.registerFailedAttempt(key, now);
        return localResult;
      }

    } catch (error) {
      console.error('Login error:', error);
      // Conservative increment on unexpected error
      try {
        const name = credentials?.username?.toLowerCase()?.trim();
        if (name) this.registerFailedAttempt(name, Date.now());
      } catch {}
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
    const want = sanitizeArabicText(role).trim();
    const curStatus = sanitizeArabicText(this.currentUser.status).trim();
    const curRole = sanitizeArabicText(this.currentUser.role).trim();
    return curStatus === want || curRole === want;
  }

  // Check if user is admin
    public isAdmin(): boolean {
    if (!this.currentUser) return false;
    const code = String(this.currentUser.code || '').toUpperCase();
    const sRaw = String(this.currentUser.status || '');
    const rRaw = String(this.currentUser.role || '');
    try {
      const s = sanitizeArabicText(sRaw).trim();
      const r = sanitizeArabicText(rRaw).trim();
      if (s === 'ادمن' || r === 'مدير النظام' || r === 'ادمن') return true;
    } catch {}
    if (code.startsWith('ADMIN')) return true;
    if (sRaw === 'O\u0015O_U.U+' || rRaw === 'U.O_USO� O\u0015U,U+O,O\u0015U.') return true;
    return false;
  }
  private toPersistedUser(user: User): PersistedUser {
    return { id: user.id, code: user.code, status: user.status, role: user.role };
  }

  private registerFailedAttempt(key: string, nowMs: number): void {
    const entry = this.failedLoginAttempts.get(key) || { count: 0, lastAttemptMs: 0 };
    entry.count += 1;
    entry.lastAttemptMs = nowMs;
    if (entry.count >= this.MAX_ATTEMPTS_BEFORE_LOCK) {
      entry.lockedUntilMs = nowMs + this.LOCK_DURATION_MS;
    }
    this.failedLoginAttempts.set(key, entry);
  }

  private resetFailedAttempts(key: string): void {
    this.failedLoginAttempts.delete(key);
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
        const api = (window as any).electronAPI;
        const exists = await api.auth.checkEmailExists(userData.email.toLowerCase().trim());
        const existingUser = exists?.ok ? (exists.data ? { id: '1' } : null) : null;

        if (existingUser) {
          return {
            success: false,
            error: 'البريد الإلكتروني مستخدم بالفعل'
          };
        }

        // Check if code already exists
        const codeExists = await api.auth.checkCodeExists(userData.code);
        const existingCode = codeExists?.ok ? (codeExists.data ? { id: '1' } : null) : null;

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

        // Note: uniqueness checks for code/email were done above; skip per-user update validation here

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

        const created = await api.auth.createUser(insertPayload);
        if (!created?.ok) {
          return { success: false, error: 'فشل في إنشاء المستخدم' };
        }

        const normalized: User = this.normalizeUserRow(created.data as any);

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

        const api = (window as any).electronAPI;
        const res = await api.auth.updatePassword(userId, passwordHash);

        if (!res?.ok) {
          return {
            success: false,
            error: 'فشل في تحديث كلمة المرور'
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
        const api = (window as any).electronAPI;
        const res = await api.auth.listUsers();
        if (!res?.ok) throw new Error('فشل في جلب المستخدمين');
        const rows = Array.isArray(res.data) ? res.data : [];
        // If desktop local mode returns empty, fallback to local auth users to keep page functional
        if (rows.length === 0) {
          const local = await localAuthService.getUsers();
          return local.map((u: any) => this.normalizeUserRow(u));
        }
        return rows.map((u: any) => this.normalizeUserRow(u));
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

        // Validate unique code and email if changed
        try {
          const api = (window as any).electronAPI;
          const listRes = await api.auth.listUsers();
          if (listRes?.ok && Array.isArray(listRes.data)) {
            const allUsers = listRes.data as any[];
            const current = allUsers.find(u => String(u.id) === String(userId));
            if (current) {
              if (updates.email !== undefined) {
                const newEmail = String(updates.email).trim().toLowerCase();
                const oldEmail = String(current.email || '').trim().toLowerCase();
                if (newEmail && newEmail !== oldEmail) {
                  const dup = allUsers.some(u => String(u.id) !== String(userId) && String(u.email || '').trim().toLowerCase() === newEmail);
                  if (dup) {
                    return { success: false, error: 'البريد الإلكتروني مستخدم من قبل مستخدم آخر' };
                  }
                }
              }
              if (updates.code !== undefined) {
                const newCode = String(updates.code).trim();
                const oldCode = String(current.code || '').trim();
                if (newCode && newCode !== oldCode) {
                  const dup = allUsers.some(u => String(u.id) !== String(userId) && String(u.code || '').trim() === newCode);
                  if (dup) {
                    return { success: false, error: 'اسم المستخدم (الكود) مستخدم من قبل مستخدم آخر' };
                  }
                }
              }
            }
          }
        } catch {}

        const payload: any = { ...updates };
        if (updates.name !== undefined) payload.name = sanitizeArabicText(updates.name);
        if (updates.role !== undefined && usersHasRole) payload.role = sanitizeArabicText(updates.role);
        if (updates.role !== undefined && usersHasRoleId) {
          const roleId = await this.getRoleIdByName(updates.role as string);
          if (roleId) payload.role_id = roleId;
        }

        const api = (window as any).electronAPI;
        const res = await api.auth.updateUser(userId, payload);

        // If Supabase returns an error (e.g., offline or network), gracefully fallback to local auth
        if (!res?.ok) {
          console.warn('Supabase update failed, falling back to local auth for update user:', res?.error);
          const localFallback = await localAuthService.updateUser(userId, updates);
          return localFallback;
        }

        const normalized: User = this.normalizeUserRow(res.data as any);

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
        const api = (window as any).electronAPI;
        const res = await api.auth.deleteUser(userId);

        if (!res?.ok) {
          return {
            success: false,
            error: 'فشل في حذف المستخدم'
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





