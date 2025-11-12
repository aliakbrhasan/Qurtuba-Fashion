import React, { useEffect, useMemo, useState } from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table'
import { storage } from '@/storage'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { DateField } from './ui/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

type AdminLog = {
  id: string
  action_type: 'create' | 'update' | 'delete'
  entity_type: 'invoice' | 'customer'
  entity_id: string
  changed_fields?: any
  action_date: string
  action_time: string
  user_name?: string
  created_at: string
}

const fieldLabel = (k: string) => (({
  name: 'الاسم',
  phone: 'رقم الهاتف',
  address: 'العنوان',
  totalSpent: 'إجمالي الإنفاق',
  lastOrder: 'آخر طلب',
  status: 'الحالة',
  customer_name: 'اسم العميل',
  customer_phone: 'هاتف العميل',
  customer_address: 'عنوان العميل',
  paid_amount: 'المبلغ المدفوع',
  invoice_date: 'تاريخ الفاتورة',
  due_date: 'تاريخ الاستحقاق',
  notes: 'ملاحظات',
  fabric_image_url: 'صورة القماش',
} as Record<string, string>)[k] || k)

export function AdminLogPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<'all' | 'create' | 'update' | 'delete'>('all')
  const [entityFilter, setEntityFilter] = useState<'all' | 'invoice' | 'customer'>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = (await (storage as any).getAdminLogs?.()) || []
        if (mounted) setLogs(list)
      } catch {
        if (mounted) setLogs([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(
    () =>
      logs.filter((l) => {
        if (actionFilter !== 'all' && l.action_type !== actionFilter) return false
        if (entityFilter !== 'all' && l.entity_type !== entityFilter) return false
        if (dateFilter && l.action_date !== dateFilter) return false
        const text = `${l.user_name || ''} ${JSON.stringify(l.changed_fields || '')} ${l.entity_type} ${l.action_type}`.toLowerCase()
        return !search || text.includes(search.toLowerCase())
      }),
    [logs, actionFilter, entityFilter, dateFilter, search],
  )

  const rows = useMemo(
    () =>
      filtered.map((l) => ({
        id: l.id,
        actionLabel: l.action_type === 'create' ? 'إنشاء' : l.action_type === 'update' ? 'تحديث' : 'حذف',
        entityLabel: l.entity_type === 'invoice' ? 'فاتورة' : 'عميل',
        date: l.action_date,
        time: l.action_time,
        user: l.user_name || '-',
        fields: Array.isArray(l.changed_fields)
          ? l.changed_fields.map((k: any) => fieldLabel(String(k))).join('، ')
          : l.changed_fields && typeof l.changed_fields === 'object'
            ? Object.keys(l.changed_fields).map((k) => fieldLabel(String(k))).join('، ')
            : l.changed_fields
              ? String(l.changed_fields)
              : '-',
        raw: l,
      })),
    [filtered],
  )

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-[#F6E9CA] border-[#C69A72]">
        <CardHeader>
          <CardTitle className="text-[#13312A] arabic-text">سجل الإدارة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="arabic-text text-[#13312A]">نوع الإجراء</span>
              <Select value={actionFilter} onValueChange={(v: any) => setActionFilter(v)}>
                <SelectTrigger className="w-32 bg-white border-[#C69A72] text-right">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#C69A72]">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="create">إنشاء</SelectItem>
                  <SelectItem value="update">تحديث</SelectItem>
                  <SelectItem value="delete">حذف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="arabic-text text-[#13312A]">نوع الكيان</span>
              <Select value={entityFilter} onValueChange={(v: any) => setEntityFilter(v)}>
                <SelectTrigger className="w-32 bg-white border-[#C69A72] text-right">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#C69A72]">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="customer">عميل</SelectItem>
                  <SelectItem value="invoice">فاتورة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="arabic-text text-[#13312A]">التاريخ</span>
              <DateField
                className="bg-white border-[#C69A72] text-left"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="بحث..."
                className="bg-white border-[#C69A72] text-right"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الإجراء</TableHead>
                  <TableHead className="text-right">الكيان</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">الحقول</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">يجري التحميل...</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">لا توجد سجلات</TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-right">
                        <Badge variant={r.actionLabel === 'حذف' ? 'destructive' : 'secondary'}>{r.actionLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.entityLabel}</TableCell>
                      <TableCell className="text-right">{r.date}</TableCell>
                      <TableCell className="text-right">{r.time}</TableCell>
                      <TableCell className="text-right">{r.user}</TableCell>
                      <TableCell className="text-right">{r.fields}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminLogPage

