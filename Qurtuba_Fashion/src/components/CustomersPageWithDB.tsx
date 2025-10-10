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
	const [prefill, setPrefill] = useState<{ name: string; phone: string; address: string } | null>(null);

	return (
		<>
			<CustomersPage
				customers={customers}
				onCustomerSelect={onCustomerSelect}
				loading={loading}
				onCreateInvoiceForCustomer={(c) => {
					setPrefill({ name: c.name, phone: c.phone, address: c.address });
					setIsInvoiceDialogOpen(true);
				}}
				// Let CustomersPage handle edit dialog internally
			/>
			<NewInvoiceDialogWithDB
				isOpen={isInvoiceDialogOpen}
				onOpenChange={(open) => setIsInvoiceDialogOpen(open)}
				prefillCustomer={prefill || undefined}
			/>
		</>
	);
}


