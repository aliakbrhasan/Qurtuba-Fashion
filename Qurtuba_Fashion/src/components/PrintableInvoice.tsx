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
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} IQD`;
  }
}

export function formatDate(dateLike: string | Date | undefined): string {
  if (!dateLike) return '';
  const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
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
      return new Intl.NumberFormat('ar-IQ', { maximumFractionDigits: 0 }).format(value) + ' د.ع';
    } catch {
      return `${value} د.ع`;
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      {/* Local print styles for button visibility */}
      <style>{`@media print { .print-btn { display: none !important; } }`}</style>
      <div style={{
        width: '100%',
        maxWidth: 794, /* ~ A5 landscape inner width in px at 96dpi */
        margin: '0 auto',
        background: '#ffffff',
        color: '#13312A',
        border: '1px solid #C69A72',
        borderRadius: 12,
        boxShadow: '0 10px 24px rgba(19,49,42,0.12)',
      }}>
        <div style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 28 }}>فاتورة</h1>
            <p style={{ margin: '8px 0 0', color: '#155446' }}>
              رقم الفاتورة: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo' }}>{invoice.id}</span>
            </p>
            <div style={{ height: 1, background: 'rgba(198,154,114,0.6)', marginTop: 14 }} />
          </div>

          {/* Customer name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>اسم الزبون:</div>
            <div style={{
              padding: 12,
              background: '#FDFBF7',
              border: '1px solid #C69A72',
              borderRadius: 10,
            }}>
              {invoice.customerName}
            </div>
          </div>

          {/* Paid amount + payment date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>المبلغ المدفوع:</div>
              <div style={{ padding: 12, background: '#E8F7EE', border: '1px solid #98D4B2', borderRadius: 10 }}>
                {formatShortCurrency(invoice.paid || 0)}
              </div>
            </div>
            <div>
              <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>تاريخ الدفع:</div>
              <div style={{ padding: 12, background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 10 }}>
                {invoice.paymentDate ? formatDate(invoice.paymentDate) : '—'}
              </div>
            </div>
          </div>

          {/* Remaining amount */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>المبلغ المتبقي:</div>
            <div style={{ padding: 12, background: '#FFF4E5', border: '1px solid #F59E0B', borderRadius: 10 }}>
              {formatShortCurrency(remaining)}
            </div>
          </div>

          {/* Receive + Delivery dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>تاريخ الاستلام:</div>
              <div style={{ padding: 12, background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 10 }}>
                {formatDate(invoice.receivedDate)}
              </div>
            </div>
            <div>
              <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>تاريخ التسليم:</div>
              <div style={{ padding: 12, background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 10 }}>
                {formatDate(invoice.deliveryDate)}
              </div>
            </div>
          </div>

          {/* Optional contact/address */}
          {(invoice.phone || invoice.address) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              {invoice.phone ? (
                <div>
                  <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>الهاتف:</div>
                  <div style={{ padding: 12, background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 10 }}>{invoice.phone}</div>
                </div>
              ) : null}
              {invoice.address ? (
                <div>
                  <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>العنوان:</div>
                  <div style={{ padding: 12, background: '#FDFBF7', border: '1px solid #C69A72', borderRadius: 10 }}>{invoice.address}</div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Notes */}
          {invoice.notes ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ color: '#13312A', marginBottom: 6, fontWeight: 600 }}>الملاحظات:</div>
              <div style={{ padding: 12, background: '#F6E9CA', border: '1px solid #C69A72', borderRadius: 10 }}>{invoice.notes}</div>
            </div>
          ) : null}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24, color: '#155446', fontSize: 12 }}>
            فاتورة مستخرجة من نظام قرطبة بتاريخ: {currentDate}
          </div>
        </div>

        {/* Print button (hidden on print) */}
        <div style={{ padding: 16, textAlign: 'center' }}>
          <button className="print-btn" onClick={() => window.print()} style={{
            background: '#155446',
            color: '#F6E9CA',
            border: '1px solid #13312A',
            borderRadius: 8,
            padding: '10px 16px',
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


