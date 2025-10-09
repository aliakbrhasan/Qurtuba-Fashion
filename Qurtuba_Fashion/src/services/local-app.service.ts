import { DatabaseService } from '@/db/database.service';

export interface LocalAppConfig {
  isElectron: boolean;
  isOnline: boolean;
  autoSync: boolean;
  syncInterval: number; // in minutes
}

export class LocalAppService {
  private static instance: LocalAppService;
  private config: LocalAppConfig;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      isElectron: this.isElectronApp(),
      isOnline: navigator.onLine,
      autoSync: true,
      syncInterval: 5 // 5 minutes
    };

    this.initializeApp();
  }

  public static getInstance(): LocalAppService {
    if (!LocalAppService.instance) {
      LocalAppService.instance = new LocalAppService();
    }
    return LocalAppService.instance;
  }

  private isElectronApp(): boolean {
    return !!(window as any).electronAPI;
  }

  private async initializeApp(): Promise<void> {
    if (this.config.isElectron) {
      // Initialize Electron-specific features
      await this.initializeElectronFeatures();
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.config.isOnline = true;
      this.handleOnlineStatus();
    });

    window.addEventListener('offline', () => {
      this.config.isOnline = false;
      this.handleOfflineStatus();
    });

    // Start auto-sync if enabled
    if (this.config.autoSync && this.config.isElectron) {
      this.startAutoSync();
    }
  }

  private async initializeElectronFeatures(): Promise<void> {
    try {
      // Check if we're online
      const onlineStatus = await (window as any).electronAPI.offline.isOnline();
      this.config.isOnline = onlineStatus;

      // Listen for sync events
      (window as any).electronAPI.onSyncCompleted(() => {
        console.log('Sync completed successfully');
        this.showNotification('تم مزامنة البيانات بنجاح', 'success');
      });

      (window as any).electronAPI.onSyncError((error: any) => {
        console.error('Sync error:', error);
        this.showNotification('حدث خطأ أثناء المزامنة', 'error');
      });

    } catch (error) {
      console.error('Error initializing Electron features:', error);
    }
  }

  private handleOnlineStatus(): void {
    console.log('App is online');
    if (this.config.isElectron) {
      this.triggerSync();
    }
  }

  private handleOfflineStatus(): void {
    console.log('App is offline');
    this.showNotification('التطبيق يعمل في وضع عدم الاتصال', 'info');
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.config.isOnline && this.config.autoSync) {
        await this.triggerSync();
      }
    }, this.config.syncInterval * 60 * 1000);
  }

  private async triggerSync(): Promise<void> {
    if (!this.config.isElectron) return;

    try {
      const result = await (window as any).electronAPI.sync.start();
      if (result.success) {
        console.log(`Synced ${result.syncedCount} records`);
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Public methods
  public async getCustomers(): Promise<any[]> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.getCustomers();
      } catch (error) {
        console.error('Error getting customers from local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().getCustomers();
      }
    } else {
      return await DatabaseService.getInstance().getCustomers();
    }
  }

  public async createCustomer(customer: any): Promise<any> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.createCustomer(customer);
      } catch (error) {
        console.error('Error creating customer in local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().createCustomer(customer);
      }
    } else {
      return await DatabaseService.getInstance().createCustomer(customer);
    }
  }

  public async updateCustomer(id: string, updates: any): Promise<any> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.updateCustomer(id, updates);
      } catch (error) {
        console.error('Error updating customer in local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().updateCustomer(id, updates);
      }
    } else {
      return await DatabaseService.getInstance().updateCustomer(id, updates);
    }
  }

  public async deleteCustomer(id: string): Promise<void> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.deleteCustomer(id);
      } catch (error) {
        console.error('Error deleting customer from local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().deleteCustomer(id);
      }
    } else {
      return await DatabaseService.getInstance().deleteCustomer(id);
    }
  }

  public async getInvoices(): Promise<any[]> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.getInvoices();
      } catch (error) {
        console.error('Error getting invoices from local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().getInvoices();
      }
    } else {
      return await DatabaseService.getInstance().getInvoices();
    }
  }

  public async createInvoice(invoice: any): Promise<any> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.createInvoice(invoice);
      } catch (error) {
        console.error('Error creating invoice in local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().createInvoice(invoice);
      }
    } else {
      return await DatabaseService.getInstance().createInvoice(invoice);
    }
  }

  public async updateInvoice(id: string, updates: any): Promise<any> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.updateInvoice(id, updates);
      } catch (error) {
        console.error('Error updating invoice in local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().updateInvoice(id, updates);
      }
    } else {
      return await DatabaseService.getInstance().updateInvoice(id, updates);
    }
  }

  public async deleteInvoice(id: string): Promise<void> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.deleteInvoice(id);
      } catch (error) {
        console.error('Error deleting invoice from local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().deleteInvoice(id);
      }
    } else {
      return await DatabaseService.getInstance().deleteInvoice(id);
    }
  }

  public async getOrders(): Promise<any[]> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.getOrders();
      } catch (error) {
        console.error('Error getting orders from local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().getOrders();
      }
    } else {
      return await DatabaseService.getInstance().getOrders();
    }
  }

  public async createOrder(order: any): Promise<any> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.createOrder(order);
      } catch (error) {
        console.error('Error creating order in local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().createOrder(order);
      }
    } else {
      return await DatabaseService.getInstance().createOrder(order);
    }
  }

  public async updateOrder(id: string, updates: any): Promise<any> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.updateOrder(id, updates);
      } catch (error) {
        console.error('Error updating order in local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().updateOrder(id, updates);
      }
    } else {
      return await DatabaseService.getInstance().updateOrder(id, updates);
    }
  }

  public async deleteOrder(id: string): Promise<void> {
    if (this.config.isElectron) {
      try {
        return await (window as any).electronAPI.local.deleteOrder(id);
      } catch (error) {
        console.error('Error deleting order from local DB:', error);
        // Fallback to cloud database
        return await DatabaseService.getInstance().deleteOrder(id);
      }
    } else {
      return await DatabaseService.getInstance().deleteOrder(id);
    }
  }

  // Sync methods
  public async syncData(): Promise<{ success: boolean; message: string }> {
    if (!this.config.isElectron) {
      return { success: false, message: 'المزامنة متاحة فقط في التطبيق المحلي' };
    }

    try {
      const result = await (window as any).electronAPI.sync.start();
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, message: 'حدث خطأ أثناء المزامنة' };
    }
  }

  public async getSyncStatus(): Promise<any> {
    if (!this.config.isElectron) {
      return { isOnline: this.config.isOnline, lastSync: null, pendingChanges: 0, isSyncing: false };
    }

    try {
      return await (window as any).electronAPI.sync.getStatus();
    } catch (error) {
      console.error('Error getting sync status:', error);
      return { isOnline: this.config.isOnline, lastSync: null, pendingChanges: 0, isSyncing: false };
    }
  }

  public async forceSync(): Promise<{ success: boolean; message: string }> {
    if (!this.config.isElectron) {
      return { success: false, message: 'المزامنة القسرية متاحة فقط في التطبيق المحلي' };
    }

    try {
      const result = await (window as any).electronAPI.sync.forceSync();
      return result;
    } catch (error) {
      console.error('Force sync error:', error);
      return { success: false, message: 'حدث خطأ أثناء المزامنة القسرية' };
    }
  }

  // Configuration methods
  public getConfig(): LocalAppConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<LocalAppConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.autoSync !== undefined || updates.syncInterval !== undefined) {
      if (this.config.autoSync && this.config.isElectron) {
        this.startAutoSync();
      } else if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    }
  }

  // Utility methods
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // This would integrate with your notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  public isElectronApp(): boolean {
    return this.config.isElectron;
  }

  public isOnline(): boolean {
    return this.config.isOnline;
  }

  public async getOfflineData(): Promise<any> {
    if (!this.config.isElectron) {
      return null;
    }

    try {
      return await (window as any).electronAPI.offline.getOfflineData();
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }
}
