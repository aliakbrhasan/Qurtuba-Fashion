export type PrintableInvoiceData = {
  id: string;
  customerName: string;
  phone?: string;
  address?: string;
  total: number;
  paid: number;
  receivedDate: string | Date;
  deliveryDate: string | Date;
  paymentDate?: string | Date;
  notes?: string;
};

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    const formatted = new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      maximumFractionDigits: 0,
    }).format(value);
    
    // Convert to Arabic digits
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return formatted.replace(/[0-9]/g, (digit) => {
      return arabicDigits[parseInt(digit)];
    });
  } catch {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return `${String(value).replace(/[0-9]/g, (digit) => arabicDigits[parseInt(digit)])} د.ع`;
  }
}

export function formatDate(dateLike: string | Date | undefined): string {
  if (!dateLike) return '';
  const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) return '';
  try {
    const formatted = new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
    
    // Convert to Arabic digits
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return formatted.replace(/[0-9]/g, (digit) => {
      return arabicDigits[parseInt(digit)];
    });
  } catch {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return date.toISOString().slice(0, 10).replace(/[0-9]/g, (digit) => {
      return arabicDigits[parseInt(digit)];
    });
  }
}

type PrintableInvoiceProps = {
  invoice: PrintableInvoiceData;
};

export function PrintableInvoice({ invoice }: PrintableInvoiceProps) {
  const remaining = Math.max((invoice.total || 0) - (invoice.paid || 0), 0);

  const currentDate = (() => {
    try {
      return new Intl.DateTimeFormat('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  })();

  const formatShortCurrency = (value: number): string => {
    if (!Number.isFinite(value)) return '—';
    try {
      const formatted = new Intl.NumberFormat('ar-IQ', { maximumFractionDigits: 0 }).format(value);
      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return formatted.replace(/[0-9]/g, (digit) => {
        return arabicDigits[parseInt(digit)];
      }) + ' د.ع';
    } catch {
      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return `${String(value).replace(/[0-9]/g, (digit) => arabicDigits[parseInt(digit)])} د.ع`;
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, system-ui, -apple-system, Segoe UI, Roboto, Arial', width: '187mm', minHeight: '128mm', margin: '0 auto', background: '#ffffff', color: '#13312A', pageBreakInside: 'avoid' }}>
      {/* Local print styles for button visibility */}
      <style>{`
        @media print { .print-btn { display: none !important; } }
        @media print { html, body { background: #ffffff; } }
      `}</style>
      <div style={{
        width: '100%',
        border: '1px solid #C69A72',
        borderRadius: 6,
        padding: '8mm',
        pageBreakInside: 'avoid'
      }}>
        <div style={{ padding: 0 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '6mm', pageBreakInside: 'avoid' }}>
            <h1 style={{ margin: 0, fontSize: 20 }}>فاتورة</h1>
            <p style={{ margin: '4px 0 0', color: '#155446', fontSize: 12 }}>
              رقم الفاتورة: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo' }}>{invoice.id}</span>
            </p>
            <div style={{ height: 1, background: 'rgba(198,154,114,0.6)', marginTop: '4mm' }} />
          </div>

          {/* Customer name */}
          <div style={{ marginBottom: '4mm', pageBreakInside: 'avoid' }}>
            <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>اسم الزبون:</div>
            <div style={{
              padding: '6px 10px',
              background: '#FDFBF7',
              border: '1px solid #C69A72',
              borderRadius: 8,
            }}>
              {invoice.customerName}
            </div>
          </div>

          {/* Paid amount + payment date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', marginBottom: '4mm', pageBreakInside: 'avoid' }}>
            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>المبلغ المدفوع:</div>
              <div style={{ padding: '6px 10px', background: '#E8F7EE', border: '1px solid #98D4B2', borderRadius: 8 }}>
                {formatShortCurrency(invoice.paid || 0)}
              </div>
            </div>
            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>تاريخ الدفع:</div>
              <div style={{ padding: '6px 10px', background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 8 }}>
                {invoice.paymentDate ? formatDate(invoice.paymentDate) : '—'}
              </div>
            </div>
          </div>

          {/* Remaining amount */}
          <div style={{ marginBottom: '4mm', pageBreakInside: 'avoid' }}>
            <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>المبلغ المتبقي:</div>
            <div style={{ padding: '6px 10px', background: '#FFF4E5', border: '1px solid #F59E0B', borderRadius: 8 }}>
              {formatShortCurrency(remaining)}
            </div>
          </div>

          {/* Receive + Delivery dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', pageBreakInside: 'avoid' }}>
            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>تاريخ الاستلام:</div>
              <div style={{ padding: '6px 10px', background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 8 }}>
                {formatDate(invoice.receivedDate)}
              </div>
            </div>
            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>تاريخ التسليم:</div>
              <div style={{ padding: '6px 10px', background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 8 }}>
                {formatDate(invoice.deliveryDate)}
              </div>
            </div>
          </div>

          {/* Optional contact/address */}
          {(invoice.phone || invoice.address) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', marginTop: '4mm', pageBreakInside: 'avoid' }}>
              {invoice.phone ? (
                <div>
                  <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>الهاتف:</div>
                  <div style={{ padding: '6px 10px', background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 8 }}>{invoice.phone}</div>
                </div>
              ) : null}
              {invoice.address ? (
                <div>
                  <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>العنوان:</div>
                  <div style={{ padding: '6px 10px', background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 8 }}>{invoice.address}</div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Notes */}
          {invoice.notes ? (
            <div style={{ marginTop: '4mm', pageBreakInside: 'avoid' }}>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>الملاحظات:</div>
              <div style={{ padding: '6px 10px', background: '#F6E9CA', border: '1px solid #C69A72', borderRadius: 8, maxHeight: '25mm', overflow: 'hidden' }}>{invoice.notes}</div>
            </div>
          ) : null}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '6mm', color: '#155446', fontSize: 11 }}>
            فاتورة مستخرجة من نظام قرطبة بتاريخ: {currentDate}
          </div>
        </div>

        {/* Print button (hidden on print) */}
        <div style={{ paddingTop: '6mm', textAlign: 'center', pageBreakInside: 'avoid' }}>
          <button className="print-btn" onClick={() => window.print()} style={{
            background: '#155446',
            color: '#F6E9CA',
            border: '1px solid #13312A',
            borderRadius: 8,
            padding: '8px 14px',
            cursor: 'pointer',
          }}>
            طباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintableInvoice;


