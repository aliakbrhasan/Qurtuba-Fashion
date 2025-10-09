import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Printer, 
  Share2, 
  Download, 
  FileImage, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Ruler, 
  Scissors, 
  CreditCard,
  Clock,
  MessageCircle,
  X
} from 'lucide-react';
import { formatCurrency, formatDate, PrintableInvoiceData, PrintableInvoice } from './PrintableInvoice';
import { openPrintWindow } from './print/PrintUtils';

interface InvoiceDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: PrintableInvoiceData & {
    status: string;
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
}

export function InvoiceDetailsDialog({ isOpen, onOpenChange, invoice }: InvoiceDetailsDialogProps) {
  const remaining = Math.max(invoice.total - invoice.paid, 0);

  const handlePrint = () => {
    openPrintWindow(`فاتورة ${invoice.id}`, <PrintableInvoice invoice={invoice} />);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `فاتورة ${invoice.id}`,
          text: `فاتورة ${invoice.customerName} - ${formatCurrency(invoice.total)}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `فاتورة ${invoice.id}\nالزبون: ${invoice.customerName}\nالمبلغ: ${formatCurrency(invoice.total)}`;
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

  const handleSaveAsImage = () => {
    // This would typically use html2canvas to capture the dialog content
    // For now, we'll use the print functionality
    handlePrint();
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[98vw] sm:w-[95vw] h-[90vh] max-h-[90vh] bg-[#F6E9CA] border-[#C69A72] p-0 flex flex-col">
        <DialogHeader className="p-4 pb-3 border-b border-[#C69A72]/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-[#13312A] arabic-text text-xl md:text-2xl">
                تفاصيل الفاتورة
              </DialogTitle>
              <DialogDescription className="text-[#155446] arabic-text text-sm md:text-lg">
                رقم الفاتورة: {invoice.id}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-[#155446] hover:bg-[#C69A72]/20"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Header Info */}
            <div className="bg-white rounded-lg border border-[#C69A72] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-center sm:text-right">
                  <h2 className="text-2xl font-bold text-[#13312A] arabic-text">{invoice.customerName}</h2>
                  <p className="text-[#155446] arabic-text">رقم الفاتورة: {invoice.id}</p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Badge className={`${getStatusColor(invoice.status)} text-sm px-3 py-1`}>
                    {invoice.status}
                  </Badge>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#13312A]">{formatCurrency(invoice.total)}</p>
                    <p className="text-sm text-[#155446] arabic-text">المبلغ الكلي</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Customer Information */}
                <Card className="bg-white border-[#C69A72]">
                  <CardHeader className="p-4">
                    <CardTitle className="text-[#13312A] arabic-text text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      بيانات الزبون
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-[#155446]" />
                      <div>
                        <p className="text-sm text-[#155446] arabic-text">الاسم</p>
                        <p className="text-lg font-semibold text-[#13312A] arabic-text">{invoice.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-[#155446]" />
                      <div>
                        <p className="text-sm text-[#155446] arabic-text">الهاتف</p>
                        <p className="text-lg font-semibold text-[#13312A]">{invoice.phone}</p>
                      </div>
                    </div>
                    {invoice.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-[#155446]" />
                        <div>
                          <p className="text-sm text-[#155446] arabic-text">العنوان</p>
                          <p className="text-lg font-semibold text-[#13312A] arabic-text">{invoice.address}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Measurements */}
                {invoice.measurements && (
                  <Card className="bg-white border-[#C69A72]">
                    <CardHeader className="p-4">
                      <CardTitle className="text-[#13312A] arabic-text text-lg flex items-center gap-2">
                        <Ruler className="h-5 w-5" />
                        القياسات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-3">
                        {invoice.measurements.length && (
                          <div className="text-center p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72]/30">
                            <div className="text-[#155446] arabic-text text-sm font-medium mb-1">الطول</div>
                            <div className="text-[#13312A] text-xl font-bold">{invoice.measurements.length} سم</div>
                          </div>
                        )}
                        {invoice.measurements.shoulder && (
                          <div className="text-center p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72]/30">
                            <div className="text-[#155446] arabic-text text-sm font-medium mb-1">الكتف</div>
                            <div className="text-[#13312A] text-xl font-bold">{invoice.measurements.shoulder} سم</div>
                          </div>
                        )}
                        {invoice.measurements.waist && (
                          <div className="text-center p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72]/30">
                            <div className="text-[#155446] arabic-text text-sm font-medium mb-1">الخصر</div>
                            <div className="text-[#13312A] text-xl font-bold">{invoice.measurements.waist} سم</div>
                          </div>
                        )}
                        {invoice.measurements.chest && (
                          <div className="text-center p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72]/30">
                            <div className="text-[#155446] arabic-text text-sm font-medium mb-1">الصدر</div>
                            <div className="text-[#13312A] text-xl font-bold">{invoice.measurements.chest} سم</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Design Details */}
                {invoice.designDetails && (
                  <Card className="bg-white border-[#C69A72]">
                    <CardHeader className="p-4">
                      <CardTitle className="text-[#13312A] arabic-text text-lg flex items-center gap-2">
                        <Scissors className="h-5 w-5" />
                        تفاصيل التصميم
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      {invoice.designDetails.fabricType && invoice.designDetails.fabricType.length > 0 && (
                        <div>
                          <div className="text-[#155446] arabic-text text-sm font-medium mb-2">نوع القماش</div>
                          <div className="flex flex-wrap gap-2">
                            {invoice.designDetails.fabricType.map((type, index) => (
                              <Badge key={index} variant="secondary" className="bg-[#F6E9CA] text-[#13312A] border-[#C69A72]">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {invoice.designDetails.fabricSource && invoice.designDetails.fabricSource.length > 0 && (
                        <div>
                          <div className="text-[#155446] arabic-text text-sm font-medium mb-2">مصدر القماش</div>
                          <div className="flex flex-wrap gap-2">
                            {invoice.designDetails.fabricSource.map((source, index) => (
                              <Badge key={index} variant="secondary" className="bg-[#F6E9CA] text-[#13312A] border-[#C69A72]">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {invoice.designDetails.collarType && invoice.designDetails.collarType.length > 0 && (
                        <div>
                          <div className="text-[#155446] arabic-text text-sm font-medium mb-2">نوع الياقة</div>
                          <div className="flex flex-wrap gap-2">
                            {invoice.designDetails.collarType.map((type, index) => (
                              <Badge key={index} variant="secondary" className="bg-[#F6E9CA] text-[#13312A] border-[#C69A72]">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {invoice.designDetails.chestStyle && invoice.designDetails.chestStyle.length > 0 && (
                        <div>
                          <div className="text-[#155446] arabic-text text-sm font-medium mb-2">أسلوب الصدر</div>
                          <div className="flex flex-wrap gap-2">
                            {invoice.designDetails.chestStyle.map((style, index) => (
                              <Badge key={index} variant="secondary" className="bg-[#F6E9CA] text-[#13312A] border-[#C69A72]">
                                {style}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {invoice.designDetails.sleeveEnd && invoice.designDetails.sleeveEnd.length > 0 && (
                        <div>
                          <div className="text-[#155446] arabic-text text-sm font-medium mb-2">نهاية الكم</div>
                          <div className="flex flex-wrap gap-2">
                            {invoice.designDetails.sleeveEnd.map((end, index) => (
                              <Badge key={index} variant="secondary" className="bg-[#F6E9CA] text-[#13312A] border-[#C69A72]">
                                {end}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Financial Information */}
                <Card className="bg-white border-[#C69A72]">
                  <CardHeader className="p-4">
                    <CardTitle className="text-[#13312A] arabic-text text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      المعلومات المالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      <div className="text-center p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72]/30">
                        <div className="text-[#155446] arabic-text text-sm font-medium mb-1">المبلغ الكلي</div>
                        <div className="text-[#13312A] text-2xl font-bold">{formatCurrency(invoice.total)}</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-green-700 arabic-text text-sm font-medium mb-1">المبلغ المدفوع</div>
                        <div className="text-green-800 text-2xl font-bold">{formatCurrency(invoice.paid)}</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-orange-700 arabic-text text-sm font-medium mb-1">المبلغ المتبقي</div>
                        <div className="text-orange-800 text-2xl font-bold">{formatCurrency(remaining)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dates */}
                <Card className="bg-white border-[#C69A72]">
                  <CardHeader className="p-4">
                    <CardTitle className="text-[#13312A] arabic-text text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      التواريخ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      <div className="text-center p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72]/30">
                        <div className="text-[#155446] arabic-text text-sm font-medium mb-1">تاريخ الاستلام</div>
                        <div className="text-[#13312A] text-lg font-semibold">{formatDate(invoice.receivedDate)}</div>
                      </div>
                      <div className="text-center p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72]/30">
                        <div className="text-[#155446] arabic-text text-sm font-medium mb-1">تاريخ التسليم</div>
                        <div className="text-[#13312A] text-lg font-semibold">{formatDate(invoice.deliveryDate)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {invoice.notes && (
                  <Card className="bg-white border-[#C69A72]">
                    <CardHeader className="p-4">
                      <CardTitle className="text-[#13312A] arabic-text text-lg flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        الملاحظات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="p-3 bg-[#F6E9CA] rounded-lg border border-[#C69A72]/30">
                        <p className="text-[#13312A] arabic-text text-base leading-relaxed">
                          {invoice.notes}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fabric Image */}
                {invoice.fabricImage && (
                  <Card className="bg-white border-[#C69A72]">
                    <CardHeader className="p-4">
                      <CardTitle className="text-[#13312A] arabic-text text-lg flex items-center gap-2">
                        <FileImage className="h-5 w-5" />
                        صورة القماش
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-center">
                        <img
                          src={invoice.fabricImage}
                          alt="صورة القماش"
                          className="max-w-full h-auto max-h-64 rounded-lg border border-[#C69A72]/30 shadow-md"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-[#F6E9CA] border-t border-[#C69A72]/30 p-4">
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handlePrint}
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                مشاركة
              </Button>
              <Button
                onClick={handleSaveAsPDF}
                variant="outline"
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                حفظ PDF
              </Button>
              <Button
                onClick={handleSaveAsImage}
                variant="outline"
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] flex items-center gap-2"
              >
                <FileImage className="h-4 w-4" />
                حفظ صورة
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
