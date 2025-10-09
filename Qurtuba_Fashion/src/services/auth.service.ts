import { supabase } from '../db/client';
import { localAuthService } from './local-auth.service';

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
          this.currentUser = authData.user;
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
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
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
        if (!users.password_hash) {
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

        const isValidPassword = await this.verifyPassword(password, users.password_hash);
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
          .eq('id', users.id);

        // Set current user
        this.currentUser = users;

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
          user: users
        };

      } catch (dbError) {
        console.log('Database error, using local authentication:', dbError);
        // Fallback to local auth
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

        // Create user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            code: userData.code,
            name: userData.name,
            email: userData.email.toLowerCase().trim(),
            phone: userData.phone,
            password_hash: passwordHash,
            status: userData.status,
            role: userData.role,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          return {
            success: false,
            error: 'فشل في إنشاء المستخدم: ' + error.message
          };
        }

        return {
          success: true,
          user: newUser
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
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error('فشل في جلب المستخدمين: ' + error.message);
        }

        return users || [];
      } catch (dbError) {
        console.log('Database unavailable, using local authentication for users');
        // Fallback to local auth
        return await localAuthService.getUsers();
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
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          return {
            success: false,
            error: 'فشل في تحديث المستخدم: ' + error.message
          };
        }

        // Update current user if it's the same user
        if (this.currentUser?.id === userId) {
          this.currentUser = updatedUser;
        }

        return {
          success: true,
          user: updatedUser
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
