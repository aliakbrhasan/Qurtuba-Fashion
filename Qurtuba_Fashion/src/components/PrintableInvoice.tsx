import React from 'react';

export interface PrintableInvoiceData {
  id: string;
  customerName: string;
  phone: string;
  address?: string;
  total: number;
  paid: number;
  receivedDate: string;
  deliveryDate: string;
  notes?: string;
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (value: string) => {
  if (!value) {
    return 'غير محدد';
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return 'تاريخ غير صالح';
  }
  
  return new Intl.DateTimeFormat('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const receiptStyles = `
  @page {
    size: A5 landscape;
    margin: 0.5cm;
  }

  body {
    margin: 0;
    background: #f3ede0;
    font-family: 'Tajawal', 'Noto Kufi Arabic', sans-serif;
    direction: rtl;
    color: #13312A;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  * {
    box-sizing: border-box;
  }

  .receipt-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0.6cm 0;
  }

  .receipt-container {
    width: 100%;
    max-width: calc(21cm - 1cm);
    height: calc(14.8cm - 1cm);
    background: #FDFBF7;
    border: 2px solid #C69A72;
    border-radius: 16px;
    padding: 14px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 12px 28px rgba(19, 49, 42, 0.12);
    position: relative;
    overflow: hidden;
    page-break-inside: avoid;
  }

  .receipt-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(198, 154, 114, 0.12), rgba(21, 84, 70, 0.08));
    pointer-events: none;
  }

  .receipt-inner {
    position: relative;
    z-index: 1;
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 14px;
  }

  .receipt-header {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    align-items: start;
  }

  .brand {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .brand-name {
    font-size: 22px;
    font-weight: 700;
    color: #13312A;
    letter-spacing: 1px;
  }

  .brand-tagline {
    font-size: 12px;
    color: #155446;
  }

  .header-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .invoice-meta {
    background: rgba(246, 233, 202, 0.9);
    border: 1px solid rgba(198, 154, 114, 0.6);
    border-radius: 12px;
    padding: 9px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta-item {
    font-size: 12px;
    color: #13312A;
  }

  .header-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .summary-pill {
    border-radius: 12px;
    border: 1px solid rgba(198, 154, 114, 0.45);
    background: rgba(246, 233, 202, 0.55);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .summary-pill.accent {
    background: linear-gradient(135deg, rgba(21, 84, 70, 0.92), rgba(19, 49, 42, 0.85));
    border-color: rgba(21, 84, 70, 0.55);
  }

  .pill-label {
    font-size: 10px;
    color: #155446;
  }

  .pill-value {
    font-size: 14px;
    font-weight: 700;
    color: #13312A;
  }

  .summary-pill.accent .pill-label {
    color: rgba(253, 251, 247, 0.82);
  }

  .summary-pill.accent .pill-value {
    color: #F6E9CA;
  }

  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'customer amounts'
      'dates notes';
    gap: 12px 16px;
    align-content: stretch;
    align-items: stretch;
    min-height: 0;
  }

  .customer-section {
    grid-area: customer;
  }

  .amounts-section {
    grid-area: amounts;
  }

  .dates-section {
    grid-area: dates;
  }

  .notes-section {
    grid-area: notes;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #155446;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(246, 233, 202, 0.55);
    border: 1px solid rgba(198, 154, 114, 0.4);
    border-radius: 12px;
    padding: 8px 10px;
    min-height: 56px;
  }

  .info-label {
    font-size: 11px;
    color: #155446;
  }

  .info-value {
    font-size: 13px;
    font-weight: 600;
    word-break: break-word;
  }

  .amounts-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .amount-card {
    padding: 10px;
    border-radius: 14px;
    border: 1px solid rgba(198, 154, 114, 0.45);
    background: white;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .amount-card.highlight {
    background: rgba(21, 84, 70, 0.08);
    border-color: rgba(21, 84, 70, 0.35);
  }

  .amount-label {
    font-size: 12px;
    color: #155446;
  }

  .amount-value {
    font-size: 15px;
    font-weight: 700;
    color: #13312A;
  }

  .dates-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .note-box {
    min-height: 0;
    height: 100%;
    flex: 1;
    border: 1.5px dashed rgba(198, 154, 114, 0.65);
    border-radius: 14px;
    padding: 10px 12px;
    background: rgba(246, 233, 202, 0.35);
    font-size: 12px;
    line-height: 1.5;
    color: #13312A;
    display: flex;
    align-items: flex-start;
    word-break: break-word;
  }

  .receipt-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 10px;
    font-size: 11px;
    color: #155446;
    padding-top: 10px;
    border-top: 1px solid rgba(198, 154, 114, 0.45);
    margin-top: auto;
    flex-wrap: wrap;
  }

  .signature-box {
    min-width: 140px;
    border-top: 1.5px solid rgba(198, 154, 114, 0.9);
    padding-top: 10px;
    text-align: center;
  }

  @media screen and (max-width: 900px) {
    .receipt-container {
      height: auto;
      max-width: 100%;
    }

    .content-grid {
      grid-template-columns: 1fr;
      grid-template-rows: none;
      grid-template-areas: none;
      gap: 14px;
    }

    .customer-section,
    .amounts-section,
    .dates-section,
    .notes-section {
      grid-column: 1 / -1;
      grid-row: auto;
      align-self: stretch;
    }

    .info-grid,
    .amounts-grid,
    .dates-grid {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }

    .note-box {
      height: auto;
      min-height: 110px;
    }
  }

  @media print {
    body {
      background: white;
    }

    .receipt-wrapper {
      padding: 0;
    }

    .receipt-container {
      margin: 0 auto;
      width: calc(21cm - 1cm);
      height: calc(14.8cm - 1cm);
      box-shadow: none;
    }
  }
`;

interface PrintableInvoiceProps {
  invoice: PrintableInvoiceData;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice }) => {
  const remaining = Math.max(invoice.total - invoice.paid, 0);

  return (
    <div className="receipt-wrapper">
      <div className="receipt-container">
        <div className="receipt-inner">
          <header className="receipt-header">
            <div className="brand">
              <span className="brand-name">أزياء قرطبة</span>
              <span className="brand-tagline">وصل فاتورة - نموذج داخلي</span>
            </div>
            <div className="header-meta">
              <div className="invoice-meta">
                <span className="meta-item">رقم الفاتورة: {invoice.id}</span>
                <span className="meta-item">تاريخ الإصدار: {formatDate(invoice.receivedDate)}</span>
              </div>
            </div>
          </header>

          <div className="content-grid">
            <section className="section customer-section">
              <h2 className="section-title">بيانات الزبون</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">اسم الزبون</span>
                  <span className="info-value">{invoice.customerName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">رقم الهاتف</span>
                  <span className="info-value">{invoice.phone}</span>
                </div>
                {invoice.address ? (
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="info-label">العنوان</span>
                    <span className="info-value">{invoice.address}</span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="section amounts-section">
              <h2 className="section-title">الحساب المالي</h2>
              <div className="amounts-grid">
                <div className="amount-card">
                  <div className="amount-label">المبلغ الكلي</div>
                  <div className="amount-value">{formatCurrency(invoice.total)}</div>
                </div>
                <div className="amount-card highlight">
                  <div className="amount-label">المبلغ الواصل</div>
                  <div className="amount-value">{formatCurrency(invoice.paid)}</div>
                </div>
                <div className="amount-card">
                  <div className="amount-label">المبلغ المتبقي</div>
                  <div className="amount-value">{formatCurrency(remaining)}</div>
                </div>
              </div>
            </section>

            <section className="section dates-section">
              <h2 className="section-title">التواريخ</h2>
              <div className="dates-grid">
                <div className="info-item">
                  <span className="info-label">تاريخ الاستلام</span>
                  <span className="info-value">{formatDate(invoice.receivedDate)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">تاريخ التسليم</span>
                  <span className="info-value">{formatDate(invoice.deliveryDate)}</span>
                </div>
              </div>
            </section>

            <section className="section notes-section">
              <h2 className="section-title">ملاحظات</h2>
              <div className="note-box">{invoice.notes || '—'}</div>
            </section>
          </div>

          <footer className="receipt-footer">
            <div>
              <div>نشكر ثقتكم بخدمات أزياء قرطبة.</div>
              <div>يرجى الاحتفاظ بالوصل للمراجعة.</div>
            </div>
            <div className="signature-box">توقيع الموظف</div>
          </footer>
        </div>
      </div>
    </div>
  );
};
