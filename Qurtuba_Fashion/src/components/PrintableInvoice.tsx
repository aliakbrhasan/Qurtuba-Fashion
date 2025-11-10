// Logo for printed invoice (center top)
// Try to use logo from public/logo.png, fallback to Electron API if available
import React from 'react';
import logoSrc from '/logo.png';

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
    return new Intl.NumberFormat('en-US', {
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
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

type PrintableInvoiceProps = { invoice: PrintableInvoiceData };

export function PrintableInvoice({ invoice }: PrintableInvoiceProps) {
  const [logoUrl, setLogoUrl] = React.useState<string>(logoSrc);
  
  // In Electron, get logo path from main process
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.getLogoPath().then((result: any) => {
        if (result?.ok && result?.data) {
          setLogoUrl(result.data);
        }
      }).catch(() => {
        // Fallback to default logo path
      });
    }
  }, []);

  const remaining = Math.max((invoice.total || 0) - (invoice.paid || 0), 0);
  const currentDate = (() => {
    try {
      return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  })();

  const formatShortCurrency = (value: number): string => {
    if (!Number.isFinite(value)) return '—';
    try {
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value) + ' د.ع';
    } catch {
      return `${value} د.ع`;
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: 'Tajawal, system-ui, -apple-system, Segoe UI, Roboto, Arial',
        width: '100%',
        margin: '0 auto',
        background: '#ffffff',
        color: '#13312A',
        pageBreakInside: 'avoid',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media print {
          .print-btn { display: none !important; }
          html, body { background: #ffffff; margin: 0; padding: 0; height: 100vh; overflow: hidden; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A5 landscape; margin: 4mm; }
      `}</style>

      <div
        style={{
          width: '100%',
          maxHeight: 'calc(100vh - 8mm)',
          border: '1px solid #C69A72',
          borderRadius: 8,
          padding: '8mm',
          pageBreakInside: 'avoid',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '6mm', pageBreakInside: 'avoid' }}>
          {/* Top meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2mm' }}>
            <div />
            <div style={{ fontSize: 9, color: '#155446', textAlign: 'right' }}>
              فاتورة مستخرجة من نظام قرطبة بتاريخ: {currentDate}
            </div>
          </div>

          {/* Logo and invoice title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12mm', marginBottom: '4mm' }}>
            {/* Logo and center contact */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6mm', flex: '0 0 auto', direction: 'ltr' }}>
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: 14, color: '#13312A', textAlign: 'left', lineHeight: 1.4, fontWeight: 600 }}>
                <span>07707984448</span>
                <span>07901354519</span>
              </div>
              <img src={logoUrl} alt="Qurtuba Logo" style={{ maxHeight: 64, maxWidth: 220, objectFit: 'contain' }} />
            </div>

            {/* Invoice title and number */}
            <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#13312A' }}>فاتورة</h1>
              <p style={{ margin: '4px 0 0', color: '#155446', fontSize: 12 }}>
                رقم الفاتورة: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo' }}>{invoice.id}</span>
              </p>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(198,154,114,0.6)' }} />
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4mm',
            flex: 1,
            alignItems: 'start',
            pageBreakInside: 'avoid',
          }}
        >
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm' }}>
            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>اسم الزبون:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: '#FDFBF7',
                  border: '1px solid #C69A72',
                  borderRadius: 6,
                  fontSize: 12,
                  minHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {invoice.customerName}
              </div>
            </div>

            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>المبلغ المدفوع:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: '#E8F7EE',
                  border: '1px solid #98D4B2',
                  borderRadius: 6,
                  fontSize: 12,
                  minHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatShortCurrency(invoice.paid || 0)}
              </div>
            </div>

            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>المبلغ المتبقي:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: '#FFF4E5',
                  border: '1px solid #F59E0B',
                  borderRadius: 6,
                  fontSize: 12,
                  minHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatShortCurrency(remaining)}
              </div>
            </div>

            {invoice.phone ? (
              <div>
                <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>الهاتف:</div>
                <div
                  style={{
                    padding: '6px 8px',
                    background: '#FDFBF7',
                    border: '1px solid #C69A72',
                    borderRadius: 6,
                    fontSize: 12,
                    minHeight: 28,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {invoice.phone}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm' }}>
            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>تاريخ الدفع:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: '#FDFBF7',
                  border: '1px solid #C69A72',
                  borderRadius: 6,
                  fontSize: 12,
                  minHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {invoice.paymentDate ? formatDate(invoice.paymentDate) : '—'}
              </div>
            </div>

            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>تاريخ الاستلام:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: '#FDFBF7',
                  border: '1px solid #C69A72',
                  borderRadius: 6,
                  fontSize: 12,
                  minHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatDate(invoice.receivedDate)}
              </div>
            </div>

            <div>
              <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>تاريخ التسليم:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: '#FDFBF7',
                  border: '1px solid #C69A72',
                  borderRadius: 6,
                  fontSize: 12,
                  minHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatDate(invoice.deliveryDate)}
              </div>
            </div>

            {invoice.address ? (
              <div>
                <div style={{ color: '#13312A', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>العنوان:</div>
                <div
                  style={{
                    padding: '6px 8px',
                    background: '#FDFBF7',
                    border: '1px solid #C69A72',
                    borderRadius: 6,
                    fontSize: 12,
                    minHeight: 28,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {invoice.address}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Print button (hidden on print) */}
        <div style={{ paddingTop: '4mm', textAlign: 'center', pageBreakInside: 'avoid' }}>
          <button
            className="print-btn"
            onClick={() => window.print()}
            style={{
              background: '#155446',
              color: '#F6E9CA',
              border: '1px solid #13312A',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            طباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintableInvoice;
