import type { Invoice, InvoiceItem } from '@/db/database.service';
import type { Order, NewOrder } from '@/ports/orders';
import type { Customer } from '@/db/database.service';

export interface UnsyncedBundle {
	customers: Customer[];
	invoices: Invoice[];
	orders: Order[];
}

export interface StoragePort {
	// Customers
	getCustomers(): Promise<Customer[]>;
	createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer>;
	updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;
	deleteCustomer(id: string): Promise<void>;

	// Orders
	getOrders(): Promise<Order[]>;
	getOrdersByCustomer?(customerId: string): Promise<Order[]>;
	createOrder(order: NewOrder): Promise<Order>;
	updateOrder(id: string, updates: Partial<Order>): Promise<Order>;
	deleteOrder(id: string): Promise<void>;

	// Invoices
	getInvoices(): Promise<Invoice[]>;
	getInvoiceById?(id: string): Promise<Invoice | null>;
	createInvoice(invoice: {
		customer_id?: string;
		customer_name: string;
		customer_phone?: string;
		customer_address?: string;
		total: number;
		paid_amount?: number;
		status?: string;
		due_date?: string;
		notes?: string;
		items?: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
		fabric_image_url?: string;
	}): Promise<Invoice>;
	updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
	deleteInvoice(id: string): Promise<void>;
	getInvoiceItems?(invoiceId: string): Promise<InvoiceItem[]>;
	createInvoiceItem?(item: Omit<InvoiceItem, 'id' | 'created_at'>): Promise<InvoiceItem>;
	updateInvoiceItem?(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem>;
	deleteInvoiceItem?(id: string): Promise<void>;

	// Sync helpers (web)
	getUnsyncedRecords?(): Promise<UnsyncedBundle>;
	markAsSynced?(tableName: 'customers' | 'invoices' | 'orders', recordId: string): Promise<void>;
	upsertCustomerFromCloud?(payload: any): Promise<void>;
	upsertInvoiceFromCloud?(payload: any): Promise<void>;
	upsertOrderFromCloud?(payload: any): Promise<void>;

	// Backup/restore helpers
	exportAll?(): Promise<{ customers: Customer[]; invoices: Invoice[]; orders: Order[]; items?: InvoiceItem[]; meta?: any }>;
	importAll?(data: { customers?: Customer[]; invoices?: Invoice[]; orders?: Order[]; items?: InvoiceItem[] }): Promise<void>;
}

export function isElectronRuntime(): boolean {
	return typeof window !== 'undefined' && !!(window as any).electronAPI;
}


