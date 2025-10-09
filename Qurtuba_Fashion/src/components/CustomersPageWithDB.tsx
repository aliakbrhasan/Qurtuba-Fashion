import { CustomersPage } from './CustomersPage';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer';

interface CustomersPageWithDBProps {
	onCustomerSelect: (customer: Customer) => void;
}

export function CustomersPageWithDB({ onCustomerSelect }: CustomersPageWithDBProps) {
	const { customers, loading } = useCustomers();

	return (
		<CustomersPage
			customers={customers}
			onCustomerSelect={onCustomerSelect}
			loading={loading}
		/>
	);
}


