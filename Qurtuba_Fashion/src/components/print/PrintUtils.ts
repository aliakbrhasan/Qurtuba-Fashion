// Print utilities for the application
export function openPrintWindow(content: string, title: string = 'طباعة') {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}

export function openPrintInvoiceWindow(invoiceData: any) {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1>فاتورة</h1>
      <p>رقم الفاتورة: ${invoiceData.invoice_number || invoiceData.id}</p>
    </div>
    <div style="margin-bottom: 20px;">
      <h3>بيانات العميل:</h3>
      <p>الاسم: ${invoiceData.customer_name}</p>
      <p>الهاتف: ${invoiceData.customer_phone || 'غير محدد'}</p>
      <p>العنوان: ${invoiceData.customer_address || 'غير محدد'}</p>
    </div>
    <div style="margin-bottom: 20px;">
      <h3>تفاصيل الفاتورة:</h3>
      <p>المجموع: ${invoiceData.total} دينار</p>
      <p>المبلغ المدفوع: ${invoiceData.paid_amount || 0} دينار</p>
      <p>المتبقي: ${(invoiceData.total - (invoiceData.paid_amount || 0))} دينار</p>
      <p>الحالة: ${invoiceData.status}</p>
    </div>
    ${invoiceData.notes ? `<div><h3>ملاحظات:</h3><p>${invoiceData.notes}</p></div>` : ''}
  `;
  
  openPrintWindow(content, `فاتورة ${invoiceData.invoice_number || invoiceData.id}`);
}

export function formatPrintDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
