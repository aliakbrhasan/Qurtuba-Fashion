import type { Invoice, NewInvoice } from '@/db/database.service';
import { databaseService } from '@/db/database.service';
import { LocalAppService } from '@/services/local-app.service';

export interface InvoicesPort {
  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: NewInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
}

export const invoicesAdapter: InvoicesPort = {
  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const localApp = LocalAppService.getInstance?.();
      const isElectron = !!localApp?.getConfig?.().isElectron;
      if (isElectron) {
        return await localApp!.getInvoices();
      }
    } catch (e) {
      // Fallback to cloud database if anything goes wrong
    }
    return await databaseService.getInvoices();
  },
  createInvoice: async (invoice: NewInvoice): Promise<Invoice> => {
    try {
      const localApp = LocalAppService.getInstance?.();
      const isElectron = !!localApp?.getConfig?.().isElectron;
      if (isElectron) {
        const nowIso = new Date().toISOString();
        const localPayload: any = {
          customer_id: invoice.customer_id,
          customer_name: invoice.customer_name,
          customer_phone: invoice.customer_phone,
          customer_address: invoice.customer_address,
          total: invoice.total,
          paid_amount: invoice.paid_amount ?? 0,
          status: invoice.status ?? 'معلق',
          invoice_date: nowIso,
          due_date: invoice.due_date,
          notes: invoice.notes,
          fabric_image_url: invoice.fabric_image_url,
        };
        const created = await localApp!.createInvoice(localPayload);
        return created as Invoice;
      }
    } catch (e) {
      // Fallback to cloud database
    }
    return await databaseService.createInvoice(invoice);
  },
  updateInvoice: async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    try {
      const localApp = LocalAppService.getInstance?.();
      const isElectron = !!localApp?.getConfig?.().isElectron;
      if (isElectron) {
        const updated = await localApp!.updateInvoice(id, updates);
        return updated as Invoice;
      }
    } catch (e) {
      // Fallback to cloud database
    }
    return await databaseService.updateInvoice(id, updates);
  },
  deleteInvoice: async (id: string): Promise<void> => {
    try {
      const localApp = LocalAppService.getInstance?.();
      const isElectron = !!localApp?.getConfig?.().isElectron;
      if (isElectron) {
        await localApp!.deleteInvoice(id);
        return;
      }
    } catch (e) {
      // Fallback to cloud database
    }
    return await databaseService.deleteInvoice(id);
  },
};


