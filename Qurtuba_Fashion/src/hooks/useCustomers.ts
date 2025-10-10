import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { databaseService, type Invoice } from '@/db/database.service';
import type { Customer as UiCustomer, CustomerOrder } from '@/types/customer';

type DbCustomer = Awaited<ReturnType<typeof databaseService.getCustomers>>[number];

function parseIdToNumber(id: string | number | undefined): number {
	if (typeof id === 'number') return id;
	if (!id) return Date.now();
	const parsed = parseInt(String(id), 10);
	return Number.isNaN(parsed) ? Date.now() : parsed;
}

function buildOrderFromInvoice(invoice: Invoice): CustomerOrder {
	return {
		id: String(invoice.id),
		type: 'فاتورة',
		status: invoice.status,
		orderDate: invoice.invoice_date || invoice.created_at,
		deliveryDate: invoice.due_date || invoice.invoice_date || invoice.created_at,
		total: invoice.total,
		paid: invoice.paid_amount || 0,
	};
}

function mapDbCustomerToUi(db: DbCustomer): UiCustomer {
	return {
		id: parseIdToNumber(db.id),
		name: db.name,
		phone: db.phone || '',
		address: db.address || '',
		totalSpent: db.totalSpent || 0,
		lastOrder: db.lastOrder || '',
		label: db.label || 'جديد',
		measurements: db.measurements || { height: 0, shoulder: 0, waist: 0, chest: 0 },
		orders: [],
		notes: db.notes,
		created_at: db.created_at,
	};
}

export function useCustomers() {
	const {
		data: dbCustomers = [],
		isLoading: loadingCustomers,
		error: customersError,
		refetch: refetchCustomers,
	} = useQuery({
		queryKey: ['customers'],
		queryFn: () => databaseService.getCustomers(),
		staleTime: 5 * 60 * 1000,
		refetchInterval: 30 * 1000,
	});

	const {
		data: invoices = [],
		isLoading: loadingInvoices,
		error: invoicesError,
		refetch: refetchInvoices,
	} = useQuery({
		// Share cache with invoices page
		queryKey: ['invoices'],
		queryFn: async () => {
			const rows = await databaseService.getInvoices();
			// Keep customers table up-to-date from invoices
			try { await databaseService.reconcileCustomersFromInvoices(rows); } catch {}
			return rows;
		},
		staleTime: 60 * 1000,
		refetchInterval: 30 * 1000,
	});

	const customers: UiCustomer[] = useMemo(() => {
		// Seed with DB customers, create primary and alias indices
		const map = new Map<string, UiCustomer>(); // key -> customer
		const aliasToKey = new Map<string, string>(); // name|phone -> key

		for (const c of dbCustomers) {
			const ui = mapDbCustomerToUi(c);
			const key = String(c.id);
			map.set(key, ui);
			const alias = `${(c.name || '').trim()}|${(c.phone || '').trim()}`;
			if (alias !== '|') aliasToKey.set(alias, key);
		}

		for (const inv of invoices) {
			const idKey = inv.customer_id ? String(inv.customer_id) : null;
			const alias = `${(inv.customer_name || '').trim()}|${(inv.customer_phone || '').trim()}`;

			let keyToUse: string | null = null;
			if (idKey && map.has(idKey)) {
				keyToUse = idKey;
			} else if (aliasToKey.has(alias)) {
				keyToUse = aliasToKey.get(alias)!;
			}

			let customer: UiCustomer | undefined = keyToUse ? map.get(keyToUse) : undefined;

			if (!customer) {
				// Create a new customer derived from invoice
				customer = {
					id: parseIdToNumber(inv.customer_id),
					name: inv.customer_name,
					phone: inv.customer_phone || '',
					address: inv.customer_address || '',
					totalSpent: 0,
					lastOrder: inv.invoice_date || inv.created_at,
					label: 'جديد',
					measurements: { height: 0, shoulder: 0, waist: 0, chest: 0 },
					orders: [],
					created_at: inv.created_at,
				};
				// Prefer idKey when available to keep stable keys; otherwise use alias
				keyToUse = idKey || alias;
				map.set(keyToUse, customer);
				// Ensure alias also maps to this key for future invoices
				if (alias !== '|') aliasToKey.set(alias, keyToUse);
			}

			// Append order from this invoice
			customer.orders.push(buildOrderFromInvoice(inv));
			customer.totalSpent += inv.paid_amount || 0;
			const candidateDate = inv.invoice_date || inv.created_at;
			if (!customer.lastOrder || new Date(candidateDate) > new Date(customer.lastOrder)) {
				customer.lastOrder = candidateDate;
			}
		}

		// Ensure stable order
		return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
	}, [dbCustomers, invoices]);

	return {
		customers,
		loading: loadingCustomers || loadingInvoices,
		error: customersError?.message || invoicesError?.message || null,
		reload: async () => {
			await Promise.all([refetchCustomers(), refetchInvoices()]);
		},
	};
}


