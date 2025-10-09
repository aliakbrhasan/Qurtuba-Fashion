import type { Invoice, NewInvoice } from '@/db/database.service';
import { databaseService } from '@/db/database.service';

export interface InvoicesPort {
  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: NewInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
}

export const invoicesAdapter: InvoicesPort = {
  getInvoices: async (): Promise<Invoice[]> => await databaseService.getInvoices(),
  createInvoice: async (invoice: NewInvoice): Promise<Invoice> => await databaseService.createInvoice(invoice),
  updateInvoice: async (id: string, updates: Partial<Invoice>): Promise<Invoice> => await databaseService.updateInvoice(id, updates),
  deleteInvoice: async (id: string): Promise<void> => await databaseService.deleteInvoice(id),
};


