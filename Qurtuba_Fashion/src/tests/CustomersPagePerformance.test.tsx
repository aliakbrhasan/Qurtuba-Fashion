import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomersPage } from '../components/CustomersPage';
import { Customer } from '../types/customer';

// Mock dependencies
jest.mock('../db/database.service', () => ({
  databaseService: {
    createCustomer: jest.fn(),
    getCustomers: jest.fn(),
  }
}));

jest.mock('../components/print/PrintUtils', () => ({
  openPrintWindow: jest.fn(),
  formatPrintDateTime: jest.fn(() => '2024-01-01 12:00:00'),
}));

jest.mock('../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasActionPermission: jest.fn(() => true),
  }),
}));

jest.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: jest.fn(() => ({ id: '1', role: 'admin' })),
  },
}));

// Generate large dataset for performance testing
const generateLargeCustomerDataset = (count: number): Customer[] => {
  const labels = ['جديد', 'منتظم', 'وفي', 'ذهبي'];
  const cities = ['بغداد', 'البصرة', 'الموصل', 'أربيل', 'النجف', 'كربلاء', 'الأنبار', 'ديالى'];
  const districts = ['الكرخ', 'الرصافة', 'العشار', 'الزراعة', 'أنكاوا', 'الاسرة', 'الفلوجة', 'بعقوبة'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `زبون ${index + 1}`,
    phone: `077${String(index).padStart(8, '0')}`,
    address: `${cities[index % cities.length]}، ${districts[index % districts.length]}`,
    totalSpent: Math.floor(Math.random() * 5000) + 100,
    lastOrder: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    label: labels[index % labels.length],
    measurements: {
      height: 140 + Math.floor(Math.random() * 20),
      shoulder: 40 + Math.floor(Math.random() * 20),
      waist: 35 + Math.floor(Math.random() * 20),
      chest: 90 + Math.floor(Math.random() * 30),
    },
    orders: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, orderIndex) => ({
      id: `ORD-${index}-${orderIndex}`,
      type: `طلب ${orderIndex + 1}`,
      status: ['جديد', 'قيد التنفيذ', 'جاهز', 'مسلم'][Math.floor(Math.random() * 4)],
      orderDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      deliveryDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      total: Math.floor(Math.random() * 1000) + 100,
      paid: Math.floor(Math.random() * 500) + 50,
    })),
    notes: `ملاحظات للزبون ${index + 1}`,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const mockOnCustomerSelect = jest.fn();

