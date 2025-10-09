import { supabase } from '../db/client';
import { sanitizeAction, sanitizePage, sanitizeRole, sanitizeArabicText } from '../utils/encoding';

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

  private constructor() {
    this.initializeLocalData();
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

  // Get all roles
  async getRoles(): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(role => this.mapSupabaseRoleToRole(role));
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
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
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.mapSupabaseRoleToRole(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.roles.find(role => role.id === id) || null;
    }
  }

  // Create new role
  async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([{
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          allowed_pages: role.allowedPages,
          allowed_actions: role.allowedActions,
          is_active: role.isActive
        }])
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseRoleToRole(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const newRole: Role = {
        ...role,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      this.localData.roles.push(newRole);
      return newRole;
    }
  }

  // Update role
  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    try {
      // Update local default roles (non-UUID) without hitting Supabase
      if (!this.isUuid(id)) {
        const idx = this.localData.roles.findIndex(r => r.id === id);
        if (idx !== -1) {
          this.localData.roles[idx] = {
            ...this.localData.roles[idx],
            ...updates,
            name: sanitizeArabicText(updates.name ?? this.localData.roles[idx].name),
            description: sanitizeArabicText(updates.description ?? this.localData.roles[idx].description),
            updated_at: new Date().toISOString()
          };
          return sanitizeRole(this.localData.roles[idx]);
        }
      }
      const { data, error } = await supabase
        .from('roles')
        .update({
          name: updates.name,
          description: updates.description,
          permissions: updates.permissions,
          allowed_pages: updates.allowedPages,
          allowed_actions: updates.allowedActions,
          is_active: updates.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseRoleToRole(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const roleIndex = this.localData.roles.findIndex(r => r.id === id);
      if (roleIndex !== -1) {
        this.localData.roles[roleIndex] = { 
          ...this.localData.roles[roleIndex], 
          ...updates,
          name: sanitizeArabicText(updates.name ?? this.localData.roles[roleIndex].name),
          description: sanitizeArabicText(updates.description ?? this.localData.roles[roleIndex].description),
          updated_at: new Date().toISOString()
        };
        return sanitizeRole(this.localData.roles[roleIndex]);
      }
      // If the role doesn't exist locally, synthesize a safe object to keep UI responsive
      const synthesized: Role = {
        id,
        name: sanitizeArabicText(updates.name || 'دور بدون اسم'),
        description: sanitizeArabicText(updates.description || ''),
        permissions: updates.permissions || [],
        allowedPages: updates.allowedPages || [],
        allowedActions: updates.allowedActions || [],
        isActive: updates.isActive ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.localData.roles.push(synthesized);
      return sanitizeRole(synthesized);
    }
  }

  // Delete role
  async deleteRole(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      this.localData.roles = this.localData.roles.filter(r => r.id !== id);
    }
  }

  // Get all pages
  async getPages(): Promise<Page[]> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data || []).map((p: any) => sanitizePage(p));
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.pages;
    }
  }

  // Get all actions
  async getActions(): Promise<Action[]> {
    try {
      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name');

      if (error) throw error;
      return (data || []).map((a: any) => sanitizeAction(a));
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
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
    const role: Role = {
      id: data.id,
      name: sanitizeArabicText(data.name),
      description: sanitizeArabicText(data.description),
      permissions: data.permissions || [],
      allowedPages: data.allowed_pages || [],
      allowedActions: data.allowed_actions || [],
      isActive: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    return sanitizeRole(role);
  }
}

export const rolesService = RolesService.getInstance();
