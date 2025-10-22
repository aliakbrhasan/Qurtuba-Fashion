//
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Clock, Receipt, Handshake } from 'lucide-react';
import type { Invoice } from '@/db/database.service';
import { formatCurrency } from '../PrintableInvoice';
import { formatArabicDate } from '@/utils/arabicNumbers';

interface RecentActivitiesProps {
  recentInvoices: Invoice[];
  recentCustomers: any[];
  upcomingDeliveries: Invoice[];
}

export function RecentActivities({ 
  recentInvoices, 
  recentCustomers: _recentCustomers,
  upcomingDeliveries 
}: RecentActivitiesProps) {
  const handleMarkDelivered = async (invoiceId: string) => {
    try {
      const { InvoiceService } = await import('@/services/invoice.service');
      await InvoiceService.markAsDelivered(invoiceId);
    } catch (err) {
      console.error('Failed to mark delivered:', err);
      alert('حدث خطأ أثناء تحديث تاريخ التسليم');
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return formatArabicDate(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مدفوع':
        return 'bg-green-100 text-green-800';
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800';
      case 'جزئي':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-100 text-red-800';
    if (diffDays <= 1) return 'bg-orange-100 text-orange-800';
    if (diffDays <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Invoices */}
      <Card className="bg-white border-[#C69A72]">
        <CardHeader>
          <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            الفواتير الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72] hover:bg-[#F0E4C4] transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-[#13312A] arabic-text font-medium">
                      {invoice.customer_name}
                    </p>
                    <p className="text-sm text-[#155446] arabic-text">
                      {invoice.invoice_number} - {formatCurrency(invoice.total)}
                    </p>
                    <p className="text-xs text-[#155446] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(invoice.created_at)}
                    </p>
                  </div>
                  <div className="text-left">
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#155446] arabic-text text-center py-4">
                لا توجد فواتير حديثة
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deliveries */}
      <Card className="bg-white border-[#C69A72]">
        <CardHeader>
          <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            التسليمات القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingDeliveries.length > 0 ? (
              upcomingDeliveries.map((invoice) => {
                const dueDate = new Date(invoice.due_date!);
                const now = new Date();
                const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72] hover:bg-[#F0E4C4] transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-[#13312A] arabic-text font-medium">
                        {invoice.customer_name}
                      </p>
                      <p className="text-sm text-[#155446] arabic-text">
                        {invoice.invoice_number} - {formatCurrency(invoice.total)}
                      </p>
                      <p className="text-xs text-[#155446] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatArabicDate(dueDate)}
                      </p>
                    </div>
                    <div className="text-left flex items-center gap-2">
                      <Badge className={getPriorityColor(invoice.due_date!)}>
                        {diffDays === 0 ? 'اليوم' : 
                         diffDays === 1 ? 'غداً' : 
                         diffDays < 0 ? 'متأخر' : 
                         `خلال ${diffDays} أيام`}
                      </Badge>
                      {diffDays > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkDelivered(invoice.id)}
                          className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
                          aria-label={`تم التسليم للفاتورة ${invoice.invoice_number}`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Handshake className="w-4 h-4" />
                            تم التسليم
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[#155446] arabic-text text-center py-4">
                لا توجد تسليمات قادمة
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



