import { storage } from '@/storage';
import { DesignSettingsService } from './design-settings.service';

export type ExportBundle = {
  meta: { exportedAt: string; version: number; scope?: string };
  customers?: any[];
  invoices?: any[];
  orders?: any[];
  invoiceItems?: any[];
  users?: any[];
  roles?: any[];
  images?: any[];
  adminLogs?: any[];
  designSettings?: any;
};

export type ImportScope = {
  customers?: boolean;
  invoices?: boolean;
  orders?: boolean;
  invoiceItems?: boolean;
  users?: boolean;
  roles?: boolean;
  images?: boolean;
  adminLogs?: boolean;
  designSettings?: boolean;
};

export class ExportImportService {
  static async exportAll(scope: 'all' | 'invoices_customers' | 'settings_users' = 'all'): Promise<ExportBundle> {
    const bundle: any = await (storage as any).exportAll?.();
    // Ensure design settings are present; add from service if missing
    if (!bundle.designSettings) {
      try {
        const svc = DesignSettingsService.getInstance();
        const keys: any = ['fabricType','fabricSource','collarType','chestStyle','sleeveEnd','bunijaType'];
        const options: any = {}; const selected: any = {};
        for (const k of keys) { options[k] = svc.getOptions(k); selected[k] = svc.getSelectedId(k); }
        bundle.designSettings = { options, selected };
      } catch {}
    }
    bundle.meta = bundle.meta || { exportedAt: new Date().toISOString(), version: 2 };
    bundle.meta.scope = scope === 'all' ? 'all' : scope;
    if (scope === 'invoices_customers') {
      delete bundle.users; delete bundle.roles; delete bundle.images; delete bundle.adminLogs; // keep design for safety
    } else if (scope === 'settings_users') {
      delete bundle.customers; delete bundle.invoices; delete bundle.orders; delete bundle.invoiceItems; delete bundle.images; // settings + users/roles
    }
    return bundle as ExportBundle;
  }

  static async importAll(bundle: ExportBundle, options: { policy?: 'replace' | 'merge'; scope?: ImportScope } = {}): Promise<void> {
    const scope = options.scope || { customers: true, invoices: true, orders: true, invoiceItems: true, users: true, roles: true, images: true, adminLogs: true, designSettings: true };
    const payload: any = {
      customers: scope.customers ? (bundle.customers || []) : undefined,
      invoices: scope.invoices ? (bundle.invoices || []) : undefined,
      orders: scope.orders ? (bundle.orders || []) : undefined,
      invoiceItems: scope.invoiceItems ? (bundle.invoiceItems || []) : undefined,
      users: scope.users ? (bundle.users || []) : undefined,
      roles: scope.roles ? (bundle.roles || []) : undefined,
      images: scope.images ? (bundle.images || []) : undefined,
      adminLogs: scope.adminLogs ? (bundle.adminLogs || []) : undefined,
      designSettings: scope.designSettings ? (bundle.designSettings || undefined) : undefined,
    };
    await (storage as any).importAll?.(payload, { policy: options.policy || 'merge', scope: { customers: !!scope.customers, invoices: !!scope.invoices, orders: !!scope.orders, invoiceItems: !!scope.invoiceItems, users: !!scope.users, roles: !!scope.roles, images: !!scope.images, adminLogs: !!scope.adminLogs } });
    // Apply design settings (web and electron renderer)
    if (scope.designSettings && bundle.designSettings) {
      try {
        const svc = DesignSettingsService.getInstance();
        const opts = bundle.designSettings.options || {}; const sel = bundle.designSettings.selected || {};
        const keys: any = ['fabricType','fabricSource','collarType','chestStyle','sleeveEnd','bunijaType'];
        for (const k of keys) { if (Array.isArray(opts[k])) svc.setOptions(k, opts[k]); if (sel[k]) svc.setSelectedId(k, sel[k]); }
      } catch {}
    }
    // Invalidate caches and notify
    try {
      const { queryClient } = await import('@/app/queryClient');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch {}
    try {
      const { notifications } = await import('@/services/notifications.service');
      notifications.emit({ type: 'success', title: 'استيراد البيانات', message: 'تم استيراد البيانات بنجاح', target: { page: 'settings' } as any });
    } catch {}
  }
}


