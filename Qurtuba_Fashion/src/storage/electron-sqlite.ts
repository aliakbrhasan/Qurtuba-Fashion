import type { StoragePort, UnsyncedBundle } from './StoragePort';
import type { Customer, Invoice, InvoiceItem } from '@/db/database.service';
import type { Order, NewOrder } from '@/ports/orders';

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

export class ElectronSQLiteStorage implements StoragePort {
	private api: any;

	constructor() {
		this.api = isElectron ? (window as any).electronAPI : null;
	}

	private ensureApi(): any {
		if (!this.api) throw new Error('Not running in Electron environment');
		return this.api;
	}

	async getCustomers(): Promise<Customer[]> { const api = this.ensureApi(); return await api.local.getCustomers(); }

	async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> { const api = this.ensureApi(); return await api.local.createCustomer(customer); }

	async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> { const api = this.ensureApi(); return await api.local.updateCustomer(id, updates); }

	async deleteCustomer(id: string): Promise<void> { const api = this.ensureApi(); await api.local.deleteCustomer(id); }

	async getOrders(): Promise<Order[]> { const api = this.ensureApi(); return await api.local.getOrders(); }

	async createOrder(order: NewOrder): Promise<Order> { const api = this.ensureApi(); return await api.local.createOrder(order); }

	async updateOrder(id: string, updates: Partial<Order>): Promise<Order> { const api = this.ensureApi(); return await api.local.updateOrder(id, updates); }

	async deleteOrder(id: string): Promise<void> { const api = this.ensureApi(); await api.local.deleteOrder(id); }

	async getInvoices(): Promise<Invoice[]> { const api = this.ensureApi(); return await api.local.getInvoices(); }

	async createInvoice(invoice: any): Promise<Invoice> { const api = this.ensureApi(); return await api.local.createInvoice(invoice); }

	async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> { const api = this.ensureApi(); return await api.local.updateInvoice(id, updates); }

	async deleteInvoice(id: string): Promise<void> { const api = this.ensureApi(); await api.local.deleteInvoice(id); }

	async getInvoiceItems(_invoiceId: string): Promise<InvoiceItem[]> { return []; }

	async createInvoiceItem(_item: Omit<InvoiceItem, 'id' | 'created_at'>): Promise<InvoiceItem> { throw new Error('Not implemented via IPC'); }

	async updateInvoiceItem(_id: string, _updates: Partial<InvoiceItem>): Promise<InvoiceItem> { throw new Error('Not implemented via IPC'); }

	async deleteInvoiceItem(_id: string): Promise<void> { throw new Error('Not implemented via IPC'); }

	// Sync helpers: handled in main process; renderer does not need these.
	async getUnsyncedRecords(): Promise<UnsyncedBundle> {
		return { customers: [], invoices: [], orders: [] };
	}

	async markAsSynced(): Promise<void> { /* no-op */ }
	async upsertCustomerFromCloud(): Promise<void> { /* no-op */ }
	async upsertInvoiceFromCloud(): Promise<void> { /* no-op */ }
	async upsertOrderFromCloud(): Promise<void> { /* no-op */ }
}


