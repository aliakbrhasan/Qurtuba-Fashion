import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { DateInput } from './ui/date-input';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard } from './dashboard/StatCard';
import { DashboardGrids } from './dashboard/ResponsiveGrid';
import { formatArabicNumber } from '@/utils/arabicNumbers';

export function FinancialPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { stats, isLoading, error, refetch } = useDashboardStats({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const exportCsv = () => {
    const rows = [
      ['رقم الفاتورة','العميل','الهاتف','الإجمالي','المدفوع','الحالة','تاريخ الإنشاء','تاريخ الاستحقاق'],
      ...stats.filteredInvoices.map(inv => [
        inv.invoice_number,
        inv.customer_name,
        inv.customer_phone || '',
        String(inv.total ?? 0),
        String(inv.paid_amount ?? 0),
        inv.status,
        inv.created_at,
        inv.due_date || ''
      ])
    ];

    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 arabic-text mb-2">
              خطأ في تحميل البيانات المالية
            </h3>
            <p className="text-red-600 arabic-text mb-4">
              {error}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-3">
        <div className="w-full max-w-xs">
          <label className="block text-sm text-[#13312A] arabic-text mb-1">تاريخ البداية</label>
          <DateInput
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white border-[#C69A72]"
          />
        </div>
        <div className="w-full max-w-xs">
          <label className="block text-sm text-[#13312A] arabic-text mb-1">تاريخ النهاية</label>
          <DateInput
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white border-[#C69A72]"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} className="bg-[#155446] hover:bg-[#13312A] text-white">
            <RefreshCw className="w-4 h-4 ml-2" /> تحديث
          </Button>
          <Button onClick={exportCsv} variant="outline" className="border-[#13312A] text-[#13312A]">
            تصدير CSV
          </Button>
        </div>
      </div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl text-[#13312A] arabic-text mb-2">
          التقارير المالية والإحصائيات
        </h1>
        <p className="text-[#155446] arabic-text">
          نظرة شاملة على الأداء المالي - {new Date().toLocaleDateString('en-US')}
        </p>
      </div>

      {/* Main Statistics Cards */}
      <div className="space-y-6">
        <h2 className="text-xl text-[#13312A] arabic-text font-semibold">الإحصائيات الرئيسية</h2>
        <DashboardGrids.Stats>
          <StatCard
            title="فواتير اليوم"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : formatArabicNumber(stats.todayInvoices)}
            icon={TrendingUp}
            color="bg-[#155446]"
            subtitle="فواتير جديدة اليوم"
          />
          <StatCard
            title="إجمالي الإيرادات"
            value={isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(stats.totalRevenue)}
            icon={TrendingUp}
            color="bg-[#155446]"
            subtitle="جميع المدفوعات"
          />
          <StatCard
            title="إجمالي الزبائن"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : formatArabicNumber(stats.totalCustomers)}
            icon={TrendingUp}
            color="bg-[#C69A72]"
            subtitle="زبائن مسجلون"
          />
          <StatCard
            title="إجمالي الفواتير"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : formatArabicNumber(stats.totalInvoices)}
            icon={TrendingUp}
            color="bg-[#155446]"
            subtitle="جميع الفواتير"
          />
        </DashboardGrids.Stats>
      </div>

      {/* Revenue Breakdown */}
      <div className="space-y-6">
        <h2 className="text-xl text-[#13312A] arabic-text font-semibold">تحليل الإيرادات</h2>
        <DashboardGrids.Revenue>
          <StatCard
            title="إيرادات اليوم"
            value={isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(stats.dailyRevenue)}
            icon={TrendingUp}
            color="bg-green-600"
            subtitle="إيرادات اليوم"
          />
          <StatCard
            title="إيرادات الأسبوع"
            value={isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(stats.weeklyRevenue)}
            icon={TrendingUp}
            color="bg-blue-600"
            subtitle="آخر 7 أيام"
          />
          <StatCard
            title="إيرادات الشهر"
            value={isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(stats.monthlyRevenue)}
            icon={TrendingUp}
            color="bg-purple-600"
            subtitle="آخر 30 يوم"
          />
        </DashboardGrids.Revenue>
      </div>

      {/* Invoice Status Breakdown */}
      <div className="space-y-6">
        <h2 className="text-xl text-[#13312A] arabic-text font-semibold">حالة الفواتير</h2>
        <DashboardGrids.Status>
          <StatCard
            title="فواتير معلقة"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : formatArabicNumber(stats.pendingInvoices)}
            icon={TrendingUp}
            color="bg-yellow-600"
            subtitle="في انتظار الدفع"
          />
          <StatCard
            title="فواتير مدفوعة"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : formatArabicNumber(stats.paidInvoices)}
            icon={TrendingUp}
            color="bg-green-600"
            subtitle="مدفوعة بالكامل"
          />
          <StatCard
            title="فواتير جزئية"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : formatArabicNumber(stats.partialInvoices)}
            icon={TrendingUp}
            color="bg-blue-600"
            subtitle="مدفوعة جزئياً"
          />
        </DashboardGrids.Status>
      </div>

      {/* Additional Financial Metrics */}
      <div className="space-y-6">
        <h2 className="text-xl text-[#13312A] arabic-text font-semibold">مؤشرات إضافية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="متوسط قيمة الفاتورة"
            value={isLoading ? <Skeleton className="h-8 w-20" /> : 
              stats.totalInvoices > 0 ? formatCurrency(stats.totalRevenue / stats.totalInvoices) : '0 د.ع.'}
            icon={TrendingUp}
            color="bg-indigo-600"
            subtitle="متوسط المبيعات"
          />
          <StatCard
            title="معدل الدفع"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : 
              stats.totalInvoices > 0 ? `${Math.round((stats.paidInvoices / stats.totalInvoices) * 100)}%` : '0%'}
            icon={TrendingUp}
            color="bg-emerald-600"
            subtitle="نسبة الفواتير المدفوعة"
          />
          <StatCard
            title="إجمالي الطلبات"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : formatArabicNumber(stats.totalOrders)}
            icon={TrendingUp}
            color="bg-orange-600"
            subtitle="جميع الطلبات"
          />
        </div>
      </div>
    </div>
  );
}
