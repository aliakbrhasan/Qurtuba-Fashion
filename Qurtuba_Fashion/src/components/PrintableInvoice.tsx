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

type IconProps = { size?: number; color?: string };

const WhatsappIcon = ({ size = 22, color = '#25D366' }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    style={{ display: 'block' }}
  >
    <path
      fill={color}
      d="M413.37 97.36C366.08 50.05 304.4 24 238.66 24 107.46 24 0 131.46 0 262.65c0 46.25 12.36 91.36 35.78 131.16L0 488l96.04-35.43c37.03 20.17 78.89 30.79 121.26 30.79h.05c131.19 0 238.65-107.46 238.65-238.66 0-65.72-26.08-127.41-73.42-174.74zM238.69 439.6h-.05c-38.05-.02-75.38-10.17-108-29.36l-7.74-4.6-57 21 21.37-55.62-5-8.12c-21.73-35.39-33.21-76.23-33.21-118.16C48.06 147.98 147.86 48.2 270.58 48.2c59.48 0 115.36 23.18 157.45 65.27 42.09 42.1 65.27 97.98 65.27 157.46 0 122.72-99.81 222.52-222.61 222.52zm121.1-164.79c-6.64-3.32-39.3-19.4-45.38-21.63-6.09-2.21-10.51-3.32-14.95 3.32-4.43 6.65-17.11 21.63-20.96 26.07-3.86 4.43-7.74 4.98-14.39 1.66-6.65-3.32-28.05-10.33-53.46-32.92-19.78-17.65-33.05-39.42-36.91-46.06-3.86-6.65-.41-10.24 2.91-13.55 3-2.99 6.65-7.76 9.97-11.63 3.32-3.86 4.43-6.65 6.65-11.08 2.21-4.43 1.11-8.32-.55-11.63-1.66-3.32-14.95-36.06-20.49-49.38-5.41-13.02-10.93-11.25-14.95-11.48-3.86-.21-8.31-.27-12.74-.27-4.44 0-11.63 1.66-17.76 8.32-6.08 6.65-23.18 22.65-23.18 55.21 0 32.56 23.76 64.06 27.14 68.49 3.32 4.43 46.77 71.4 113.3 100.1 15.83 6.84 28.17 10.94 37.81 13.99 15.9 5.05 30.39 4.34 41.84 2.63 12.75-1.91 39.3-16.06 44.83-31.58 5.53-15.55 5.53-28.89 3.86-31.6-1.66-2.8-6.08-4.41-12.72-7.74z"
    />
    <path
      fill="#FDFBF7"
      d="M359.79 274.81c-6.64-3.32-39.3-19.4-45.38-21.63-6.09-2.21-10.51-3.32-14.95 3.32-4.43 6.65-17.11 21.63-20.96 26.07-3.86 4.43-7.74 4.98-14.39 1.66-6.65-3.32-28.05-10.33-53.46-32.92-19.78-17.65-33.05-39.42-36.91-46.06-3.86-6.65-.41-10.24 2.91-13.55 3-2.99 6.65-7.76 9.97-11.63 3.32-3.86 4.43-6.65 6.65-11.08 2.21-4.43 1.11-8.32-.55-11.63-1.66-3.32-14.95-36.06-20.49-49.38-5.41-13.02-10.93-11.25-14.95-11.48-3.86-.21-8.31-.27-12.74-.27-4.44 0-11.63 1.66-17.76 8.32-6.08 6.65-23.18 22.65-23.18 55.21 0 32.56 23.76 64.06 27.14 68.49 3.32 4.43 46.77 71.4 113.3 100.1 15.83 6.84 28.17 10.94 37.81 13.99 15.9 5.05 30.39 4.34 41.84 2.63 12.75-1.91 39.3-16.06 44.83-31.58 5.53-15.55 5.53-28.89 3.86-31.6-1.66-2.8-6.08-4.41-12.72-7.74z"
      opacity={0.2}
    />
  </svg>
);

const PhoneIcon = ({ size = 22, color = '#155446' }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: 'block' }}
  >
    <path
      fill={color}
      d="M3.654 1.328A2.25 2.25 0 015.25 0h3.5c.966 0 1.79.688 1.972 1.638l.684 3.42a2.25 2.25 0 01-1.286 2.442l-1.391.558a10.982 10.982 0 005.21 5.21l.558-1.39a2.25 2.25 0 012.442-1.287l3.42.685A2.25 2.25 0 0122 11.75v3.5a2.25 2.25 0 01-2.328 2.216c-2.11-.107-6.73-.806-10.772-4.848C4.858 8.576 4.158 3.956 4.05 1.846a2.25 2.25 0 01-.396-1.327z"
    />
  </svg>
);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6mm', flex: '0 0 auto' }}>
              <img src={logoUrl} alt="Qurtuba Logo" style={{ maxHeight: 64, maxWidth: 220, objectFit: 'contain' }} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid #C69A72',
                  borderRadius: 12,
                  padding: '10px 18px',
                  background: '#FDFBF7',
                  boxShadow: '0 2px 6px rgba(19,49,42,0.1)',
                  direction: 'ltr',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 18, color: '#13312A', fontWeight: 700 }}>
                  <WhatsappIcon />
                  <span>07707984448</span>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(198,154,114,0.5)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 18, color: '#13312A', fontWeight: 700 }}>
                  <PhoneIcon />
                  <span>07901354519</span>
                </div>
              </div>
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
