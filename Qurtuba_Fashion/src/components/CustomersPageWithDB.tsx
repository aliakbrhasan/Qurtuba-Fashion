import { CustomersPage } from './CustomersPage';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer';
import { NewInvoiceDialogWithDB } from './NewInvoiceDialogWithDB';
import { useState } from 'react';

interface CustomersPageWithDBProps {
	onCustomerSelect: (customer: Customer) => void;
}

export function CustomersPageWithDB({ onCustomerSelect }: CustomersPageWithDBProps) {
	const { customers, loading } = useCustomers();
	const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
	const [prefill, setPrefill] = useState<{
		name: string;
		phone: string;
		address: string;
		measurements?: {
			length?: string | number;
			shoulder?: string | number;
			waist?: string | number;
			chest?: string | number;
			collar?: string | number;
		};
	} | null>(null);

	return (
		<>
			<CustomersPage
				customers={customers}
				onCustomerSelect={onCustomerSelect}
				loading={loading}
				onCreateInvoiceForCustomer={(c) => {
					// Prepare customer data with measurements (as strings to preserve text like "1 ونصف")
					setPrefill({
						name: c.name,
						phone: c.phone,
						address: c.address,
						measurements: c.measurements ? {
							length: String(c.measurements.height || ''),
							shoulder: String(c.measurements.shoulder || ''),
							waist: String(c.measurements.waist || ''),
							chest: String(c.measurements.chest || ''),
							collar: String((c.measurements as any)?.collar || '')
						} : undefined
					});
					setIsInvoiceDialogOpen(true);
				}}
				// Let CustomersPage handle edit dialog internally
			/>
			<NewInvoiceDialogWithDB
				isOpen={isInvoiceDialogOpen}
				onOpenChange={(open) => setIsInvoiceDialogOpen(open)}
				prefillCustomer={prefill || undefined}
				onInvoiceCreated={async () => {
					// Refresh data after creating a new invoice
					const { queryClient } = await import('@/app/queryClient');
					queryClient.invalidateQueries({ queryKey: ['invoices'] });
					queryClient.invalidateQueries({ queryKey: ['customers'] });
					queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
				}}
			/>
		</>
	);
}


