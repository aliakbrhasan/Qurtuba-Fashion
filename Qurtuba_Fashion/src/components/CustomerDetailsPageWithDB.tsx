import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Customer } from '../types/customer';
import { formatCurrency } from './PrintableInvoice';
import { databaseService, Invoice } from '../db/database.service';
import { notifications } from '@/services/notifications.service';
import { NewInvoiceDialogWithDB } from './NewInvoiceDialogWithDB';
import { CustomerEditDialog } from './CustomerEditDialog';
import {
  Calendar,
  CreditCard,
  ArrowRight,
  Plus,
  Star,
  Eye,
  FileText,
  Pencil,
  Loader2,
  Users,
  Ruler,
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


const getLabelText = (label: string) => {
  switch (label) {
    case 'O?O_USO_':
      return '????';
    case 'U.U+O?O,U.':
      return '???????';
    case 'U^U?US':
      return '???';
    case 'O?U?O"US':
      return '????';
    default:
      return label || '';
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
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestMeasurements, setLatestMeasurements] = useState<{
    height?: string | number;
    shoulder?: string | number;
    waist?: string | number;
    chest?: string | number;
    collar?: string | number;
  } | null>(null);
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
        // Measurements come from saved customer profile (which is updated from the last created invoice)
        try {
          const newest = [...customerInvoices].sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())[0];
          let m: any = (freshCustomer as any)?.measurements || (customer as any)?.measurements || {};
          if (!m || typeof m !== 'object' || Object.keys(m).length === 0) {
            m = (newest as any)?.customer_measurements || (newest as any)?.measurements || {};
          }
          setLatestMeasurements({
            height: m.length ?? m.height ?? '',
            shoulder: m.shoulder ?? '',
            waist: m.waist ?? '',
            chest: m.chest ?? '',
            collar: (m as any).collar ?? '',
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
            let m: any = (freshCustomer as any)?.measurements || (customer as any)?.measurements || {};
            if (!m || typeof m !== 'object' || Object.keys(m).length === 0) {
              m = (newest as any)?.customer_measurements || (newest as any)?.measurements || {};
            }
            setLatestMeasurements({
              height: Number(m.length || m.height || 0),
              shoulder: Number(m.shoulder || 0),
              waist: Number(m.waist || 0),
              chest: Number(m.chest || 0),
              collar: Number((m as any).collar || 0),
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

  const handleViewInvoice = (invoice: Invoice) => {
    if (onViewInvoiceDetails) {
      onViewInvoiceDetails(invoice);
    }
  };

  // measurements displayed directly in cards, no separate array needed

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
    <div className="w-full bg-[#F9F9F9] p-4 md:p-6" dir="rtl">
      <div className="max-w-[1800px] mx-auto space-y-4">
        {/* شريط الإجراءات */}
        <Card className="shadow-sm bg-white">
          <CardContent className="p-3 md:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onBack} className="text-[#2B5A4D] border-[#C9D6D1]">
                <ArrowRight className="h-4 w-4 ml-2" /> رجوع
              </Button>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">الزبائن</span>
              <span className="text-gray-300">/</span>
              <span className="text-sm">تفاصيل الزبون</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-[#C9D6D1] text-[#2B5A4D]" onClick={() => { setEditCustomer(freshCustomer || customer); setIsEditOpen(true); }}>
                <Pencil className="h-4 w-4 ml-2" /> تعديل
              </Button>
              <Button
                variant="default"
                className="!bg-[#2B5A4D] hover:!bg-[#234A3F] text-white shadow-md"
                size="sm"
                onClick={() => setIsInvoiceDialogOpen(true)}
              >
                <Plus className="h-4 w-4 ml-2" /> فاتورة جديدة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* الشبكة العليا: بيانات الزبون وقياساته (مطابقة لتصميم الفاتورة) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1) بيانات الزبون */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg"><Users className="h-5 w-5 text-white" /></div>
              <h3 className="text-white">بيانات الزبون</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-1"><span className="text-gray-500">الاسم الكامل:</span></div>
                <p className="text-gray-700 text-right">{freshCustomer?.name ?? customer.name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-1"><span className="text-gray-500">رقم الموبايل:</span></div>
                <p className="text-[#2B5A4D] text-right">{freshCustomer?.phone ?? (customer.phone || '—')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-1"><span className="text-gray-500">العنوان:</span></div>
                <p className="text-gray-700 text-right">{freshCustomer?.address ?? (customer.address || '—')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-1"><span className="text-gray-500">آخر طلب:</span></div>
                <p className="text-gray-700 text-right">{lastOrderDate || 'لا يوجد'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getLabelColor((freshCustomer?.label || customer.label || ''))} flex items-center gap-1`}>
                  {getLabelIcon((freshCustomer?.label || customer.label || ''))}
                  {freshCustomer?.label ?? (customer.label || '—')}
                </Badge>
              </div>
            </div>
          </Card>

          {/* 2) قياسات الزبون */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg"><Ruler className="h-5 w-5 text-white" /></div>
              <h3 className="text-white">قياسات الزبون</h3>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2">
              {[ 
                { label: 'الطول', value: (latestMeasurements?.height ?? freshCustomer?.measurements?.height ?? customer.measurements?.height) },
                { label: 'الكتف', value: (latestMeasurements?.shoulder ?? freshCustomer?.measurements?.shoulder ?? customer.measurements?.shoulder) },
                { label: 'الخصر', value: (latestMeasurements?.waist ?? freshCustomer?.measurements?.waist ?? customer.measurements?.waist) },
                { label: 'الصدر', value: (latestMeasurements?.chest ?? freshCustomer?.measurements?.chest ?? customer.measurements?.chest) },
                { label: 'الياخة', value: ((latestMeasurements as any)?.collar ?? (freshCustomer as any)?.measurements?.collar ?? (customer as any)?.measurements?.collar) }
              ].map((row, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{row.label}:</span>
                    <span className="text-gray-700">{row.value ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 3) ملخص */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg"><CreditCard className="h-5 w-5 text-white" /></div>
              <h3 className="text-white">ملخص</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center"><span className="text-gray-500">إجمالي المصروف:</span><span className="text-[#2B5A4D]">{formatCurrency(totalSpent)}</span></div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center"><span className="text-gray-500">عدد الفواتير:</span><span className="text-[#2B5A4D]">{invoices.length}</span></div>
              </div>
              {customer.notes && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center"><span className="text-gray-600">ملاحظات:</span><span className="text-gray-700 text-right">{customer.notes}</span></div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* سجل الفواتير */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-[#155446] px-5 py-2 text-white">
            <h3 className="text-white">سجل الفواتير</h3>
          </div>
          <CardContent className="space-y-4">
            {sortedInvoices.length > 0 ? (
              sortedInvoices.map((invoice) => {
                const remaining = Math.max(invoice.total - (invoice.paid_amount || 0), 0);
                return (
                  <div
                    key={invoice.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
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

        <NewInvoiceDialogWithDB
          isOpen={isInvoiceDialogOpen}
          onOpenChange={setIsInvoiceDialogOpen}
          lockCustomerFields
          prefillCustomer={{
            name: (freshCustomer?.name || customer.name) as any,
            phone: (freshCustomer?.phone || customer.phone) as any,
            address: (freshCustomer?.address || customer.address) as any,
            measurements: {
              length: String(((freshCustomer as any)?.measurements?.height ?? customer.measurements?.height ?? '')),
              shoulder: String(((freshCustomer as any)?.measurements?.shoulder ?? customer.measurements?.shoulder ?? '')),
              waist: String(((freshCustomer as any)?.measurements?.waist ?? customer.measurements?.waist ?? '')),
              chest: String(((freshCustomer as any)?.measurements?.chest ?? customer.measurements?.chest ?? '')),
              collar: String(((freshCustomer as any)?.measurements?.collar ?? (customer as any)?.measurements?.collar ?? '')),
            }
          }}
        />

        <CustomerEditDialog
          open={isEditOpen}
          customer={editCustomer}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setEditCustomer(null);
            }
          }}
          onUpdated={(updated) => {
            setFreshCustomer(updated as Customer);
            setEditCustomer(updated as Customer);
            setLatestMeasurements({
              height: updated.measurements?.height ?? 0,
              shoulder: updated.measurements?.shoulder ?? 0,
              waist: updated.measurements?.waist ?? 0,
              chest: updated.measurements?.chest ?? 0,
              collar: (updated.measurements as any)?.collar ?? 0,
            });
          }}
        />
      </div>
    </div>
  );
}






