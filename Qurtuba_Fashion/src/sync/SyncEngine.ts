import { createClient } from '@supabase/supabase-js';
import type { StoragePort } from '@/storage/StoragePort';

const fallbackSupabaseUrl = 'https://dbjaogpesmyrqjwtzzwr.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamFvZ3Blc215cnFqd3R6endyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Nzk1MzksImV4cCI6MjA3NDA1NTUzOX0.mioc1bAd_RYxcKS546MuBB3-DpLdyxxJiumJW4zv6Rw';

export class SyncEngine {
	private storage: StoragePort;
	private supabase: any;
	private timer: any = null;

	constructor(storage: StoragePort) {
		this.storage = storage;
		const url = (import.meta as any).env?.VITE_SUPABASE_URL || fallbackSupabaseUrl;
		const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;
		this.supabase = createClient(url, key);
	}

	schedule(intervalMs: number = 60000) {
		if (this.timer) return;
		this.timer = setInterval(() => {
			this.sync().catch(() => {});
		}, intervalMs);
	}

	async sync(): Promise<void> {
		if (!this.storage.getUnsyncedRecords) return; // Electron renderer uses main-process sync
		await this.push();
		await this.pull();
	}

	private async push(): Promise<void> {
		const bundle = await this.storage.getUnsyncedRecords!();
		// customers
		for (const c of bundle.customers) {
			await this.supabase.from('customers').upsert({
				id: c.id,
				name: c.name,
				phone: c.phone,
				address: c.address,
				total_spent: (c as any).totalSpent ?? (c as any).total_spent ?? 0,
				last_order: (c as any).lastOrder ?? (c as any).last_order ?? null,
				label: c.label,
				measurements: (c as any).measurements ?? null,
				notes: c.notes,
				created_at: c.created_at,
				updated_at: new Date().toISOString(),
			});
			await this.storage.markAsSynced!('customers', c.id);
		}
		// invoices
		for (const inv of bundle.invoices) {
			await this.supabase.from('invoices').upsert({
				id: inv.id,
				invoice_number: inv.invoice_number,
				customer_id: inv.customer_id,
				customer_name: inv.customer_name,
				customer_phone: inv.customer_phone,
				customer_address: inv.customer_address,
				total: inv.total,
				paid_amount: inv.paid_amount,
				status: inv.status,
				invoice_date: inv.invoice_date,
				due_date: inv.due_date,
				notes: inv.notes,
				fabric_image_url: (inv as any).fabric_image_url,
				created_at: inv.created_at,
				updated_at: new Date().toISOString(),
			});
			await this.storage.markAsSynced!('invoices', inv.id);
		}
		// orders
		for (const o of bundle.orders) {
			await this.supabase.from('orders').upsert({
				id: o.id,
				customer_id: (o as any).customer_id,
				order_date: (o as any).order_date || o.created_at,
				delivery_date: (o as any).delivery_date || (o as any).order_date || o.created_at,
				status: (o as any).status || 'محدث',
				total: o.total,
				notes: (o as any).notes,
				created_at: o.created_at,
				updated_at: new Date().toISOString(),
			});
			await this.storage.markAsSynced!('orders', o.id);
		}
	}

	private async pull(): Promise<void> {
		// customers
		const { data: customers } = await this.supabase.from('customers').select('*').order('updated_at', { ascending: false });
		if (customers && this.storage.upsertCustomerFromCloud) {
			for (const c of customers) {
				await this.storage.upsertCustomerFromCloud({ ...c });
			}
			// reconcile deletions
			const cloudIds = new Set<string>(customers.map((c: any) => String(c.id)));
			const locals = await this.storage.getCustomers();
			for (const lc of locals) {
				if (!cloudIds.has(String(lc.id))) {
					await (this.storage as any).deleteCustomer?.(String(lc.id));
				}
			}
		}
		// invoices
		const { data: invoices } = await this.supabase.from('invoices').select('*').order('updated_at', { ascending: false });
		if (invoices && this.storage.upsertInvoiceFromCloud) {
			for (const inv of invoices) {
				await this.storage.upsertInvoiceFromCloud({ ...inv });
			}
			const cloudIds = new Set<string>(invoices.map((i: any) => String(i.id)));
			const locals = await this.storage.getInvoices();
			for (const li of locals) {
				if (!cloudIds.has(String(li.id))) {
					await (this.storage as any).deleteInvoice?.(String(li.id));
				}
			}
		}
		// orders
		const { data: orders } = await this.supabase.from('orders').select('*').order('updated_at', { ascending: false });
		if (orders && this.storage.upsertOrderFromCloud) {
			for (const o of orders) {
				await this.storage.upsertOrderFromCloud({ ...o });
			}
			const cloudIds = new Set<string>(orders.map((o: any) => String(o.id)));
			const locals = await this.storage.getOrders();
			for (const lo of locals) {
				if (!cloudIds.has(String(lo.id))) {
					await (this.storage as any).deleteOrder?.(String(lo.id));
				}
			}
		}
	}
}


