import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, ArrowRight, Printer, Image as ImageIcon, Pencil } from 'lucide-react';
import { PrintableInvoice, PrintableInvoiceData, formatCurrency, formatDate } from './PrintableInvoice';
import { openPrintInvoiceWindow } from './print/PrintUtils.tsx';
import { useImages } from '@/hooks/useImages';
import { useInvoiceDetails } from '@/hooks/useInvoiceDetails';
import { InvoiceService } from '@/services/invoice.service';

interface InvoiceDetailsPageProps {
  invoiceId: string;
  onBack: () => void;
  onMarkAsPaid?: (invoiceId: string) => void;
}

export function InvoiceDetailsPage({ invoiceId, onBack }: InvoiceDetailsPageProps) {
  const { invoiceDetails, isLoading, error } = useInvoiceDetails(invoiceId);
  const { images, loading: imagesLoading } = useImages('invoice', invoiceId);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6E9CA] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#155446] mx-auto mb-4" />
          <p className="text-[#13312A] arabic-text">جاري تحميل تفاصيل الفاتورة...</p>
        </div>
      </div>
    );
  }

  if (error || !invoiceDetails) {
    return (
      <div className="min-h-screen bg-[#F6E9CA] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-red-800 arabic-text text-lg font-semibold mb-2">حدث خطأ في تحميل تفاصيل الفاتورة</h2>
            <p className="text-red-600 arabic-text mb-4">{error || 'حدث خطأ غير متوقع'}</p>
            <Button onClick={onBack} className="bg-red-600 hover:bg-red-700 text-white">رجوع</Button>
          </div>
        </div>
      </div>
    );
  }

  const invoice = invoiceDetails;
  const hasFabricImageUrl = !!(invoice as any).fabric_image_url;
  const remaining = Math.max((invoice.total || 0) - (invoice.paid_amount || 0), 0);

  const printableInvoice: PrintableInvoiceData = {
    id: invoice.invoice_number,
    customerName: invoice.customer_name,
    phone: invoice.customer_phone || '',
    address: invoice.customer_address || '',
    total: invoice.total,
    paid: invoice.paid_amount,
    receivedDate: invoice.invoice_date,
    deliveryDate: invoice.due_date || invoice.invoice_date,
    paymentDate: (invoice as any).paid_at || undefined,
    notes: invoice.notes || ''
  };

  const handlePrint = () => {
    openPrintInvoiceWindow(`فاتورة ${invoice.invoice_number}`, <PrintableInvoice invoice={printableInvoice} />);
  };

  const triggerChangeImage = () => {
    setImageError(null);
    fileInputRef.current?.click();
  };

  const onChangeImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      setImageError(null);
      const { ImageService } = await import('@/services/image.service');
      const uploaded: any = await ImageService.uploadImage(file, 'fabric-images');
      const newUrl = uploaded?.publicUrl || uploaded?.url || '';
      if (newUrl) {
        await InvoiceService.updateInvoice(invoice.id, { fabric_image_url: newUrl } as any);
        (invoice as any).fabric_image_url = newUrl;
      }
    } catch (err: any) {
      setImageError(err?.message || 'حدث خطأ أثناء تحديث صورة القماش');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F6E9CA] p-6 md:p-8" dir="rtl">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* شريط علوي */}
        <Card className="shadow-md bg-white">
          <CardContent className="p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onBack} className="text-[#6b7280] hover:bg-[#f9fafb] flex items-center gap-2 px-3 py-2">
                <ArrowRight className="h-4 w-4" />
                رجوع
              </Button>
              <h1 className="text-[#1a1a1a] arabic-text">{invoice.customer_name}</h1>
              <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-sm px-3 py-1">{invoice.status}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 bg-white hover:bg-[#f9fafb] border-[#d1d5db]" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* تفاصيل الفاتورة + صورة القماش */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* تفاصيل الفاتورة الأساسية */}
          <Card className="shadow-md bg-white lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#1a1a1a] arabic-text">تفاصيل الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#155446] arabic-text">
              <div>رقم الفاتورة: {invoice.invoice_number}</div>
              <div>حالة الفاتورة: {invoice.status}</div>
              <div>تاريخ الاستلام: {formatDate(invoice.invoice_date)}</div>
              <div>تاريخ التسليم: {formatDate(invoice.due_date || invoice.invoice_date)}</div>
              <div>الإجمالي: {formatCurrency(invoice.total)}</div>
              <div>المدفوع: {formatCurrency(invoice.paid_amount)}</div>
              <div>المتبقي: {formatCurrency(remaining)}</div>
              {(invoice as any).paid_at ? (
                <div className="md:col-span-2">تاريخ الدفع: {formatDate((invoice as any).paid_at)}</div>
              ) : null}
            </CardContent>
          </Card>

          {/* صورة القماش */}
          <Card className="shadow-md bg-white">
            <CardHeader className="pb-4 flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#1a1a1a] arabic-text">
                <ImageIcon className="w-5 h-5" /> صورة القماش
              </CardTitle>
              <Button variant="outline" size="sm" onClick={triggerChangeImage} className="bg-white hover:bg-[#f9fafb]" disabled={isUploadingImage}>
                {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Pencil className="w-4 h-4 ml-1" /> تغيير الصورة</>)}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-[#f9fafb] rounded-lg p-8 border border-[#e5e7eb] flex flex-col items-center justify-center gap-3 min-h-[140px]">
                {imagesLoading && !hasFabricImageUrl ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#9ca3af]" />
                ) : (images && images.length > 0) ? (
                  <div className="w-full h-48 flex items-center justify-center overflow-hidden">
                    <img src={images[0].data_url} alt="صورة القماش" className="max-h-full max-w-full object-contain rounded-lg shadow-md" />
                  </div>
                ) : hasFabricImageUrl ? (
                  <div className="w-full h-48 flex items-center justify-center overflow-hidden">
                    <img src={(invoice as any).fabric_image_url} alt="صورة القماش" className="max-h-full max-w-full object-contain rounded-lg shadow-md" />
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-[#9ca3af]" />
                    <p className="text-[#6b7280] text-center arabic-text">لا توجد صورة للقماش بعد</p>
                  </>
                )}
                {imageError && (
                  <p className="text-red-600 text-xs arabic-text text-center">{imageError}</p>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onChangeImageFile} className="hidden" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تفاصيل الدفع */}
        <Card className="shadow-md bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#1a1a1a] arabic-text">تفاصيل الدفع</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[#155446] arabic-text">
            <div>حالة الدفع: <Badge className="bg-gray-100 text-gray-800 border">{invoice.status}</Badge></div>
            <div>المدفوع: {formatCurrency(invoice.paid_amount)}</div>
            <div>المتبقي: {formatCurrency(remaining)}</div>
            <div>تاريخ الاستلام: {formatDate(invoice.invoice_date)}</div>
            <div>تاريخ التسليم: {formatDate(invoice.due_date || invoice.invoice_date)}</div>
            {(invoice as any).paid_at ? (<div>تاريخ الدفع: {formatDate((invoice as any).paid_at)}</div>) : null}
            {invoice.notes ? <div className="md:col-span-3">ملاحظات: {invoice.notes}</div> : null}
          </CardContent>
        </Card>

        {/* معلومات الزبون، القياسات، الملاحظات، تفاصيل التصميم */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* معلومات الزبون */}
          <Card className="shadow-md bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#1a1a1a] arabic-text">معلومات الزبون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[#155446] arabic-text">
              <div>الاسم: {invoice.customer_name}</div>
              {invoice.customer_phone ? <div>الهاتف: {invoice.customer_phone}</div> : null}
              {invoice.customer_address ? <div>العنوان: {invoice.customer_address}</div> : null}
            </CardContent>
          </Card>

          {/* القياسات */}
          <Card className="shadow-md bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#1a1a1a] arabic-text">القياسات</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-[#155446] arabic-text">
              <div>الطول: {invoice.measurements?.length ?? '—'}</div>
              <div>الكتف: {invoice.measurements?.shoulder ?? '—'}</div>
              <div>الخصر: {invoice.measurements?.waist ?? '—'}</div>
              <div>الصدر: {invoice.measurements?.chest ?? '—'}</div>
            </CardContent>
          </Card>

          {/* الملاحظات */}
          <Card className="shadow-md bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#1a1a1a] arabic-text">الملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.notes ? (
                <p className="text-[#155446] arabic-text leading-7">{invoice.notes}</p>
              ) : (
                <p className="text-[#9ca3af] arabic-text">لا توجد ملاحظات</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* تفاصيل التصميم */}
        <Card className="shadow-md bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#1a1a1a] arabic-text">تفاصيل التصميم</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[#155446] arabic-text">
            <div>نوع القماش: {(invoice.designDetails?.fabricType && invoice.designDetails.fabricType.length) ? invoice.designDetails.fabricType.join('، ') : '—'}</div>
            <div>مصدر القماش: {(invoice.designDetails?.fabricSource && invoice.designDetails.fabricSource.length) ? invoice.designDetails.fabricSource.join('، ') : '—'}</div>
            <div>نوع الياقة: {(invoice.designDetails?.collarType && invoice.designDetails.collarType.length) ? invoice.designDetails.collarType.join('، ') : '—'}</div>
            <div>تصميم الصدر: {(invoice.designDetails?.chestStyle && invoice.designDetails.chestStyle.length) ? invoice.designDetails.chestStyle.join('، ') : '—'}</div>
            <div>نهاية الكم: {(invoice.designDetails?.sleeveEnd && invoice.designDetails.sleeveEnd.length) ? invoice.designDetails.sleeveEnd.join('، ') : '—'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

