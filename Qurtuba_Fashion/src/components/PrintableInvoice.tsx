// Logo for printed invoice (center top)
// Try to use logo from public/logo.png, fallback to Electron API if available
import React from 'react';
import logoSrc from '/logo.png';

const RECEIPT_PALETTE = {
  text: '#0B1F1A',
  mutedText: '#133B2E',
  accent: '#8B5E3C',
  accentDark: '#5A331B',
  softBg: '#F4DFC8',
  softBgAlt: '#EBD1B0',
  successBg: '#D9F0E2',
  successBorder: '#3F8E67',
  warningBg: '#F4C9AE',
  warningBorder: '#B24B13',
} as const;

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
        background: '#FFF6EB',
        color: RECEIPT_PALETTE.text,
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
          border: `1px solid ${RECEIPT_PALETTE.accent}`,
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
        <div style={{ marginBottom: '4mm', pageBreakInside: 'avoid' }}>
          {/* Centered logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5mm', textAlign: 'center' }}>
            <img
              src={logoUrl}
              alt="Qurtuba Logo"
              style={{
                maxHeight: 96,
                maxWidth: 260,
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.15))',
              }}
            />
          </div>

          {/* Invoice info row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              color: RECEIPT_PALETTE.mutedText,
              marginTop: '3mm',
              flexWrap: 'wrap',
              gap: '3mm',
            }}
          >
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo', color: RECEIPT_PALETTE.accentDark, minWidth: 140, textAlign: 'left' }}>
              رقم الفاتورة: {invoice.id}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>فاتورة مستخرجة من نظام قرطبة بتاريخ: {currentDate}</div>
          </div>

          <div style={{ height: 1, background: RECEIPT_PALETTE.accent, opacity: 0.7, marginTop: '2mm' }} />
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
              <div style={{ color: RECEIPT_PALETTE.text, marginBottom: 4, fontWeight: 700, fontSize: 13 }}>اسم الزبون:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: RECEIPT_PALETTE.softBg,
                  border: `1px solid ${RECEIPT_PALETTE.accent}`,
                  borderRadius: 6,
                  fontSize: 14,
                  minHeight: 34,
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {invoice.customerName}
              </div>
            </div>

            <div>
              <div style={{ color: RECEIPT_PALETTE.text, marginBottom: 4, fontWeight: 700, fontSize: 13 }}>المبلغ المدفوع:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: RECEIPT_PALETTE.successBg,
                  border: `1px solid ${RECEIPT_PALETTE.successBorder}`,
                  borderRadius: 6,
                  fontSize: 14,
                  minHeight: 34,
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatShortCurrency(invoice.paid || 0)}
              </div>
            </div>

            <div>
              <div style={{ color: RECEIPT_PALETTE.text, marginBottom: 4, fontWeight: 700, fontSize: 13 }}>المبلغ المتبقي:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: RECEIPT_PALETTE.warningBg,
                  border: `1px solid ${RECEIPT_PALETTE.warningBorder}`,
                  borderRadius: 6,
                  fontSize: 14,
                  minHeight: 34,
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatShortCurrency(remaining)}
              </div>
            </div>

            {invoice.phone ? (
              <div>
                <div style={{ color: RECEIPT_PALETTE.text, marginBottom: 4, fontWeight: 700, fontSize: 13 }}>الهاتف:</div>
                <div
                  style={{
                    padding: '6px 8px',
                    background: RECEIPT_PALETTE.softBg,
                    border: `1px solid ${RECEIPT_PALETTE.accent}`,
                    borderRadius: 6,
                    fontSize: 14,
                    minHeight: 34,
                    lineHeight: 1.4,
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
              <div style={{ color: RECEIPT_PALETTE.text, marginBottom: 4, fontWeight: 700, fontSize: 13 }}>تاريخ الدفع:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: RECEIPT_PALETTE.softBgAlt,
                  border: `1px solid ${RECEIPT_PALETTE.accent}`,
                  borderRadius: 6,
                  fontSize: 14,
                  minHeight: 34,
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {invoice.paymentDate ? formatDate(invoice.paymentDate) : '—'}
              </div>
            </div>

            <div>
              <div style={{ color: RECEIPT_PALETTE.text, marginBottom: 4, fontWeight: 700, fontSize: 13 }}>تاريخ الاستلام:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: RECEIPT_PALETTE.softBgAlt,
                  border: `1px solid ${RECEIPT_PALETTE.accent}`,
                  borderRadius: 6,
                  fontSize: 14,
                  minHeight: 34,
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatDate(invoice.receivedDate)}
              </div>
            </div>

            <div>
              <div style={{ color: RECEIPT_PALETTE.text, marginBottom: 4, fontWeight: 700, fontSize: 13 }}>تاريخ التسليم:</div>
              <div
                style={{
                  padding: '6px 8px',
                  background: RECEIPT_PALETTE.softBgAlt,
                  border: `1px solid ${RECEIPT_PALETTE.accent}`,
                  borderRadius: 6,
                  fontSize: 14,
                  minHeight: 34,
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatDate(invoice.deliveryDate)}
              </div>
            </div>

            {invoice.address ? (
              <div>
                <div style={{ color: RECEIPT_PALETTE.text, marginBottom: 4, fontWeight: 700, fontSize: 13 }}>العنوان:</div>
                <div
                  style={{
                    padding: '6px 8px',
                    background: RECEIPT_PALETTE.softBg,
                    border: `1px solid ${RECEIPT_PALETTE.accent}`,
                    borderRadius: 6,
                    fontSize: 14,
                    minHeight: 34,
                    lineHeight: 1.4,
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

        {/* Footer contact */}
        <div style={{ marginTop: '4mm', paddingTop: '3mm', borderTop: `1px solid ${RECEIPT_PALETTE.accent}`, paddingBottom: '4mm' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10mm',
              flexWrap: 'wrap',
              fontWeight: 700,
              fontSize: 14,
              color: RECEIPT_PALETTE.text,
            }}
          >
            <span style={{ fontSize: 13, color: RECEIPT_PALETTE.mutedText }}>تواصل معنا عبر الأرقام التالية</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14mm',
                padding: '6px 20px',
                borderRadius: 14,
                border: `2px solid ${RECEIPT_PALETTE.accentDark}`,
                background: '#FFF',
                color: RECEIPT_PALETTE.accentDark,
                direction: 'ltr',
                minWidth: 'fit-content',
              }}
            >
              <span>07707984448</span>
              <span>07901354519</span>
            </div>
          </div>
        </div>

        {/* Print button (hidden on print) */}
        <div style={{ paddingTop: '4mm', textAlign: 'center', pageBreakInside: 'avoid', paddingBottom: '4mm' }}>
          <button
            className="print-btn"
            onClick={() => window.print()}
            style={{
              background: RECEIPT_PALETTE.accentDark,
              color: '#FBEBD7',
              border: `1px solid ${RECEIPT_PALETTE.accent}`,
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
