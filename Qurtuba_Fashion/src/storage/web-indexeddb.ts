import type { StoragePort, UnsyncedBundle } from './StoragePort';
import type { Customer, Invoice, InvoiceItem } from '@/db/database.service';
import type { Order, NewOrder } from '@/ports/orders';

const LS_KEYS = {
	customers: 'qf_web_customers',
	invoices: 'qf_web_invoices',
	orders: 'qf_web_orders',
	items: 'qf_web_invoice_items',
};

function load<T>(key: string, fallback: T): T {
	try {
		const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch { return fallback; }
}

function save<T>(key: string, value: T): void {
	try {
		if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value));
	} catch {}
}

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export class WebIndexedDBStorage implements StoragePort {
	private customersArr: Customer[] = load<Customer[]>(LS_KEYS.customers, []);
	private invoicesArr: Invoice[] = load<Invoice[]>(LS_KEYS.invoices, []);
	private ordersArr: Order[] = load<Order[]>(LS_KEYS.orders, []);
	private itemsArr: InvoiceItem[] = load<InvoiceItem[]>(LS_KEYS.items, []);

	private persistAll() {
		save(LS_KEYS.customers, this.customersArr);
		save(LS_KEYS.invoices, this.invoicesArr);
		save(LS_KEYS.orders, this.ordersArr);
		save(LS_KEYS.items, this.itemsArr);
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
		const created: Order = { id: generateId(), customer_name: order.customer_name, total: order.total, created_at: new Date().toISOString() } as any;
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
			total: invoice.total,
			paid_amount: invoice.paid_amount || 0,
			status: invoice.status || 'معلق',
			invoice_date: invoice.invoice_date || now,
			due_date: invoice.due_date,
			notes: invoice.notes,
			fabric_image_url: invoice.fabric_image_url,
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
		const updated = { ...this.invoicesArr[idx], ...updates, updated_at: new Date().toISOString() } as Invoice;
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
}


