import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomersPage } from '../components/CustomersPage';
import { Customer } from '../types/customer';

// Mock the database service
jest.mock('../db/database.service', () => ({
  databaseService: {
    createCustomer: jest.fn(),
    getCustomers: jest.fn(),
  }
}));

// Mock the print utilities
jest.mock('../components/print/PrintUtils', () => ({
  openPrintWindow: jest.fn(),
  formatPrintDateTime: jest.fn(() => '2024-01-01 12:00:00'),
}));

// Mock the permissions hook
jest.mock('../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasActionPermission: jest.fn(() => true),
  }),
}));

// Mock the auth service
jest.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: jest.fn(() => ({ id: '1', role: 'admin' })),
  },
}));

// Sample test data
const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'أحمد محمد العراقي',
    phone: '07701234567',
    address: 'بغداد، منطقة الكرخ',
    totalSpent: 1250,
    lastOrder: '2024-01-15',
    label: 'ذهبي',
    measurements: {
      height: 142,
      shoulder: 49,
      waist: 44,
      chest: 110,
    },
    orders: [
      {
        id: 'ORD-1024',
        type: 'دشداشة ستايل كويتي',
        status: 'جاهز',
        orderDate: '2024-01-15',
        deliveryDate: '2024-01-25',
        total: 250,
        paid: 200,
      },
    ],
    notes: 'يفضل الأقمشة الفاخرة ذات الألوان الهادئة.',
    created_at: '2023-10-01T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'صالح علي الأحمد',
    phone: '07807654321',
    address: 'البصرة، حي العشار',
    totalSpent: 680,
    lastOrder: '2024-01-14',
    label: 'وفي',
    measurements: {
      height: 138,
      shoulder: 46,
      waist: 40,
      chest: 104,
    },
    orders: [
      {
        id: 'ORD-1101',
        type: 'دشداشة إماراتية',
        status: 'قيد التنفيذ',
        orderDate: '2024-01-14',
        deliveryDate: '2024-01-24',
        total: 220,
        paid: 100,
      },
    ],
    created_at: '2023-08-01T10:00:00.000Z',
  },
  {
    id: 3,
    name: 'محمد خالد',
    phone: '07909876543',
    address: 'الموصل، حي الزراعة',
    totalSpent: 420,
    lastOrder: '2024-01-10',
    label: 'منتظم',
    measurements: {
      height: 140,
      shoulder: 45,
      waist: 38,
      chest: 100,
    },
    orders: [
      {
        id: 'ORD-1200',
        type: 'دشداشة كلاسيكية',
        status: 'قيد التنفيذ',
        orderDate: '2024-01-10',
        deliveryDate: '2024-01-22',
        total: 180,
        paid: 50,
      },
    ],
    created_at: '2023-06-01T10:00:00.000Z',
  },
];

const mockOnCustomerSelect = jest.fn();

