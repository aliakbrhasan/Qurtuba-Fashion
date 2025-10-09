import { useQuery } from '@tanstack/react-query';
import { databaseService } from '@/db/database.service';
import type { Invoice, Customer } from '@/db/database.service';

export interface DashboardStats {
  totalInvoices: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
  partialInvoices: number;
  todayInvoices: number;
  recentInvoices: Invoice[];
  recentCustomers: Customer[];
  upcomingDeliveries: Invoice[];
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  filteredInvoices: Invoice[];
}

export function useDashboardStats(params?: { startDate?: string; endDate?: string }) {
  const { startDate, endDate } = params || {};

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats', startDate || null, endDate || null],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Fetch all data in parallel
        const [invoices, customers, orders] = await Promise.all([
          databaseService.getInvoices(),
          databaseService.getCustomers(),
          databaseService.getOrders()
        ]);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Apply optional date range filter
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const withinRange = (d: string) => {
          const dt = new Date(d);
          if (start && dt < start) return false;
          if (end) {
            const endDay = new Date(end);
            endDay.setHours(23, 59, 59, 999);
            if (dt > endDay) return false;
          }
          return true;
        };

        const filteredInvoices = invoices.filter(inv => withinRange(inv.created_at));

        // Calculate statistics
        const totalInvoices = filteredInvoices.length;
        const totalCustomers = customers.length;
        const totalOrders = orders.length;
        
        const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0);
        const monthlyRevenue = filteredInvoices
          .filter(invoice => new Date(invoice.created_at) >= monthAgo)
          .reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0);
        const weeklyRevenue = filteredInvoices
          .filter(invoice => new Date(invoice.created_at) >= weekAgo)
          .reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0);
        const dailyRevenue = filteredInvoices
          .filter(invoice => new Date(invoice.created_at) >= today)
          .reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0);

        const pendingInvoices = filteredInvoices.filter(invoice => invoice.status === 'معلق').length;
        const paidInvoices = filteredInvoices.filter(invoice => invoice.status === 'مدفوع').length;
        const partialInvoices = filteredInvoices.filter(invoice => invoice.status === 'جزئي').length;
        const todayInvoices = filteredInvoices.filter(invoice => 
          new Date(invoice.created_at) >= today
        ).length;

        // Recent data (last 5 items)
        const recentInvoices = filteredInvoices
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        const recentCustomers = customers
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 5);

        // Upcoming deliveries (invoices with due dates in the next 7 days)
        const upcomingDeliveries = filteredInvoices
          .filter(invoice => {
            if (!invoice.due_date) return false;
            const dueDate = new Date(invoice.due_date);
            const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff <= 7;
          })
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
          .slice(0, 5);

        return {
          totalInvoices,
          totalCustomers,
          totalOrders,
          totalRevenue,
          pendingInvoices,
          paidInvoices,
          partialInvoices,
          todayInvoices,
          recentInvoices,
          recentCustomers,
          upcomingDeliveries,
          monthlyRevenue,
          weeklyRevenue,
          dailyRevenue,
          filteredInvoices
        };
      } catch (error) {
        console.error('Error calculating dashboard stats:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  return {
    stats: stats || {
      totalInvoices: 0,
      totalCustomers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingInvoices: 0,
      paidInvoices: 0,
      partialInvoices: 0,
      todayInvoices: 0,
      recentInvoices: [],
      recentCustomers: [],
      upcomingDeliveries: [],
      monthlyRevenue: 0,
      weeklyRevenue: 0,
      dailyRevenue: 0,
      filteredInvoices: []
    },
    isLoading,
    error: error?.message || null,
    refetch
  };
}




