// Renderer must not call Supabase directly; use IPC via preload
import { sanitizeAction, sanitizePage, sanitizeRole, sanitizeArabicText } from '../utils/encoding';
// Local-only: Supabase disabled

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  allowedPages: string[];
  allowedActions: string[];
  isActive: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Page {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

class RolesService {
  private static instance: RolesService;
  private localData: {
    roles: Role[];
    pages: Page[];
    actions: Action[];
  } = {
    roles: [],
    pages: [],
    actions: []
  };

  // Simple persistent cache to keep UI consistent when DB is unreachable
  private readonly ROLES_CACHE_KEY = 'qurtuba_roles_cache';
  private readonly PAGES_CACHE_KEY = 'qurtuba_pages_cache';
  private readonly ACTIONS_CACHE_KEY = 'qurtuba_actions_cache';

  private constructor() {
    this.initializeLocalData();
  }

  private async getRoleIdByName(roleName: string): Promise<string | null> {
    try {
      const name = sanitizeArabicText(roleName);
      const api = (window as any).electronAPI;
      const all = await api.local.getRoles();
      const found = (all || []).find((r: any) => (r.name || '').trim() === name.trim());
      return found ? String(found.id) : null;
    } catch {
      return null;
    }
  }

  public static getInstance(): RolesService {
    if (!RolesService.instance) {
      RolesService.instance = new RolesService();
    }
    return RolesService.instance;
  }

  private isUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  private initializeLocalData(): void {
    // Default pages
    this.localData.pages = [
      { id: 'dashboard', name: 'الصفحة الرئيسية', description: 'لوحة التحكم الرئيسية', category: 'عام', isActive: true },
      { id: 'invoices', name: 'الفواتير', description: 'إدارة الفواتير', category: 'المبيعات', isActive: true },
      { id: 'customers', name: 'الزبائن', description: 'إدارة العملاء', category: 'المبيعات', isActive: true },
      { id: 'financial', name: 'المالية', description: 'الإدارة المالية', category: 'المالية', isActive: true },
      { id: 'users', name: 'إدارة المستخدمين', description: 'إدارة المستخدمين والأدوار', category: 'الإدارة', isActive: true }
    ];

    // Default actions
    this.localData.actions = [
      // إجراءات الفواتير
      { id: 'create_invoice', name: 'إنشاء فاتورة جديدة', description: 'إضافة فاتورة جديدة', category: 'الفواتير', isActive: true },
      { id: 'edit_invoice', name: 'تعديل الفاتورة', description: 'تعديل بيانات الفاتورة', category: 'الفواتير', isActive: true },
      { id: 'delete_invoice', name: 'حذف الفاتورة', description: 'حذف الفاتورة', category: 'الفواتير', isActive: true },
      { id: 'change_invoice_status', name: 'تغيير حالة الفاتورة', description: 'تعديل حالة الفاتورة', category: 'الفواتير', isActive: true },
      { id: 'mark_invoice_paid', name: 'تسجيل دفع الفاتورة', description: 'تسجيل دفع الفاتورة', category: 'الفواتير', isActive: true },
      { id: 'print_invoice', name: 'طباعة الفاتورة', description: 'طباعة الفاتورة', category: 'الفواتير', isActive: true },
      { id: 'print_invoices_list', name: 'طباعة قائمة الفواتير', description: 'طباعة قائمة الفواتير', category: 'الفواتير', isActive: true },
      
      // إجراءات العملاء
      { id: 'create_customer', name: 'إضافة زبون جديد', description: 'إضافة عميل جديد', category: 'العملاء', isActive: true },
      { id: 'edit_customer', name: 'تعديل بيانات الزبون', description: 'تعديل بيانات العميل', category: 'العملاء', isActive: true },
      { id: 'delete_customer', name: 'حذف الزبون', description: 'حذف العميل', category: 'العملاء', isActive: true },
      { id: 'view_customer_details', name: 'عرض تفاصيل الزبون', description: 'عرض تفاصيل العميل', category: 'العملاء', isActive: true },
      { id: 'print_customers_list', name: 'طباعة قائمة الزبائن', description: 'طباعة قائمة العملاء', category: 'العملاء', isActive: true },
      
      // إجراءات المالية
      { id: 'view_financial_reports', name: 'عرض التقارير المالية', description: 'عرض التقارير المالية', category: 'المالية', isActive: true },
      { id: 'manage_payments', name: 'إدارة المدفوعات', description: 'إدارة المدفوعات', category: 'المالية', isActive: true },
      { id: 'view_income_statement', name: 'عرض قائمة الدخل', description: 'عرض قائمة الدخل', category: 'المالية', isActive: true },
      
      // إجراءات التقارير
      { id: 'generate_sales_report', name: 'تقرير المبيعات', description: 'توليد تقرير المبيعات', category: 'التقارير', isActive: true },
      { id: 'generate_customer_report', name: 'تقرير العملاء', description: 'توليد تقرير العملاء', category: 'التقارير', isActive: true },
      { id: 'generate_financial_report', name: 'تقرير مالي', description: 'توليد تقرير مالي', category: 'التقارير', isActive: true },
      
      // إجراءات الإدارة
      { id: 'manage_users', name: 'إدارة المستخدمين', description: 'إدارة المستخدمين', category: 'الإدارة', isActive: true },
      { id: 'manage_roles', name: 'إدارة الأدوار', description: 'إدارة الأدوار والصلاحيات', category: 'الإدارة', isActive: true },
      { id: 'system_settings', name: 'إعدادات النظام', description: 'تعديل إعدادات النظام', category: 'الإدارة', isActive: true }
    ];

    // Default roles
    this.localData.roles = [
      {
        id: '1',
        name: 'مدير النظام',
        description: 'صلاحيات كاملة في النظام',
        permissions: ['إدارة المستخدمين', 'إدارة الفواتير', 'إدارة العملاء', 'التقارير', 'الإعدادات'],
        allowedPages: ['dashboard', 'invoices', 'customers', 'financial', 'users'],
        allowedActions: ['create_invoice', 'edit_invoice', 'delete_invoice', 'change_invoice_status', 'mark_invoice_paid', 'print_invoice', 'print_invoices_list', 'create_customer', 'edit_customer', 'delete_customer', 'view_customer_details', 'print_customers_list', 'view_financial_reports', 'manage_payments', 'view_income_statement', 'generate_sales_report', 'generate_customer_report', 'generate_financial_report', 'manage_users', 'manage_roles', 'system_settings'],
        isActive: true,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'مندوب مبيعات',
        description: 'إدارة المبيعات والعملاء',
        permissions: ['إدارة العملاء', 'إنشاء الفواتير', 'عرض التقارير'],
        allowedPages: ['dashboard', 'invoices', 'customers'],
        allowedActions: ['create_invoice', 'edit_invoice', 'change_invoice_status', 'print_invoice', 'print_invoices_list', 'create_customer', 'edit_customer', 'view_customer_details', 'print_customers_list', 'generate_sales_report', 'generate_customer_report'],
        isActive: true,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'محاسب رئيسي',
        description: 'إدارة الحسابات والمالية',
        permissions: ['إدارة الفواتير', 'التقارير المالية', 'إدارة المدفوعات'],
        allowedPages: ['dashboard', 'invoices', 'financial'],
        allowedActions: ['create_invoice', 'edit_invoice', 'delete_invoice', 'change_invoice_status', 'mark_invoice_paid', 'print_invoice', 'print_invoices_list', 'view_financial_reports', 'manage_payments', 'view_income_statement', 'generate_sales_report', 'generate_financial_report'],
        isActive: true,
        created_at: new Date().toISOString()
      }
    ];
  }

  private readCache<T>(key: string, fallback: T): T {
    try {
      const api = (window as any).electronAPI;
      if (api?.cache?.readJson) {
        // Prefer persistent cache file in Electron production
        const res = api.cache.readJson(key);
        // Support both sync-like and promise-like invocation across environments
        if (res && typeof res.then === 'function') {
          // This branch is not used here; readCache remains sync in renderer; fall back to localStorage
        } else if (res?.ok) {
          return (res.data ?? fallback) as T;
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private writeCache<T>(key: string, value: T): void {
    try {
      const api = (window as any).electronAPI;
      if (api?.cache?.writeJson) {
        void api.cache.writeJson(key, value);
      }
    } catch {}
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  // Get all roles
  async getRoles(): Promise<Role[]> {
    try {
      const api = (window as any).electronAPI;
      if (api?.local?.getRoles) {
        const res = await api.local.getRoles();
        if (!res?.ok) throw new Error(res?.error || 'Failed to load roles');
        const mapped = (res.data || []).map((role: any) => this.mapSupabaseRoleToRole(role));
        // Local-first: don't overwrite cache with empty remote result
        if (mapped.length > 0) {
          this.writeCache(this.ROLES_CACHE_KEY, mapped);
          return mapped;
        }
      }
      // Local-first: don't overwrite cache with empty remote result
      const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
      if (cached.length) return cached.map(r => sanitizeRole(r));
      return this.localData.roles;
    } catch (error) {
      console.warn('Supabase error, using cached/local roles:', error);
      const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
      if (cached.length) return cached.map(r => sanitizeRole(r));
      return this.localData.roles;
    }
  }

  // Get role by ID
  async getRoleById(id: string): Promise<Role | null> {
    try {
      // If id is not a UUID, prefer local seed roles
      if (!this.isUuid(id)) {
        const localRole = this.localData.roles.find(role => role.id === id) || null;
        return localRole ? sanitizeRole(localRole) : null;
      }
      const api = (window as any).electronAPI;
      const res = await api.local.getRoles();
      if (!res?.ok) throw new Error(res?.error || 'Failed to load roles');
      const row = (res.data || []).find((r: any) => String(r.id) === String(id));
      return row ? this.mapSupabaseRoleToRole(row) : null;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.roles.find(role => role.id === id) || null;
    }
  }

  // Create new role
  async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    try {
      const api = (window as any).electronAPI;
      const res = await api.local.createRole({
        name: sanitizeArabicText(role.name),
        description: sanitizeArabicText(role.description),
        permissions: role.permissions,
        allowedPages: role.allowedPages,
        allowedActions: role.allowedActions,
        isActive: role.isActive,
      });
      if (!res?.ok) throw new Error(res?.error || 'Failed to create role');
      const createdMapped = this.mapSupabaseRoleToRole(res.data);
      const current = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
      this.writeCache(this.ROLES_CACHE_KEY, [createdMapped, ...current]);
      return createdMapped;
    } catch (error) {
      console.warn('Supabase createRole error, persisting to cache:', error);
      const newRole: Role = sanitizeRole({
        ...role,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Role);
      const current = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
      this.writeCache(this.ROLES_CACHE_KEY, [newRole, ...current]);
      return newRole;
    }
  }

  // Update role
  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    try {
      const sanitizedName = updates.name !== undefined ? sanitizeArabicText(updates.name) : undefined;
      const sanitizedDesc = updates.description !== undefined ? sanitizeArabicText(updates.description) : undefined;

      // If non-UUID (seed/local) try to resolve by name and then update or insert
      if (!this.isUuid(id)) {
        const localIdx = this.localData.roles.findIndex(r => r.id === id);
        const currentLocal = localIdx !== -1 ? this.localData.roles[localIdx] : null;
        const targetName = sanitizedName ?? currentLocal?.name ?? '';
        const resolvedId = targetName ? await this.getRoleIdByName(targetName) : null;

        if (resolvedId) {
          const api = (window as any).electronAPI;
          let updated: Role | null = null;
          if (api?.local?.updateRole) {
            const res = await api.local.updateRole(resolvedId, {
              name: sanitizedName ?? currentLocal!.name,
              description: sanitizedDesc ?? currentLocal!.description,
              permissions: updates.permissions ?? currentLocal!.permissions,
              allowedPages: updates.allowedPages ?? currentLocal!.allowedPages,
              allowedActions: updates.allowedActions ?? currentLocal!.allowedActions,
              isActive: updates.isActive ?? currentLocal!.isActive,
            });
            if (!res?.ok) throw new Error(res?.error || 'Failed to update role');
            updated = this.mapSupabaseRoleToRole(res.data);
      } else {
        // Local-only: skip remote update path
      }
          if (!updated) {
            // Fallback to cache-only update
            const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
            const idx = cached.findIndex(r => r.id === resolvedId);
            if (idx !== -1) {
              const nextRole: Role = sanitizeRole({
                ...cached[idx],
                name: sanitizedName ?? cached[idx].name,
                description: sanitizedDesc ?? cached[idx].description,
                permissions: updates.permissions ?? cached[idx].permissions,
                allowedPages: updates.allowedPages ?? cached[idx].allowedPages,
                allowedActions: updates.allowedActions ?? cached[idx].allowedActions,
                isActive: updates.isActive ?? cached[idx].isActive,
                updated_at: new Date().toISOString()
              } as Role);
              cached[idx] = nextRole;
              this.writeCache(this.ROLES_CACHE_KEY, [...cached]);
              updated = nextRole;
            } else {
              updated = sanitizeRole({
                id: resolvedId,
                name: sanitizedName ?? currentLocal!.name,
                description: sanitizedDesc ?? currentLocal!.description,
                permissions: updates.permissions ?? currentLocal!.permissions,
                allowedPages: updates.allowedPages ?? currentLocal!.allowedPages,
                allowedActions: updates.allowedActions ?? currentLocal!.allowedActions,
                isActive: updates.isActive ?? currentLocal!.isActive,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as Role);
              const cached2 = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
              this.writeCache(this.ROLES_CACHE_KEY, [updated, ...cached2]);
            }
          }
          const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
          const next = cached.map(r => (r.id === resolvedId ? updated! : r));
          this.writeCache(this.ROLES_CACHE_KEY, next);
          // Mirror into local default for consistency
          if (currentLocal) {
            this.localData.roles[localIdx] = sanitizeRole({ ...currentLocal, ...updated! });
          }
          return updated!;
        } else if (currentLocal) {
          // Insert a new role if none exists in cloud
          const api = (window as any).electronAPI;
          let created: Role | null = null;
          if (api?.local?.createRole) {
            const res = await api.local.createRole({
              name: sanitizedName ?? currentLocal.name,
              description: sanitizedDesc ?? currentLocal.description,
              permissions: updates.permissions ?? currentLocal.permissions,
              allowedPages: updates.allowedPages ?? currentLocal.allowedPages,
              allowedActions: updates.allowedActions ?? currentLocal.allowedActions,
              isActive: updates.isActive ?? currentLocal.isActive,
            });
            if (!res?.ok) throw new Error(res?.error || 'Failed to create role');
            created = this.mapSupabaseRoleToRole(res.data);
          } else {
            // Local-only: skip remote create path
          }
          if (!created) {
            created = sanitizeRole({
              ...currentLocal,
              id: `local-${Date.now()}`,
              name: sanitizedName ?? currentLocal.name,
              description: sanitizedDesc ?? currentLocal.description,
              permissions: updates.permissions ?? currentLocal.permissions,
              allowedPages: updates.allowedPages ?? currentLocal.allowedPages,
              allowedActions: updates.allowedActions ?? currentLocal.allowedActions,
              isActive: updates.isActive ?? currentLocal.isActive,
              updated_at: new Date().toISOString()
            } as Role);
          }
          const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
          this.writeCache(this.ROLES_CACHE_KEY, [created!, ...cached]);
          // Update local copy
          this.localData.roles[localIdx] = sanitizeRole({ ...currentLocal, ...created! });
          return created!;
        }
      }

      // UUID path: direct update by id
      const api = (window as any).electronAPI;
      let updated: Role | null = null;
      if (api?.local?.updateRole) {
        const res = await api.local.updateRole(id, {
          name: sanitizedName,
          description: sanitizedDesc,
          permissions: updates.permissions,
          allowedPages: updates.allowedPages,
          allowedActions: updates.allowedActions,
          isActive: updates.isActive,
        });
        if (!res?.ok) throw new Error(res?.error || 'Failed to update role');
        updated = this.mapSupabaseRoleToRole(res.data);
      } else {
        // Local-only: skip remote update path
      }
      if (!updated) {
        const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
        const idx = cached.findIndex(r => r.id === id);
        if (idx !== -1) {
          const nextRole: Role = sanitizeRole({
            ...cached[idx],
            name: sanitizeArabicText(updates.name ?? cached[idx].name),
            description: sanitizeArabicText(updates.description ?? cached[idx].description),
            permissions: updates.permissions ?? cached[idx].permissions,
            allowedPages: updates.allowedPages ?? cached[idx].allowedPages,
            allowedActions: updates.allowedActions ?? cached[idx].allowedActions,
            isActive: updates.isActive ?? cached[idx].isActive,
            updated_at: new Date().toISOString()
          } as Role);
          cached[idx] = nextRole;
          this.writeCache(this.ROLES_CACHE_KEY, [...cached]);
          return nextRole;
        }
        // If not found in cache, synthesize
        return sanitizeRole({
          id,
          name: sanitizeArabicText(updates.name || 'دور بدون اسم'),
          description: sanitizeArabicText(updates.description || ''),
          permissions: updates.permissions || [],
          allowedPages: updates.allowedPages || [],
          allowedActions: updates.allowedActions || [],
          isActive: updates.isActive ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Role);
      }
      const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
      const next = cached.map(r => (r.id === id ? updated! : r));
      this.writeCache(this.ROLES_CACHE_KEY, next);
      return updated!;
    } catch (error) {
      console.warn('Supabase updateRole error, updating cached role:', error);
      const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
      const idx = cached.findIndex(r => r.id === id);
      if (idx !== -1) {
        const nextRole: Role = sanitizeRole({
          ...cached[idx],
          ...updates,
          name: sanitizeArabicText(updates.name ?? cached[idx].name),
          description: sanitizeArabicText(updates.description ?? cached[idx].description),
          updated_at: new Date().toISOString()
        } as Role);
        cached[idx] = nextRole;
        this.writeCache(this.ROLES_CACHE_KEY, [...cached]);
        return nextRole;
      }
      // If not found, treat as create into cache
      const synthesized: Role = sanitizeRole({
        id,
        name: sanitizeArabicText(updates.name || 'دور بدون اسم'),
        description: sanitizeArabicText(updates.description || ''),
        permissions: updates.permissions || [],
        allowedPages: updates.allowedPages || [],
        allowedActions: updates.allowedActions || [],
        isActive: updates.isActive ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Role);
      this.writeCache(this.ROLES_CACHE_KEY, [synthesized, ...cached]);
      return synthesized;
    }
  }

  // Delete role
  async deleteRole(id: string): Promise<void> {
    try {
      const api = (window as any).electronAPI;
      if (api?.local?.deleteRole) {
        const res = await api.local.deleteRole(id);
        if (!res?.ok) throw new Error(res?.error || 'Failed to delete role');
      } else {
        // Web fallback: remove from cached roles only
        const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
        const next = cached.filter(r => r.id !== id);
        this.writeCache(this.ROLES_CACHE_KEY, next);
        return;
      }
    } catch (error) {
      console.warn('Supabase deleteRole error, updating cached roles:', error);
      const cached = this.readCache<Role[]>(this.ROLES_CACHE_KEY, []);
      const next = cached.filter(r => r.id !== id);
      this.writeCache(this.ROLES_CACHE_KEY, next);
    }
  }

  // Get all pages
  async getPages(): Promise<Page[]> {
    try {
      // Pages are static in local service; return defaults then cache
      const mapped = this.localData.pages.map(p => sanitizePage(p));
      if (mapped.length > 0) {
        this.writeCache(this.PAGES_CACHE_KEY, mapped);
        return mapped;
      }
      const cached = this.readCache<Page[]>(this.PAGES_CACHE_KEY, []);
      if (cached.length) return cached.map(p => sanitizePage(p));
      return this.localData.pages;
    } catch (error) {
      console.warn('Supabase error, using cached/local pages:', error);
      const cached = this.readCache<Page[]>(this.PAGES_CACHE_KEY, []);
      if (cached.length) return cached.map(p => sanitizePage(p));
      return this.localData.pages;
    }
  }

  // Get all actions
  async getActions(): Promise<Action[]> {
    try {
      // Actions are static in local service; return defaults then cache
      const mapped = this.localData.actions.map(a => sanitizeAction(a));
      if (mapped.length > 0) {
        this.writeCache(this.ACTIONS_CACHE_KEY, mapped);
        return mapped;
      }
      const cached = this.readCache<Action[]>(this.ACTIONS_CACHE_KEY, []);
      if (cached.length) return cached.map(a => sanitizeAction(a));
      return this.localData.actions;
    } catch (error) {
      console.warn('Supabase error, using cached/local actions:', error);
      const cached = this.readCache<Action[]>(this.ACTIONS_CACHE_KEY, []);
      if (cached.length) return cached.map(a => sanitizeAction(a));
      return this.localData.actions;
    }
  }

  // Check if user has permission for page
  async hasPagePermission(userRoleId: string, pageId: string): Promise<boolean> {
    try {
      const role = await this.getRoleById(userRoleId);
      return role ? role.allowedPages.includes(pageId) : false;
    } catch (error) {
      console.error('Error checking page permission:', error);
      return false;
    }
  }

  // Check if user has permission for action
  async hasActionPermission(userRoleId: string, actionId: string): Promise<boolean> {
    try {
      const role = await this.getRoleById(userRoleId);
      return role ? role.allowedActions.includes(actionId) : false;
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  }

  // Get user's allowed pages
  async getUserAllowedPages(userRoleId: string): Promise<string[]> {
    try {
      const role = await this.getRoleById(userRoleId);
      return role ? role.allowedPages : [];
    } catch (error) {
      console.error('Error getting user allowed pages:', error);
      return [];
    }
  }

  // Get user's allowed actions
  async getUserAllowedActions(userRoleId: string): Promise<string[]> {
    try {
      const role = await this.getRoleById(userRoleId);
      return role ? role.allowedActions : [];
    } catch (error) {
      console.error('Error getting user allowed actions:', error);
      return [];
    }
  }

  // Map Supabase role to Role interface
  private mapSupabaseRoleToRole(data: any): Role {
    const allowedPages = Array.isArray(data.allowedPages) ? data.allowedPages
      : Array.isArray(data.allowed_pages) ? data.allowed_pages
      : typeof data.allowedPages === 'string' ? safeParseArray(data.allowedPages)
      : typeof data.allowed_pages === 'string' ? safeParseArray(data.allowed_pages)
      : [];

    const allowedActions = Array.isArray(data.allowedActions) ? data.allowedActions
      : Array.isArray(data.allowed_actions) ? data.allowed_actions
      : typeof data.allowedActions === 'string' ? safeParseArray(data.allowedActions)
      : typeof data.allowed_actions === 'string' ? safeParseArray(data.allowed_actions)
      : [];

    const permissions = Array.isArray(data.permissions) ? data.permissions
      : typeof data.permissions === 'string' ? safeParseArray(data.permissions)
      : [];

    const role: Role = {
      id: String(data.id),
      name: sanitizeArabicText(String(data.name ?? '')),
      description: sanitizeArabicText(String(data.description ?? '')),
      permissions,
      allowedPages,
      allowedActions,
      isActive: Boolean(data.is_active ?? data.isActive ?? true),
      created_at: String(data.created_at ?? new Date().toISOString()),
      updated_at: data.updated_at ? String(data.updated_at) : undefined
    };
    return sanitizeRole(role);
  }
}

export const rolesService = RolesService.getInstance();

// Helper: parse JSON arrays safely and normalize primitives to strings
function safeParseArray(input: string | any): string[] {
  try {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    if (Array.isArray(parsed)) return parsed.map(v => String(v));
    return [];
  } catch {
    return [];
  }
}
