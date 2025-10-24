import React, { useEffect, useMemo, useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { storage } from '@/storage';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type AdminLog = {
  id: string;
  action_type: 'create' | 'update' | 'delete';
  entity_type: 'invoice' | 'customer';
  entity_id: string;
  changed_fields?: any;
  action_date: string;
  action_time: string;
  user_name?: string;
  created_at: string;
};

export function AdminLogPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = (await (storage as any).getAdminLogs?.()) || [];
        if (mounted) setLogs(list);
      } catch {
        if (mounted) setLogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const rows = useMemo(() => logs.map((l) => ({
    id: l.id,
    actionLabel: l.action_type === 'create' ? 'إضافة' : l.action_type === 'update' ? 'تعديل' : 'حذف',
    entityLabel: l.entity_type === 'invoice' ? 'فاتورة' : 'زبون',
    date: l.action_date,
    time: l.action_time,
    user: l.user_name || '-',
    fields: Array.isArray(l.changed_fields)
      ? l.changed_fields.join('، ')
      : (l.changed_fields && typeof l.changed_fields === 'object')
        ? Object.entries(l.changed_fields).map(([k, v]) => `${k}: ${v}`).join('، ')
        : (l.changed_fields ? String(l.changed_fields) : '-'),
  })), [logs]);

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-[#F6E9CA] border-[#C69A72]">
        <CardHeader>
          <CardTitle className="text-[#13312A] arabic-text">سجل الإدارة</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-[#13312A] arabic-text">جاري التحميل...</div>
          ) : rows.length === 0 ? (
            <div className="text-[#13312A] arabic-text">لا توجد سجلات حتى الآن.</div>
          ) : (
            <Table className="arabic-text">
              <TableHeader>
                <TableRow className="bg-[#155446] text-[#F6E9CA]">
                  <TableHead className="text-right text-[#F6E9CA]">نوع الإجراء</TableHead>
                  <TableHead className="text-right text-[#F6E9CA]">التاريخ</TableHead>
                  <TableHead className="text-right text-[#F6E9CA]">الوقت</TableHead>
                  <TableHead className="text-right text-[#F6E9CA]">الحقول التي تم تغييرها</TableHead>
                  <TableHead className="text-right text-[#F6E9CA]">المستخدم المنفذ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-[#13312A]">{`${r.actionLabel} ${r.entityLabel}`}</TableCell>
                    <TableCell className="text-[#13312A]">{r.date}</TableCell>
                    <TableCell className="text-[#13312A]">{r.time}</TableCell>
                    <TableCell className="text-[#13312A] max-w-[520px] whitespace-normal">{r.fields}</TableCell>
                    <TableCell className="text-[#13312A]">{r.user}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

