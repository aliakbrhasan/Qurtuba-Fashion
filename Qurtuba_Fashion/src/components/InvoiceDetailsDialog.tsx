import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Printer, X } from 'lucide-react';
import { PrintableInvoice, formatCurrency, formatDate, PrintableInvoiceData } from './PrintableInvoice';
import { openPrintInvoiceWindow } from './print/PrintUtils.tsx';
import { formatStringNumber } from '../utils/arabicNumbers';

interface InvoiceDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: PrintableInvoiceData & {
    status: string;
    fabricImage?: string;
    measurements?: { length?: number; shoulder?: number; waist?: number; chest?: number };
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
  const remaining = Math.max((invoice.total || 0) - (invoice.paid || 0), 0);

  const handlePrint = () => {
    openPrintInvoiceWindow(`فاتورة ${invoice.id}`, <PrintableInvoice invoice={invoice} />);
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
              <DialogTitle className="text-[#13312A] arabic-text text-xl md:text-2xl">تفاصيل الفاتورة</DialogTitle>
              <DialogDescription className="text-[#155446] arabic-text text-sm md:text-lg">
                رقم الفاتورة: {formatStringNumber(invoice.id)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-[#155446] hover:bg-[#C69A72]/20">
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <Card className="bg-white border border-[#C69A72]">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-center sm:text-right">
                    <h2 className="text-2xl font-bold text-[#13312A] arabic-text">{invoice.customerName}</h2>
                    <p className="text-[#155446] arabic-text">المبلغ: {formatCurrency(invoice.total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" />
                      طباعة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-[#C69A72]">
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#155446] arabic-text">
                <div>تاريخ الاستلام: {formatDate(invoice.receivedDate)}</div>
                <div>تاريخ التسليم: {formatDate(invoice.deliveryDate)}</div>
                <div>المدفوع: {formatCurrency(invoice.paid)}</div>
                <div>المتبقي: {formatCurrency(remaining)}</div>
                {invoice.address ? <div className="sm:col-span-2">العنوان: {invoice.address}</div> : null}
                {invoice.notes ? <div className="sm:col-span-2">ملاحظات: {invoice.notes}</div> : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

