import React, { useState, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceService } from '@/services/invoice.service';
import {
  Plus,
  Search,
  Filter,
  Download,
  Copy,
  Edit,
  MoreVertical,
  FileImage,
  MessageCircle,
  Printer,
  Eye,
  CheckCircle,
  Save,
  Grid3X3,
  List,
  Calendar,
  DollarSign,
  User,
  Phone,
  MapPin,
  Clock,
  ArrowUpDown,
  FilterX,
  RefreshCw,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  PrintableInvoice,
  receiptStyles,
  formatCurrency,
  formatDate,
  PrintableInvoiceData,
} from './PrintableInvoice';
import { openPrintWindow, formatPrintDateTime } from './print/PrintUtils';
import { InvoiceDetailsPage } from './InvoiceDetailsPage';
import { InvoiceDetailsDialog } from './InvoiceDetailsDialog';

type DateParts = {
  year: string;
  month: string;
  day: string;
};

const monthOptions = [
  { value: '1', label: 'كانون الثاني (يناير)' },
  { value: '2', label: 'شباط (فبراير)' },
  { value: '3', label: 'آذار (مارس)' },
  { value: '4', label: 'نيسان (أبريل)' },
  { value: '5', label: 'أيار (مايو)' },
  { value: '6', label: 'حزيران (يونيو)' },
  { value: '7', label: 'تموز (يوليو)' },
  { value: '8', label: 'آب (أغسطس)' },
  { value: '9', label: 'أيلول (سبتمبر)' },
  { value: '10', label: 'تشرين الأول (أكتوبر)' },
  { value: '11', label: 'تشرين الثاني (نوفمبر)' },
  { value: '12', label: 'كانون الأول (ديسمبر)' },
];

const dayOptions = Array.from({ length: 31 }, (_, index) => (index + 1).toString());

const getLastDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const formatRangeDate = (date: Date) =>
  new Intl.DateTimeFormat('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

const mobileDateFormatter = new Intl.DateTimeFormat('ar-IQ', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatMobileDate = (value: string) => mobileDateFormatter.format(new Date(value));

const buildBoundaryDate = (parts: DateParts, isStart: boolean): Date | null => {
  const year = parseInt(parts.year, 10);

  if (Number.isNaN(year)) {
    return null;
  }

  const month = parts.month ? parseInt(parts.month, 10) : isStart ? 1 : 12;

  if (Number.isNaN(month) || month < 1 || month > 12) {
    return null;
  }

  const lastDay = getLastDayOfMonth(year, month);

  let day: number;

  if (parts.day) {
    const parsedDay = parseInt(parts.day, 10);

    if (Number.isNaN(parsedDay) || parsedDay < 1) {
      return null;
    }

    day = Math.min(parsedDay, lastDay);
  } else {
    day = isStart ? 1 : lastDay;
  }

  const boundary = new Date(year, month - 1, day);

  if (isStart) {
    boundary.setHours(0, 0, 0, 0);
  } else {
    boundary.setHours(23, 59, 59, 999);
  }

  return boundary;
};

interface InvoicesPageProps {
  onCreateInvoice: () => void;
  onViewInvoiceDetails?: (invoice: Invoice) => void;
  onMarkAsPaid?: (invoiceId: string) => void;
}

type InvoiceStatus = 'مدفوع' | 'معلق' | 'جزئي' | string;

type Invoice = PrintableInvoiceData & {
  status: InvoiceStatus;
  fabricImage: string;
  measurements?: {
    length?: number;
    shoulder?: number;
    waist?: number;
    chest?: number;
  };
  designDetails?: {
    fabricType?: string[];
    fabricSource?: string[];
    collarType?: string[];
    chestStyle?: string[];
    sleeveEnd?: string[];
  };
};

export function InvoicesPage({ onCreateInvoice, onViewInvoiceDetails, onMarkAsPaid }: InvoicesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Use the database hook
  const { invoices: dbInvoices, loading, error, markAsPaid: markInvoiceAsPaid } = useInvoices();

  // Transform database invoices to match the expected format
  const invoices: Invoice[] = dbInvoices.map(invoice => ({
    id: invoice.id,
    customerName: invoice.customer_name,
    phone: invoice.customer_phone || '',
    address: invoice.customer_address || '',
    total: invoice.total,
    paid: invoice.paid_amount,
    receivedDate: invoice.invoice_date,
    deliveryDate: invoice.due_date || invoice.invoice_date,
    status: invoice.status,
    notes: invoice.notes || '',
    fabricImage: 'https://images.unsplash.com/photo-1642683497706-77a72ea549bb?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=100&fit=crop',
    measurements: {
      length: 180,
      shoulder: 45,
      waist: 90,
      chest: 100
    },
    designDetails: {
      fabricType: ['قطن'],
      fabricSource: ['داخل المحل'],
      collarType: ['عادية'],
      chestStyle: ['صدر واحد'],
      sleeveEnd: ['كم عادي']
    }
  }));

  const receivedTimes = invoices.map((invoice) => new Date(invoice.receivedDate).getTime());
  const fallbackYear = new Date().getFullYear().toString();
  const initialFromYear = receivedTimes.length ? new Date(Math.min(...receivedTimes)).getFullYear().toString() : fallbackYear;
  const initialToYear = receivedTimes.length ? new Date(Math.max(...receivedTimes)).getFullYear().toString() : fallbackYear;

  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [fromDateParts, setFromDateParts] = useState<DateParts>(() => ({
    year: initialFromYear,
    month: '',
    day: '',
  }));
  const [toDateParts, setToDateParts] = useState<DateParts>(() => ({
    year: initialToYear,
    month: '',
    day: '',
  }));
  const [printError, setPrintError] = useState<string | null>(null);

  const openPrintDialog = () => {
    setPrintError(null);
    setIsPrintDialogOpen(true);
  };

  const handlePrintDialogOpenChange = (open: boolean) => {
    setIsPrintDialogOpen(open);
    if (!open) {
      setPrintError(null);
    }
  };

  const handleFromYearChange = (value: string) => {
    setFromDateParts((prev) => ({
      ...prev,
      year: value,
    }));
    setPrintError(null);
  };

  const handleToYearChange = (value: string) => {
    setToDateParts((prev) => ({
      ...prev,
      year: value,
    }));
    setPrintError(null);
  };

  const handleFromMonthChange = (value: string) => {
    setFromDateParts((prev) => ({
      ...prev,
      month: value,
      day: '',
    }));
    setPrintError(null);
  };

  const handleToMonthChange = (value: string) => {
    setToDateParts((prev) => ({
      ...prev,
      month: value,
      day: '',
    }));
    setPrintError(null);
  };

  const handleFromDayChange = (value: string) => {
    setFromDateParts((prev) => ({
      ...prev,
      day: value,
    }));
    setPrintError(null);
  };

  const handleToDayChange = (value: string) => {
    setToDateParts((prev) => ({
      ...prev,
      day: value,
    }));
    setPrintError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مدفوع': return 'bg-green-100 text-green-800';
      case 'معلق': return 'bg-red-100 text-red-800';
      case 'جزئي': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'معلق':
        return 'غير مدفوع';
      case 'جزئي':
        return 'مدفوع جزئياً';
      default:
        return status;
    }
  };

  const getStatusPrintStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'مدفوع':
        return {
          backgroundColor: 'rgba(21, 84, 70, 0.12)',
          color: '#155446',
          border: '1px solid rgba(21, 84, 70, 0.35)',
        };
      case 'معلق':
        return {
          backgroundColor: 'rgba(190, 49, 68, 0.12)',
          color: '#8f1d2c',
          border: '1px solid rgba(190, 49, 68, 0.35)',
        };
      case 'جزئي':
        return {
          backgroundColor: 'rgba(246, 196, 120, 0.2)',
          color: '#8a5a00',
          border: '1px solid rgba(246, 196, 120, 0.45)',
        };
      default:
        return {
          backgroundColor: 'rgba(198, 154, 114, 0.2)',
          color: '#13312A',
          border: '1px solid rgba(198, 154, 114, 0.4)',
        };
    }
  };

  // Enhanced filtering and sorting logic
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      // Search filter
      const matchesSearch = invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.phone.includes(searchTerm) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.address?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const invoiceDate = new Date(invoice.receivedDate);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            matchesDate = daysDiff === 0;
            break;
          case 'week':
            matchesDate = daysDiff <= 7;
            break;
          case 'month':
            matchesDate = daysDiff <= 30;
            break;
          case 'quarter':
            matchesDate = daysDiff <= 90;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sort filtered results
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime();
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'total':
          return b.total - a.total;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [invoices, searchTerm, statusFilter, dateFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedInvoices.length;
    const paid = filteredAndSortedInvoices.filter(inv => inv.status === 'مدفوع').length;
    const pending = filteredAndSortedInvoices.filter(inv => inv.status === 'معلق').length;
    const partial = filteredAndSortedInvoices.filter(inv => inv.status === 'جزئي').length;
    const totalAmount = filteredAndSortedInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = filteredAndSortedInvoices.reduce((sum, inv) => sum + inv.paid, 0);
    
    return { total, paid, pending, partial, totalAmount, paidAmount };
  }, [filteredAndSortedInvoices]);

  const handlePrintInvoices = (rangeStart: Date, rangeEnd: Date) => {
    const invoicesInRange = filteredAndSortedInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.receivedDate);
      return invoiceDate >= rangeStart && invoiceDate <= rangeEnd;
    });

    const totalAmount = invoicesInRange.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalPaid = invoicesInRange.reduce((sum, invoice) => sum + invoice.paid, 0);
    const totalRemaining = invoicesInRange.reduce((sum, invoice) => sum + Math.max(invoice.total - invoice.paid, 0), 0);
    const statusCounts = invoicesInRange.reduce<Record<string, number>>((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {});
    const now = new Date();
    const rangeLabel = `${formatRangeDate(rangeStart)} إلى ${formatRangeDate(rangeEnd)}`;

    openPrintWindow('قائمة الفواتير', (
      <>
        <header className="print-header">
          <h1 className="print-title">سجل الفواتير</h1>
          <p className="print-subtitle">قائمة تفصيلية بالفواتير المسجلة في نظام أزياء قرطبة</p>
          <div className="print-meta">
            <span>تاريخ الطباعة: {formatPrintDateTime(now)}</span>
            <span>عدد الفواتير: {invoicesInRange.length}</span>
            <span>الفترة المختارة: {rangeLabel}</span>
          </div>
        </header>

        <section className="print-section">
          <h2 className="section-title">ملخص الأرقام</h2>
          <div className="metrics-grid">
            <div className="metric-card accent">
              <span className="metric-label">إجمالي قيمة الفواتير</span>
              <span className="metric-value">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">المبالغ المستلمة</span>
              <span className="metric-value">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">المبالغ المتبقية</span>
              <span className="metric-value">{formatCurrency(totalRemaining)}</span>
            </div>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div className="metric-card" key={status}>
                <span className="metric-label">فواتير {getStatusLabel(status)}</span>
                <span className="metric-value">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="print-section">
          <h2 className="section-title">جدول الفواتير</h2>
          <p className="section-description">
            يتضمن الجدول التفاصيل الأساسية لكل فاتورة بما في ذلك حالة السداد ومواعيد التسليم.
            {invoicesInRange.length === 0 && ' لا توجد فواتير ضمن الفترة المحددة حالياً.'}
          </p>
          <div className="print-table-wrapper">
            <table className="print-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>الزبون</th>
                  <th>الهاتف</th>
                  <th>تاريخ الاستلام</th>
                  <th>تاريخ التسليم</th>
                  <th>المبلغ الكلي</th>
                  <th>المبلغ الواصل</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {invoicesInRange.map((invoice) => {
                  const remaining = Math.max(invoice.total - invoice.paid, 0);
                  return (
                    <tr key={invoice.id}>
                      <td>{invoice.id}</td>
                      <td>{invoice.customerName}</td>
                      <td>{invoice.phone}</td>
                      <td>{formatDate(invoice.receivedDate)}</td>
                      <td>{formatDate(invoice.deliveryDate)}</td>
                      <td>{formatCurrency(invoice.total)}</td>
                      <td>{formatCurrency(invoice.paid)}</td>
                      <td>{formatCurrency(remaining)}</td>
                      <td>
                        <span className="status-pill" style={getStatusPrintStyle(invoice.status)}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="print-section">
          <h2 className="section-title">تفاصيل الفواتير</h2>
          <p className="section-description">
            تم تجهيز هذه البطاقات لتعرض بيانات الزبون والملاحظات المرتبطة بكل فاتورة.
            {invoicesInRange.length === 0 && ' لا توجد فواتير ضمن الفترة المحددة حالياً.'}
          </p>
          <div className="detail-cards">
            {invoicesInRange.map((invoice) => {
              const remaining = Math.max(invoice.total - invoice.paid, 0);
              return (
                <article className="detail-card" key={`${invoice.id}-details`}>
                  <div className="detail-card-header">
                    <h3 className="detail-title">{invoice.customerName}</h3>
                    <span className="status-pill" style={getStatusPrintStyle(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                  <div className="detail-grid two-column">
                    <div className="detail-item">
                      <span className="item-label">رقم الفاتورة</span>
                      <span className="item-value">{invoice.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">الهاتف</span>
                      <span className="item-value">{invoice.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">تاريخ الاستلام</span>
                      <span className="item-value">{formatDate(invoice.receivedDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">تاريخ التسليم</span>
                      <span className="item-value">{formatDate(invoice.deliveryDate)}</span>
                    </div>
                  </div>
                  <div className="detail-grid two-column">
                    <div className="detail-item">
                      <span className="item-label">المبلغ الكلي</span>
                      <span className="item-value">{formatCurrency(invoice.total)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">المبلغ الواصل</span>
                      <span className="item-value">{formatCurrency(invoice.paid)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">المبلغ المتبقي</span>
                      <span className="item-value">{formatCurrency(remaining)}</span>
                    </div>
                  </div>
                  {invoice.address && (
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="item-label">العنوان</span>
                        <span className="item-value">{invoice.address}</span>
                      </div>
                    </div>
                  )}
                  {invoice.notes && (
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="item-label">ملاحظات</span>
                        <span className="item-value">{invoice.notes}</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </>
    ));
  };

  const handleConfirmPrintRange = () => {
    setPrintError(null);

    const startDate = buildBoundaryDate(fromDateParts, true);
    const endDate = buildBoundaryDate(toDateParts, false);

    if (!startDate || !endDate) {
      setPrintError('يرجى تحديد سنة صالحة لكل من تاريخ البداية والنهاية.');
      return;
    }

    if (startDate.getTime() > endDate.getTime()) {
      setPrintError('تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.');
      return;
    }

    setIsPrintDialogOpen(false);
    handlePrintInvoices(startDate, endDate);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const receiptWindow = window.open('', '_blank', 'width=900,height=700');

    if (!receiptWindow) {
      return;
    }

    const markup = renderToStaticMarkup(<PrintableInvoice invoice={invoice} />);

    receiptWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charSet="utf-8" />
    <title>فاتورة ${invoice.id}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
    <style>${receiptStyles}</style>
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
    receiptWindow.document.close();
    receiptWindow.focus();
  };

  const handleExportPDF = (invoice: Invoice) => {
    const receiptWindow = window.open('', '_blank', 'width=900,height=700');

    if (!receiptWindow) {
      return;
    }

    const markup = renderToStaticMarkup(<PrintableInvoice invoice={invoice} />);

    receiptWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charSet="utf-8" />
    <title>فاتورة ${invoice.id}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
    <style>${receiptStyles}</style>
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
    receiptWindow.document.close();
    receiptWindow.focus();
  };

  const handleShareWhatsApp = (invoice: Invoice) => {
    const remaining = Math.max(invoice.total - invoice.paid, 0);
    const message = [
      `فاتورة رقم: ${invoice.id}`,
      `الزبون: ${invoice.customerName}`,
      `المبلغ الكلي: ${formatCurrency(invoice.total)}`,
      `المبلغ الواصل: ${formatCurrency(invoice.paid)}`,
      `المبلغ المتبقي: ${formatCurrency(remaining)}`,
      `تاريخ الاستلام: ${formatDate(invoice.receivedDate)}`,
      `تاريخ التسليم: ${formatDate(invoice.deliveryDate)}`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${invoice.phone.replace(/^0/, '964')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSaveAsImage = (invoiceId: string) => {
    console.log('Saving as image:', invoiceId);
    // Image export logic would go here
  };

  const handleViewDetails = (invoice: Invoice) => {
    if (onViewInvoiceDetails) {
      onViewInvoiceDetails(invoice);
    } else {
      setSelectedInvoice(invoice);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await markInvoiceAsPaid(invoice.id);
      if (onMarkAsPaid) {
        onMarkAsPaid(invoice.id);
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const canMarkAsPaid = (invoice: Invoice) => {
    return invoice.status === 'معلق' || invoice.status === 'جزئي';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6E9CA] to-[#FDFBF7]">
      <div className="container mx-auto p-4 space-y-6">
        {/* Enhanced Header with Statistics */}
        <div className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#13312A] arabic-text mb-2">إدارة الفواتير</h1>
              <p className="text-[#155446] arabic-text">إدارة شاملة لفواتير العملاء والطلبات</p>
            </div>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-[#155446] to-[#13312A] text-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm opacity-90 arabic-text">إجمالي الفواتير</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{stats.paid}</div>
                <div className="text-sm opacity-90 arabic-text">مدفوعة</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm opacity-90 arabic-text">معلقة</div>
              </div>
              <div className="bg-gradient-to-r from-[#C69A72] to-[#B8860B] text-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                <div className="text-sm opacity-90 arabic-text">إجمالي المبلغ</div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              onClick={onCreateInvoice}
              className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span className="arabic-text">فاتورة جديدة</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={openPrintDialog}
              className="border-2 border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] hover:text-white flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Printer className="w-5 h-5" />
              <span className="arabic-text">طباعة القائمة</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-2 border-[#155446] text-[#155446] hover:bg-[#155446] hover:text-white flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Filter className="w-5 h-5" />
              <span className="arabic-text">تصفية متقدمة</span>
            </Button>
            
            <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-[#C69A72]/30">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline arabic-text">جدول</span>
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline arabic-text">شبكة</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Basic Filters */}
        <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#155446] w-5 h-5" />
                <Input
                  placeholder="بحث عن الفواتير، الزبائن، أو أرقام الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 pl-4 py-3 bg-white border-2 border-[#C69A72]/30 rounded-xl text-right text-lg focus:border-[#155446] focus:ring-2 focus:ring-[#155446]/20 transition-all duration-300"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-2 border-[#C69A72]/30 rounded-xl">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">التاريخ</SelectItem>
                    <SelectItem value="customer">اسم الزبون</SelectItem>
                    <SelectItem value="total">المبلغ</SelectItem>
                    <SelectItem value="status">الحالة</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                    setSortBy('date');
                  }}
                  className="border-2 border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2 px-4 py-3 rounded-xl"
                >
                  <FilterX className="w-4 h-4" />
                  <span className="arabic-text">مسح الفلاتر</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-[#13312A] arabic-text mb-4">تصفية متقدمة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label className="text-[#155446] arabic-text font-semibold mb-2 block">حالة الفاتورة</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-2 border-[#C69A72]/30 rounded-xl">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="مدفوع">مدفوع</SelectItem>
                      <SelectItem value="معلق">معلق</SelectItem>
                      <SelectItem value="جزئي">جزئي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-[#155446] arabic-text font-semibold mb-2 block">الفترة الزمنية</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="border-2 border-[#C69A72]/30 rounded-xl">
                      <SelectValue placeholder="اختر الفترة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفترات</SelectItem>
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="week">آخر أسبوع</SelectItem>
                      <SelectItem value="month">آخر شهر</SelectItem>
                      <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-[#155446] hover:bg-[#13312A] text-white flex items-center gap-2 px-4 py-3 rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="arabic-text">تطبيق الفلاتر</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#155446] mx-auto mb-4"></div>
              <div className="text-[#13312A] arabic-text text-lg">جاري تحميل الفواتير...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-red-600 arabic-text text-lg mb-4">خطأ في تحميل الفواتير: {error}</div>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
                إعادة المحاولة
              </Button>
            </div>
          </div>
        )}

        {/* Invoices Display */}
        {!loading && !error && (
          <>
            {filteredAndSortedInvoices.length === 0 ? (
              <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20">
                <CardContent className="p-16 text-center">
                  <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#13312A] arabic-text mb-2">لا توجد فواتير</h3>
                  <p className="text-[#155446] arabic-text mb-6">لم يتم العثور على فواتير تطابق معايير البحث</p>
                  <Button
                    onClick={onCreateInvoice}
                    className="bg-[#155446] hover:bg-[#13312A] text-white px-8 py-3 text-lg rounded-xl"
                  >
                    <Plus className="w-5 h-5 ml-2" />
                    إنشاء فاتورة جديدة
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Table View */}
                {viewMode === 'table' && (
                  <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-[#13312A] to-[#155446] hover:bg-gradient-to-r hover:from-[#13312A] hover:to-[#155446]">
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">رقم الفاتورة</TableHead>
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">الزبون</TableHead>
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">الهاتف</TableHead>
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">المبلغ</TableHead>
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">صورة القماش</TableHead>
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">تاريخ الاستلام</TableHead>
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">تاريخ التسليم</TableHead>
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">الحالة</TableHead>
                            <TableHead className="text-[#F6E9CA] arabic-text text-right font-bold text-base">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedInvoices.map((invoice) => (
                            <TableRow 
                              key={invoice.id} 
                              className="hover:bg-gradient-to-r hover:from-[#F6E9CA]/50 hover:to-[#FDFBF7] cursor-pointer transition-all duration-300 border-b border-[#C69A72]/20"
                              onClick={() => handleViewDetails(invoice)}
                            >
                              <TableCell className="text-[#13312A] arabic-text font-semibold text-lg">{invoice.id}</TableCell>
                              <TableCell className="text-[#13312A] arabic-text font-medium">{invoice.customerName}</TableCell>
                              <TableCell className="text-[#13312A] font-mono">{invoice.phone}</TableCell>
                              <TableCell className="text-[#13312A] font-bold text-lg">{formatCurrency(invoice.total)}</TableCell>
                              <TableCell>
                                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#C69A72]/30 shadow-md">
                                  <ImageWithFallback
                                    src={invoice.fabricImage}
                                    alt="صورة القماش"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-[#13312A]">{formatDate(invoice.receivedDate)}</TableCell>
                              <TableCell className="text-[#13312A]">{formatDate(invoice.deliveryDate)}</TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(invoice.status)} px-3 py-1 text-sm font-semibold rounded-full`}>
                                  {getStatusLabel(invoice.status)}
                                </Badge>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePrintInvoice(invoice)}
                                    className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] hover:text-white rounded-lg"
                                    aria-label={`طباعة فاتورة ${invoice.customerName}`}
                                  >
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                  
                                  {canMarkAsPaid(invoice) && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkAsPaid(invoice)}
                                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1"
                                      aria-label={`تم الدفع لفاتورة ${invoice.customerName}`}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 px-3">
                                      <MoreVertical className="w-4 h-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white border-[#C69A72] rounded-xl shadow-lg">
                                      <DropdownMenuItem onClick={() => handleViewDetails(invoice)} className="arabic-text">
                                        <Eye className="w-4 h-4 ml-2" />
                                        عرض التفاصيل
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="arabic-text">
                                        <Edit className="w-4 h-4 ml-2" />
                                        تعديل الفاتورة
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="arabic-text">
                                        <Copy className="w-4 h-4 ml-2" />
                                        تكرار الفاتورة
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleExportPDF(invoice)} className="arabic-text">
                                        <Download className="w-4 h-4 ml-2" />
                                        تصدير إلى PDF
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleShareWhatsApp(invoice)} className="arabic-text">
                                        <MessageCircle className="w-4 h-4 ml-2" />
                                        مشاركة عبر واتساب
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSaveAsImage(invoice.id)} className="arabic-text">
                                        <FileImage className="w-4 h-4 ml-2" />
                                        حفظ كصورة
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}

                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedInvoices.map((invoice) => (
                      <Card 
                        key={invoice.id} 
                        className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={() => handleViewDetails(invoice)}
                      >
                        <CardContent className="p-0">
                          {/* Image Header */}
                          <div className="relative h-48 overflow-hidden rounded-t-xl">
                            <ImageWithFallback
                              src={invoice.fabricImage}
                              alt="صورة القماش"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 right-3">
                              <Badge className={`${getStatusColor(invoice.status)} px-3 py-1 text-sm font-semibold rounded-full shadow-lg`}>
                                {getStatusLabel(invoice.status)}
                              </Badge>
                            </div>
                            {canMarkAsPaid(invoice) && (
                              <div className="absolute top-3 left-3">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsPaid(invoice);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg"
                                  aria-label={`تم الدفع لفاتورة ${invoice.customerName}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-[#13312A] arabic-text mb-2 truncate">{invoice.customerName}</h3>
                            <p className="text-sm text-[#155446] arabic-text mb-1">رقم الفاتورة: {invoice.id}</p>
                            <p className="text-sm text-[#155446] font-mono mb-3">{invoice.phone}</p>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[#155446] arabic-text">المبلغ الكلي:</span>
                                <span className="font-bold text-[#13312A] text-lg">{formatCurrency(invoice.total)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[#155446] arabic-text">المدفوع:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(invoice.paid)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[#155446] arabic-text">المتبقي:</span>
                                <span className="font-semibold text-orange-600">{formatCurrency(Math.max(invoice.total - invoice.paid, 0))}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1 mb-4 text-sm text-[#155446]">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="arabic-text">الاستلام: {formatDate(invoice.receivedDate)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="arabic-text">التسليم: {formatDate(invoice.deliveryDate)}</span>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintInvoice(invoice)}
                                className="flex-1 border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] hover:text-white rounded-lg"
                              >
                                <Printer className="w-4 h-4 ml-1" />
                                <span className="arabic-text">طباعة</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShareWhatsApp(invoice)}
                                className="flex-1 border-green-300 text-green-600 hover:bg-green-50 rounded-lg"
                              >
                                <MessageCircle className="w-4 h-4 ml-1" />
                                <span className="arabic-text">واتساب</span>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] hover:text-white rounded-lg">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-[#C69A72] rounded-xl shadow-lg">
                                  <DropdownMenuItem onClick={() => handleViewDetails(invoice)} className="arabic-text">
                                    <Eye className="w-4 h-4 ml-2" />
                                    عرض التفاصيل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="arabic-text">
                                    <Edit className="w-4 h-4 ml-2" />
                                    تعديل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExportPDF(invoice)} className="arabic-text">
                                    <Download className="w-4 h-4 ml-2" />
                                    تصدير PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>

      <Dialog open={isPrintDialogOpen} onOpenChange={handlePrintDialogOpenChange}>
        <DialogContent className="max-w-3xl bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text">تحديد فترة الطباعة</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">
              اختر تاريخ البداية والنهاية قبل طباعة قائمة الفواتير، ويمكنك توسيع الفترة أو تقليصها حسب الحاجة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-[#C69A72] bg-[#FDFBF7] p-4">
                <h3 className="text-lg font-semibold text-[#13312A] arabic-text">بداية الفترة (من)</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[#13312A] arabic-text">السنة</Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={fromDateParts.year}
                      onChange={(e) => handleFromYearChange(e.target.value)}
                      placeholder="مثال: 2024"
                      className="border-[#C69A72] text-right arabic-text touch-target"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[#13312A] arabic-text">الشهر</Label>
                    <select
                      value={fromDateParts.month}
                      onChange={(e) => handleFromMonthChange(e.target.value)}
                      className="px-3 py-2 border border-[#C69A72] rounded-md bg-white text-[#13312A] arabic-text touch-target focus:border-[#155446] focus:ring-1 focus:ring-[#155446]"
                    >
                      <option value="">من بداية السنة</option>
                      {monthOptions.map((month) => (
                        <option key={`from-month-${month.value}`} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[#13312A] arabic-text">اليوم</Label>
                    <select
                      value={fromDateParts.day}
                      onChange={(e) => handleFromDayChange(e.target.value)}
                      disabled={!fromDateParts.month}
                      className="px-3 py-2 border border-[#C69A72] rounded-md bg-white text-[#13312A] arabic-text touch-target focus:border-[#155446] focus:ring-1 focus:ring-[#155446] disabled:cursor-not-allowed disabled:bg-[#E2D4BD] disabled:text-[#7A6A58]"
                    >
                      <option value="">من بداية الشهر</option>
                      {dayOptions.map((day) => (
                        <option key={`from-day-${day}`} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-[#C69A72] bg-[#FDFBF7] p-4">
                <h3 className="text-lg font-semibold text-[#13312A] arabic-text">نهاية الفترة (إلى)</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[#13312A] arabic-text">السنة</Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={toDateParts.year}
                      onChange={(e) => handleToYearChange(e.target.value)}
                      placeholder="مثال: 2024"
                      className="border-[#C69A72] text-right arabic-text touch-target"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[#13312A] arabic-text">الشهر</Label>
                    <select
                      value={toDateParts.month}
                      onChange={(e) => handleToMonthChange(e.target.value)}
                      className="px-3 py-2 border border-[#C69A72] rounded-md bg-white text-[#13312A] arabic-text touch-target focus:border-[#155446] focus:ring-1 focus:ring-[#155446]"
                    >
                      <option value="">حتى نهاية السنة</option>
                      {monthOptions.map((month) => (
                        <option key={`to-month-${month.value}`} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[#13312A] arabic-text">اليوم</Label>
                    <select
                      value={toDateParts.day}
                      onChange={(e) => handleToDayChange(e.target.value)}
                      disabled={!toDateParts.month}
                      className="px-3 py-2 border border-[#C69A72] rounded-md bg-white text-[#13312A] arabic-text touch-target focus:border-[#155446] focus:ring-1 focus:ring-[#155446] disabled:cursor-not-allowed disabled:bg-[#E2D4BD] disabled:text-[#7A6A58]"
                    >
                      <option value="">حتى نهاية الشهر</option>
                      {dayOptions.map((day) => (
                        <option key={`to-day-${day}`} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#155446] arabic-text">
              ترك حقل الشهر أو اليوم فارغاً يعني طباعة الفترة الكاملة للسنة أو الشهر المحدد. سيتم استخدام تاريخ الاستلام لكل فاتورة لتحديد مدى الطباعة.
            </p>

            {printError && (
              <p className="text-sm text-red-600 arabic-text">{printError}</p>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handlePrintDialogOpenChange(false)}
              className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] touch-target"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPrintRange}
              className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] touch-target"
            >
              بدء الطباعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Dialog - Fallback for when onViewInvoiceDetails is not provided */}
      {selectedInvoice && !onViewInvoiceDetails && (
        <InvoiceDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}
