import React, { useRef, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Loader2, ArrowRight, Printer, Pencil, QrCode, Wallet, Ruler, Users, Edit } from 'lucide-react';
import { NewInvoiceDialogWithDB } from './NewInvoiceDialogWithDB';
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
  const { invoiceDetails, isLoading, error, refetch } = useInvoiceDetails(invoiceId);
  const { images, loading: imagesLoading } = useImages('invoice', invoiceId);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2B5A4D] mx-auto mb-4" />
          <p className="text-[#2B5A4D] arabic-text">جاري تحميل تفاصيل الفاتورة...</p>
        </div>
      </div>
    );
  }

  if (error || !invoiceDetails) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-red-800 arabic-text text-lg font-semibold mb-2">حدث خطأ في تحميل تفاصيل الفاتورة</h2>
            <p className="text-red-600 arabic-text mb-4">{error || 'تعذر تحميل البيانات'}</p>
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
      const uploaded: any = await ImageService.uploadImage(file, 'invoice', invoice.id);
      const newUrl = uploaded?.publicUrl || uploaded?.data_url || uploaded?.url || '';
      if (newUrl) {
        await InvoiceService.updateInvoice(invoice.id, { fabric_image_url: newUrl } as any);
        (invoice as any).fabric_image_url = newUrl;
      }
    } catch (err: any) {
      setImageError(err?.message || 'تعذر رفع صورة القماش');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-[#F9F9F9] p-4 md:p-6" dir="rtl">
      <div className="max-w-[1800px] mx-auto space-y-4">
        {/* شريط الإجراءات - لا نغيّر الرأس العام */}
        <Card className="shadow-sm bg-white">
          <CardContent className="p-3 md:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onBack} className="text-[#2B5A4D] border-[#C9D6D1] hover:bg-[#E6F0ED] font-medium">
                <ArrowRight className="h-4 w-4 ml-2" /> رجوع
              </Button>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">سجل الفواتير</span>
              <span className="text-gray-300">/</span>
              <span className="text-sm">تفاصيل الفاتورة</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-[#C9D6D1] text-[#2B5A4D] hover:bg-[#E6F0ED] font-medium" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4 ml-2" /> تعديل
              </Button>
              <Button variant="default" size="sm" onClick={handlePrint} className="!bg-[#2B5A4D] !hover:bg-[#234A3F] !text-white font-medium shadow-sm border-0">
                <Printer className="h-4 w-4 ml-2" /> طباعة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* شبكة البطاقات بترتيب جديد مع ترويسات خضراء داكنة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1) بيانات الزبون */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center gap-3 text-white"><div className="bg-white/20 p-2 rounded-lg"><Users className="h-5 w-5 text-white" /></div><h3 className="text-white">بيانات الزبون</h3></div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200"><div className="flex justify-between items-center mb-1"><span className="text-gray-500">الاسم الكامل:</span></div><p className="text-gray-700 text-right">{invoice.customer_name || '—'}</p></div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200"><div className="flex justify-between items-center mb-1"><span className="text-gray-500">رقم الموبايل:</span></div><p className="text-[#2B5A4D] text-right">{invoice.customer_phone || '—'}</p></div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200"><div className="flex justify-between items-center mb-1"><span className="text-gray-500">العنوان:</span></div><p className="text-gray-700 text-right">{invoice.customer_address || '—'}</p></div>
            </div>
          </Card>

          {/* 2) بيانات الدفع */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center gap-3 text-white"><div className="bg-white/20 p-2 rounded-lg"><Wallet className="h-5 w-5 text-white" /></div><h3 className="text-white">بيانات الدفع</h3></div>
            <div className="p-4 flex flex-col space-y-3">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2"><span className="text-gray-500">المبلغ الكلي:</span><span className="text-[#2B5A4D] font-semibold">{formatCurrency(invoice.total)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">المبلغ المدفوع:</span><span className="text-[#2B5A4D]">{formatCurrency(invoice.paid_amount)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">تاريخ الدفع:</span><span className="text-gray-700">{(invoice as any).paid_at ? formatDate((invoice as any).paid_at) : '—'}</span></div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2"><span className="text-gray-500">المتبقي:</span><span className="text-red-600">{formatCurrency(remaining)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">الحالة:</span><span className="text-[#2B5A4D]">{invoice.status}</span></div>
              </div>
            </div>
          </Card>

          {/* 3) الملاحظات */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center gap-3 text-white"><div className="bg-white/20 p-2 rounded-lg"><Edit className="h-5 w-5 text-white" /></div><h3 className="text-white">الملاحظات</h3></div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 text-right whitespace-pre-wrap">{invoice.notes || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center"><span className="text-gray-600">تاريخ التسليم:</span><span className="text-gray-700">{formatDate(invoice.due_date || invoice.invoice_date)}</span></div>
              </div>
            </div>
          </Card>

          {/* 4) تفاصيل التصميم */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center gap-3 text-white"><div className="bg-white/20 p-2 rounded-lg"><Ruler className="h-5 w-5 text-white" /></div><h3 className="text-white">تفاصيل التصميم</h3></div>
            <div className="p-4 space-y-2">
              {[
                { label: 'نوع القماش', value: (invoice.designDetails?.fabricType?.length ? invoice.designDetails.fabricType.join('، ') : '—') },
                { label: 'مصدر القماش', value: (invoice.designDetails?.fabricSource?.length ? invoice.designDetails.fabricSource.join('، ') : '—') },
                { label: 'نوع الياقة', value: (invoice.designDetails?.collarType?.length ? invoice.designDetails.collarType.join('، ') : '—') },
                { label: 'تصميم الصدر', value: (invoice.designDetails?.chestStyle?.length ? invoice.designDetails.chestStyle.join('، ') : '—') },
                { label: 'نهاية الكم', value: (invoice.designDetails?.sleeveEnd?.length ? invoice.designDetails.sleeveEnd.join('، ') : '—') },
              ].map((row, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200"><div className="flex justify-between items-center"><span className="text-gray-600">{row.label}:</span><span className="text-gray-700">{row.value}</span></div></div>
              ))}
            </div>
          </Card>

          {/* 5) القياسات */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center gap-3 text-white"><div className="bg-white/20 p-2 rounded-lg"><Ruler className="h-5 w-5 text-white" /></div><h3 className="text-white">القياسات</h3></div>
            <div className="p-4 grid grid-cols-1 gap-2">
              {[
                { label: 'الطول', value: invoice.measurements?.length },
                { label: 'الكتف', value: invoice.measurements?.shoulder },
                { label: 'الخصر', value: invoice.measurements?.waist },
                { label: 'الصدر', value: invoice.measurements?.chest },
                { label: 'الياخة', value: (invoice.measurements as any)?.collar },
              ].map((row, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{row.label}:</span>
                    <span className="text-gray-700">{row.value || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 6) صورة القماش */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#155446] px-5 py-2 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><QrCode className="h-5 w-5 text-white" /></div>
                <h3 className="text-white">صورة القماش</h3>
              </div>
              <Button variant="outline" size="sm" onClick={triggerChangeImage} className="bg-white/10 border-white/30 text-white hover:bg-white/20" disabled={isUploadingImage}>{isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Pencil className="h-4 w-4 ml-1" /> تغيير</>)}</Button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <div className="w-full max-w-[260px] aspect-square bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center shadow-inner">
                {imagesLoading && !hasFabricImageUrl ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#9ca3af]" />
                ) : (images && images.length > 0) ? (
                  <img src={images[0].data_url} alt="صورة القماش" className="max-h-full max-w-full object-contain rounded" />
                ) : hasFabricImageUrl ? (
                  <img src={(invoice as any).fabric_image_url} alt="صورة القماش" className="max-h-full max-w-full object-contain rounded" />
                ) : (
                  <div className="grid grid-cols-10 grid-rows-10 gap-[2px] w-full h-full p-4" aria-hidden />
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onChangeImageFile} className="hidden" />
              </div>
              {imageError ? (<p className="text-red-600 text-xs arabic-text text-center mt-3">{imageError}</p>) : null}
            </div>
          </Card>
        </div>

        {/* Edit Invoice Dialog - reuse the same dialog with prefilled data */}
        {invoice && (
          <NewInvoiceDialogWithDB
            isOpen={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
            }}
            onInvoiceCreated={async () => {
              setIsEditDialogOpen(false);
              try { await refetch?.(); } catch {}
            }}
            prefillCustomer={{
              id: String((invoice as any).id),
              name: invoice.customer_name,
              phone: invoice.customer_phone,
              address: invoice.customer_address,
              total: invoice.total,
              paidAmount: invoice.paid_amount,
              status: invoice.status,
              deliveryDate: typeof invoice.due_date === 'string' ? (invoice.due_date || '') : new Date(invoice.due_date as any).toISOString().split('T')[0],
              notes: invoice.notes,
              fabricImageUrl: (invoice as any).fabric_image_url || undefined,
              paymentDate: (invoice as any).paid_at ? String((invoice as any).paid_at).split('T')[0] : undefined,
              designDetails: invoice.designDetails ? {
                fabricType: invoice.designDetails.fabricType || [],
                fabricSource: invoice.designDetails.fabricSource || [],
                collarType: invoice.designDetails.collarType || [],
                chestStyle: invoice.designDetails.chestStyle || [],
                sleeveEnd: invoice.designDetails.sleeveEnd || [],
                bunijaType: invoice.designDetails.bunijaType || ''
              } : undefined,
              items: [],
              measurements: invoice.measurements ? {
                length: String(invoice.measurements.length || ''),
                shoulder: String(invoice.measurements.shoulder || ''),
                waist: String(invoice.measurements.waist || ''),
                chest: String(invoice.measurements.chest || ''),
                collar: String((invoice.measurements as any)?.collar || '')
              } : undefined,
            }}
          />
        )}
      </div>
    </div>
  );
}
