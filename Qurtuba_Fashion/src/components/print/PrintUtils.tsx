import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Type definitions for Electron API
declare global {
  interface Window {
    electronAPI?: {
      print: (data: { title: string; content: string; styles?: string; pageSize?: string | { width: number; height: number }; landscape?: boolean; printBackground?: boolean }) => Promise<any>;
      printPreview: (data: { title: string; content: string; styles?: string; pageSize?: string | { width: number; height: number }; landscape?: boolean; printBackground?: boolean }) => Promise<any>;
      pdfPreview: (data: { title: string; content: string; styles?: string; pageSize?: string; landscape?: boolean }) => Promise<any>;
    };
  }
}

export const brandPrintStyles = `
  @page {
    size: A4 portrait;
    margin: 14mm;
  }

  body {
    margin: 0;
    background: #f4ede1;
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

  .print-container {
    width: 100%;
    min-height: calc(100vh - 28mm);
    background: linear-gradient(135deg, rgba(246, 233, 202, 0.96), rgba(255, 253, 247, 0.92));
    border: 2px solid rgba(198, 154, 114, 0.65);
    border-radius: 20px;
    padding: 28px 32px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: 0 16px 42px rgba(19, 49, 42, 0.12);
    position: relative;
    overflow: hidden;
  }

  .print-container::before {
    content: '';
    position: absolute;
    inset: 12px;
    border: 1px dashed rgba(198, 154, 114, 0.35);
    border-radius: 16px;
    pointer-events: none;
  }

  .print-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .print-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 16px;
    border-bottom: 2px solid rgba(198, 154, 114, 0.5);
  }

  .print-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #13312A;
  }

  .print-subtitle {
    margin: 0;
    font-size: 16px;
    color: #155446;
  }

  .print-meta {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px 24px;
    font-size: 13px;
    color: #155446;
  }

  .print-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .section-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #13312A;
  }

  .section-description {
    margin: 0;
    font-size: 13px;
    color: #155446;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
  }

  .metric-card {
    background: rgba(246, 233, 202, 0.9);
    border: 1px solid rgba(198, 154, 114, 0.45);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 96px;
  }

  .metric-card.accent {
    background: linear-gradient(135deg, rgba(21, 84, 70, 0.92), rgba(19, 49, 42, 0.85));
    border-color: rgba(21, 84, 70, 0.6);
  }

  .metric-label {
    font-size: 13px;
    color: #155446;
  }

  .metric-card.accent .metric-label {
    color: rgba(246, 233, 202, 0.9);
  }

  .metric-value {
    font-size: 19px;
    font-weight: 700;
    color: #13312A;
  }

  .metric-card.accent .metric-value {
    color: #F6E9CA;
  }

  .print-table-wrapper {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(198, 154, 114, 0.45);
  }

  table.print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    direction: rtl;
  }

  table.print-table thead {
    background: linear-gradient(135deg, rgba(19, 49, 42, 0.96), rgba(21, 84, 70, 0.92));
    color: #F6E9CA;
  }

  table.print-table thead th {
    padding: 10px 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
  }

  table.print-table tbody tr {
    background: rgba(255, 253, 247, 0.95);
  }

  table.print-table tbody tr:nth-child(even) {
    background: rgba(246, 233, 202, 0.45);
  }

  table.print-table tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(198, 154, 114, 0.3);
    color: #155446;
    vertical-align: top;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid transparent;
    min-width: 72px;
  }

  .detail-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .detail-card {
    background: rgba(255, 253, 247, 0.96);
    border: 1px solid rgba(198, 154, 114, 0.5);
    border-radius: 18px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 12px 24px rgba(19, 49, 42, 0.08);
    page-break-inside: avoid;
  }

  .detail-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(198, 154, 114, 0.35);
  }

  .detail-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #13312A;
  }

  .detail-grid {
    display: grid;
    gap: 8px;
  }

  .detail-grid.two-column {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(246, 233, 202, 0.35);
    border: 1px solid rgba(198, 154, 114, 0.35);
    border-radius: 12px;
    padding: 8px 10px;
  }

  .item-label {
    font-size: 12px;
    font-weight: 600;
    color: #13312A;
  }

  .item-value {
    font-size: 12px;
    color: #155446;
    line-height: 1.6;
  }

  .detail-subsection {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .subsection-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #13312A;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .list-item {
    background: rgba(246, 233, 202, 0.3);
    border: 1px solid rgba(198, 154, 114, 0.3);
    border-radius: 12px;
    padding: 8px 10px;
    font-size: 12px;
    color: #155446;
    line-height: 1.6;
  }

  .bullet-list {
    list-style: disc;
    padding-right: 20px;
    display: block;
  }

  .bullet-list li {
    margin-bottom: 6px;
  }

  .print-footer {
    margin-top: 12px;
    text-align: center;
    font-size: 12px;
    color: #155446;
  }

  @media print {
    body {
      background: transparent;
    }

    .print-container {
      box-shadow: none;
    }
  }
`;

export const formatPrintDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
};

export type PrintWindowOptions = {
  pageSize?: string | { width: number; height: number };
  landscape?: boolean;
  printBackground?: boolean;
};

