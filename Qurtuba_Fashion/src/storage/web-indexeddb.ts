import type { StoragePort, UnsyncedBundle } from './StoragePort';
import type { Customer, Invoice, InvoiceItem } from '@/db/database.service';
import type { Order, NewOrder } from '@/ports/orders';
import { toIQD } from '@/utils/money';

const LS_KEYS = {
	customers: 'qf_web_customers',
	invoices: 'qf_web_invoices',
	orders: 'qf_web_orders',
	items: 'qf_web_invoice_items',
	logs: 'qf_web_admin_logs',
};

// Attempt to read legacy keys from older builds and migrate to new keys transparently
const LEGACY_KEYS = {
	invoices: 'qf_local_invoices',
	items: 'qf_local_invoice_items',
	cache: 'qf_local_db_cache_v1',
};

function load<T>(key: string, fallback: T): T {
	try {
		const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
		if (raw) return JSON.parse(raw) as T;

		// Legacy migration paths
		if (typeof window !== 'undefined') {
			// Invoices
			if (key === LS_KEYS.invoices) {
				const legacy = window.localStorage.getItem(LEGACY_KEYS.invoices);
				if (legacy) {
					const parsed = JSON.parse(legacy) as T;
					// Migrate forward
					window.localStorage.setItem(LS_KEYS.invoices, legacy);
					return parsed;
				}
				const cache = window.localStorage.getItem(LEGACY_KEYS.cache);
				if (cache) {
					const parsedCache = JSON.parse(cache);
					if (Array.isArray(parsedCache?.invoices)) {
						const arr = parsedCache.invoices as T;
						window.localStorage.setItem(LS_KEYS.invoices, JSON.stringify(arr));
						return arr;
					}
				}
			}

			// Invoice items
			if (key === LS_KEYS.items) {
				const legacyItems = window.localStorage.getItem(LEGACY_KEYS.items);
				if (legacyItems) {
					window.localStorage.setItem(LS_KEYS.items, legacyItems);
					return JSON.parse(legacyItems) as T;
				}
			}

			// Customers (cached inside legacy cache blob)
			if (key === LS_KEYS.customers) {
				const cache = window.localStorage.getItem(LEGACY_KEYS.cache);
				if (cache) {
					const parsedCache = JSON.parse(cache);
					if (Array.isArray(parsedCache?.customers)) {
						const arr = parsedCache.customers as T;
						window.localStorage.setItem(LS_KEYS.customers, JSON.stringify(arr));
						return arr;
					}
				}
			}
		}

		return fallback;
	} catch { return fallback; }
}

function save<T>(key: string, value: T): void {
	try {
		if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value));
	} catch {}
}

