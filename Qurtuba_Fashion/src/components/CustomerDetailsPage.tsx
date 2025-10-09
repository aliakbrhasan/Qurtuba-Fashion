import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Customer } from '../types/customer';
import {
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight,
  ClipboardList,
  Plus,
  Star,
} from 'lucide-react';

interface CustomerDetailsPageProps {
  customer: Customer;
  onBack: () => void;
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
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function CustomerDetailsPage({ customer, onBack }: CustomerDetailsPageProps) {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const sortedOrders = useMemo(
    () =>
      [...customer.orders].sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      ),
    [customer]
  );

  const handleNewOrderSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsNewOrderOpen(false);
  };

  const measurementItems = [
    { label: 'الطول', value: `${customer.measurements.height} سم` },
    { label: 'الكتف', value: `${customer.measurements.shoulder} سم` },
    { label: 'الخصر', value: `${customer.measurements.waist} سم` },
    { label: 'الصدر', value: `${customer.measurements.chest} سم` },
  ];

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
          <Badge className={`${getLabelColor(customer.label)} flex items-center gap-1`}>
            {getLabelIcon(customer.label)}
            {customer.label}
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
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="arabic-text">آخر طلب: {customer.lastOrder}</span>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <MapPin className="w-4 h-4" />
              <span className="arabic-text">{customer.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="arabic-text">إجمالي المصروف: {customer.totalSpent} دينار عراقي</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="arabic-text">عدد الطلبات: {customer.orders.length}</span>
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

      <Card className="bg-white border-[#C69A72]">
        <CardHeader>
          <CardTitle className="text-[#13312A] arabic-text text-lg">سجل الطلبات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => {
              const remaining = order.total - order.paid;
              return (
                <div
                  key={order.id}
                  className="bg-[#FDF9F1] border border-[#C69A72] rounded-lg p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg text-[#13312A] arabic-text">{order.type}</span>
                        <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                      </div>
                      <span className="text-sm text-[#155446] arabic-text">رقم الطلب: {order.id}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-[#155446] arabic-text">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>تاريخ الطلب: {order.orderDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>تاريخ التسليم: {order.deliveryDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>التكلفة: {order.total} د.ع</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>المتبقي: {remaining} د.ع</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[#155446] arabic-text">
              لا توجد طلبات مسجلة لهذا الزبون بعد.
            </p>
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
              تم تعبئة بيانات الزبون وقياساته بشكل تلقائي ويمكنك تعديلها قبل الحفظ
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
                    className="bg-white border-[#C69A72] text-right"
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">رقم الهاتف</Label>
                  <Input
                    defaultValue={customer.phone}
                    className="bg-white border-[#C69A72] text-right"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#13312A] arabic-text">العنوان</Label>
                  <Input
                    defaultValue={customer.address}
                    className="bg-white border-[#C69A72] text-right"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">القياسات</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">الطول</Label>
                  <Input
                    type="number"
                    defaultValue={customer.measurements.height}
                    className="bg-white border-[#C69A72] text-right"
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">الكتف</Label>
                  <Input
                    type="number"
                    defaultValue={customer.measurements.shoulder}
                    className="bg-white border-[#C69A72] text-right"
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">الخصر</Label>
                  <Input
                    type="number"
                    defaultValue={customer.measurements.waist}
                    className="bg-white border-[#C69A72] text-right"
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">الصدر</Label>
                  <Input
                    type="number"
                    defaultValue={customer.measurements.chest}
                    className="bg-white border-[#C69A72] text-right"
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
                  <Label className="text-[#13312A] arabic-text">تاريخ التسليم</Label>
                  <Input type="date" className="bg-white border-[#C69A72] text-right" />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">التكلفة المتوقعة</Label>
                  <Input type="number" placeholder="0" className="bg-white border-[#C69A72] text-right" />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">الدفعة المقدمة</Label>
                  <Input type="number" placeholder="0" className="bg-white border-[#C69A72] text-right" />
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
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
              >
                حفظ الطلب
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
