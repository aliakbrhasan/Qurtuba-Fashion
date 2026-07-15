import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { RefreshCw, Wifi, WifiOff, Cloud } from 'lucide-react';
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

  // Force sync kept in service for future use; not used in compact view

  // formatting helper removed in compact mode

  // Compact icon-only indicator with tooltip
  const icon = !isElectron
    ? <Cloud className="h-4 w-4 text-[#13312A]" />
    : syncStatus.isSyncing
      ? <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      : syncStatus.isOnline
        ? <Wifi className="h-4 w-4 text-green-600" />
        : <WifiOff className="h-4 w-4 text-red-600" />;

  const tooltip = !isElectron
    ? 'وضع الويب - البيانات محفوظة في السحابة'
    : syncStatus.isSyncing
      ? 'جاري المزامنة'
      : syncStatus.isOnline
        ? (syncStatus.pendingChanges > 0 ? `متصل - تغييرات معلقة: ${syncStatus.pendingChanges}` : 'متصل - محدث')
        : 'غير متصل - سيتم المزامنة عند الاتصال';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`p-2 ${className}`}
            onClick={async () => {
              if (!isElectron) return;
              if (!syncStatus.isOnline || syncStatus.isSyncing) return;
              await handleSync();
            }}
            disabled={isElectron ? (!syncStatus.isOnline || syncStatus.isSyncing) : false}
            aria-label={tooltip}
            title={tooltip}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="arabic-text text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