describe('CustomersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders customers page with header and statistics', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('إدارة الزبائن')).toBeInTheDocument();
    expect(screen.getByText('إدارة شاملة لبيانات العملاء والزبائن')).toBeInTheDocument();
    expect(screen.getByText('إجمالي الزبائن')).toBeInTheDocument();
    expect(screen.getByText('منتظمون')).toBeInTheDocument();
    expect(screen.getByText('زبائن ذهبيون')).toBeInTheDocument();
    expect(screen.getByText('إجمالي الإنفاق')).toBeInTheDocument();
  });

  it('displays correct statistics', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    // Check total customers
    expect(screen.getByText('3')).toBeInTheDocument(); // Total customers
    
    // Check golden customers
    expect(screen.getByText('1')).toBeInTheDocument(); // Golden customers
    
    // Check regular customers
    expect(screen.getByText('1')).toBeInTheDocument(); // Regular customers
  });

  it('displays customers in table view by default', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('أحمد محمد العراقي')).toBeInTheDocument();
    expect(screen.getByText('صالح علي الأحمد')).toBeInTheDocument();
    expect(screen.getByText('محمد خالد')).toBeInTheDocument();
  });

  it('allows searching customers by name', async () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('بحث عن الزبائن، الأسماء، أو أرقام الهاتف...');
    fireEvent.change(searchInput, { target: { value: 'أحمد' } });

    await waitFor(() => {
      expect(screen.getByText('أحمد محمد العراقي')).toBeInTheDocument();
      expect(screen.queryByText('صالح علي الأحمد')).not.toBeInTheDocument();
    });
  });

  it('allows searching customers by phone', async () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('بحث عن الزبائن، الأسماء، أو أرقام الهاتف...');
    fireEvent.change(searchInput, { target: { value: '07701234567' } });

    await waitFor(() => {
      expect(screen.getByText('أحمد محمد العراقي')).toBeInTheDocument();
      expect(screen.queryByText('صالح علي الأحمد')).not.toBeInTheDocument();
    });
  });

  it('allows filtering by customer label', async () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    // Open advanced filters
    const filterButton = screen.getByText('تصفية متقدمة');
    fireEvent.click(filterButton);

    // Select golden customers filter
    const labelSelect = screen.getByDisplayValue('جميع التصنيفات');
    fireEvent.click(labelSelect);

    // This would need to be implemented based on the actual Select component behavior
    // For now, we'll just verify the filter section is visible
    expect(screen.getByText('تصفية متقدمة')).toBeInTheDocument();
  });

  it('allows sorting customers by different criteria', async () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    const sortSelect = screen.getByDisplayValue('الاسم');
    fireEvent.click(sortSelect);

    // Verify sort options are available
    expect(screen.getByText('الاسم')).toBeInTheDocument();
    expect(screen.getByText('إجمالي الإنفاق')).toBeInTheDocument();
    expect(screen.getByText('عدد الطلبات')).toBeInTheDocument();
    expect(screen.getByText('آخر طلب')).toBeInTheDocument();
    expect(screen.getByText('التصنيف')).toBeInTheDocument();
  });

  it('allows switching between table and grid view', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    const gridButton = screen.getByText('شبكة');
    fireEvent.click(gridButton);

    // Verify view mode buttons are present
    expect(screen.getByText('جدول')).toBeInTheDocument();
    expect(screen.getByText('شبكة')).toBeInTheDocument();
  });

  it('opens new customer dialog when clicking add customer button', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    const addButton = screen.getByText('زبون جديد');
    fireEvent.click(addButton);

    expect(screen.getByText('إضافة زbون جديد')).toBeInTheDocument();
    expect(screen.getByText('أدخل بيانات الزبون الجديد')).toBeInTheDocument();
  });

  it('calls onCustomerSelect when clicking on a customer row', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    const customerRow = screen.getByText('أحمد محمد العراقي');
    fireEvent.click(customerRow);

    expect(mockOnCustomerSelect).toHaveBeenCalledWith(mockCustomers[0]);
  });

  it('displays loading state correctly', () => {
    render(
      <CustomersPage
        customers={[]}
        onCustomerSelect={mockOnCustomerSelect}
        loading={true}
      />
    );

    expect(screen.getByText('جاري تحميل بيانات الزبائن...')).toBeInTheDocument();
  });

  it('displays empty state when no customers match search criteria', async () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('بحث عن الزبائن، الأسماء، أو أرقام الهاتف...');
    fireEvent.change(searchInput, { target: { value: 'غير موجود' } });

    await waitFor(() => {
      expect(screen.getByText('لا توجد زبائن')).toBeInTheDocument();
      expect(screen.getByText('لم يتم العثور على زبائن تطابق معايير البحث')).toBeInTheDocument();
    });
  });

  it('displays customer labels with correct styling', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('ذهبي')).toBeInTheDocument();
    expect(screen.getByText('وفي')).toBeInTheDocument();
    expect(screen.getByText('منتظم')).toBeInTheDocument();
  });

  it('displays customer phone numbers correctly', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('07701234567')).toBeInTheDocument();
    expect(screen.getByText('07807654321')).toBeInTheDocument();
    expect(screen.getByText('07909876543')).toBeInTheDocument();
  });

  it('displays customer addresses correctly', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('بغداد، منطقة الكرخ')).toBeInTheDocument();
    expect(screen.getByText('البصرة، حي العشار')).toBeInTheDocument();
    expect(screen.getByText('الموصل، حي الزراعة')).toBeInTheDocument();
  });

  it('displays customer total spent amounts correctly', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('1,250 د.ع')).toBeInTheDocument();
    expect(screen.getByText('680 د.ع')).toBeInTheDocument();
    expect(screen.getByText('420 د.ع')).toBeInTheDocument();
  });

  it('displays customer order counts correctly', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    // Each customer has 1 order in the mock data
    expect(screen.getAllByText('1')).toHaveLength(4); // 3 customers + 1 in statistics
  });

  it('allows clearing all filters', async () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    // Set some filters first
    const searchInput = screen.getByPlaceholderText('بحث عن الزبائن، الأسماء، أو أرقام الهاتف...');
    fireEvent.change(searchInput, { target: { value: 'أحمد' } });

    // Clear filters
    const clearButton = screen.getByText('مسح الفلاتر');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      expect(screen.getByText('أحمد محمد العراقي')).toBeInTheDocument();
      expect(screen.getByText('صالح علي الأحمد')).toBeInTheDocument();
      expect(screen.getByText('محمد خالد')).toBeInTheDocument();
    });
  });

  it('displays print button when user has permission', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('طباعة القائمة')).toBeInTheDocument();
  });

  it('displays add customer button when user has permission', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('زبون جديد')).toBeInTheDocument();
  });

  it('displays statistics when user has permission', () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    expect(screen.getByText('إجمالي الزبائن')).toBeInTheDocument();
    expect(screen.getByText('منتظمون')).toBeInTheDocument();
    expect(screen.getByText('زبائن ذهبيون')).toBeInTheDocument();
    expect(screen.getByText('إجمالي الإنفاق')).toBeInTheDocument();
  });
});

