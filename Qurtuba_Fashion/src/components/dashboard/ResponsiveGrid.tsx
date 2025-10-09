import React from 'react';
import { cn } from '../ui/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 } 
}: ResponsiveGridProps) {
  const getGridCols = () => {
    const classes = [];
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div className={cn(
      "grid gap-4",
      getGridCols(),
      className
    )}>
      {children}
    </div>
  );
}

// Predefined grid layouts for common use cases
export const DashboardGrids = {
  Stats: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid 
      cols={{ default: 1, sm: 2, lg: 4 }} 
      className={className}
    >
      {children}
    </ResponsiveGrid>
  ),
  
  Revenue: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid 
      cols={{ default: 1, md: 3 }} 
      className={className}
    >
      {children}
    </ResponsiveGrid>
  ),
  
  Status: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid 
      cols={{ default: 1, md: 3 }} 
      className={className}
    >
      {children}
    </ResponsiveGrid>
  ),
  
  Activities: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid 
      cols={{ default: 1, lg: 2 }} 
      className={className}
    >
      {children}
    </ResponsiveGrid>
  ),
  
  QuickActions: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ResponsiveGrid 
      cols={{ default: 1, md: 2, lg: 3 }} 
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
};





