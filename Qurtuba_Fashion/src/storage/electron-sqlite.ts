import type { StoragePort, UnsyncedBundle } from './StoragePort';
import type { Customer, Invoice, InvoiceItem } from '@/db/database.service';
import type { Order, NewOrder } from '@/ports/orders';

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

export class ElectronSQLiteStorage implements StoragePort {
	private api: any;
	private async call<T>(channel: string, ...args: any[]): Promise<T> {
		const res = await (this.ensureApi() as any);
		const out = await (resPath(res, channel))(...args);
		if (out && typeof out === 'object' && 'ok' in out) {
			if ((out as any).ok) return (out as any).data as T;
			throw new Error((out as any).error || 'IPC error');
		}
		return out as T;
	}

	constructor() {
		this.api = isElectron ? (window as any).electronAPI : null;
	}

	private ensureApi(): any {
		if (!this.api) throw new Error('Not running in Electron environment');
		return this.api;
	}

	async getCustomers(): Promise<Customer[]> { return await this.call<Customer[]>('local.getCustomers'); }

	async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> { return await this.call<Customer>('local.createCustomer', customer); }

	async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> { return await this.call<Customer>('local.updateCustomer', id, updates); }

	async deleteCustomer(id: string): Promise<void> { await this.call('local.deleteCustomer', id); }

	async getOrders(): Promise<Order[]> { return await this.call<Order[]>('local.getOrders'); }

	async createOrder(order: NewOrder): Promise<Order> { return await this.call<Order>('local.createOrder', order); }

	async updateOrder(id: string, updates: Partial<Order>): Promise<Order> { return await this.call<Order>('local.updateOrder', id, updates); }

	async deleteOrder(id: string): Promise<void> { await this.call('local.deleteOrder', id); }

	async getInvoices(): Promise<Invoice[]> { return await this.call<Invoice[]>('local.getInvoices'); }

	async createInvoice(invoice: any): Promise<Invoice> { return await this.call<Invoice>('local.createInvoice', invoice); }

	async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> { return await this.call<Invoice>('local.updateInvoice', id, updates); }

	async deleteInvoice(id: string): Promise<void> { await this.call('local.deleteInvoice', id); }

	// Roles via IPC
	async getRoles(): Promise<any[]> { return await this.call<any[]>('local.getRoles'); }
	async createRole(role: any): Promise<any> { return await this.call<any>('local.createRole', role); }
	async updateRole(id: string, updates: any): Promise<any> { return await this.call<any>('local.updateRole', id, updates); }
	async deleteRole(id: string): Promise<void> { await this.call('local.deleteRole', id); }

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

	// Backup/restore via IPC if available
	async exportAll() {
		const api = this.ensureApi();
		if (api?.local?.exportAll) {
			const res = await api.local.exportAll();
			return res?.ok ? res.data : res;
		}
		// Fallback: fetch through individual calls
		const [customers, invoices, orders] = await Promise.all([
			this.getCustomers(), this.getInvoices(), this.getOrders()
		]);
		return { customers, invoices, orders, items: [] as any[] };
	}

	async importAll(data: { customers?: Customer[]; invoices?: Invoice[]; orders?: Order[]; items?: InvoiceItem[] }) {
		const api = this.ensureApi();
		if (api?.local?.importAll) {
			const res = await api.local.importAll(data);
			return res?.ok ? res.data : res;
		}
		// Fallback: naive replace-by-loop
		if (Array.isArray(data.customers)) {
			for (const c of data.customers) { try { await this.createCustomer({ ...(c as any), created_at: c.created_at } as any); } catch {} }
		}
		if (Array.isArray(data.invoices)) {
			for (const i of data.invoices) { try { await this.createInvoice(i as any); } catch {} }
		}
		if (Array.isArray(data.orders)) {
			for (const o of data.orders) { try { await this.createOrder(o as any); } catch {} }
		}
	}
}

// Helper to traverse object by dotted path like 'local.getCustomers'
function resPath(obj: any, path: string): any {
	return path.split('.').reduce((acc, key) => acc?.[key], obj);
}


