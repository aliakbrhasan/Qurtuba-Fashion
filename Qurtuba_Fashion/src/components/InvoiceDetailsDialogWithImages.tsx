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
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { ImageGallery } from './ui/ImageGallery';
import { useImages } from '@/hooks/useImages';

interface InvoiceDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_phone?: string;
    customer_address?: string;
    total: number;
    paid_amount: number;
    status: string;
    invoice_date: string;
    due_date?: string;
    notes?: string;
    items: Array<{
      id: string;
      item_name: string;
      description?: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    measurements?: {
      length?: number;
      shoulder?: number;
      waist?: number;
      chest?: number;
    };
    design_details?: {
      fabric_type?: string[];
      fabric_source?: string[];
      collar_type?: string[];
      chest_style?: string[];
      sleeve_end?: string[];
    };
  };
  onMarkAsPaid?: (invoiceId: string) => void;
  onPrint?: (invoiceId: string) => void;
}

export function InvoiceDetailsDialogWithImages({
  isOpen,
  onOpenChange,
  invoice,
  onMarkAsPaid,
  onPrint
}: InvoiceDetailsDialogProps) {
  const { images, loading: imagesLoading, deleteImage } = useImages('invoice', invoice.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'مدفوع':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'جزئي':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'معلق':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مدفوع':
        return 'bg-green-100 text-green-800';
      case 'جزئي':
        return 'bg-yellow-100 text-yellow-800';
      case 'معلق':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const remainingAmount = invoice.total - invoice.paid_amount;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#13312A] arabic-text">
            تفاصيل الفاتورة #{invoice.invoice_number}
          </DialogTitle>
          <DialogDescription className="text-gray-600 arabic-text">
            عرض تفاصيل الفاتورة والصور المرتبطة بها
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card className="bg-gradient-to-r from-[#F6E9CA] to-[#E8D5B7] border-[#C69A72]">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invoice.status)}
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    تاريخ الفاتورة: {formatDate(invoice.invoice_date)}
                  </p>
                  {invoice.due_date && (
                    <p className="text-sm text-gray-600">
                      تاريخ الاستحقاق: {formatDate(invoice.due_date)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#13312A]">
                    {formatCurrency(invoice.total)}
                  </p>
                  <p className="text-sm text-gray-600">
                    المبلغ المدفوع: {formatCurrency(invoice.paid_amount)}
                  </p>
                  {remainingAmount > 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      المتبقي: {formatCurrency(remainingAmount)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="bg-white border-[#C69A72]">
            <CardHeader>
              <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
                <User className="w-5 h-5" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 arabic-text">الاسم</p>
                  <p className="text-lg text-[#13312A] arabic-text">{invoice.customer_name}</p>
                </div>
                {invoice.customer_phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 arabic-text flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      الهاتف
                    </p>
                    <p className="text-lg text-[#13312A]">{invoice.customer_phone}</p>
                  </div>
                )}
              </div>
              {invoice.customer_address && (
                <div>
                  <p className="text-sm font-medium text-gray-700 arabic-text flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    العنوان
                  </p>
                  <p className="text-lg text-[#13312A] arabic-text">{invoice.customer_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images Section */}
          <Card className="bg-white border-[#C69A72]">
            <CardHeader>
              <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                صور الطلب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageGallery
                images={images}
                loading={imagesLoading}
                onDelete={deleteImage}
                maxImages={8}
                showThumbnails={true}
              />
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="bg-white border-[#C69A72]">
            <CardHeader>
              <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                عناصر الفاتورة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-[#13312A] arabic-text">{item.item_name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 arabic-text mt-1">{item.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>الكمية: {item.quantity}</span>
                          <span>السعر: {formatCurrency(item.unit_price)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#13312A]">
                          {formatCurrency(item.total_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between items-center text-lg font-bold text-[#13312A]">
                <span className="arabic-text">المجموع الكلي</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Measurements */}
          {invoice.measurements && (
            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  المقاسات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {invoice.measurements.length && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 arabic-text">الطول</p>
                      <p className="text-lg font-medium text-[#13312A]">{invoice.measurements.length} سم</p>
                    </div>
                  )}
                  {invoice.measurements.shoulder && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 arabic-text">العرض</p>
                      <p className="text-lg font-medium text-[#13312A]">{invoice.measurements.shoulder} سم</p>
                    </div>
                  )}
                  {invoice.measurements.waist && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 arabic-text">الخصر</p>
                      <p className="text-lg font-medium text-[#13312A]">{invoice.measurements.waist} سم</p>
                    </div>
                  )}
                  {invoice.measurements.chest && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 arabic-text">الصدر</p>
                      <p className="text-lg font-medium text-[#13312A]">{invoice.measurements.chest} سم</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Design Details */}
          {invoice.design_details && (
            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text">تفاصيل التصميم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invoice.design_details.fabric_type && invoice.design_details.fabric_type.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 arabic-text">نوع القماش</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {invoice.design_details.fabric_type.map((type, index) => (
                          <Badge key={index} variant="secondary" className="arabic-text">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {invoice.design_details.collar_type && invoice.design_details.collar_type.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 arabic-text">نوع الياقة</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {invoice.design_details.collar_type.map((type, index) => (
                          <Badge key={index} variant="secondary" className="arabic-text">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  ملاحظات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 arabic-text">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#C69A72] text-[#13312A] hover:bg-[#F6E9CA]"
            >
              إغلاق
            </Button>
            {onPrint && (
              <Button
                onClick={() => onPrint(invoice.id)}
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
              >
                <Printer className="w-4 h-4 mr-2" />
                طباعة
              </Button>
            )}
            {onMarkAsPaid && invoice.status !== 'مدفوع' && (
              <Button
                onClick={() => onMarkAsPaid(invoice.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                وضع علامة مدفوع
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
