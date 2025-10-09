import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { LocalAppService } from '@/services/local-app.service';

interface SyncStatusProps {
  className?: string;
}

export function SyncStatus({ className = "" }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    lastSync: null as string | null,
    pendingChanges: 0,
    isSyncing: false
  });
  const [isElectron, setIsElectron] = useState(false);

  const localAppService = LocalAppService.getInstance();

  useEffect(() => {
    setIsElectron(localAppService.isElectronApp());
    
    if (isElectron) {
      loadSyncStatus();
      
      // Update sync status every 30 seconds
      const interval = setInterval(loadSyncStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isElectron]);

  const loadSyncStatus = async () => {
    if (!isElectron) return;
    
    try {
      const status = await localAppService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleSync = async () => {
    if (!isElectron) return;
    
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const result = await localAppService.syncData();
      if (result.success) {
        await loadSyncStatus();
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleForceSync = async () => {
    if (!isElectron) return;
    
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const result = await localAppService.forceSync();
      if (result.success) {
        await loadSyncStatus();
      }
    } catch (error) {
      console.error('Force sync error:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'لم يتم المزامنة';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  if (!isElectron) {
    return (
      <Card className={`bg-white border-[#C69A72] ${className}`}>
        <CardHeader>
          <CardTitle className="text-[#13312A] arabic-text text-sm flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            وضع الويب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#155446] arabic-text text-sm">
            التطبيق يعمل في وضع الويب - البيانات محفوظة في السحابة
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white border-[#C69A72] ${className}`}>
      <CardHeader>
        <CardTitle className="text-[#13312A] arabic-text text-sm flex items-center gap-2">
          {syncStatus.isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          حالة المزامنة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Online Status */}
        <div className="flex items-center justify-between">
          <span className="text-[#155446] arabic-text text-sm">الاتصال:</span>
          <Badge variant={syncStatus.isOnline ? "default" : "destructive"}>
            {syncStatus.isOnline ? 'متصل' : 'غير متصل'}
          </Badge>
        </div>

        {/* Last Sync */}
        <div className="flex items-center justify-between">
          <span className="text-[#155446] arabic-text text-sm">آخر مزامنة:</span>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-[#155446]" />
            <span className="text-[#155446] arabic-text text-xs">
              {formatLastSync(syncStatus.lastSync)}
            </span>
          </div>
        </div>

        {/* Pending Changes */}
        {syncStatus.pendingChanges > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[#155446] arabic-text text-sm">تغييرات معلقة:</span>
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              {syncStatus.pendingChanges}
            </Badge>
          </div>
        )}

        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <span className="text-[#155446] arabic-text text-sm">الحالة:</span>
          <div className="flex items-center gap-2">
            {syncStatus.isSyncing ? (
              <>
                <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
                <span className="text-blue-600 arabic-text text-xs">جاري المزامنة...</span>
              </>
            ) : syncStatus.pendingChanges > 0 ? (
              <>
                <AlertCircle className="h-3 w-3 text-orange-600" />
                <span className="text-orange-600 arabic-text text-xs">يوجد تغييرات</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-green-600 arabic-text text-xs">محدث</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleSync}
            disabled={!syncStatus.isOnline || syncStatus.isSyncing}
            className="flex-1 bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-xs"
          >
            <RefreshCw className={`h-3 w-3 ml-1 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            مزامنة
          </Button>
          
          {syncStatus.pendingChanges > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceSync}
              disabled={!syncStatus.isOnline || syncStatus.isSyncing}
              className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-xs"
            >
              مزامنة قسرية
            </Button>
          )}
        </div>

        {/* Offline Notice */}
        {!syncStatus.isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
            <p className="text-yellow-800 arabic-text text-xs text-center">
              التطبيق يعمل في وضع عدم الاتصال - سيتم المزامنة عند الاتصال بالإنترنت
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
