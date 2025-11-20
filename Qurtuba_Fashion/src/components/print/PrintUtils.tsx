import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Type definitions for Electron API
declare global {
  interface Window {
    electronAPI?: {
      getLogoPath: () => Promise<{ ok: boolean; data?: string; error?: string }>;
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

const isPromiseLike = (value: unknown): value is Promise<unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Promise<unknown>).then === 'function'
  );
};

const handleAsyncResult = (
  result: unknown,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (value: unknown) => void;
    onError?: (error: unknown) => void;
  },
) => {
  if (isPromiseLike(result)) {
    result
      .then((value) => {
        onSuccess?.(value);
      })
      .catch((error) => {
        onError?.(error);
      });
    return;
  }

  onSuccess?.(result);
};

const createTimeoutGuard = (callback: () => void, timeoutMs = 5000) => {
  if (typeof window === 'undefined') {
    return {
      cancel: () => false,
      didTimeout: () => false,
    };
  }

  let state: 'pending' | 'triggered' | 'cleared' = 'pending';
  const timerId = window.setTimeout(() => {
    if (state !== 'pending') return;
    state = 'triggered';
    callback();
  }, timeoutMs);

  return {
    cancel: () => {
      if (state !== 'pending') return false;
      state = 'cleared';
      window.clearTimeout(timerId);
      return true;
    },
    didTimeout: () => state === 'triggered',
  };
};

export const openPrintWindow = (title: string, content: React.ReactElement, options?: PrintWindowOptions) => {
  console.log('openPrintWindow called with title:', title);
  console.log('content type:', typeof content);
  console.log('window.electronAPI available:', !!window.electronAPI);
  
  const markup = renderToStaticMarkup(content);
  console.log('markup generated, length:', markup.length);

  const electronPrint = window.electronAPI?.print;
  
  if (typeof electronPrint === 'function') {
    try {
      const timeoutGuard = createTimeoutGuard(() => {
        console.warn('Electron print request timed out, falling back to browser print.');
        fallbackPrint(title, markup);
      });
      const result = electronPrint({
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
      });

      handleAsyncResult(result, {
        onSuccess: () => {
          timeoutGuard.cancel();
        },
        onError: (error) => {
          console.error('Print failed:', error);
          if (!timeoutGuard.didTimeout()) {
            timeoutGuard.cancel();
            fallbackPrint(title, markup);
          }
        },
      });
    } catch (error) {
      console.error('Print threw synchronously:', error);
      fallbackPrint(title, markup);
    }
    return;
  }

  if (window.electronAPI && !electronPrint) {
    console.warn('Electron API detected but print function is unavailable. Falling back to browser print.');
  }

  fallbackPrint(title, markup);
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

export const openPrintInvoiceWindow = async (title: string, content: React.ReactElement) => {
  let markup = renderToStaticMarkup(content);
  
  // In Electron, replace logo src with base64 data URL for reliable printing
  if (window.electronAPI && window.electronAPI.getLogoPath) {
    try {
      const logoResult = await window.electronAPI.getLogoPath();
      if (logoResult?.ok && logoResult?.data) {
        const logoDataUrl = logoResult.data;
        // Replace any logo src attributes (including data URLs or file paths) with base64
        // Match both quoted and unquoted src attributes
        markup = markup.replace(
          /(<img[^>]*src=["'])([^"']*logo[^"']*)(["'][^>]*>)/gi,
          (_match, before, _src, after) => {
            return `${before}${logoDataUrl}${after}`;
          }
        );
        // Also handle alt text that might contain "logo" or "Qurtuba"
        markup = markup.replace(
          /(<img[^>]*alt=["'][^"']*(?:logo|Qurtuba)[^"']*["'][^>]*src=["'])([^"']*)(["'][^>]*>)/gi,
          (_match, before, _src, after) => {
            return `${before}${logoDataUrl}${after}`;
          }
        );
        console.log('Logo replaced in print markup with base64 data URL');
      }
    } catch (error) {
      console.warn('Failed to get logo path:', error);
    }
  }
  
  console.log('openPrintInvoiceWindow called with title:', title);
  console.log('window.electronAPI available:', !!window.electronAPI);
  console.log('window.electronAPI.print available:', !!(window.electronAPI && window.electronAPI.print));
  
  // Check if we're in Electron environment
  const electronPrint = window.electronAPI?.print;
  
  if (typeof electronPrint === 'function') {
    console.log('Using Electron print API');
    try {
      const timeoutGuard = createTimeoutGuard(() => {
        console.warn('Electron print request timed out, using browser fallback.');
        fallbackPrintInvoice(title, markup);
      });
      const result = electronPrint({
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
      });

      handleAsyncResult(result, {
        onSuccess: (value) => {
          timeoutGuard.cancel();
          if (value !== undefined) {
            console.log('Print API result:', value);
          }
        },
        onError: (error) => {
          console.error('Print failed:', error);
          if (!timeoutGuard.didTimeout()) {
            timeoutGuard.cancel();
            fallbackPrintInvoice(title, markup);
          }
        },
      });
    } catch (error) {
      console.error('Print threw synchronously:', error);
      fallbackPrintInvoice(title, markup);
    }
    return;
  }

  console.log('Using fallback print');
  fallbackPrintInvoice(title, markup);
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
  if (window.electronAPI?.printPreview) {
    // Use Electron's native print preview functionality
    try {
      const timeoutGuard = createTimeoutGuard(() => {
        console.warn('Electron print preview timed out, falling back to print window.');
        openPrintWindow(title, content);
      });
      const result = window.electronAPI.printPreview({
        title,
        content: `
          <div class="print-container">
            <div class="print-inner">${markup}</div>
            <div class="print-footer">تم إنشاء هذا المستند من خلال نظام إدارة أزياء قرطبة</div>
          </div>
        `,
        styles: brandPrintStyles
      });

      handleAsyncResult(result, {
        onSuccess: () => {
          timeoutGuard.cancel();
        },
        onError: (error) => {
          console.error('Print preview failed:', error);
          if (!timeoutGuard.didTimeout()) {
            timeoutGuard.cancel();
            openPrintWindow(title, content);
          }
        },
      });
    } catch (error) {
      console.error('Print preview threw synchronously:', error);
      openPrintWindow(title, content);
    }
  } else {
    // Fallback to regular print
    openPrintWindow(title, content);
  }
};

// OS-native PDF preview: renders to PDF then opens system viewer
export const openPdfPreviewWindow = (title: string, content: React.ReactElement, opts?: { pageSize?: 'A4'|'A5'|'Letter'|'Legal'; landscape?: boolean }) => {
  const markup = renderToStaticMarkup(content);

  if (window.electronAPI?.pdfPreview) {
    try {
      const timeoutGuard = createTimeoutGuard(() => {
        console.warn('Electron PDF preview timed out, falling back to in-app preview.');
        openPrintPreviewWindow(title, content);
      });
      const result = window.electronAPI.pdfPreview({
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
      });

      handleAsyncResult(result, {
        onSuccess: () => {
          timeoutGuard.cancel();
        },
        onError: (error) => {
          console.error('PDF preview failed:', error);
          if (!timeoutGuard.didTimeout()) {
            timeoutGuard.cancel();
            openPrintPreviewWindow(title, content);
          }
        },
      });
    } catch (error) {
      console.error('PDF preview threw synchronously:', error);
      openPrintPreviewWindow(title, content);
    }
  } else {
    // Fallback: in-app preview
    openPrintPreviewWindow(title, content);
  }
};
