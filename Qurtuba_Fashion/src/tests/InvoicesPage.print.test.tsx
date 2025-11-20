import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { InvoicesPage } from '@/components/InvoicesPage';

vi.mock('@/hooks/useInvoices', () => ({
  useInvoices: () => ({
    invoices: [
      {
        id: 'INV-1',
        customer_name: 'عميل تجريبي',
        customer_phone: '0770000000',
        customer_address: 'بغداد',
        total: 100000,
        paid_amount: 50000,
        invoice_date: new Date().toISOString(),
        due_date: new Date().toISOString(),
        paid_at: null,
        status: 'معلق',
        notes: '',
      },
    ],
    loading: false,
    error: null,
    markAsPaid: vi.fn(),
    loadInvoices: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasActionPermission: () => true,
  }),
}));

vi.mock('@/components/ProtectedRoute', () => ({
  useAuth: () => ({ currentUser: { id: 'test-user' } }),
}));

vi.mock('@/components/InvoiceDetailsDialog', () => ({
  InvoiceDetailsDialog: () => null,
}));

vi.mock('@/components/NewInvoiceDialogWithDB', () => ({
  NewInvoiceDialogWithDB: () => null,
}));

vi.mock('@/components/figma/ImageWithFallback', () => ({
  ImageWithFallback: () => null,
}));

vi.mock('@/components/print/PrintUtils.tsx', () => ({
  openPrintWindow: vi.fn(),
  openPrintInvoiceWindow: vi.fn(),
  openPdfPreviewWindow: vi.fn(),
  formatPrintDateTime: () => 'now',
}));

describe('InvoicesPage print dialog', () => {
  it('opens the date range dialog when clicking the print list button', async () => {
    render(<InvoicesPage onCreateInvoice={() => {}} />);

    fireEvent.click(screen.getByText('طباعة القائمة'));

    expect(await screen.findByText('تحديد فترة الطباعة')).toBeInTheDocument();
  });
});

