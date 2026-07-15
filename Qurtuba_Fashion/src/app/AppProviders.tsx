import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { NotificationsProvider } from '@/app/NotificationsProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </QueryClientProvider>
  );
}