export const openPrintWindow = (title: string, content: React.ReactElement, options?: PrintWindowOptions) => {
  console.log('openPrintWindow called with title:', title);
  console.log('content type:', typeof content);
  console.log('window.electronAPI available:', !!window.electronAPI);
  
  const markup = renderToStaticMarkup(content);
  console.log('markup generated, length:', markup.length);
  
  // Check if we're in Electron environment
  if (window.electronAPI) {
    // Use Electron's native print functionality
    window.electronAPI.print({
      title,
      content: `
        <div class="print-container">
          <div class="print-inner">${markup}</div>
          <div class="print-footer">تم إنشاء هذا المستند من خلال نظام إدارة أزياء قرطبة</div>
        </div>
      `,
        styles: brandPrintStyles,
        pageSize: options?.pageSize ?? 'A4',
        landscape: options?.landscape ?? false,
        printBackground: options?.printBackground ?? true
      }).catch((error: any) => {
      console.error('Print failed:', error);
      // Fallback to browser print
      fallbackPrint(title, markup);
    });
  } else {
    // Fallback to browser print
    fallbackPrint(title, markup);
  }
};

const fallbackPrint = (title: string, markup: string) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charSet="utf-8" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
    <style>${brandPrintStyles}</style>
  </head>
  <body>
    <div class="print-container">
      <div class="print-inner">${markup}</div>
      <div class="print-footer">تم إنشاء هذا المستند من خلال نظام إدارة أزياء قرطبة</div>
    </div>
    <script>
      window.onload = () => {
        window.focus();
        setTimeout(() => window.print(), 300);
      };
    <\/script>
  </body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
};

export const openPrintInvoiceWindow = (title: string, content: React.ReactElement) => {
  const markup = renderToStaticMarkup(content);
  
  console.log('openPrintInvoiceWindow called with title:', title);
  console.log('window.electronAPI available:', !!window.electronAPI);
  console.log('window.electronAPI.print available:', !!(window.electronAPI && window.electronAPI.print));
  
  // Check if we're in Electron environment
  if (window.electronAPI && window.electronAPI.print) {
    console.log('Using Electron print API');
    // Use Electron's native print functionality
    window.electronAPI.print({
      title,
      content: markup,
      styles: `
        @page { size: A5 landscape; margin: 6mm; }
        html, body { padding: 0; margin: 0; background: #ffffff; }
        * { box-sizing: border-box; }
      `,
      pageSize: 'A5',
      landscape: true,
      printBackground: true
    }).then((result: any) => {
      console.log('Print API result:', result);
    }).catch((error: any) => {
      console.error('Print failed:', error);
      // Fallback to browser print
      fallbackPrintInvoice(title, markup);
    });
  } else {
    console.log('Using fallback print');
    // Fallback to browser print
    fallbackPrintInvoice(title, markup);
  }
};

const fallbackPrintInvoice = (title: string, markup: string) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charSet="utf-8" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
    <style>
      @page { size: A5 landscape; margin: 6mm; }
      html, body { padding: 0; margin: 0; background: #ffffff; }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>
    ${markup}
    <script>
      window.onload = () => {
        window.focus();
        setTimeout(() => window.print(), 300);
      };
    <\/script>
  </body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
};

export const openPrintPreviewWindow = (title: string, content: React.ReactElement) => {
  const markup = renderToStaticMarkup(content);
  
  // Check if we're in Electron environment
  if (window.electronAPI) {
    // Use Electron's native print preview functionality
    window.electronAPI.printPreview({
      title,
      content: `
        <div class="print-container">
          <div class="print-inner">${markup}</div>
          <div class="print-footer">تم إنشاء هذا المستند من خلال نظام إدارة أزياء قرطبة</div>
        </div>
      `,
      styles: brandPrintStyles
    }).catch((error: any) => {
      console.error('Print preview failed:', error);
      // Fallback to regular print
      openPrintWindow(title, content);
    });
  } else {
    // Fallback to regular print
    openPrintWindow(title, content);
  }
};

// OS-native PDF preview: renders to PDF then opens system viewer
export const openPdfPreviewWindow = (title: string, content: React.ReactElement, opts?: { pageSize?: 'A4'|'A5'|'Letter'|'Legal'; landscape?: boolean }) => {
  const markup = renderToStaticMarkup(content);

  if (window.electronAPI && window.electronAPI.pdfPreview) {
    window.electronAPI.pdfPreview({
      title,
      content: `
        <div class="print-container">
          <div class="print-inner">${markup}</div>
          <div class="print-footer">تم توليد المعاينة كملف PDF</div>
        </div>
      `,
      styles: brandPrintStyles,
      pageSize: opts?.pageSize || 'A5',
      landscape: opts?.landscape ?? true,
    }).catch((error: any) => {
      console.error('PDF preview failed:', error);
      // Fallback to in-app preview if PDF preview fails
      openPrintPreviewWindow(title, content);
    });
  } else {
    // Fallback: in-app preview
    openPrintPreviewWindow(title, content);
  }
};
