import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Printer, 
  Share2, 
  Download, 
  User, 
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  CreditCard,
  Wallet,
  FileText,
  Image as ImageIcon,
  Pencil
} from 'lucide-react';
import { formatCurrency, formatDate, PrintableInvoiceData, PrintableInvoice } from './PrintableInvoice';
import { openPrintWindow } from './print/PrintUtils';
import { useImages } from '@/hooks/useImages';
import { useInvoiceDetails } from '@/hooks/useInvoiceDetails';
import { useRef, useState } from 'react';
import { ImageService } from '@/services/image.service';
import { InvoiceService } from '@/services/invoice.service';

interface InvoiceDetailsPageProps {
  invoiceId: string;
  onBack: () => void;
  onMarkAsPaid?: (invoiceId: string) => void;
}

export function InvoiceDetailsPage({ invoiceId, onBack, onMarkAsPaid }: InvoiceDetailsPageProps) {
  const { invoiceDetails, isLoading, error } = useInvoiceDetails(invoiceId);
  // Ensure hooks order is stable across renders
  const { images, loading: imagesLoading } = useImages('invoice', invoiceId);
  // Hooks must be declared before any early returns
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // حالة التحميل
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

  // حالة الخطأ
  if (error || !invoiceDetails) {
    return (
      <div className="min-h-screen bg-[#F6E9CA] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-red-800 arabic-text text-lg font-semibold mb-2">خطأ في تحميل الفاتورة</h2>
            <p className="text-red-600 arabic-text mb-4">{error || 'الفاتورة غير موجودة'}</p>
            <Button onClick={onBack} className="bg-red-600 hover:bg-red-700 text-white">
              العودة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const invoice = invoiceDetails;
  const remaining = Math.max(invoice.total - invoice.paid_amount, 0);
  const isPaid = invoice.status === 'مدفوع';
  const isPartiallyPaid = invoice.status === 'جزئي';
  const canMarkAsPaid = !isPaid && (invoice.status === 'معلق' || isPartiallyPaid);

  // تحويل البيانات للطباعة
  const printableInvoice: PrintableInvoiceData = {
    id: invoice.invoice_number,
    customerName: invoice.customer_name,
    phone: invoice.customer_phone || '',
    address: invoice.customer_address || '',
    total: invoice.total,
    paid: invoice.paid_amount,
    receivedDate: invoice.invoice_date,
    deliveryDate: invoice.due_date || invoice.invoice_date,
    notes: invoice.notes || ''
  };

  const handlePrint = () => {
    openPrintWindow(`فاتورة ${invoice.invoice_number}`, <PrintableInvoice invoice={printableInvoice} />);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `فاتورة ${invoice.invoice_number}`,
          text: `فاتورة ${invoice.customer_name} - ${formatCurrency(invoice.total)}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `فاتورة ${invoice.invoice_number}\nالزبون: ${invoice.customer_name}\nالمبلغ: ${formatCurrency(invoice.total)}`;
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  const handleSaveAsPDF = () => {
    // This would typically use a library like jsPDF or html2pdf
    // For now, we'll use the print functionality
    handlePrint();
  };

  const handleMarkAsPaid = () => {
    if (onMarkAsPaid) {
      onMarkAsPaid(invoice.id);
    }
  };

  // Change fabric image
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
      // Upload to local storage (folder-only path to avoid remote DB dependency)
      const uploaded = await ImageService.uploadImage(file, 'fabric-images');
      const newUrl = (uploaded as any).publicUrl || (uploaded as any).url || '';
      if (!newUrl) throw new Error('فشل في رفع الصورة');
      // Update invoice with new image URL in local DB
      await InvoiceService.updateInvoice(invoice.id, { fabric_image_url: newUrl } as any);
      // Optimistically update current view
      (invoice as any).fabric_image_url = newUrl;
    } catch (err: any) {
      setImageError(err?.message || 'حدث خطأ أثناء تغيير الصورة');
    } finally {
      setIsUploadingImage(false);
      // reset input value to allow re-selecting same file later
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مدفوع':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'جزئي':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // حساب نسبة الدفع
  const paymentPercentage = (invoice.paid_amount / invoice.total) * 100;

  return (
    <div className="w-full min-h-screen bg-[#F6E9CA] p-6 md:p-8" dir="rtl">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header Section */}
        <Card className="shadow-md bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left: Customer name, Invoice number, and Status */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={onBack}
                    className="text-[#6b7280] hover:bg-[#f9fafb] flex items-center gap-2 px-3 py-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    العودة
                  </Button>
                  <h1 className="text-[#1a1a1a] arabic-text">{invoice.customer_name}</h1>
                  <Badge 
                    className={`${getStatusColor(invoice.status)} text-sm px-3 py-1`}
                  >
                    {invoice.status}
                  </Badge>
                </div>
                <p className="text-[#6b7280] arabic-text">رقم الفاتورة: {invoice.invoice_number}</p>
              </div>

              {/* Right: Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  className="gap-2 bg-white hover:bg-[#f9fafb] border-[#d1d5db]"
                  onClick={handleSaveAsPDF}
                >
                  <Download className="w-4 h-4" />
                  حفظ PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 bg-white hover:bg-[#f9fafb] border-[#d1d5db]"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </Button>
                <Button 
                  className="gap-2 bg-[#1a1a1a] hover:bg-[#0a0a0a] text-white"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </Button>
                {canMarkAsPaid && (
                  <Button
                    onClick={handleMarkAsPaid}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4" />
                    تم الدفع
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

         {/* Main Content Area - 3 Column Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Column 1 - Customer Information */}
           <Card className="shadow-md bg-white">
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center gap-2 text-[#1a1a1a] arabic-text">
                 <User className="w-5 h-5" />
                 بيانات الزبون
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-start gap-3">
                 <User className="w-5 h-5 text-[#6b7280] mt-0.5" />
                 <div className="flex-1">
                   <p className="text-[#6b7280] text-sm arabic-text">الاسم</p>
                   <p className="text-[#1a1a1a] arabic-text">{invoice.customer_name}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <Phone className="w-5 h-5 text-[#6b7280] mt-0.5" />
                 <div className="flex-1">
                   <p className="text-[#6b7280] text-sm arabic-text">الهاتف</p>
                   <p className="text-[#1a1a1a]">{invoice.customer_phone || 'غير محدد'}</p>
                 </div>
               </div>
               {invoice.customer_address && (
                 <div className="flex items-start gap-3">
                   <MapPin className="w-5 h-5 text-[#6b7280] mt-0.5" />
                   <div className="flex-1">
                     <p className="text-[#6b7280] text-sm arabic-text">العنوان</p>
                     <p className="text-[#1a1a1a] arabic-text">{invoice.customer_address}</p>
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>

           {/* Column 2 - Invoice Summary */}
           <Card className="shadow-md bg-white">
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center gap-2 text-[#1a1a1a] arabic-text">
                 <DollarSign className="w-5 h-5" />
                 ملخص الفاتورة
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-5">
               {/* Payment Progress */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-[#6b7280] text-sm arabic-text">حالة الدفع</span>
                   <span className="text-[#1a1a1a]">{paymentPercentage.toFixed(0)}%</span>
                 </div>
                 <Progress value={paymentPercentage} className="h-2" />
               </div>

               {/* Financial Details */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[#6b7280]">
                     <Wallet className="w-4 h-4" />
                     <span className="arabic-text">المبلغ الكلي</span>
                   </div>
                   <span className="text-[#1a1a1a]">{formatCurrency(invoice.total)}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[#10b981]">
                     <CheckCircle className="w-4 h-4" />
                     <span className="arabic-text">المدفوع</span>
                   </div>
                   <span className="text-[#10b981]">{formatCurrency(invoice.paid_amount)}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[#ef4444]">
                     <CreditCard className="w-4 h-4" />
                     <span className="arabic-text">المتبقي</span>
                   </div>
                   <span className="text-[#ef4444]">{formatCurrency(remaining)}</span>
                 </div>
               </div>

               {/* Dates */}
               <div className="space-y-3 pt-3 border-t border-[#e5e7eb]">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[#6b7280]">
                     <Calendar className="w-4 h-4" />
                     <span className="arabic-text">تاريخ الإصدار</span>
                   </div>
                   <span className="text-[#1a1a1a] text-sm arabic-text">{formatDate(invoice.invoice_date)}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[#6b7280]">
                     <Calendar className="w-4 h-4" />
                     <span className="arabic-text">تاريخ التسليم</span>
                   </div>
                   <span className="text-[#1a1a1a] text-sm arabic-text">{formatDate(invoice.due_date || invoice.invoice_date)}</span>
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Column 3 - Design Details */}
           <Card className="shadow-md bg-white">
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center gap-2 text-[#1a1a1a] arabic-text">
                 <FileText className="w-5 h-5" />
                 تفاصيل التصميم
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <p className="text-[#6b7280] text-sm arabic-text">نوع القماش</p>
                   <p className="text-[#1a1a1a] text-sm arabic-text">
                     {invoice.designDetails?.fabricType && invoice.designDetails.fabricType.length > 0 
                       ? invoice.designDetails.fabricType.join(', ') 
                       : 'لم يتم التحديد'}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[#6b7280] text-sm arabic-text">مصدر القماش</p>
                   <p className="text-[#1a1a1a] text-sm arabic-text">
                     {invoice.designDetails?.fabricSource && invoice.designDetails.fabricSource.length > 0 
                       ? invoice.designDetails.fabricSource.join(', ') 
                       : 'لم يتم التحديد'}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[#6b7280] text-sm arabic-text">نوع الياقة</p>
                   <p className="text-[#1a1a1a] text-sm arabic-text">
                     {invoice.designDetails?.collarType && invoice.designDetails.collarType.length > 0 
                       ? invoice.designDetails.collarType.join(', ') 
                       : 'لم يتم التحديد'}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[#6b7280] text-sm arabic-text">أسلوب الصدر</p>
                   <p className="text-[#1a1a1a] text-sm arabic-text">
                     {invoice.designDetails?.chestStyle && invoice.designDetails.chestStyle.length > 0 
                       ? invoice.designDetails.chestStyle.join(', ') 
                       : 'لم يتم التحديد'}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[#6b7280] text-sm arabic-text">نهاية الكم</p>
                   <p className="text-[#1a1a1a] text-sm arabic-text">
                     {invoice.designDetails?.sleeveEnd && invoice.designDetails.sleeveEnd.length > 0 
                       ? invoice.designDetails.sleeveEnd.join(', ') 
                       : 'لم يتم التحديد'}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[#6b7280] text-sm arabic-text">القياسات</p>
                   <p className="text-[#1a1a1a] text-sm arabic-text">
                     {invoice.measurements ? 
                       `الطول: ${invoice.measurements.length || 'غير محدد'} سم` : 
                       'لم يتم التحديد'}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>

         {/* Footer Section - Notes and Fabric Image */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Notes Card */}
           <Card className="shadow-md bg-white">
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center gap-2 text-[#1a1a1a] arabic-text">
                 <MessageCircle className="w-5 h-5" />
                 الملاحظات
               </CardTitle>
             </CardHeader>
            <CardContent>
              <div className="bg-[#f9fafb] rounded-lg p-4 border border-[#e5e7eb]">
                <p className="text-[#6b7280] arabic-text">{invoice.notes || 'لا توجد ملاحظات'}</p>
              </div>
            </CardContent>
          </Card>

           {/* Fabric Image Card */}
           <Card className="shadow-md bg-white">
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center gap-2 text-[#1a1a1a] arabic-text">
                 <ImageIcon className="w-5 h-5" />
                 صورة القماش
               </CardTitle>
             </CardHeader>
            <CardContent>
              <div className="bg-[#f9fafb] rounded-lg p-8 border border-[#e5e7eb] flex flex-col items-center justify-center gap-3 min-h-[140px] relative">
                {imagesLoading && !invoice.fabricImageUrl ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#9ca3af]" />
                ) : (images && images.length > 0) ? (
                  <div className="w-full h-48 flex items-center justify-center overflow-hidden">
                    <img
                      src={images[0].data_url}
                      alt="صورة القماش"
                      className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                    />
                  </div>
                ) : (invoice as any).fabric_image_url || (invoice as any).fabricImageUrl ? (
                  <div className="w-full h-48 flex items-center justify-center overflow-hidden">
                    <img
                      src={(invoice as any).fabric_image_url || (invoice as any).fabricImageUrl}
                      alt="صورة القماش"
                      className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                    />
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-[#9ca3af]" />
                    <p className="text-[#6b7280] text-center arabic-text">لا توجد صورة للقماش</p>
                  </>
                )}
                {/* Change image button */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerChangeImage}
                    className="bg-white/80 hover:bg-white"
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Pencil className="w-4 h-4 mr-1" />
                        تغيير الصورة
                      </>
                    )}
                  </Button>
                </div>
                {imageError && (
                  <p className="text-red-600 text-xs arabic-text absolute bottom-2 left-2 right-2 text-center">
                    {imageError}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onChangeImageFile}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
