import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listOrdersRepo, createOrderRepo } from '@/db/orders.repo';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: '1', customer_name: 'Test Customer', total: 100, created_at: '2024-01-01' },
          error: null,
        })),
      })),
    })),
  })),
};

// Mock the supabase client
vi.mock('@/db/client', () => ({
  supabase: mockSupabase,
}));

describe('Orders Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listOrdersRepo', () => {
    it('should return empty array when no orders exist', async () => {
      const result = await listOrdersRepo();
      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
    });

    it('should throw error when Supabase returns error', async () => {
      const errorMessage = 'Database connection failed';
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: errorMessage },
          })),
        })),
      });

      await expect(listOrdersRepo()).rejects.toThrow(`Failed to fetch orders: ${errorMessage}`);
    });
  });

  describe('createOrderRepo', () => {
    it('should create order successfully', async () => {
      const payload = { customer_name: 'Test Customer', total: 100 };
      const result = await createOrderRepo(payload);

      expect(result).toEqual({
        id: '1',
        customer_name: 'Test Customer',
        total: 100,
        created_at: '2024-01-01',
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
    });

    it('should throw error when creation fails', async () => {
      const errorMessage = 'Validation failed';
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: errorMessage },
            })),
          })),
        })),
      });

      const payload = { customer_name: 'Test Customer', total: 100 };
      await expect(createOrderRepo(payload)).rejects.toThrow(`Failed to create order: ${errorMessage}`);
    });
  });
});





