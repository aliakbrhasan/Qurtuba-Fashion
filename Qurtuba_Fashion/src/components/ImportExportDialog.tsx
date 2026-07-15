import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { ExportImportService, type ImportScope } from '@/services/export-import.service';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({ open, onOpenChange }) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [scope, setScope] = useState<'all' | 'invoices_customers' | 'settings_users'>('all');
  const [policy, setPolicy] = useState<'merge' | 'replace'>('merge');
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [bundleInfo, setBundleInfo] = useState<any | null>(null);

  const importScope: ImportScope = useMemo(() => {
    if (scope === 'all') return { customers: true, invoices: true, orders: true, invoiceItems: true, users: true, roles: true, images: true, adminLogs: true, designSettings: true };
    if (scope === 'invoices_customers') return { customers: true, invoices: true, orders: true, invoiceItems: true } as any;
    return { users: true, roles: true, designSettings: true } as any;
  }, [scope]);

  const handleExport = async () => {
    setBusy(true); setFileError(null);
    try {
      const bundle = await ExportImportService.exportAll(scope);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qurtuba-export-${scope}-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e: any) {
      setFileError(String(e?.message || e));
    } finally { setBusy(false); }
  };

  const handleFile = async (file: File) => {
    setBusy(true); setFileError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setBundleInfo({ meta: parsed.meta });
      await ExportImportService.importAll(parsed, { policy, scope: importScope });
      setBundleInfo(null);
      onOpenChange(false);
    } catch (e: any) {
      setFileError('ملف غير صالح أو حدث خطأ أثناء الاستيراد');
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#F6E9CA] border-[#C69A72]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-[#13312A] arabic-text">تصدير / استيراد البيانات</DialogTitle>
          <DialogDescription className="text-[#155446] arabic-text">العمل دون إنترنت - نسخة احتياطية واستعادة</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mb-3">
          <Button variant={tab==='export'?'default':'outline'} onClick={() => setTab('export')} className="border-[#C69A72]">تصدير</Button>
          <Button variant={tab==='import'?'default':'outline'} onClick={() => setTab('import')} className="border-[#C69A72]">استيراد</Button>
        </div>
        {tab === 'export' ? (
          <Card className="bg-white border-[#C69A72]">
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label className="text-[#13312A] arabic-text">نطاق التصدير</Label>
                <div className="flex gap-3 flex-wrap">
                  <Button variant={scope==='all'?'default':'outline'} onClick={()=>setScope('all')}>كل شيء</Button>
                  <Button variant={scope==='invoices_customers'?'default':'outline'} onClick={()=>setScope('invoices_customers')}>الفواتير والزبائن</Button>
                  <Button variant={scope==='settings_users'?'default':'outline'} onClick={()=>setScope('settings_users')}>الإعدادات والمستخدمون</Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleExport} disabled={busy} className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">تنزيل ملف التصدير</Button>
              </div>
              {fileError && <div className="text-red-600 text-sm">{fileError}</div>}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-[#C69A72]">
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label className="text-[#13312A] arabic-text">نطاق الاستيراد</Label>
                <div className="flex gap-3 flex-wrap">
                  <Button variant={scope==='all'?'default':'outline'} onClick={()=>setScope('all')}>كل شيء</Button>
                  <Button variant={scope==='invoices_customers'?'default':'outline'} onClick={()=>setScope('invoices_customers')}>الفواتير والزبائن</Button>
                  <Button variant={scope==='settings_users'?'default':'outline'} onClick={()=>setScope('settings_users')}>الإعدادات والمستخدمون</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#13312A] arabic-text">سياسة الدمج</Label>
                <div className="flex gap-3 flex-wrap">
                  <Button variant={policy==='merge'?'default':'outline'} onClick={()=>setPolicy('merge')}>دمج</Button>
                  <Button variant={policy==='replace'?'default':'outline'} onClick={()=>setPolicy('replace')}>استبدال</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#13312A] arabic-text">ملف الاستيراد (JSON)</Label>
                <input type="file" accept="application/json" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) void handleFile(f); }} />
              </div>
              {bundleInfo && (
                <div className="text-xs text-[#155446]">نسخة: v{bundleInfo.meta?.version} — تاريخ: {bundleInfo.meta?.exportedAt}</div>
              )}
              {fileError && <div className="text-red-600 text-sm">{fileError}</div>}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};


