import React from 'react';
import { Card, CardContent } from '../ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '../ui/utils';

interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  subtitle,
  className 
}: StatCardProps) {
  return (
    <Card className={cn("bg-white border-[#C69A72] hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-[#155446] arabic-text mb-1">{title}</p>
            <div className="text-2xl font-bold text-[#13312A] mb-1">
              {typeof value === 'number' ? value.toLocaleString('ar-IQ') : value}
            </div>
            {subtitle && (
              <p className="text-xs text-[#155446] arabic-text">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-1">
                <span className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-[#155446] mr-1">من الشهر الماضي</span>
              </div>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", color)}>
            <Icon className="w-6 h-6 text-[#F6E9CA]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
