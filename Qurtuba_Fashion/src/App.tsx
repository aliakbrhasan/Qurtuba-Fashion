import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { InvoicesPageWithDB } from './components/InvoicesPageWithDB';
import { CustomersPage } from './components/CustomersPage';
import { FinancialPage } from './components/FinancialPage';
import { CustomerDetailsPageWithDB } from './components/CustomerDetailsPageWithDB';
import { InvoiceDetailsPage } from './components/InvoiceDetailsPage';
import { NewInvoiceDialogWithDB } from './components/NewInvoiceDialogWithDB';
import { UsersManagementPage } from './components/UsersManagementPage';
import { RolesManagementPage } from './components/RolesManagementPage';
import { Toaster } from './components/ui/sonner';
import { AppProviders } from './app/AppProviders';
import { Customer } from './types/customer';
import { databaseService } from './db/database.service';
import { authService, User } from './services/auth.service';
import './db/init'; // Initialize database

const customersData: Customer[] = [
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
      {
        id: 'ORD-0987',
        type: 'بدلة رسمية',
        status: 'مسلم',
        orderDate: '2023-12-05',
        deliveryDate: '2023-12-20',
        total: 480,
        paid: 480,
      },
      {
        id: 'ORD-0881',
        type: 'عباءة فاخرة',
        status: 'مسلم',
        orderDate: '2023-10-18',
        deliveryDate: '2023-10-30',
        total: 520,
        paid: 520,
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
      {
        id: 'ORD-1042',
        type: 'بدلة عصرية',
        status: 'جاهز',
        orderDate: '2023-12-22',
        deliveryDate: '2024-01-02',
        total: 210,
        paid: 210,
      },
      {
        id: 'ORD-0975',
        type: 'دشداشة صيفية',
        status: 'مسلم',
        orderDate: '2023-08-18',
        deliveryDate: '2023-08-30',
        total: 250,
        paid: 250,
      },
    ],
    created_at: '2023-08-01T10:00:00.000Z',
  },
  {
    id: 3,
    name: 'محمد خالد ',
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
      {
        id: 'ORD-1133',
        type: 'قميص رسمي',
        status: 'مسلم',
        orderDate: '2023-11-28',
        deliveryDate: '2023-12-08',
        total: 120,
        paid: 120,
      },
      {
        id: 'ORD-1008',
        type: 'سروال رسمي',
        status: 'مسلم',
        orderDate: '2023-06-12',
        deliveryDate: '2023-06-25',
        total: 120,
        paid: 120,
      },
    ],
    created_at: '2023-06-01T10:00:00.000Z',
  },
  {
    id: 4,
    name: 'علي حسن ',
    phone: '07512345678',
    address: 'أربيل، حي أنكاوا',
    totalSpent: 150,
    lastOrder: '2024-01-12',
    label: 'جديد',
    measurements: {
      height: 144,
      shoulder: 47,
      waist: 42,
      chest: 108,
    },
    orders: [
      {
        id: 'ORD-1302',
        type: 'دشداشة شبابية',
        status: 'جديد',
        orderDate: '2024-01-12',
        deliveryDate: '2024-01-28',
        total: 150,
        paid: 50,
      },
    ],
    created_at: '2024-01-01T10:00:00.000Z',
  },
  {
    id: 5,
    name: 'عبدالله أحمد ',
    phone: '07605678901',
    address: 'النجف، حي الاسرة',
    totalSpent: 890,
    lastOrder: '2024-01-08',
    label: 'وفي',
    measurements: {
      height: 139,
      shoulder: 44,
      waist: 39,
      chest: 102,
    },
    orders: [
      {
        id: 'ORD-1155',
        type: 'قميص عملي',
        status: 'مسلم',
        orderDate: '2023-09-15',
        deliveryDate: '2023-09-28',
        total: 200,
        paid: 200,
      },
      {
        id: 'ORD-0902',
        type: 'دشداشة رسمية',
        status: 'مسلم',
        orderDate: '2023-11-30',
        deliveryDate: '2023-12-10',
        total: 230,
        paid: 230,
      },
      {
        id: 'ORD-1011',
        type: 'جاكيت شتوي',
        status: 'مسلم',
        orderDate: '2023-12-20',
        deliveryDate: '2024-01-05',
        total: 260,
        paid: 260,
      },
      {
        id: 'ORD-1077',
        type: 'دشداشة بخيوط تطريز',
        status: 'جاهز',
        orderDate: '2024-01-08',
        deliveryDate: '2024-01-21',
        total: 200,
        paid: 120,
      },
    ],
    notes: 'يحب التفاصيل المطرزة حول الياقة والأكمام.',
    created_at: '2023-09-01T10:00:00.000Z',
  },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isNewInvoiceDialogOpen, setIsNewInvoiceDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Load customers from database
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        await databaseService.getCustomers();
        // For now, keep using the hardcoded data for the UI
        setCustomers(customersData);
      } catch (error) {
        console.error('Error loading customers:', error);
        // Fallback to hardcoded data if database fails
        setCustomers(customersData);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      loadCustomers();
    }
  }, [isLoggedIn]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
    setSelectedCustomer(null);
    setSelectedInvoice(null);
    setIsNewInvoiceDialogOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setCurrentPage('dashboard');
      setSelectedCustomer(null);
      setSelectedInvoice(null);
      setIsNewInvoiceDialogOpen(false);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page !== 'customerDetails' && page !== 'invoiceDetails') {
      setSelectedCustomer(null);
    }
    if (page !== 'invoiceDetails') {
      setSelectedInvoice(null);
    }
    setIsNewInvoiceDialogOpen(false);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentPage('customerDetails');
  };

  const handleCreateInvoice = () => {
    setIsNewInvoiceDialogOpen(true);
  };

  const handleViewInvoiceDetails = (invoice: any) => {
    // إذا كان invoice كائن كامل، نأخذ الـ ID
    // إذا كان ID فقط، نستخدمه مباشرة
    const invoiceId = typeof invoice === 'string' ? invoice : invoice.id;
    setSelectedInvoice({ id: invoiceId });
    setCurrentPage('invoiceDetails');
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    // Here you would typically update the invoice status in your data store
    console.log('Marking invoice as paid:', invoiceId);
    // For now, we'll just update the local state
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice({
        ...selectedInvoice,
        status: 'مدفوع',
        paid: selectedInvoice.total
      });
    }
    // You would also update the invoices list here in a real application
    // This is just for demonstration purposes
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onCreateInvoice={handleCreateInvoice}
          />
        );
      case 'invoices':
        return <InvoicesPageWithDB onCreateInvoice={handleCreateInvoice} onViewInvoiceDetails={handleViewInvoiceDetails} onMarkAsPaid={handleMarkAsPaid} />;
      case 'customers':
        return (
          <CustomersPage
            customers={customers}
            onCustomerSelect={handleCustomerSelect}
            loading={loading}
          />
        );
      case 'customerDetails':
        return selectedCustomer ? (
          <CustomerDetailsPageWithDB
            customer={selectedCustomer}
            onBack={() => {
              setSelectedCustomer(null);
              setCurrentPage('customers');
            }}
            onViewInvoiceDetails={handleViewInvoiceDetails}
          />
        ) : (
          <CustomersPage
            customers={customers}
            onCustomerSelect={handleCustomerSelect}
            loading={loading}
          />
        );
      case 'invoiceDetails':
        return selectedInvoice ? (
          <InvoiceDetailsPage
            invoiceId={selectedInvoice.id}
            onBack={() => {
              setSelectedInvoice(null);
              setCurrentPage('invoices');
            }}
            onMarkAsPaid={handleMarkAsPaid}
          />
        ) : (
          <InvoicesPageWithDB onCreateInvoice={handleCreateInvoice} onViewInvoiceDetails={handleViewInvoiceDetails} onMarkAsPaid={handleMarkAsPaid} />
        );
      case 'financial':
        return <FinancialPage />;
      case 'users':
        return <UsersManagementPage onNavigate={handleNavigate} />;
      case 'roles':
        return <RolesManagementPage onBack={() => setCurrentPage('users')} />;
      default:
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onCreateInvoice={handleCreateInvoice}
          />
        );
    }
  };

  return (
    <AppProviders>
      <div className="min-h-screen">
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <Layout
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
            currentUser={currentUser}
          >
            {renderCurrentPage()}
            <NewInvoiceDialogWithDB
              isOpen={isNewInvoiceDialogOpen}
              onOpenChange={setIsNewInvoiceDialogOpen}
            />
          </Layout>
        )}
        <Toaster position="top-center" />
      </div>
    </AppProviders>
  );
}