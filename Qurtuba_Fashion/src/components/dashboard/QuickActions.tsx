import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Scissors, Receipt, Users, Settings } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  color: string;
  description?: string;
}

interface QuickActionsProps {
  onCreateInvoice: () => void;
  onNavigate: (page: string) => void;
}

export function QuickActions({ onCreateInvoice, onNavigate }: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    { 
      label: 'فاتورة جديدة', 
      icon: Receipt, 
      action: onCreateInvoice, 
      color: 'bg-[#155446]',
      description: 'إنشاء فاتورة جديدة للعميل'
    },
    { 
      label: 'إدارة الزبائن', 
      icon: Users, 
      action: () => onNavigate('customers'), 
      color: 'bg-[#13312A]',
      description: 'عرض وإدارة بيانات الزبائن'
    },
    { 
      label: 'إدارة المستخدمين', 
      icon: Settings, 
      action: () => onNavigate('users'), 
      color: 'bg-[#C69A72]',
      description: 'إدارة المستخدمين والصلاحيات'
    }
  ];

  return (
    <Card className="bg-white border-[#C69A72]">
      <CardHeader>
        <CardTitle className="text-[#13312A] arabic-text flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={action.action}
                className={`${action.color} hover:opacity-90 text-[#F6E9CA] p-4 h-auto flex flex-col items-center gap-2 touch-target transition-all hover:scale-105`}
              >
                <Icon className="w-6 h-6" />
                <div className="text-center">
                  <span className="arabic-text font-medium">{action.label}</span>
                  {action.description && (
                    <p className="text-xs opacity-90 mt-1 arabic-text">
                      {action.description}
                    </p>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}




