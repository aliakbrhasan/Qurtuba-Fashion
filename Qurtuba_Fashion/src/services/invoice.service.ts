import { invoicesAdapter } from '@/adapters/invoices.adapter';
import type { Invoice, NewInvoice } from '@/db/database.service';
import { notifications } from '@/services/notifications.service';
import { toIQD } from '@/utils/money';

export interface InvoiceFormData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  total: number;
  paidAmount: number;
  status: string;
  deliveryDate: string;
  notes: string;
  items: {
    itemName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  measurements?: {
    length: number;
    shoulder: number;
    waist: number;
    chest: number;
    collar: number;
  };
  designDetails?: {
    fabricType: string[];
    fabricSource: string[];
    collarType: string[];
    chestStyle: string[];
    sleeveEnd: string[];
    bunijaType?: string;
  };
  fabricImageUrl?: string;
}

export class InvoiceService {
  // Get all invoices
  static async getInvoices(): Promise<Invoice[]> {
    try {
      const { databaseService } = await import('@/db/database.service');
      return await databaseService.getInvoices();
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  // Create new invoice
  static async createInvoice(formData: InvoiceFormData): Promise<Invoice> {
    try {
      const newInvoice: NewInvoice = {
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_address: formData.customerAddress,
        total: toIQD(formData.total),
        paid_amount: toIQD(formData.paidAmount),
        status: formData.status,
        due_date: formData.deliveryDate,
        notes: formData.notes,
        items: formData.items.map(item => ({
          item_name: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unit_price: toIQD(item.unitPrice),
          total_price: toIQD(item.totalPrice)
        })),
        fabric_image_url: formData.fabricImageUrl
      };

      const created = await invoicesAdapter.createInvoice(newInvoice);
      // Ensure customer table reflects this newly created invoice immediately
      try {
        const { databaseService } = await import('@/db/database.service');
        await databaseService.reconcileCustomersFromInvoices([created as any]);
        // Update customer's saved measurements from this invoice's form if provided
        try {
          const customers = await databaseService.getCustomers();
          const target = customers.find(c => String((c as any).id) === String((created as any).customer_id))
            || customers.find(c => (c.name || '').trim() === (newInvoice.customer_name || '').trim() && (c.phone || '').trim() === (newInvoice.customer_phone || '').trim());
          const m = (formData as any).measurements || {};
          const hasMeasurements = typeof m === 'object' && (m.length || m.shoulder || m.waist || m.chest);
          if (target && hasMeasurements) {
            await databaseService.updateCustomer(String((target as any).id), {
              measurements: {
                height: Number(m.length || 0),
                shoulder: Number(m.shoulder || 0),
                waist: Number(m.waist || 0),
                chest: Number(m.chest || 0),
              }
            } as any, { silent: true });
          }
        } catch {}
      } catch {}
      try {
        notifications.emit({
          type: 'success',
          title: 'فاتورة جديدة',
          message: `تم إنشاء فاتورة للعميل ${formData.customerName}`,
          target: { page: 'invoices', id: (created as any).id },
        });
        // Update caches consistently without duplicating rows
        try {
          const { queryClient } = await import('@/app/queryClient');
          queryClient.setQueryData(['invoices'], (oldData: Invoice[] = []) => {
            const arr = Array.isArray(oldData) ? oldData : [];
            const exists = arr.some((inv) => String(inv.id) === String((created as any).id));
            return exists ? arr : [created, ...arr];
          });
          queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'dashboard-stats' });
          // Refresh customers list so new customer appears immediately
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        } catch {}
      } catch {}
      return created;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Update invoice
  static async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const { databaseService } = await import('@/db/database.service');

      // Load current invoice to avoid no-op updates and noisy notifications
      const current = await databaseService.getInvoiceById(id);
      if (!current) {
        throw new Error(`Invoice with id ${id} not found`);
      }

      // Determine if any provided field actually changes the current value
      const keys = Object.keys(updates || {});
      const isChanged = keys.some((k) => {
        const nextVal: any = (updates as any)[k];
        const prevVal: any = (current as any)[k];
        if (typeof nextVal === 'undefined') return false;
        const bothObjects = typeof nextVal === 'object' && nextVal !== null && typeof prevVal === 'object' && prevVal !== null;
        if (bothObjects) return JSON.stringify(prevVal) !== JSON.stringify(nextVal);
        // Coerce numeric strings and numbers for fair comparison
        const numPrev = typeof prevVal === 'string' && !isNaN(Number(prevVal)) ? Number(prevVal) : prevVal;
        const numNext = typeof nextVal === 'string' && !isNaN(Number(nextVal)) ? Number(nextVal) : nextVal;
        return numPrev !== numNext;
      });

      if (!isChanged) {
        // No-op: return current invoice without emitting notifications
        return current;
      }

      const updated = await databaseService.updateInvoice(id, updates);
      try {
        notifications.emit({
          type: 'info',
          title: 'تعديل فاتورة',
          message: `تم تعديل الفاتورة رقم ${id}`,
          target: { page: 'invoices', id },
        });
      } catch {}
      return updated;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // Delete invoice
  static async deleteInvoice(id: string): Promise<void> {
    try {
      await invoicesAdapter.deleteInvoice(id);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Mark invoice as paid
  static async markAsPaid(id: string): Promise<Invoice> {
    console.log('InvoiceService.markAsPaid called with id:', id);
    
    try {
      // Import databaseService dynamically to avoid circular dependency
      console.log('Importing databaseService...');
      const { databaseService } = await import('@/db/database.service');
      console.log('databaseService imported successfully:', !!databaseService);
      
      // Get the invoice first to get its total amount
      console.log('Getting invoice by id...');
      const invoice = await databaseService.getInvoiceById(id);
      console.log('Invoice found:', invoice);
      
      if (!invoice) {
        throw new Error(`Invoice with id ${id} not found`);
      }
      
      // Update only the necessary fields
      const nowIso = new Date().toISOString();
      const updates: Partial<Invoice> = {
        status: 'مدفوع',
        paid_amount: invoice.total,
        paid_at: nowIso,
      } as any;
      
      console.log('Updating invoice with:', updates);
      // Call the static method explicitly to avoid losing `this` when passed by reference
      const result = await InvoiceService.updateInvoice(id, updates);
      console.log('Update result:', result);
      
      return result;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  // Mark invoice as delivered today by setting due_date to today
  static async markAsDelivered(id: string): Promise<Invoice> {
    try {
      const { databaseService } = await import('@/db/database.service');
      const invoice = await databaseService.getInvoiceById(id);
      if (!invoice) {
        throw new Error(`Invoice with id ${id} not found`);
      }

      // Use date-only format (YYYY-MM-DD) to avoid timezone shifts and ensure UI comparisons by day work correctly
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayYmd = `${yyyy}-${mm}-${dd}`;

      const updated = await InvoiceService.updateInvoice(id, { due_date: todayYmd } as Partial<Invoice>);

      try {
        // Invalidate caches so UI reflects change immediately
        const { queryClient } = await import('@/app/queryClient');
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({
          predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'dashboard-stats',
        });
      } catch {}

      try {
        notifications.emit({
          type: 'success',
          title: 'تم التسليم',
          message: `تم تحديث تاريخ التسليم للفاتورة ${invoice.invoice_number} إلى اليوم`,
          target: { page: 'invoices', id },
        });
      } catch {}

      return updated;
    } catch (error) {
      console.error('Error marking invoice as delivered:', error);
      throw error;
    }
  }

  // Calculate total from items
  static calculateTotal(items: InvoiceFormData['items']): number {
    const sum = items.reduce((total, item) => total + toIQD(item.totalPrice), 0);
    return toIQD(sum);
  }

  // Validate invoice form data
  static validateInvoiceData(data: InvoiceFormData): string[] {
    const errors: string[] = [];

    if (!data.customerName.trim()) {
      errors.push('اسم العميل مطلوب');
    }

    if (!data.customerPhone.trim()) {
      errors.push('رقم الهاتف مطلوب');
    }

    // عناصر الفاتورة أصبحت اختيارية؛ لا نفرض وجودها أو تفاصيلها
    // إن وُجدت عناصر سنقوم فقط بتجاهل التحقق التفصيلي لتبسيط الإدخال

    if (data.total <= 0) {
      errors.push('المجموع يجب أن يكون أكبر من صفر');
    }

    if (data.paidAmount < 0) {
      errors.push('المبلغ المدفوع لا يمكن أن يكون سالباً');
    }

    if (data.paidAmount > data.total) {
      errors.push('المبلغ المدفوع لا يمكن أن يكون أكبر من المجموع');
    }

    return errors;
  }

  // Get invoice status badge color
  static getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'مدفوع':
        return 'bg-green-100 text-green-800';
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800';
      case 'جزئي':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Format date
  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}


