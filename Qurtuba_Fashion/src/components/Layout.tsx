import React from 'react';
import { Home, Receipt, Users, Menu, Settings, User, LogOut, DollarSign, Bell, Download, Upload, HardDrive } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { User as UserType } from '../services/auth.service';
import { usePermissions } from '../hooks/usePermissions';
import { useState } from 'react';
import { NotificationCenter } from './dashboard/NotificationCenter';
import { useNotifications } from '@/app/NotificationsProvider';
// import { SyncStatus } from './SyncStatus';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string, itemId?: string) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  currentUser?: UserType | null;
}

export function Layout({ children, currentPage, onNavigate, isLoggedIn, onLogout, currentUser }: LayoutProps) {
  const { hasPagePermission } = usePermissions(currentUser ?? null);
  const { unreadCount } = useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const { storage } = await import('@/storage');
      if (typeof (storage as any).exportAll === 'function') {
        const data = await (storage as any).exportAll();
        const json = JSON.stringify(data, null, 2);
        const defaultName = `qurtuba-backup-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
        const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
        if (isElectron) {
          try {
            const result = await (window as any).electronAPI.showSaveDialog({
              title: 'حفظ النسخة الاحتياطية',
              defaultPath: defaultName,
              filters: [{ name: 'JSON', extensions: ['json'] }]
            });
            if (!result?.canceled && result?.filePath) {
              await (window as any).electronAPI.saveFile(json, result.filePath);
            }
          } catch {}
        } else {
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = defaultName;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } finally { setExporting(false); }
  };

  const handleImport = async (file: File) => {
    try {
      setImporting(true);
      const text = await file.text();
      const json = JSON.parse(text);
      const { storage } = await import('@/storage');
      if (typeof (storage as any).importAll === 'function') {
        await (storage as any).importAll(json);
        // Hard reload caches
        window.location.reload();
      }
    } catch (e) {
      console.error('Import failed:', e);
    } finally { setImporting(false); }
  };

  // All possible navigation items
  const allNavigationItems = [
    { id: 'dashboard', label: 'الصفحة الرئيسية', icon: Home },
    { id: 'invoices', label: 'الفواتير', icon: Receipt },
    { id: 'customers', label: 'الزبائن', icon: Users },
    { id: 'financial', label: 'المالية', icon: DollarSign },
  ];

  // Filter navigation items based on user permissions
  const navigationItems = allNavigationItems.filter(item => 
    hasPagePermission(item.id)
  );

  const activePage = currentPage === 'customerDetails' ? 'customers' : currentPage;

  const MobileNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-[#13312A] border-t border-[#155446] z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 p-2 touch-target ${
                activePage === item.id
                  ? 'text-[#F6E9CA] bg-[#155446]'
                  : 'text-[#C69A72] hover:text-[#F6E9CA] hover:bg-[#155446]'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs arabic-text">{item.label}</span>
            </Button>
          );
        })}
        
        <Sheet>
          <SheetTrigger className="inline-flex flex-col items-center gap-1 p-2 touch-target text-[#C69A72] hover:text-[#F6E9CA] hover:bg-[#155446] rounded-md transition-colors">
            <Menu size={20} />
            <span className="text-xs arabic-text">المزيد</span>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#13312A] border-[#155446] w-80">
            <SheetHeader>
              <SheetTitle className="text-[#F6E9CA] arabic-text">القائمة</SheetTitle>
              <SheetDescription className="text-[#C69A72] arabic-text">
                الخيارات والإعدادات الإضافية
              </SheetDescription>
            </SheetHeader>
            
            {currentUser && (
              <div className="flex items-center gap-3 p-4 bg-[#155446] rounded-lg mt-4">
                <div className="w-10 h-10 bg-[#13312A] rounded-full flex items-center justify-center">
                  <User size={20} className="text-[#F6E9CA]" />
                </div>
                <div className="text-right flex-1">
                  <div className="text-[#F6E9CA] arabic-text font-medium">{currentUser.name}</div>
                  <div className="text-[#C69A72] arabic-text text-sm">{currentUser.status}</div>
                  <div className="text-[#C69A72] arabic-text text-xs">{currentUser.email}</div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-4 mt-4">
              <div className="p-4 bg-[#155446] rounded-lg">
                <div className="flex items-center gap-2 text-[#F6E9CA] mb-3"><HardDrive size={18} /><span className="arabic-text">إدارة البيانات المحلية</span></div>
                <div className="flex gap-2">
                  <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 bg-[#C69A72] text-[#13312A] rounded px-3 py-2 text-sm">
                    <Download size={16} />
                    <span className="arabic-text">تصدير</span>
                  </button>
                  <label className="inline-flex items-center gap-2 bg-[#C69A72] text-[#13312A] rounded px-3 py-2 text-sm cursor-pointer" title={importing ? 'جاري الاستيراد...' : 'استيراد نسخة احتياطية'}>
                    <Upload size={16} />
                    <span className="arabic-text">استيراد</span>
                    <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && handleImport(e.target.files[0])} />
                  </label>
                </div>
              </div>
              {/* Show additional pages based on permissions */}
              {hasPagePermission('users') && (
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('users')}
                  className="flex items-center gap-3 justify-start text-[#F6E9CA] hover:bg-[#155446] p-4 touch-target"
                >
                  <Settings size={20} />
                  <span className="arabic-text">إدارة المستخدمين</span>
                </Button>
              )}
              <Button
                variant="ghost"
                className="flex items-center gap-3 justify-start text-[#F6E9CA] hover:bg-[#155446] p-4 touch-target"
              >
                <User size={20} />
                <span className="arabic-text">الملف الشخصي</span>
              </Button>
              <Button
                variant="ghost"
                onClick={onLogout}
                className="flex items-center gap-3 justify-start text-[#F6E9CA] hover:bg-destructive p-4 touch-target"
              >
                <LogOut size={20} />
                <span className="arabic-text">تسجيل الخروج</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  const DesktopNavigation = () => (
    <header className="bg-[#13312A] border-b border-[#155446] hidden md:block">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl text-[#F6E9CA] arabic-text">نظام إدارة التفصيل</h1>
            <nav className="flex gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 touch-target ${
                      activePage === item.id
                        ? 'text-[#F6E9CA] bg-[#155446]'
                        : 'text-[#C69A72] hover:text-[#F6E9CA] hover:bg-[#155446]'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="arabic-text">{item.label}</span>
                  </Button>
                );
              })}
              
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => setIsNotificationOpen(true)}
                className="text-[#C69A72] hover:text-[#F6E9CA] hover:bg-[#155446] p-2 touch-target relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] leading-none rounded-full py-[2px] px-[6px]">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 bg-[#C69A72] text-[#13312A] rounded px-3 py-2 text-sm">
                <Download size={16} />
                <span className="arabic-text">تصدير</span>
              </button>
              <label className="inline-flex items-center gap-2 bg-[#C69A72] text-[#13312A] rounded px-3 py-2 text-sm cursor-pointer" title={importing ? 'جاري الاستيراد...' : 'استيراد نسخة احتياطية'}>
                <Upload size={16} />
                <span className="arabic-text">استيراد</span>
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && handleImport(e.target.files[0])} />
              </label>
            </div>
            {currentUser && (
              <div className="flex items-center gap-2 text-[#F6E9CA]">
                <div className="w-8 h-8 bg-[#155446] rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
                <div className="text-right">
                  <div className="text-sm arabic-text font-medium">{currentUser.name}</div>
                  <div className="text-xs text-[#C69A72] arabic-text">{currentUser.status}</div>
                </div>
              </div>
            )}
            {hasPagePermission('users') && (
              <Button
                variant="ghost"
                onClick={() => onNavigate('users')}
                className="text-[#C69A72] hover:text-[#F6E9CA] hover:bg-[#155446] p-2 touch-target"
              >
                <Settings size={18} />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-[#C69A72] hover:text-[#F6E9CA] hover:bg-destructive p-2 touch-target"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );

  if (!isLoggedIn) {
    return <div className="min-h-screen bg-[#F6E9CA]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F6E9CA]">
      <DesktopNavigation />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <MobileNavigation />
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}