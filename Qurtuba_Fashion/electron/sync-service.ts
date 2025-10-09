import { LocalDatabase } from './local-database';
import { createClient } from '@supabase/supabase-js';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingChanges: number;
  isSyncing: boolean;
}

export class SyncService {
  private supabase: any;
  private localDB: LocalDatabase;
  private isOnline: boolean = false;
  private lastSync: string | null = null;
  private isSyncing: boolean = false;

  constructor(localDB: LocalDatabase) {
    this.localDB = localDB;
    this.initializeSupabase();
    this.checkOnlineStatus();
    
    // Check online status every 30 seconds
    setInterval(() => {
      this.checkOnlineStatus();
    }, 30000);
  }

  private initializeSupabase(): void {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  private async checkOnlineStatus(): Promise<void> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase.from('users').select('count').limit(1);
        this.isOnline = !error;
      } else {
        this.isOnline = false;
      }
    } catch (error) {
      this.isOnline = false;
    }
  }

  async syncAll(): Promise<{ success: boolean; message: string; syncedCount: number }> {
    if (!this.isOnline || !this.supabase) {
      return {
        success: false,
        message: 'غير متصل بالإنترنت أو لم يتم تكوين Supabase',
        syncedCount: 0
      };
    }

    if (this.isSyncing) {
      return {
        success: false,
        message: 'جاري المزامنة بالفعل',
        syncedCount: 0
      };
    }

    this.isSyncing = true;
    let syncedCount = 0;

    try {
      // Get unsynced records
      const unsyncedRecords = await this.localDB.getUnsyncedRecords();
      
      // Sync customers
      for (const customer of unsyncedRecords.customers) {
        try {
          const { error } = await this.supabase
            .from('customers')
            .upsert({
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              address: customer.address,
              total_spent: customer.total_spent,
              last_order: customer.last_order,
              label: customer.label,
              measurements: customer.measurements ? JSON.parse(customer.measurements) : null,
              notes: customer.notes,
              created_at: customer.created_at,
              updated_at: customer.updated_at
            });

          if (!error) {
            await this.localDB.markAsSynced('customers', customer.id);
            syncedCount++;
          }
        } catch (error) {
          console.error('Error syncing customer:', error);
        }
      }

      // Sync invoices
      for (const invoice of unsyncedRecords.invoices) {
        try {
          const { error } = await this.supabase
            .from('invoices')
            .upsert({
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              customer_id: invoice.customer_id,
              customer_name: invoice.customer_name,
              customer_phone: invoice.customer_phone,
              customer_address: invoice.customer_address,
              total: invoice.total,
              paid_amount: invoice.paid_amount,
              status: invoice.status,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date,
              notes: invoice.notes,
              fabric_image_url: invoice.fabric_image_url,
              created_at: invoice.created_at,
              updated_at: invoice.updated_at
            });

          if (!error) {
            await this.localDB.markAsSynced('invoices', invoice.id);
            syncedCount++;
          }
        } catch (error) {
          console.error('Error syncing invoice:', error);
        }
      }

      // Sync orders
      for (const order of unsyncedRecords.orders) {
        try {
          const { error } = await this.supabase
            .from('orders')
            .upsert({
              id: order.id,
              customer_id: order.customer_id,
              order_date: order.order_date,
              delivery_date: order.delivery_date,
              status: order.status,
              total: order.total,
              notes: order.notes,
              created_at: order.created_at,
              updated_at: order.updated_at
            });

          if (!error) {
            await this.localDB.markAsSynced('orders', order.id);
            syncedCount++;
          }
        } catch (error) {
          console.error('Error syncing order:', error);
        }
      }

      // Download changes from cloud
      await this.downloadChanges();

      this.lastSync = new Date().toISOString();

      return {
        success: true,
        message: `تم مزامنة ${syncedCount} سجل بنجاح`,
        syncedCount
      };

    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء المزامنة',
        syncedCount
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async downloadChanges(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Download customers
      const { data: customers } = await this.supabase
        .from('customers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (customers) {
        for (const customer of customers) {
          // Check if local version exists and is older
          const localCustomers = await this.localDB.getCustomers();
          const localCustomer = localCustomers.find(c => c.id === customer.id);
          
          if (!localCustomer || new Date(customer.updated_at) > new Date(localCustomer.updated_at)) {
            // Update local database
            if (localCustomer) {
              await this.localDB.updateCustomer(customer.id, {
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                totalSpent: customer.total_spent,
                lastOrder: customer.last_order,
                label: customer.label,
                measurements: customer.measurements,
                notes: customer.notes
              });
            }
          }
        }
      }

      // Download invoices
      const { data: invoices } = await this.supabase
        .from('invoices')
        .select('*')
        .order('updated_at', { ascending: false });

      if (invoices) {
        for (const invoice of invoices) {
          const localInvoices = await this.localDB.getInvoices();
          const localInvoice = localInvoices.find(i => i.id === invoice.id);
          
          if (!localInvoice || new Date(invoice.updated_at) > new Date(localInvoice.updated_at)) {
            if (localInvoice) {
              await this.localDB.updateInvoice(invoice.id, {
                customer_id: invoice.customer_id,
                customer_name: invoice.customer_name,
                customer_phone: invoice.customer_phone,
                customer_address: invoice.customer_address,
                total: invoice.total,
                paid_amount: invoice.paid_amount,
                status: invoice.status,
                invoice_date: invoice.invoice_date,
                due_date: invoice.due_date,
                notes: invoice.notes,
                fabric_image_url: invoice.fabric_image_url
              });
            }
          }
        }
      }

      // Download orders
      const { data: orders } = await this.supabase
        .from('orders')
        .select('*')
        .order('updated_at', { ascending: false });

      if (orders) {
        for (const order of orders) {
          const localOrders = await this.localDB.getOrders();
          const localOrder = localOrders.find(o => o.id === order.id);
          
          if (!localOrder || new Date(order.updated_at) > new Date(localOrder.updated_at)) {
            if (localOrder) {
              await this.localDB.updateOrder(order.id, {
                customer_id: order.customer_id,
                order_date: order.order_date,
                delivery_date: order.delivery_date,
                status: order.status,
                total: order.total,
                notes: order.notes
              });
            }
          }
        }
      }

    } catch (error) {
      console.error('Error downloading changes:', error);
    }
  }

  async forceSync(): Promise<{ success: boolean; message: string }> {
    if (!this.isOnline) {
      return {
        success: false,
        message: 'غير متصل بالإنترنت'
      };
    }

    try {
      // Force sync all data
      await this.syncAll();
      
      // Download all data from cloud
      await this.downloadChanges();

      return {
        success: true,
        message: 'تم المزامنة القسرية بنجاح'
      };
    } catch (error) {
      console.error('Force sync error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء المزامنة القسرية'
      };
    }
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      pendingChanges: 0, // This would be calculated from unsynced records
      isSyncing: this.isSyncing
    };
  }

  async getPendingChangesCount(): Promise<number> {
    try {
      const unsyncedRecords = await this.localDB.getUnsyncedRecords();
      return unsyncedRecords.customers.length + 
             unsyncedRecords.invoices.length + 
             unsyncedRecords.orders.length;
    } catch (error) {
      console.error('Error getting pending changes count:', error);
      return 0;
    }
  }

  // Auto-sync when online
  async startAutoSync(): Promise<void> {
    setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        const pendingCount = await this.getPendingChangesCount();
        if (pendingCount > 0) {
          await this.syncAll();
        }
      }
    }, 60000); // Check every minute
  }
}
