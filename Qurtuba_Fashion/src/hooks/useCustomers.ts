import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { databaseService, type Invoice } from '@/db/database.service';
import type { Customer as UiCustomer, CustomerOrder } from '@/types/customer';

type DbCustomer = Awaited<ReturnType<typeof databaseService.getCustomers>>[number];

function stableNumberFromString(input: string): number {
    // Simple 32-bit FNV-1a hash for stable numeric id
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0; // unsigned 32-bit
    }
    // Ensure positive and within JS safe int range
    return hash & 0x7fffffff;
}

function parseIdToNumber(id: string | number | undefined): number {
    if (typeof id === 'number') return id;
    if (!id) return stableNumberFromString('missing');
    const numeric = Number(id);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) return Math.trunc(numeric);
    return stableNumberFromString(String(id));
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
    const totalSpent = (db as any).total_spent ?? (db as any).totalSpent ?? 0;
    const lastOrder = (db as any).last_order ?? (db as any).lastOrder ?? '';
    let measurements: any = (db as any).measurements;
    if (typeof measurements === 'string') {
        try { measurements = JSON.parse(measurements); } catch { measurements = null; }
    }
    if (!measurements || typeof measurements !== 'object') {
        measurements = { height: 0, shoulder: 0, waist: 0, chest: 0 };
    }
    return {
        id: parseIdToNumber((db as any).id),
        name: (db as any).name,
        phone: (db as any).phone || '',
        address: (db as any).address || '',
        totalSpent: Number(totalSpent) || 0,
        lastOrder: String(lastOrder || ''),
        label: (db as any).label || 'جديد',
        measurements,
        orders: [],
        notes: (db as any).notes,
        created_at: (db as any).created_at,
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
		staleTime: 10 * 1000,
		refetchInterval: 10 * 1000,
	});

    // Ensure customers snapshot refreshes after invoices reconciliation completes
    // This guarantees the customers page reflects newly derived customers from invoices on desktop
    useEffect(() => {
        try { void refetchCustomers(); } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoices?.length]);

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


