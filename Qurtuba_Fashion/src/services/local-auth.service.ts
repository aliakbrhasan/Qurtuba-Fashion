import { User, LoginCredentials, AuthResult } from './auth.service';

// Local authentication service for testing without database
class LocalAuthService {
  private static instance: LocalAuthService;
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'qurtuba_auth';
  private readonly REMEMBER_KEY = 'qurtuba_remember';

  // Mock users for local testing
  private mockUsers: User[] = [
    {
      id: '1',
      code: 'ADMIN001',
      name: 'مدير النظام',
      email: 'admin@qurtuba.com',
      phone: '07701234567',
      status: 'ادمن',
      role: 'مدير النظام',
      is_active: true,
      created_at: new Date().toISOString(),
      last_login: undefined
    },
    {
      id: '2',
      code: 'EMP001',
      name: 'أحمد محمد',
      email: 'ahmed@qurtuba.com',
      phone: '07701234568',
      status: 'موظف',
      role: 'مندوب مبيعات',
      is_active: true,
      created_at: new Date().toISOString(),
      last_login: undefined
    },
    {
      id: '3',
      code: 'ACC001',
      name: 'فاطمة علي',
      email: 'fatima@qurtuba.com',
      phone: '07701234569',
      status: 'محاسب',
      role: 'محاسب مالي',
      is_active: true,
      created_at: new Date().toISOString(),
      last_login: undefined
    }
  ];

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): LocalAuthService {
    if (!LocalAuthService.instance) {
      LocalAuthService.instance = new LocalAuthService();
    }
    return LocalAuthService.instance;
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Check if user is remembered
      const remembered = localStorage.getItem(this.REMEMBER_KEY);
      if (remembered === 'true') {
        const storedAuth = localStorage.getItem(this.STORAGE_KEY);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          // Check if stored data is not too old (30 days)
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          if (authData.timestamp > thirtyDaysAgo) {
            this.currentUser = authData.user;
          } else {
            // Clear expired data
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.REMEMBER_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  // Hash password using Web Crypto API (currently unused in local auth)
  // private async hashPassword(password: string): Promise<string> {
  //   const encoder = new TextEncoder();
  //   const data = encoder.encode(password);
  //   const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  //   const hashArray = Array.from(new Uint8Array(hashBuffer));
  //   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // }

  // Verify password (currently unused in local auth)
  // private async verifyPassword(password: string, hash: string): Promise<boolean> {
  //   const passwordHash = await this.hashPassword(password);
  //   return passwordHash === hash;
  // }

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

      // Find user in mock data
      const user = this.mockUsers.find(u => 
        u.email.toLowerCase().trim() === email.toLowerCase().trim() && 
        u.is_active
      );

      if (!user) {
        return {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
      }

      // Simple password verification for demo
      // In real app, you would verify against stored hash
      const validPasswords: { [key: string]: string } = {
        'admin@qurtuba.com': 'admin123',
        'ahmed@qurtuba.com': 'ahmed123',
        'fatima@qurtuba.com': 'fatima123'
      };

      if (validPasswords[email.toLowerCase().trim()] !== password) {
        return {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
      }

      // Update last login
      user.last_login = new Date().toISOString();

      // Set current user
      this.currentUser = user;

      // Store auth data if remember me is checked
      if (rememberMe) {
        const authData = {
          user: user,
          timestamp: Date.now()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
        localStorage.setItem(this.REMEMBER_KEY, 'true');
      }

      return {
        success: true,
        user: user
      };

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

  // Get all users (admin only)
  public async getUsers(): Promise<User[]> {
    try {
      if (!this.isAdmin()) {
        throw new Error('ليس لديك صلاحية لعرض المستخدمين');
      }
      return this.mockUsers;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
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

      // Check if email already exists
      const existingUser = this.mockUsers.find(u => u.email === userData.email.toLowerCase().trim());
      if (existingUser) {
        return {
          success: false,
          error: 'البريد الإلكتروني مستخدم بالفعل'
        };
      }

      // Check if code already exists
      const existingCode = this.mockUsers.find(u => u.code === userData.code);
      if (existingCode) {
        return {
          success: false,
          error: 'كود المستخدم مستخدم بالفعل'
        };
      }

      // Create new user
      const newUser: User = {
        id: (this.mockUsers.length + 1).toString(),
        code: userData.code,
        name: userData.name,
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone,
        status: userData.status,
        role: userData.role,
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: undefined
      };

      this.mockUsers.push(newUser);

      return {
        success: true,
        user: newUser
      };

    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء إنشاء المستخدم'
      };
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

      const userIndex = this.mockUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return {
          success: false,
          error: 'المستخدم غير موجود'
        };
      }

      this.mockUsers[userIndex] = { ...this.mockUsers[userIndex], ...updates };

      // Update current user if it's the same user
      if (this.currentUser?.id === userId) {
        this.currentUser = this.mockUsers[userIndex];
      }

      return {
        success: true,
        user: this.mockUsers[userIndex]
      };

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

      const userIndex = this.mockUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return {
          success: false,
          error: 'المستخدم غير موجود'
        };
      }

      this.mockUsers.splice(userIndex, 1);

      return { success: true };

    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء حذف المستخدم'
      };
    }
  }

  // Update user password
  public async updatePassword(userId: string, _newPassword: string): Promise<AuthResult> {
    try {
      const userIndex = this.mockUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return {
          success: false,
          error: 'المستخدم غير موجود'
        };
      }

      // In local auth, we don't actually store password hashes
      // We just simulate a successful password update
      // The password verification is done against the hardcoded passwords in login
      
      // Update last login to show the user was modified
      this.mockUsers[userIndex].last_login = new Date().toISOString();

      // Update current user if it's the same user
      if (this.currentUser?.id === userId) {
        this.currentUser = this.mockUsers[userIndex];
      }

      return { success: true };

    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء تحديث كلمة المرور'
      };
    }
  }
}

export const localAuthService = LocalAuthService.getInstance();

