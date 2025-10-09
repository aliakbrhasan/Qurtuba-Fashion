import { useQuery } from '@tanstack/react-query';
import { databaseService } from '@/db/database.service';
import type { Invoice, InvoiceItem } from '@/db/database.service';

export interface InvoiceDetails extends Invoice {
  items: InvoiceItem[];
  fabricImageUrl?: string;
  measurements?: {
    length?: number;
    shoulder?: number;
    waist?: number;
    chest?: number;
  };
  designDetails?: {
    fabricType?: string[];
    fabricSource?: string[];
    collarType?: string[];
    chestStyle?: string[];
    sleeveEnd?: string[];
  };
}

export function useInvoiceDetails(invoiceId: string | null) {
  const {
    data: invoiceDetails,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoice-details', invoiceId],
    queryFn: async (): Promise<InvoiceDetails | null> => {
      if (!invoiceId) return null;
      
      try {
        // جلب بيانات الفاتورة
        const invoices = await databaseService.getInvoices();
        const invoice = invoices.find(inv => inv.id === invoiceId);
        
        if (!invoice) {
          throw new Error('الفاتورة غير موجودة');
        }

        // جلب عناصر الفاتورة
        const items = await databaseService.getInvoiceItems(invoiceId);

        // جلب القياسات الفعلية للزبون
        let measurements = null;
        if (invoice.customer_id) {
          try {
            const customerMeasurements = await databaseService.getCustomerMeasurements(parseInt(invoice.customer_id));
            if (customerMeasurements && customerMeasurements.length > 0) {
              const latestMeasurement = customerMeasurements[0];
              measurements = {
                length: latestMeasurement.height,
                shoulder: latestMeasurement.shoulder,
                waist: latestMeasurement.waist,
                chest: latestMeasurement.chest
              };
            }
          } catch (error) {
            console.warn('Error fetching customer measurements:', error);
          }
        }

        // جلب تفاصيل التصميم الفعلية (يمكن ربطها بجدول منفصل في المستقبل)
        const designDetails = {
          fabricType: (invoice as any).fabric_type ? (invoice as any).fabric_type.split(',') : [],
          fabricSource: (invoice as any).fabric_source ? (invoice as any).fabric_source.split(',') : [],
          collarType: (invoice as any).collar_type ? (invoice as any).collar_type.split(',') : [],
          chestStyle: (invoice as any).chest_style ? (invoice as any).chest_style.split(',') : [],
          sleeveEnd: (invoice as any).sleeve_end ? (invoice as any).sleeve_end.split(',') : []
        };

        // تحويل البيانات إلى الصيغة المطلوبة
        const details: InvoiceDetails = {
          ...invoice,
          items,
          fabricImageUrl: (invoice as any).fabric_image_url,
          measurements,
          designDetails
        };

        return details;
      } catch (error) {
        console.error('Error fetching invoice details:', error);
        throw error;
      }
    },
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    invoiceDetails,
    isLoading,
    error: error?.message || null,
    refetch
  };
}
