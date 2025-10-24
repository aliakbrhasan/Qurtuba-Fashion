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
import { formatCurrency } from './PrintableInvoice';
import { databaseService, Invoice } from '../db/database.service';
import { notifications } from '@/services/notifications.service';
import { NewInvoiceDialogWithDB } from './NewInvoiceDialogWithDB';
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
  Pencil,
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
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<Customer | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [latestMeasurements, setLatestMeasurements] = useState<{ height?: number; shoulder?: number; waist?: number; chest?: number } | null>(null);
  // Fresh snapshot of customer to reflect edits
  const [freshCustomer, setFreshCustomer] = useState<Customer | null>(null);

  // Load customer orders and invoices
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        // Fetch latest customer snapshot
        try {
          const allCustomers = await databaseService.getCustomers();
          const found = allCustomers.find((c: any) => String((c as any).id) === String(customer.id));
          setFreshCustomer((found as any) || null);
        } catch (e) {
          console.warn("Failed to refresh customer snapshot:", e);
          setFreshCustomer(null);
        }
        
        // Load orders for this customer (for future use)
        await databaseService.getOrdersByCustomer(customer.id.toString());
        
        // Load all invoices and filter by customer
        const allInvoices = await databaseService.getInvoices();
        const customerInvoices = allInvoices.filter(invoice => 
          invoice.customer_id === customer.id.toString() || 
          invoice.customer_name === customer.name
        );
        setInvoices(customerInvoices);
        // Capture latest measurements from the newest invoice, fallback to saved customer
        try {
          const newest = [...customerInvoices].sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())[0];
          const m: any = (newest as any)?.measurements || (freshCustomer as any)?.measurements || (customer as any)?.measurements || {};
          setLatestMeasurements({
            height: Number(m.length || m.height || 0),
            shoulder: Number(m.shoulder || 0),
            waist: Number(m.waist || 0),
            chest: Number(m.chest || 0),
          });
        } catch {}
        
      } catch (error) {
        console.error('Error loading customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [customer.id, customer.name]);

  // Refresh dynamically when invoices change anywhere in the app
  useEffect(() => {
    const listener = async (n: any) => {
      try {
        if (n?.target?.page === 'invoices') {
          try {
            const allCustomers = await databaseService.getCustomers();
            const found = allCustomers.find((c: any) => String((c as any).id) === String(customer.id));
            setFreshCustomer((found as any) || null);
          } catch {}
          const allInvoices = await databaseService.getInvoices();
          const customerInvoices = allInvoices.filter(inv => inv.customer_id === String(customer.id) || inv.customer_name === customer.name);
          setInvoices(customerInvoices);
          try {
            const newest = [...customerInvoices].sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())[0];
            const m: any = (newest as any)?.measurements || (freshCustomer as any)?.measurements || (customer as any)?.measurements || {};
            setLatestMeasurements({
              height: Number(m.length || m.height || 0),
              shoulder: Number(m.shoulder || 0),
              waist: Number(m.waist || 0),
              chest: Number(m.chest || 0),
            });
          } catch {}
        }
      } catch {}
    };
    notifications.on(listener);
    return () => notifications.off(listener);
  }, [customer.id, customer.name, freshCustomer]);

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
    { label: 'الطول', value: `${(latestMeasurements?.height ?? customer.measurements?.height ?? 0)} سم` },
    { label: 'الكتف', value: `${(latestMeasurements?.shoulder ?? customer.measurements?.shoulder ?? 0)} سم` },
    { label: 'الردن', value: `${(latestMeasurements?.waist ?? customer.measurements?.waist ?? 0)} سم` },
    { label: 'الصدر', value: `${(latestMeasurements?.chest ?? customer.measurements?.chest ?? 0)} سم` },
    { label: 'الياقة', value: `${((latestMeasurements as any)?.collar ?? (customer.measurements as any)?.collar ?? 0)} سم` },
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
    <div className="mx-auto p-3 space-y-4 max-w-6xl">
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
            onClick={() => setIsInvoiceDialogOpen(true)}
            className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] touch-target"
          >
            <Plus className="w-4 h-4 ml-2" />
            <span className="arabic-text">إضافة طلب جديد</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg text-[#13312A] arabic-text">{freshCustomer?.name ?? customer.name}</span>
          <Badge className={`${getLabelColor((freshCustomer?.label || customer.label || ""))} flex items-center gap-1` }>
            {getLabelIcon((freshCustomer?.label || customer.label || ""))}
            {freshCustomer?.label ?? (customer.label || 'O?USO? U.O-O_O_')}
          </Badge>
          <Button size="sm" variant="outline" className="border-[#C69A72] text-[#13312A]" onClick={() => { setEditDraft(freshCustomer || customer); setIsEditOpen(true); }}>
            <Pencil className="w-3 h-3 ml-1" />
            <span className="arabic-text">تعديل</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">

      <Card className="bg-white border-[#C69A72] lg:col-span-2">
        <CardHeader className="py-2">
          <CardTitle className="text-[#13312A] arabic-text text-lg">البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm text-[#155446]">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{freshCustomer?.phone ?? (customer.phone || 'O?USO? U.O-O_O_')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="arabic-text">آخر طلب: {lastOrderDate || 'لا يوجد'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="arabic-text">{freshCustomer?.address ?? (customer.address || 'O?USO? U.O-O_O_')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="arabic-text">إجمالي المصروف: {formatCurrency(totalSpent)}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="arabic-text">عدد الفواتير: {invoices.length}</span>
            </div>
          </div>
          {customer.notes && (
            <div className="bg-[#FDF9F1] border border-dashed border-[#C69A72] rounded-lg p-2 text-xs md:text-sm text-[#13312A] arabic-text">
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
            <div className="grid grid-cols-3 gap-4">
              {measurementItems.map((item) => (
                <div
                  key={item.label}
                  className="bg-[#FDF9F1] border border-[#C69A72] rounded-lg p-4 text-center"
                >
                  <p className="text-sm text-[#155446] arabic-text">{item.label === 'O\u0015U,USO\u0015U,Oc' ? 'الياخة' : item.label}</p>
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
              const remaining = Math.max(invoice.total - (invoice.paid_amount || 0), 0);
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
                        <span>تاريخ الفاتورة: {new Date(invoice.invoice_date).toLocaleDateString('en-US')}</span>
                      </div>
                      {invoice.due_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>تاريخ الاستحقاق: {new Date(invoice.due_date).toLocaleDateString('en-US')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>المبلغ الكلي: {formatCurrency(invoice.total)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>المتبقي: {formatCurrency(remaining)}</span>
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
        <DialogContent className="max-w-6xl min-w-[800px] max-h-[90vh] overflow-y-auto bg-[#F6E9CA] border-[#C69A72]">
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
                    defaultValue={freshCustomer?.phone ?? (customer.phone || '')}
                    disabled
                    className="bg-gray-100 border-[#C69A72] text-right"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#13312A] arabic-text">العنوان</Label>
                  <Input
                    defaultValue={freshCustomer?.address ?? (customer.address || '')}
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
              <CardContent className="space-y-4">
                {/* Measurements prefill from latestMeasurements */}
                {/* الصف الأول: الطول، الكتف، الردن - 3 أعمدة */}
                <div className="grid grid-cols-3 gap-4 min-w-0">
                  <div className="min-w-[120px]">
                    <Label className="text-[#13312A] arabic-text">الطول (سم)</Label>
                    <Input
                      type="number"
                      defaultValue={latestMeasurements?.height ?? customer.measurements?.height ?? 0}
                      className="bg-white border-[#C69A72] text-right min-w-0"
                    />
                  </div>
                  <div className="min-w-[120px]">
                    <Label className="text-[#13312A] arabic-text">الكتف (سم)</Label>
                    <Input
                      type="number"
                      defaultValue={latestMeasurements?.shoulder ?? customer.measurements?.shoulder ?? 0}
                      className="bg-white border-[#C69A72] text-right min-w-0"
                    />
                  </div>
                  <div className="min-w-[120px]">
                    <Label className="text-[#13312A] arabic-text">الردن (سم)</Label>
                    <Input
                      type="number"
                      defaultValue={latestMeasurements?.waist ?? customer.measurements?.waist ?? 0}
                      className="bg-white border-[#C69A72] text-right min-w-0"
                    />
                  </div>
                </div>
                {/* الصف الثاني: الصدر، الياقة - 2 أعمدة */}
                <div className="grid grid-cols-2 gap-4 min-w-0">
                  <div className="min-w-[120px]">
                    <Label className="text-[#13312A] arabic-text">الصدر (سم)</Label>
                    <Input
                      type="number"
                      defaultValue={latestMeasurements?.chest ?? customer.measurements?.chest ?? 0}
                      className="bg-white border-[#C69A72] text-right min-w-0"
                    />
                  </div>
                  <div className="min-w-[120px]">
                    <Label className="text-[#13312A] arabic-text">الياقة (سم)</Label>
                    <Input
                      type="number"
                      defaultValue={customer.measurements?.collar ?? 0}
                      className="bg-white border-[#C69A72] text-right min-w-0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">نوع التصميم</Label>
                  <Select>
                    <SelectTrigger className="bg-white border-[#C69A72] text-right" aria-label="تصنيف الزبون" title="تصنيف الزبون">
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
                    <SelectTrigger className="bg-white border-[#C69A72] text-right" aria-label="تصنيف الزبون" title="تصنيف الزبون">
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
      <NewInvoiceDialogWithDB
        isOpen={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
        lockCustomerFields
        prefillCustomer={{
          name: (freshCustomer?.name || customer.name) as any,
          phone: (freshCustomer?.phone || customer.phone) as any,
          address: (freshCustomer?.address || customer.address) as any,
          measurements: {
            length: Number((latestMeasurements?.height ?? customer.measurements?.height ?? 0) as any),
            shoulder: Number((latestMeasurements?.shoulder ?? customer.measurements?.shoulder ?? 0) as any),
            waist: Number((latestMeasurements?.waist ?? customer.measurements?.waist ?? 0) as any),
            chest: Number((latestMeasurements?.chest ?? customer.measurements?.chest ?? 0) as any),
            collar: Number(((freshCustomer as any)?.measurements?.collar ?? (customer as any)?.measurements?.collar ?? 0) as any)
          }
        }}
      />

      {/* Simple Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditDraft(null); }}>
        <DialogContent className="max-w-lg bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text">تعديل بيانات الزبون</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">قم بتحديث الاسم والهاتف والعنوان</DialogDescription>
          </DialogHeader>
          {editDraft && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSavingEdit(true);
                  const updated = await databaseService.updateCustomer(String(editDraft.id), {
                    name: editDraft.name,
                    phone: editDraft.phone,
                    address: editDraft.address,
                  });
                  try {
                    const { queryClient } = await import('@/app/queryClient');
                    queryClient.invalidateQueries({ queryKey: ['customers'] });
                    queryClient.invalidateQueries({ queryKey: ['invoices'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                  } catch {}
                  setFreshCustomer(updated as any);
                  setIsEditOpen(false);
                } catch (err) {
                  console.error('Error updating customer:', err);
                } finally {
                  setIsSavingEdit(false);
                }
              }}
            >
              <div>
                <Label className="text-[#13312A] arabic-text">اسم الزبون</Label>
                <Input className="bg-white border-[#C69A72] text-right" value={editDraft.name} onChange={(e) => setEditDraft({ ...(editDraft as Customer), name: e.target.value })} required />
              </div>
              <div>
                <Label className="text-[#13312A] arabic-text">رقم الهاتف</Label>
                <Input className="bg-white border-[#C69A72] text-right" value={editDraft.phone} onChange={(e) => setEditDraft({ ...(editDraft as Customer), phone: e.target.value })} required />
              </div>
              <div>
                <Label className="text-[#13312A] arabic-text">العنوان</Label>
                <Input className="bg-white border-[#C69A72] text-right" value={editDraft.address} onChange={(e) => setEditDraft({ ...(editDraft as Customer), address: e.target.value })} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" className="border-[#C69A72] text-[#13312A]" onClick={() => setIsEditOpen(false)} disabled={isSavingEdit}>إلغاء</Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]" disabled={isSavingEdit}>{isSavingEdit ? 'جاري الحفظ...' : 'حفظ'}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}





