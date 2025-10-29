import { useState, useEffect } from 'react';
import { rolesService } from '../services/roles.service';
import { User } from '../services/auth.service';

export interface UsePermissionsResult {
  allowedPages: string[];
  allowedActions: string[];
  hasPagePermission: (pageId: string) => boolean;
  hasActionPermission: (actionId: string) => boolean;
  loading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(currentUser: User | null): UsePermissionsResult {
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [allowedActions, setAllowedActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    if (!currentUser) {
      setAllowedPages([]);
      setAllowedActions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Map role name to role ID
      let userRoleId = '1'; // Default to admin role
      
      if (currentUser.role === 'مدير النظام' || currentUser.status === 'ادمن') {
        userRoleId = '1';
      } else if (currentUser.role === 'مندوب مبيعات' || currentUser.status === 'موظف') {
        userRoleId = '2';
      } else if (currentUser.role === 'محاسب رئيسي' || currentUser.status === 'محاسب') {
        userRoleId = '3';
      }
      
      const [pages, actions] = await Promise.all([
        rolesService.getUserAllowedPages(userRoleId),
        rolesService.getUserAllowedActions(userRoleId)
      ]);
      
      setAllowedPages(pages);
      setAllowedActions(actions);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('حدث خطأ في تحميل الصلاحيات');
      // Fallback to admin permissions for admin users
      if (currentUser.status === 'ادمن' || currentUser.role === 'مدير النظام') {
        setAllowedPages(['dashboard', 'invoices', 'customers', 'financial', 'users', 'adminLog']);
        setAllowedActions([
          'create_invoice', 'edit_invoice', 'delete_invoice', 'change_invoice_status', 
          'mark_invoice_paid', 'print_invoice', 'print_invoices_list', 'create_customer', 
          'edit_customer', 'delete_customer', 'view_customer_details', 'print_customers_list', 
          'view_financial_reports', 'manage_payments', 'view_income_statement', 
          'generate_sales_report', 'generate_customer_report', 'generate_financial_report', 
          'manage_users', 'manage_roles', 'system_settings'
        ]);
      } else {
        // For non-admin users, show minimal permissions
        setAllowedPages(['dashboard']);
        setAllowedActions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [currentUser]);

  // Auto-refresh when roles change (dynamic propagation)
  useEffect(() => {
    const handler = () => { void loadPermissions(); };
    try {
      (rolesService as any).onRolesChanged?.(handler);
      return () => { (rolesService as any).offRolesChanged?.(handler); };
    } catch {
      return () => {};
    }
  }, [currentUser]);

  const hasPagePermission = (pageId: string): boolean => {
    // Always allow dashboard for all users
    if (pageId === 'dashboard') return true;
    
    // For admin users, always allow all pages
    if (currentUser && (currentUser.status === 'ادمن' || currentUser.role === 'مدير النظام')) {
      return true;
    }
    
    return allowedPages.includes(pageId);
  };

  const hasActionPermission = (actionId: string): boolean => {
    // For admin users, always allow all actions
    if (currentUser && (currentUser.status === 'ادمن' || currentUser.role === 'مدير النظام')) {
      return true;
    }
    
    return allowedActions.includes(actionId);
  };

  const refreshPermissions = async (): Promise<void> => {
    await loadPermissions();
  };

  return {
    allowedPages,
    allowedActions,
    hasPagePermission,
    hasActionPermission,
    loading,
    error,
    refreshPermissions
  };
}
