import { useState, Suspense } from 'react';
import React from 'react';
const AppProvidersLazy = React.lazy(() => import('./app/AppProviders').then(m => ({ default: m.AppProviders })));
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { InvoicesPageWithDB } from './components/InvoicesPageWithDB';
// CustomersPageWithDB drives the customers UI from DB/invoices
import { CustomersPageWithDB } from './components/CustomersPageWithDB';
import { FinancialPage } from './components/FinancialPage';
import { CustomerDetailsPageWithDB } from './components/CustomerDetailsPageWithDB';
import { InvoiceDetailsPage } from './components/InvoiceDetailsPage';
import { NewInvoiceDialogWithDB } from './components/NewInvoiceDialogWithDB';
import { UsersManagementPage } from './components/UsersManagementPage';
import { AdminLogPage } from './components/AdminLogPage';
import { RolesManagementPage } from './components/RolesManagementPage';
import { Toaster } from './components/ui/sonner';

import { useArabicSanitizer } from './hooks/useArabicSanitizer';
import { Customer } from './types/customer';
import { authService, User } from './services/auth.service';
// Database init removed to prevent test/sync side-effects on reload

// Legacy sample customers removed; customers are now sourced from DB/invoices via CustomersPageWithDB

export default function App() {
  useArabicSanitizer();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isNewInvoiceDialogOpen, setIsNewInvoiceDialogOpen] = useState(false);
  

  // Customers are loaded by CustomersPageWithDB via react-query

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

  const handleNavigate = (page: string, itemId?: string) => {
    setCurrentPage(page);
    if (page !== 'customerDetails' && page !== 'invoiceDetails') {
      setSelectedCustomer(null);
    }
    if (page !== 'invoiceDetails') {
      setSelectedInvoice(null);
    }
    setIsNewInvoiceDialogOpen(false);

    // Handle navigation with specific item IDs
    if (itemId) {
      if (page === 'invoices') {
        setSelectedInvoice({ id: itemId });
        setCurrentPage('invoiceDetails');
      } else if (page === 'customers') {
        // For customers, we need to load the customer data first
        // This will be handled by the notification system
        setCurrentPage('customers');
      }
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentPage('customerDetails');
  };

  const handleCreateInvoice = () => {
    setIsNewInvoiceDialogOpen(true);
  };

  const handleViewInvoiceDetails = (invoice: any) => {
    // Ø¥Ø°Ø§ ÙƒØ§Ù† invoice ÙƒØ§Ø¦Ù† ÙƒØ§Ù…Ù„ØŒ Ù†Ø£Ø®Ø° Ø§Ù„Ù€ ID
    // Ø¥Ø°Ø§ ÙƒØ§Ù† ID ÙÙ‚Ø·ØŒ Ù†Ø³ØªØ®Ø¯Ù…Ù‡ Ù…Ø¨Ø§Ø´Ø±Ø©
    const invoiceId = typeof invoice === 'string' ? invoice : invoice.id;
    setSelectedInvoice({ id: invoiceId });
    setCurrentPage('invoiceDetails');
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const { InvoiceService } = await import('@/services/invoice.service');
      const { queryClient } = await import('./app/queryClient');
      await InvoiceService.markAsPaid(invoiceId);
      try { queryClient.invalidateQueries({ queryKey: ['invoices'] }); } catch {}
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({ ...selectedInvoice, status: 'Ù…Ø¯ÙÙˆØ¹' });
      }
    } catch (e) {
      console.error('Failed to mark as paid:', e);
    }
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
          <CustomersPageWithDB
            onCustomerSelect={handleCustomerSelect}
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
          <CustomersPageWithDB
            onCustomerSelect={handleCustomerSelect}
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
      case 'adminLog':
        return <AdminLogPage />;
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
    <Suspense fallback={null}>
    <AppProvidersLazy>
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
              onInvoiceCreated={async () => {
                // Refresh invoices data after creating a new invoice
                const { queryClient } = await import('./app/queryClient');
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
              }}
            />
          </Layout>
        )}
        <Toaster position="top-center" />
      </div>
    </AppProvidersLazy>
    </Suspense>
  );
}


