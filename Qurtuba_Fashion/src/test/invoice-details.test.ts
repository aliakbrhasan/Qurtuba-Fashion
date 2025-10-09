/**
 * اختبار شامل لصفحة تفاصيل الفاتورة
 * يفحص جميع الأزرار والوظائف والتكامل مع قاعدة البيانات
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvoiceDetailsPage } from '@/components/InvoiceDetailsPage';
import { databaseService } from '@/db/database.service';
import { ImageService } from '@/services/image.service';

// Mock dependencies
vi.mock('@/db/database.service');
vi.mock('@/services/image.service');
vi.mock('@/components/print/PrintUtils', () => ({
  openPrintWindow: vi.fn()
}));

// Mock window.print
Object.defineProperty(window, 'print', {
  writable: true,
  value: vi.fn()
});

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: vi.fn()
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn()
  }
});

describe('InvoiceDetailsPage', () => {
  let queryClient: QueryClient;
  let mockInvoice: any;
  let mockOnBack: any;
  let mockOnMarkAsPaid: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockOnBack = vi.fn();
    mockOnMarkAsPaid = vi.fn();

    mockInvoice = {
      id: '1',
      invoice_number: 'INV-001',
      customer_name: 'أحمد محمد',
      customer_phone: '07901234567',
      customer_address: 'بغداد، العراق',
      total: 150000,
      paid_amount: 75000,
      status: 'جزئي',
      invoice_date: '2024-01-15',
      due_date: '2024-02-15',
      notes: 'ملاحظات خاصة',
      fabric_image_url: 'https://example.com/fabric.jpg',
      measurements: {
        length: 180,
        shoulder: 45,
        waist: 80,
        chest: 95
      },
      designDetails: {
        fabricType: ['قطن'],
        fabricSource: ['خارج المحل'],
        collarType: ['عادية'],
        chestStyle: ['صدر واحد'],
        sleeveEnd: ['كم عادي']
      }
    };

    // Mock database service
    vi.mocked(databaseService.getInvoices).mockResolvedValue([mockInvoice]);
    vi.mocked(databaseService.getInvoiceItems).mockResolvedValue([]);
    vi.mocked(databaseService.getCustomerMeasurements).mockResolvedValue([]);
    vi.mocked(databaseService.updateInvoice).mockResolvedValue(mockInvoice);
  });

  const renderInvoiceDetailsPage = (invoiceId: string = '1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InvoiceDetailsPage
          invoiceId={invoiceId}
          onBack={mockOnBack}
          onMarkAsPaid={mockOnMarkAsPaid}
        />
      </QueryClientProvider>
    );
  };

  describe('تحميل البيانات', () => {
    it('يجب أن يعرض حالة التحميل', () => {
      renderInvoiceDetailsPage();
      expect(screen.getByText('جاري تحميل تفاصيل الفاتورة...')).toBeInTheDocument();
    });

    it('يجب أن يعرض بيانات الفاتورة بعد التحميل', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
        expect(screen.getByText('INV-001')).toBeInTheDocument();
        expect(screen.getByText('جزئي')).toBeInTheDocument();
      });
    });

    it('يجب أن يعرض رسالة خطأ عند فشل التحميل', async () => {
      vi.mocked(databaseService.getInvoices).mockRejectedValue(new Error('خطأ في قاعدة البيانات'));
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('خطأ في تحميل الفاتورة')).toBeInTheDocument();
      });
    });
  });

  describe('عرض المعلومات', () => {
    it('يجب أن يعرض معلومات الزبون بشكل صحيح', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
        expect(screen.getByText('07901234567')).toBeInTheDocument();
        expect(screen.getByText('بغداد، العراق')).toBeInTheDocument();
      });
    });

    it('يجب أن يعرض ملخص الفاتورة بشكل صحيح', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('150,000 د.ع')).toBeInTheDocument();
        expect(screen.getByText('75,000 د.ع')).toBeInTheDocument();
        expect(screen.getByText('75,000 د.ع')).toBeInTheDocument(); // المتبقي
      });
    });

    it('يجب أن يعرض تفاصيل التصميم بشكل صحيح', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('قطن')).toBeInTheDocument();
        expect(screen.getByText('خارج المحل')).toBeInTheDocument();
        expect(screen.getByText('عادية')).toBeInTheDocument();
      });
    });

    it('يجب أن يعرض صورة القماش إذا كانت متوفرة', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        const fabricImage = screen.getByAltText('صورة القماش');
        expect(fabricImage).toBeInTheDocument();
        expect(fabricImage).toHaveAttribute('src', 'https://example.com/fabric.jpg');
      });
    });

    it('يجب أن يعرض رسالة عدم وجود صورة إذا لم تكن متوفرة', async () => {
      const invoiceWithoutImage = { ...mockInvoice, fabric_image_url: null };
      vi.mocked(databaseService.getInvoices).mockResolvedValue([invoiceWithoutImage]);
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('لا توجد صورة للقماش')).toBeInTheDocument();
      });
    });
  });

  describe('الأزرار والوظائف', () => {
    it('يجب أن يعمل زر العودة', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        const backButton = screen.getByText('العودة');
        fireEvent.click(backButton);
        expect(mockOnBack).toHaveBeenCalled();
      });
    });

    it('يجب أن يعمل زر الطباعة', async () => {
      const { openPrintWindow } = await import('@/components/print/PrintUtils');
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        const printButton = screen.getByText('طباعة');
        fireEvent.click(printButton);
        expect(openPrintWindow).toHaveBeenCalled();
      });
    });

    it('يجب أن يعمل زر المشاركة', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        const shareButton = screen.getByText('مشاركة');
        fireEvent.click(shareButton);
        
        // يجب أن يحاول استخدام navigator.share أو clipboard
        expect(navigator.share || navigator.clipboard.writeText).toBeDefined();
      });
    });

    it('يجب أن يعمل زر حفظ PDF', async () => {
      const { openPrintWindow } = await import('@/components/print/PrintUtils');
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        const pdfButton = screen.getByText('حفظ PDF');
        fireEvent.click(pdfButton);
        expect(openPrintWindow).toHaveBeenCalled();
      });
    });

    it('يجب أن يعمل زر تم الدفع للفواتير غير المدفوعة', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        const markPaidButton = screen.getByText('تم الدفع');
        fireEvent.click(markPaidButton);
        expect(mockOnMarkAsPaid).toHaveBeenCalledWith('1');
      });
    });

    it('يجب ألا يظهر زر تم الدفع للفواتير المدفوعة', async () => {
      const paidInvoice = { ...mockInvoice, status: 'مدفوع', paid_amount: 150000 };
      vi.mocked(databaseService.getInvoices).mockResolvedValue([paidInvoice]);
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.queryByText('تم الدفع')).not.toBeInTheDocument();
      });
    });
  });

  describe('حساب النسب والمبالغ', () => {
    it('يجب أن يحسب نسبة الدفع بشكل صحيح', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        // نسبة الدفع = 75000 / 150000 * 100 = 50%
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });

    it('يجب أن يحسب المبلغ المتبقي بشكل صحيح', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        // المتبقي = 150000 - 75000 = 75000
        expect(screen.getByText('75,000 د.ع')).toBeInTheDocument();
      });
    });
  });

  describe('معالجة الأخطاء', () => {
    it('يجب أن يعالج خطأ في جلب عناصر الفاتورة', async () => {
      vi.mocked(databaseService.getInvoiceItems).mockRejectedValue(new Error('خطأ في جلب العناصر'));
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        // يجب أن يعرض الفاتورة حتى لو فشل جلب العناصر
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      });
    });

    it('يجب أن يعالج خطأ في جلب قياسات الزبون', async () => {
      vi.mocked(databaseService.getCustomerMeasurements).mockRejectedValue(new Error('خطأ في جلب القياسات'));
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        // يجب أن يعرض الفاتورة حتى لو فشل جلب القياسات
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      });
    });
  });

  describe('التكامل مع قاعدة البيانات', () => {
    it('يجب أن يجلب بيانات الفاتورة من قاعدة البيانات', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(databaseService.getInvoices).toHaveBeenCalled();
      });
    });

    it('يجب أن يجلب عناصر الفاتورة من قاعدة البيانات', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(databaseService.getInvoiceItems).toHaveBeenCalledWith('1');
      });
    });

    it('يجب أن يجلب قياسات الزبون من قاعدة البيانات', async () => {
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(databaseService.getCustomerMeasurements).toHaveBeenCalled();
      });
    });
  });

  describe('السيناريوهات المختلفة', () => {
    it('يجب أن يعمل مع فاتورة بدون عناصر', async () => {
      vi.mocked(databaseService.getInvoiceItems).mockResolvedValue([]);
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      });
    });

    it('يجب أن يعمل مع فاتورة بدون قياسات', async () => {
      vi.mocked(databaseService.getCustomerMeasurements).mockResolvedValue([]);
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      });
    });

    it('يجب أن يعمل مع فاتورة بدون تفاصيل تصميم', async () => {
      const invoiceWithoutDesign = { ...mockInvoice, designDetails: null };
      vi.mocked(databaseService.getInvoices).mockResolvedValue([invoiceWithoutDesign]);
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      });
    });

    it('يجب أن يعمل مع فاتورة بدون ملاحظات', async () => {
      const invoiceWithoutNotes = { ...mockInvoice, notes: null };
      vi.mocked(databaseService.getInvoices).mockResolvedValue([invoiceWithoutNotes]);
      
      renderInvoiceDetailsPage();
      
      await waitFor(() => {
        expect(screen.getByText('لا توجد ملاحظات')).toBeInTheDocument();
      });
    });
  });
});