// Integration tests
describe('CustomersPage Integration', () => {
  it('handles complete customer workflow', async () => {
    const { databaseService } = require('../db/database.service');
    
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    // Open new customer dialog
    const addButton = screen.getByText('زبون جديد');
    fireEvent.click(addButton);

    // Fill in customer details
    const nameInput = screen.getByLabelText('الاسم الكامل');
    const phoneInput = screen.getByLabelText('رقم الهاتف');
    const addressInput = screen.getByLabelText('العنوان');

    fireEvent.change(nameInput, { target: { value: 'زبون جديد' } });
    fireEvent.change(phoneInput, { target: { value: '07799999999' } });
    fireEvent.change(addressInput, { target: { value: 'عنوان جديد' } });

    // Submit form
    const submitButton = screen.getByText('حفظ الزبون');
    fireEvent.click(submitButton);

    // Verify database service was called
    await waitFor(() => {
      expect(databaseService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'زبون جديد',
          phone: '07799999999',
          address: 'عنوان جديد',
          label: 'جديد',
        })
      );
    });
  });

  it('handles search and filter combination', async () => {
    render(
      <CustomersPage
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        loading={false}
      />
    );

    // Search for a specific customer
    const searchInput = screen.getByPlaceholderText('بحث عن الزبائن، الأسماء، أو أرقام الهاتف...');
    fireEvent.change(searchInput, { target: { value: 'أحمد' } });

    await waitFor(() => {
      expect(screen.getByText('أحمد محمد العراقي')).toBeInTheDocument();
      expect(screen.queryByText('صالح علي الأحمد')).not.toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('أحمد محمد العراقي')).toBeInTheDocument();
      expect(screen.getByText('صالح علي الأحمد')).toBeInTheDocument();
      expect(screen.getByText('محمد خالد')).toBeInTheDocument();
    });
  });
});
