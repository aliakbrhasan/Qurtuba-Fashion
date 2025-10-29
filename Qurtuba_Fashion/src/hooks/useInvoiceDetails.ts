import { useQuery } from '@tanstack/react-query';
import { databaseService } from '@/db/database.service';
import type { Invoice, InvoiceItem } from '@/db/database.service';

export interface InvoiceDetails extends Invoice {
  items: InvoiceItem[];
  fabricImageUrl?: string;
  measurements?: {
    length?: string | number;
    shoulder?: string | number;
    waist?: string | number;
    chest?: string | number;
    collar?: string | number;
  };
  designDetails?: {
    fabricType?: string[];
    fabricSource?: string[];
    collarType?: string[];
    chestStyle?: string[];
    sleeveEnd?: string[];
    bunijaType?: string;
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
        const invoice = await databaseService.getInvoiceById(invoiceId);
        if (!invoice) throw new Error('تعذر العثور على الفاتورة');

        const items = await databaseService.getInvoiceItems(invoiceId);

        // Measurements: look in invoice first, then customer record
        let measurements: { length?: string | number; shoulder?: string | number; waist?: string | number; chest?: string | number; collar?: string | number } | undefined;
        try {
          let cm: any = (invoice as any).measurements || (invoice as any).customer_measurements;
          if (!cm) {
            const customers = await databaseService.getCustomers();
            const cid: any = (invoice as any).customer_id;
            const byId = customers.find((c: any) => String(c.id) === String(cid));
            const byAlias = customers.find((c: any) => (c.name || '').trim() === (invoice as any).customer_name?.trim() && (c.phone || '').trim() === ((invoice as any).customer_phone || '').trim());
            const customer: any = byId || byAlias;
            cm = customer?.measurements;
          }
          if (typeof cm === 'string') { try { cm = JSON.parse(cm); } catch { cm = null; } }
          if (cm && typeof cm === 'object') {
            measurements = {
              length: cm.length ?? cm.height ?? '',
              shoulder: cm.shoulder ?? '',
              waist: cm.waist ?? '',
              chest: cm.chest ?? '',
              collar: cm.collar ?? '',
            };
          }
        } catch (e) {
          console.warn('Error resolving customer measurements:', e);
        }

        // Design details: read from invoice fields or legacy design_details object
        const parseList = (val: any): string[] => {
          if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
          if (typeof val === 'string') {
            const s = val.trim();
            if (!s) return [];
            // Try JSON array first
            if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"[') && s.endsWith(']"'))) {
              try {
                const arr = JSON.parse(s.replace(/^"|"$/g, ''));
                if (Array.isArray(arr)) return arr.map((v: any) => String(v).trim()).filter(Boolean);
              } catch {}
            }
            // Split by English comma or Arabic comma U+060C
            return s.split(/[,،]/).map((v) => v.trim()).filter(Boolean);
          }
          return [];
        };
        const dd = (invoice as any).design_details || (invoice as any).designDetails || {};
        const designDetails = {
          fabricType: (invoice as any).fabric_type ? parseList((invoice as any).fabric_type) : parseList(dd.fabric_type),
          fabricSource: (invoice as any).fabric_source ? parseList((invoice as any).fabric_source) : parseList(dd.fabric_source),
          collarType: (invoice as any).collar_type ? parseList((invoice as any).collar_type) : parseList(dd.collar_type),
          chestStyle: (invoice as any).chest_style ? parseList((invoice as any).chest_style) : parseList(dd.chest_style),
          sleeveEnd: (invoice as any).sleeve_end ? parseList((invoice as any).sleeve_end) : parseList(dd.sleeve_end),
          bunijaType: (invoice as any).bunija_type ? String((invoice as any).bunija_type).trim() : (dd.bunija_type || undefined),
        };

        const details: InvoiceDetails = {
          ...invoice,
          items,
          fabricImageUrl: (invoice as any).fabric_image_url,
          measurements,
          designDetails,
        };

        return details;
      } catch (err) {
        console.error('Error fetching invoice details:', err);
        throw err;
      }
    },
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000,
  });

  return { invoiceDetails, isLoading, error: (error as any)?.message || null, refetch };
}
