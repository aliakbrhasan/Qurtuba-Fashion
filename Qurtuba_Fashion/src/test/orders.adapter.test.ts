import { describe, it, expect, vi } from 'vitest';
import { ordersAdapter } from '@/adapters/orders.adapter';

// Mock the repository functions
vi.mock('@/db/orders.repo', () => ({
  listOrdersRepo: vi.fn(),
  createOrderRepo: vi.fn(),
}));

import { listOrdersRepo, createOrderRepo } from '@/db/orders.repo';

const mockListOrdersRepo = vi.mocked(listOrdersRepo);
const mockCreateOrderRepo = vi.mocked(createOrderRepo);

describe('Orders Adapter', () => {
  describe('list', () => {
    it('should call listOrdersRepo and return result', async () => {
      const mockOrders = [
        { id: '1', customer_name: 'Customer 1', total: 100, created_at: '2024-01-01' },
        { id: '2', customer_name: 'Customer 2', total: 200, created_at: '2024-01-02' },
      ];
      mockListOrdersRepo.mockResolvedValue(mockOrders);

      const result = await ordersAdapter.list();

      expect(mockListOrdersRepo).toHaveBeenCalledOnce();
      expect(result).toEqual(mockOrders);
    });
  });

  describe('create', () => {
    it('should call createOrderRepo with payload and return result', async () => {
      const payload = { customer_name: 'New Customer', total: 150 };
      const mockOrder = { id: '3', ...payload, created_at: '2024-01-03' };
      mockCreateOrderRepo.mockResolvedValue(mockOrder);

      const result = await ordersAdapter.create(payload);

      expect(mockCreateOrderRepo).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockOrder);
    });
  });
});





