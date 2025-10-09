// React import not needed with react-jsx runtime
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell, X, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import { cn } from '../ui/utils';
import { useNotifications } from '@/app/NotificationsProvider';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function NotificationCenter({ isOpen, onClose, onNavigate }: NotificationCenterProps) {
  const { notifications, unreadCount, markAllAsRead, markAsRead, remove } = useNotifications();

  const removeNotification = remove;

  const getIcon = (type: 'info' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertCircle;
      case 'error':
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getIconColor = (type: 'info' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md bg-white border-[#C69A72] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
                className="text-xs"
              >
                تعيين الكل كمقروء
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-[#155446] arabic-text">
              لا توجد إشعارات
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors",
                      !notification.read && "bg-blue-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("w-5 h-5 mt-0.5", getIconColor(notification.type))} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "text-sm font-medium arabic-text",
                            !notification.read ? "text-[#13312A]" : "text-gray-600"
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(notification.timestamp)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeNotification(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-[#155446] arabic-text mt-1">
                          {notification.message}
                        </p>
                        {notification.target && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              markAsRead(notification.id);
                              onNavigate(notification.target!.page);
                            }}
                            className="mt-2 text-xs"
                          >
                            {notification.target.page === 'invoices'
                              ? 'عرض الفاتورة'
                              : notification.target.page === 'customers'
                                ? 'عرض الزبون'
                                : 'عرض'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





