import React from 'react';

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

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <div style={{
        width: '100%',
        maxWidth: 960,
        margin: '0 auto',
        background: '#ffffff',
        color: '#13312A',
        border: '1px solid #C69A72',
        borderRadius: 8,
        padding: 16,
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>فاتورة</h1>
            <div style={{ color: '#155446', marginTop: 4 }}>رقم الفاتورة: {invoice.id}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{formatCurrency(invoice.total)}</div>
            <div style={{ color: '#155446', fontSize: 12 }}>المبلغ الكلي</div>
          </div>
        </header>

        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{ background: '#F6E9CA', border: '1px solid #C69A72', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#155446', fontSize: 12, marginBottom: 6 }}>الزبون</div>
            <div style={{ fontWeight: 700 }}>{invoice.customerName}</div>
            {invoice.phone ? (
              <div style={{ marginTop: 4 }}>{invoice.phone}</div>
            ) : null}
            {invoice.address ? (
              <div style={{ marginTop: 4 }}>{invoice.address}</div>
            ) : null}
          </div>

          <div style={{ background: '#F6E9CA', border: '1px solid #C69A72', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ color: '#155446', fontSize: 12, marginBottom: 4 }}>تاريخ الاستلام</div>
                <div>{formatDate(invoice.receivedDate)}</div>
              </div>
              <div>
                <div style={{ color: '#155446', fontSize: 12, marginBottom: 4 }}>تاريخ التسليم</div>
                <div>{formatDate(invoice.deliveryDate)}</div>
              </div>
            </div>
          </div>
        </section>

        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center', background: '#F6E9CA', border: '1px solid #C69A72', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#155446', fontSize: 12, marginBottom: 6 }}>المبلغ الكلي</div>
            <div style={{ fontWeight: 700 }}>{formatCurrency(invoice.total)}</div>
          </div>
          <div style={{ textAlign: 'center', background: '#E8F7EE', border: '1px solid #98D4B2', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#166534', fontSize: 12, marginBottom: 6 }}>المدفوع</div>
            <div style={{ fontWeight: 700, color: '#166534' }}>{formatCurrency(invoice.paid)}</div>
          </div>
          <div style={{ textAlign: 'center', background: '#FFF4E5', border: '1px solid #F59E0B', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#9A3412', fontSize: 12, marginBottom: 6 }}>المتبقي</div>
            <div style={{ fontWeight: 700, color: '#9A3412' }}>{formatCurrency(remaining)}</div>
          </div>
        </section>

        {invoice.notes ? (
          <section style={{ background: '#F6E9CA', border: '1px solid #C69A72', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#155446', fontSize: 12, marginBottom: 6 }}>الملاحظات</div>
            <div>{invoice.notes}</div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default PrintableInvoice;


