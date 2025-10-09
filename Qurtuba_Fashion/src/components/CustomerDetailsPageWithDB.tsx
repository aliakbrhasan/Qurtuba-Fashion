import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Customer } from '../types/customer';
import { databaseService, Invoice } from '../db/database.service';
import {
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight,
  ClipboardList,
  Plus,
  Star,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';

interface CustomerDetailsPageWithDBProps {
  customer: Customer;
  onBack: () => void;
  onViewInvoiceDetails?: (invoice: Invoice) => void;
}

const getLabelColor = (label: string) => {
  switch (label) {
    case 'جديد':
      return 'bg-blue-100 text-blue-800';
    case 'منتظم':
      return 'bg-green-100 text-green-800';
    case 'وفي':
      return 'bg-purple-100 text-purple-800';
    case 'ذهبي':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getLabelIcon = (label: string) => {
  switch (label) {
    case 'ذهبي':
      return <Star className="w-3 h-3" />;
    default:
      return null;
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'جديد':
      return 'bg-blue-100 text-blue-800';
    case 'قيد التنفيذ':
      return 'bg-yellow-100 text-yellow-800';
    case 'جاهز':
      return 'bg-green-100 text-green-800';
    case 'مسلم':
      return 'bg-gray-100 text-gray-800';
    case 'مدفوع':
      return 'bg-green-100 text-green-800';
    case 'غير مدفوع':
      return 'bg-red-100 text-red-800';
    case 'جزئي':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function CustomerDetailsPageWithDB({ 
  customer, 
  onBack, 
  onViewInvoiceDetails 
}: CustomerDetailsPageWithDBProps) {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Load customer orders and invoices
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        
        // Load orders for this customer (for future use)
        await databaseService.getOrdersByCustomer(customer.id.toString());
        
        // Load all invoices and filter by customer
        const allInvoices = await databaseService.getInvoices();
        const customerInvoices = allInvoices.filter(invoice => 
          invoice.customer_id === customer.id.toString() || 
          invoice.customer_name === customer.name
        );
        setInvoices(customerInvoices);
        
      } catch (error) {
        console.error('Error loading customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [customer.id, customer.name]);

  const sortedInvoices = useMemo(
    () =>
      [...invoices].sort(
        (a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
      ),
    [invoices]
  );

  const handleNewOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingOrder(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const newOrder = {
        customer_name: customer.name,
        total: parseFloat(formData.get('total') as string) || 0,
      };
      
      await databaseService.createOrder(newOrder);
      
      // Reload orders (for future use)
      await databaseService.getOrdersByCustomer(customer.id.toString());
      
      setIsNewOrderOpen(false);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    if (onViewInvoiceDetails) {
      onViewInvoiceDetails(invoice);
    }
  };

  const measurementItems = [
    { label: 'الطول', value: `${customer.measurements?.height || 0} سم` },
    { label: 'الكتف', value: `${customer.measurements?.shoulder || 0} سم` },
    { label: 'الخصر', value: `${customer.measurements?.waist || 0} سم` },
    { label: 'الصدر', value: `${customer.measurements?.chest || 0} سم` },
  ];

  const totalSpent = invoices.reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0);
  const lastOrderDate = sortedInvoices.length > 0 ? sortedInvoices[0].invoice_date : customer.lastOrder;

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#155446]" />
          <p className="text-[#155446] arabic-text">جاري تحميل بيانات الزبون...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] touch-target"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              <span className="arabic-text">عودة إلى الزبائن</span>
            </Button>
            <h1 className="text-2xl text-[#13312A] arabic-text">تفاصيل الزبون</h1>
          </div>
          <Button
            onClick={() => setIsNewOrderOpen(true)}
            className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] touch-target"
          >
            <Plus className="w-4 h-4 ml-2" />
            <span className="arabic-text">إضافة طلب جديد</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg text-[#13312A] arabic-text">{customer.name}</span>
          <Badge className={`${getLabelColor(customer.label || '')} flex items-center gap-1`}>
            {getLabelIcon(customer.label || '')}
            {customer.label || 'غير محدد'}
          </Badge>
        </div>
      </div>

      <Card className="bg-white border-[#C69A72]">
        <CardHeader>
          <CardTitle className="text-[#13312A] arabic-text text-lg">البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#155446]">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{customer.phone || 'غير محدد'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="arabic-text">آخر طلب: {lastOrderDate || 'لا يوجد'}</span>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <MapPin className="w-4 h-4" />
              <span className="arabic-text">{customer.address || 'غير محدد'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="arabic-text">إجمالي المصروف: {totalSpent.toLocaleString()} دينار عراقي</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="arabic-text">عدد الفواتير: {invoices.length}</span>
            </div>
          </div>
          {customer.notes && (
            <div className="bg-[#FDF9F1] border border-dashed border-[#C69A72] rounded-lg p-4 text-sm text-[#13312A] arabic-text">
              <p className="font-medium mb-2">ملاحظات خاصة</p>
              <p>{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {customer.measurements && (
        <Card className="bg-white border-[#C69A72]">
          <CardHeader>
            <CardTitle className="text-[#13312A] arabic-text text-lg">قياسات الزبون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {measurementItems.map((item) => (
                <div
                  key={item.label}
                  className="bg-[#FDF9F1] border border-[#C69A72] rounded-lg p-4 text-center"
                >
                  <p className="text-sm text-[#155446] arabic-text">{item.label}</p>
                  <p className="text-xl text-[#13312A]">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-[#C69A72]">
        <CardHeader>
          <CardTitle className="text-[#13312A] arabic-text text-lg">سجل الفواتير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedInvoices.length > 0 ? (
            sortedInvoices.map((invoice) => {
              const remaining = invoice.total - (invoice.paid_amount || 0);
              return (
                <div
                  key={invoice.id}
                  className="bg-[#FDF9F1] border border-[#C69A72] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewInvoice(invoice)}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg text-[#13312A] arabic-text">فاتورة #{invoice.invoice_number}</span>
                        <Badge className={getStatusBadgeColor(invoice.status)}>{invoice.status}</Badge>
                      </div>
                      <span className="text-sm text-[#155446] arabic-text">رقم الفاتورة: {invoice.id}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-[#155446] arabic-text">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>تاريخ الفاتورة: {new Date(invoice.invoice_date).toLocaleDateString('ar-IQ')}</span>
                      </div>
                      {invoice.due_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>تاريخ الاستحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-IQ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>المبلغ الكلي: {invoice.total.toLocaleString()} د.ع</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>المتبقي: {remaining.toLocaleString()} د.ع</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleViewInvoice(invoice);
                        }}
                        className="border-[#155446] text-[#155446] hover:bg-[#155446] hover:text-white"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        <span className="arabic-text">عرض الفاتورة</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-[#155446] arabic-text">
                لا توجد فواتير مسجلة لهذا الزبون بعد.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text">
              طلب جديد للزبون {customer.name}
            </DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">
              قم بإنشاء طلب جديد للزبون
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleNewOrderSubmit}>
            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">بيانات الزبون</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">اسم الزبون</Label>
                  <Input
                    defaultValue={customer.name}
                    disabled
                    className="bg-gray-100 border-[#C69A72] text-right"
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">رقم الهاتف</Label>
                  <Input
                    defaultValue={customer.phone || ''}
                    disabled
                    className="bg-gray-100 border-[#C69A72] text-right"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#13312A] arabic-text">العنوان</Label>
                  <Input
                    defaultValue={customer.address || ''}
                    disabled
                    className="bg-gray-100 border-[#C69A72] text-right"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">تفاصيل الطلب</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">نوع التصميم</Label>
                  <Select>
                    <SelectTrigger className="bg-white border-[#C69A72] text-right">
                      <SelectValue placeholder="اختر نوع التصميم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kandora">دشداشة</SelectItem>
                      <SelectItem value="suit">بدلة رسمية</SelectItem>
                      <SelectItem value="abaya">عباءة</SelectItem>
                      <SelectItem value="shirt">قميص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">نوع القماش</Label>
                  <Select>
                    <SelectTrigger className="bg-white border-[#C69A72] text-right">
                      <SelectValue placeholder="اختر نوع القماش" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cotton">قطن</SelectItem>
                      <SelectItem value="silk">حرير</SelectItem>
                      <SelectItem value="linen">كتان</SelectItem>
                      <SelectItem value="wool">صوف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">التكلفة المتوقعة</Label>
                  <Input 
                    type="number" 
                    name="total"
                    placeholder="0" 
                    className="bg-white border-[#C69A72] text-right" 
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#13312A] arabic-text">ملاحظات إضافية</Label>
                  <Textarea
                    rows={3}
                    placeholder="اكتب أي تفاصيل إضافية حول الطلب"
                    className="bg-white border-[#C69A72] text-right"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewOrderOpen(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
                disabled={isCreatingOrder}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ الطلب'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
