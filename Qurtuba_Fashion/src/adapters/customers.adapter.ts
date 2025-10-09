import type { Customer } from '@/types/user';
import { databaseService } from '@/db/database.service';

export interface CustomersPort {
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
}

export const customersAdapter: CustomersPort = {
  getCustomers: async (): Promise<Customer[]> => await databaseService.getCustomers(),
  createCustomer: async (customer: Omit<Customer, 'id'>): Promise<Customer> => await databaseService.createCustomer(customer),
  updateCustomer: async (id: number, updates: Partial<Customer>): Promise<Customer> => await databaseService.updateCustomer(id, updates),
  deleteCustomer: async (id: number): Promise<void> => await databaseService.deleteCustomer(id),
};
