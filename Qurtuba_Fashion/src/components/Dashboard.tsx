import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { SyncStatus } from './SyncStatus';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { QuickActions } from './dashboard/QuickActions';
import { RecentActivities } from './dashboard/RecentActivities';

interface DashboardProps {
  onNavigate: (page: string, itemId?: string) => void;
  onCreateInvoice: () => void;
}

export function Dashboard({ onNavigate, onCreateInvoice }: DashboardProps) {
  const { stats, error } = useDashboardStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 arabic-text mb-2">
              خطأ في تحميل البيانات
            </h3>
            <p className="text-red-600 arabic-text mb-4">
              {error}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#13312A] arabic-text mb-2">
            {getGreeting()}، أهلاً وسهلاً
          </h1>
          <p className="text-[#155446] arabic-text">
            مرحباً بك في نظام إدارة أزياء قرطبة
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative hidden md:block">
            <SyncStatus />
          </div>
        </div>
      </div>


      {/* Quick Actions */}
      <QuickActions 
        onCreateInvoice={onCreateInvoice} 
        onNavigate={onNavigate} 
      />

      {/* Recent Activities */}
      <RecentActivities
        recentInvoices={stats.recentInvoices}
        recentCustomers={stats.recentCustomers}
        upcomingDeliveries={stats.upcomingDeliveries}
      />
    </div>
  );
}