function generateId(): string {
    try {
        if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
            return (crypto as any).randomUUID();
        }
    } catch {}
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export class WebIndexedDBStorage implements StoragePort {
	private customersArr: Customer[] = load<Customer[]>(LS_KEYS.customers, []);
	private invoicesArr: Invoice[] = load<Invoice[]>(LS_KEYS.invoices, []);
	private ordersArr: Order[] = load<Order[]>(LS_KEYS.orders, []);
	private itemsArr: InvoiceItem[] = load<InvoiceItem[]>(LS_KEYS.items, []);
	private logsArr: any[] = load<any[]>(LS_KEYS.logs, []);

	private persistAll() {
		save(LS_KEYS.customers, this.customersArr);
		save(LS_KEYS.invoices, this.invoicesArr);
		save(LS_KEYS.orders, this.ordersArr);
		save(LS_KEYS.items, this.itemsArr);
		save(LS_KEYS.logs, this.logsArr);
	}

	async getCustomers(): Promise<Customer[]> { return [...this.customersArr]; }

	async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
		const now = new Date().toISOString();
		const created: Customer = { ...(customer as any), id: generateId(), created_at: now };
		this.customersArr.unshift(created);
		this.persistAll();
		return created;
	}

	async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
		const idx = this.customersArr.findIndex(c => String(c.id) === String(id));
		if (idx === -1) throw new Error('Customer not found');
		const updated = { ...this.customersArr[idx], ...updates } as Customer;
		this.customersArr[idx] = updated;
		this.persistAll();
		return updated;
	}

	async deleteCustomer(id: string): Promise<void> {
		this.customersArr = this.customersArr.filter(c => String(c.id) !== String(id));
		this.persistAll();
	}

	async getOrders(): Promise<Order[]> { return [...this.ordersArr]; }

	async createOrder(order: NewOrder): Promise<Order> {
    const created: Order = { id: generateId(), customer_name: order.customer_name, total: toIQD(order.total as any), created_at: new Date().toISOString() } as any;
		this.ordersArr.unshift(created);
		this.persistAll();
		return created;
	}

	async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
		const idx = this.ordersArr.findIndex(o => String(o.id) === String(id));
		if (idx === -1) throw new Error('Order not found');
		const updated = { ...this.ordersArr[idx], ...updates } as Order;
		this.ordersArr[idx] = updated;
		this.persistAll();
		return updated;
	}

	async deleteOrder(id: string): Promise<void> { this.ordersArr = this.ordersArr.filter(o => String(o.id) !== String(id)); this.persistAll(); }

	async getInvoices(): Promise<Invoice[]> { return [...this.invoicesArr]; }

	async createInvoice(invoice: any): Promise<Invoice> {
		const now = new Date().toISOString();
    const created: Invoice = {
			id: generateId(),
			invoice_number: invoice.invoice_number || `INV-${Date.now()}`,
			customer_id: invoice.customer_id,
			customer_name: invoice.customer_name,
			customer_phone: invoice.customer_phone,
			customer_address: invoice.customer_address,
      total: toIQD(invoice.total),
      paid_amount: toIQD(invoice.paid_amount || 0),
			status: invoice.status || 'معلق',
			invoice_date: invoice.invoice_date || now,
			due_date: invoice.due_date,
			notes: invoice.notes,
			fabric_image_url: invoice.fabric_image_url,
			// measurements snapshot
			...(invoice.customer_measurements ? { customer_measurements: invoice.customer_measurements } : {}),
			// design details (optional)
			...(invoice.fabric_type ? { fabric_type: String(invoice.fabric_type) } : {}),
			...(invoice.fabric_source ? { fabric_source: String(invoice.fabric_source) } : {}),
			...(invoice.collar_type ? { collar_type: String(invoice.collar_type) } : {}),
			...(invoice.chest_style ? { chest_style: String(invoice.chest_style) } : {}),
			...(invoice.sleeve_end ? { sleeve_end: String(invoice.sleeve_end) } : {}),
			...(invoice.bunija_type ? { bunija_type: String(invoice.bunija_type) } : {}),
			paid_at: invoice.paid_at,
			created_at: now,
			updated_at: now,
		} as any;
		this.invoicesArr.unshift(created);
		this.persistAll();
		return created;
	}

	async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
		const idx = this.invoicesArr.findIndex(i => String(i.id) === String(id));
		if (idx === -1) throw new Error('Invoice not found');
    const normalized: Partial<Invoice> = { ...updates } as any;
    if (typeof normalized.total === 'number') normalized.total = toIQD(normalized.total);
    if (typeof normalized.paid_amount === 'number') normalized.paid_amount = toIQD(normalized.paid_amount);
    const updated = { ...this.invoicesArr[idx], ...normalized, updated_at: new Date().toISOString() } as Invoice;
		this.invoicesArr[idx] = updated;
		this.persistAll();
		return updated;
	}

	async deleteInvoice(id: string): Promise<void> {
		this.invoicesArr = this.invoicesArr.filter(i => String(i.id) !== String(id));
		this.itemsArr = this.itemsArr.filter(it => String(it.invoice_id) !== String(id));
		this.persistAll();
	}

	async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> { return this.itemsArr.filter(i => String(i.invoice_id) === String(invoiceId)); }

	async createInvoiceItem(item: Omit<InvoiceItem, 'id' | 'created_at'>): Promise<InvoiceItem> {
		const created: InvoiceItem = { ...item, id: generateId(), created_at: new Date().toISOString() } as InvoiceItem;
		this.itemsArr.push(created);
		this.persistAll();
		return created;
	}

	async updateInvoiceItem(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem> {
		const idx = this.itemsArr.findIndex(i => String(i.id) === String(id));
		if (idx === -1) throw new Error('Invoice item not found');
		const updated = { ...this.itemsArr[idx], ...updates } as InvoiceItem;
		this.itemsArr[idx] = updated;
		this.persistAll();
		return updated;
	}

	async deleteInvoiceItem(id: string): Promise<void> { this.itemsArr = this.itemsArr.filter(i => String(i.id) !== String(id)); this.persistAll(); }

	async getUnsyncedRecords(): Promise<UnsyncedBundle> { return { customers: [...this.customersArr], invoices: [...this.invoicesArr], orders: [...this.ordersArr] }; }
	async markAsSynced(): Promise<void> { /* noop */ }
	async upsertCustomerFromCloud(payload: any): Promise<void> {
		const idx = this.customersArr.findIndex(c => String(c.id) === String(payload.id));
		if (idx === -1) {
			this.customersArr.unshift(payload as Customer);
		} else {
			this.customersArr[idx] = { ...this.customersArr[idx], ...payload } as Customer;
		}
		this.persistAll();
	}
	async upsertInvoiceFromCloud(payload: any): Promise<void> {
		const idx = this.invoicesArr.findIndex(i => String(i.id) === String(payload.id));
		if (idx === -1) {
			this.invoicesArr.unshift(payload as Invoice);
		} else {
			this.invoicesArr[idx] = { ...this.invoicesArr[idx], ...payload } as Invoice;
		}
		this.persistAll();
	}
	async upsertOrderFromCloud(payload: any): Promise<void> {
		const idx = this.ordersArr.findIndex(o => String(o.id) === String(payload.id));
		if (idx === -1) {
			this.ordersArr.unshift(payload as Order);
		} else {
			this.ordersArr[idx] = { ...this.ordersArr[idx], ...payload } as Order;
		}
		this.persistAll();
	}

	// Backup/restore
	async exportAll() {
		return {
			customers: [...this.customersArr],
			invoices: [...this.invoicesArr],
			orders: [...this.ordersArr],
			items: [...this.itemsArr],
			meta: { exportedAt: new Date().toISOString(), version: 1 }
		};
	}

	async importAll(data: { customers?: Customer[]; invoices?: Invoice[]; orders?: Order[]; items?: InvoiceItem[] }) {
		if (Array.isArray(data.customers)) this.customersArr = [...data.customers];
		if (Array.isArray(data.invoices)) this.invoicesArr = [...data.invoices];
		if (Array.isArray(data.orders)) this.ordersArr = [...data.orders];
		if (Array.isArray(data.items)) this.itemsArr = [...data.items];
		this.persistAll();
	}

	// Admin logs (web fallback in localStorage)
	async getAdminLogs() {
		return [...this.logsArr].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || String(b.id).localeCompare(String(a.id)));
	}

	async createAdminLog(entry: { action_type: 'create' | 'update' | 'delete'; entity_type: 'invoice' | 'customer'; entity_id: string; changed_fields?: any; action_date?: string; action_time?: string; user_name?: string }) {
		const now = new Date();
		const id = generateId();
		const created_at = now.toISOString();
		const action_date = entry.action_date || created_at.slice(0, 10);
		const action_time = entry.action_time || now.toTimeString().slice(0, 5);
		const changed = entry.changed_fields ? JSON.stringify(entry.changed_fields) : null;
		// De-duplicate last similar log within ~45s
		const last = this.logsArr.find(l => l.action_type === entry.action_type && l.entity_type === entry.entity_type && String(l.entity_id) === String(entry.entity_id) && (l.user_name || null) === (entry.user_name || null));
		if (last && ((last.changed_fields ? JSON.stringify(last.changed_fields) : null) === changed)) {
			const lastTs = new Date(last.created_at).getTime();
			if (!Number.isNaN(lastTs)) {
				const diffSec = Math.abs(now.getTime() - lastTs) / 1000;
				if (diffSec <= 45) return last;
			}
		}
		const log = { id, ...entry, action_date, action_time, created_at } as any;
		this.logsArr.unshift(log);
		this.persistAll();
		return log;
	}
}