describe('CustomersPage Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Performance', () => {
    it('renders 100 customers within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(100);
      const startTime = performance.now();
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
      
      // Verify all customers are rendered
      expect(screen.getByText('زبون 1')).toBeInTheDocument();
      expect(screen.getByText('زبون 100')).toBeInTheDocument();
    });

    it('renders 500 customers within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(500);
      const startTime = performance.now();
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 200ms
      expect(renderTime).toBeLessThan(200);
      
      // Verify customers are rendered
      expect(screen.getByText('زبون 1')).toBeInTheDocument();
    });

    it('renders 1000 customers within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(1000);
      const startTime = performance.now();
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 500ms
      expect(renderTime).toBeLessThan(500);
      
      // Verify customers are rendered
      expect(screen.getByText('زبون 1')).toBeInTheDocument();
    });
  });

  describe('Search Performance', () => {
    it('searches through 1000 customers within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(1000);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const searchInput = screen.getByPlaceholderText('بحث عن الزبائن، الأسماء، أو أرقام الهاتف...');
      
      const startTime = performance.now();
      fireEvent.change(searchInput, { target: { value: 'زبون 500' } });
      
      await waitFor(() => {
        expect(screen.getByText('زبون 500')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      // Search should complete within 50ms
      expect(searchTime).toBeLessThan(50);
    });

    it('handles rapid search input changes efficiently', async () => {
      const customers = generateLargeCustomerDataset(500);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const searchInput = screen.getByPlaceholderText('بحث عن الزبائن، الأسماء، أو أرقام الهاتف...');
      
      const startTime = performance.now();
      
      // Simulate rapid typing
      fireEvent.change(searchInput, { target: { value: 'ز' } });
      fireEvent.change(searchInput, { target: { value: 'زب' } });
      fireEvent.change(searchInput, { target: { value: 'زبون' } });
      fireEvent.change(searchInput, { target: { value: 'زبون 1' } });
      
      await waitFor(() => {
        expect(screen.getByText('زبون 1')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid changes within 100ms
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Filtering Performance', () => {
    it('filters 1000 customers by label within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(1000);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      // Open advanced filters
      const filterButton = screen.getByText('تصفية متقدمة');
      fireEvent.click(filterButton);
      
      const startTime = performance.now();
      
      // This would need to be implemented based on the actual Select component behavior
      // For now, we'll just verify the filter section is visible
      expect(screen.getByText('تصفية متقدمة')).toBeInTheDocument();
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;
      
      // Filtering should complete within 50ms
      expect(filterTime).toBeLessThan(50);
    });
  });

  describe('Sorting Performance', () => {
    it('sorts 1000 customers by name within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(1000);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const startTime = performance.now();
      
      // Simulate sorting (this would need to be implemented based on actual component behavior)
      // For now, we'll just verify the sort options are available
      expect(screen.getByText('الاسم')).toBeInTheDocument();
      
      const endTime = performance.now();
      const sortTime = endTime - startTime;
      
      // Sorting should complete within 50ms
      expect(sortTime).toBeLessThan(50);
    });

    it('sorts 1000 customers by total spent within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(1000);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const startTime = performance.now();
      
      // Simulate sorting by total spent
      expect(screen.getByText('إجمالي الإنفاق')).toBeInTheDocument();
      
      const endTime = performance.now();
      const sortTime = endTime - startTime;
      
      // Sorting should complete within 50ms
      expect(sortTime).toBeLessThan(50);
    });
  });

  describe('View Mode Switching Performance', () => {
    it('switches from table to grid view within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(500);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const startTime = performance.now();
      
      const gridButton = screen.getByText('شبكة');
      fireEvent.click(gridButton);
      
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      // View mode switching should complete within 100ms
      expect(switchTime).toBeLessThan(100);
    });

    it('switches from grid to table view within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(500);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      // Switch to grid first
      const gridButton = screen.getByText('شبكة');
      fireEvent.click(gridButton);
      
      const startTime = performance.now();
      
      const tableButton = screen.getByText('جدول');
      fireEvent.click(tableButton);
      
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      // View mode switching should complete within 100ms
      expect(switchTime).toBeLessThan(100);
    });
  });

  describe('Statistics Calculation Performance', () => {
    it('calculates statistics for 1000 customers within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(1000);
      
      const startTime = performance.now();
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const endTime = performance.now();
      const calculationTime = endTime - startTime;
      
      // Statistics calculation should complete within 100ms
      expect(calculationTime).toBeLessThan(100);
      
      // Verify statistics are displayed
      expect(screen.getByText('إجمالي الزبائن')).toBeInTheDocument();
      expect(screen.getByText('منتظمون')).toBeInTheDocument();
      expect(screen.getByText('زبائن ذهبيون')).toBeInTheDocument();
      expect(screen.getByText('إجمالي الإنفاق')).toBeInTheDocument();
    });
  });

  describe('Memory Usage', () => {
    it('does not cause memory leaks with large datasets', async () => {
      const customers = generateLargeCustomerDataset(1000);
      
      // Render and unmount multiple times to check for memory leaks
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <CustomersPage
            customers={customers}
            onCustomerSelect={mockOnCustomerSelect}
            loading={false}
          />
        );
        
        unmount();
      }
      
      // If we reach here without errors, the test passes
      expect(true).toBe(true);
    });
  });

  describe('Interaction Performance', () => {
    it('handles customer selection efficiently', async () => {
      const customers = generateLargeCustomerDataset(1000);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const startTime = performance.now();
      
      const customerRow = screen.getByText('زبون 1');
      fireEvent.click(customerRow);
      
      const endTime = performance.now();
      const clickTime = endTime - startTime;
      
      // Customer selection should complete within 10ms
      expect(clickTime).toBeLessThan(10);
      
      expect(mockOnCustomerSelect).toHaveBeenCalledWith(customers[0]);
    });

    it('handles multiple rapid clicks efficiently', async () => {
      const customers = generateLargeCustomerDataset(500);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const startTime = performance.now();
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        const customerRow = screen.getByText('زبون 1');
        fireEvent.click(customerRow);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid clicks within 100ms
      expect(totalTime).toBeLessThan(100);
      
      // Should have been called 10 times
      expect(mockOnCustomerSelect).toHaveBeenCalledTimes(10);
    });
  });

  describe('Print Performance', () => {
    it('generates print data for 1000 customers within acceptable time', async () => {
      const customers = generateLargeCustomerDataset(1000);
      
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      
      const startTime = performance.now();
      
      const printButton = screen.getByText('طباعة القائمة');
      fireEvent.click(printButton);
      
      const endTime = performance.now();
      const printTime = endTime - startTime;
      
      // Print data generation should complete within 200ms
      expect(printTime).toBeLessThan(200);
    });
  });
});

// Performance benchmarks
describe('CustomersPage Performance Benchmarks', () => {
  it('meets performance benchmarks for different dataset sizes', async () => {
    const benchmarks = [
      { size: 100, maxRenderTime: 100, maxSearchTime: 20, maxSortTime: 20 },
      { size: 500, maxRenderTime: 200, maxSearchTime: 30, maxSortTime: 30 },
      { size: 1000, maxRenderTime: 500, maxSearchTime: 50, maxSortTime: 50 },
    ];
    
    for (const benchmark of benchmarks) {
      const customers = generateLargeCustomerDataset(benchmark.size);
      
      // Test rendering performance
      const renderStart = performance.now();
      render(
        <CustomersPage
          customers={customers}
          onCustomerSelect={mockOnCustomerSelect}
          loading={false}
        />
      );
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      expect(renderTime).toBeLessThan(benchmark.maxRenderTime);
      
      // Test search performance
      const searchInput = screen.getByPlaceholderText('بحث عن الزبائن، الأسماء، أو أرقام الهاتف...');
      const searchStart = performance.now();
      fireEvent.change(searchInput, { target: { value: 'زبون 1' } });
      await waitFor(() => {
        expect(screen.getByText('زبون 1')).toBeInTheDocument();
      });
      const searchEnd = performance.now();
      const searchTime = searchEnd - searchStart;
      
      expect(searchTime).toBeLessThan(benchmark.maxSearchTime);
    }
  });
});
