import { supabase } from './client';
import { storage } from '@/storage';
import { syncEngine } from '@/sync';
import type { User, Role } from '../types/user';
import type { Order, NewOrder } from '../ports/orders';
import { authService } from '@/services/auth.service';

// Customer interface
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  totalSpent?: number;
  lastOrder?: string;
  label?: string;
  label_auto?: boolean; // Flag to indicate if label should be calculated automatically
  measurements?: {
    height: number;
    shoulder: number;
    waist: number;
    chest: number;
    collar: number;
  };
  notes?: string;
  created_at: string;
}

// Invoice interfaces
export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  total: number;
  paid_amount: number;
  status: string;
  invoice_date: string;
  due_date?: string;
  notes?: string;
  // Snapshot of customer's measurements at time of invoice creation
  customer_measurements?: any;
  fabric_image_url?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface NewInvoice {
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  total: number;
  paid_amount?: number;
  status?: string;
  due_date?: string;
  notes?: string;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
  fabric_image_url?: string;
  // Optional design details saved with the invoice (comma-separated lists)
  fabric_type?: string;   // e.g. "ØµÙŠÙÙŠØŒ Ø´ØªÙˆÙŠ"
  fabric_source?: string; // e.g. "Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ø­Ù„ØŒ Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø­Ù„"
  collar_type?: string;
  chest_style?: string;
  sleeve_end?: string;
  bunija_type?: string;
}

// Database service that handles both local and Supabase operations
export class DatabaseService {
  private static instance: DatabaseService;
  private localOnly = true;
  private localData: {
    users: User[];
    roles: Role[];
    customers: Customer[];
    orders: Order[];
    invoices: Invoice[];
    invoiceItems: InvoiceItem[];
  } = {
    users: [],
    roles: [],
    customers: [],
    orders: [],
    invoices: [],
    invoiceItems: []
  };

  // Local persistence keys for browser fallback
  private readonly LOCAL_INVOICES_KEY = 'qf_local_invoices';
  private readonly LOCAL_INVOICE_ITEMS_KEY = 'qf_local_invoice_items';
  private readonly LOCAL_DB_CACHE_KEY = 'qf_local_db_cache_v1';

  private constructor() {
    this.initializeLocalData();
    this.loadAllFromStorage();
  }

  // Build a reliable executor display name even for admin/remembered sessions
  private getExecutorName(): string | undefined {
    try {
      const user = authService.getCurrentUser();
      const name = (user?.name || '').trim();
      if (name) return name;
      const role = (user?.role || '').trim();
      if (role) return role;
      const status = (user?.status || '').trim();
      if (status) return status as any;
      const code = (user?.code || '').trim();
      if (code) return code;
    } catch {}
    return 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù†Ø¸Ø§Ù…';
  }

  // Helper function to ensure proper UTF-8 encoding for Arabic text
  private ensureUtf8Encoding(text: string | null | undefined): string {
    if (!text) return '';
    
    try {
      // Check if text is already properly encoded
      const encoded = encodeURIComponent(text);
      const decoded = decodeURIComponent(encoded);
      
      if (decoded === text) {
        return text;
      }
      
      // Try to fix encoding issues
      return decodeURIComponent(encodeURIComponent(text));
    } catch (error) {
      console.warn('Encoding fix failed, returning original text:', error);
      return text;
    }
  }

  // Helper function to sanitize text data for database storage
  private sanitizeTextData(data: any): any {
    if (typeof data === 'string') {
      return this.ensureUtf8Encoding(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeTextData(item));
    }
    
    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeTextData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Enable/disable Supabase usage globally
  public setLocalOnlyMode(enabled: boolean) {
    this.localOnly = !!enabled;
  }
  public isLocalOnlyMode(): boolean { return this.localOnly; }

  private initializeLocalData() {
    // Initialize with default data
    this.localData.users = [
      {
        id: 1,
        code: 'ADM001',
        name: 'Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯',
        email: 'ahmed@qurtuba.com',
        phone: '07701234567',
        status: 'Ø§Ø¯Ù…Ù†',
        role: 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…',
        isActive: true,
        createdAt: '2024-01-01',
        lastLogin: '2024-01-15'
      }
    ];

    this.localData.roles = [
      {
        id: 1,
        name: 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…',
        description: 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„ÙƒØ§Ù…Ù„',
        permissions: ['all'],
        allowedPages: ['dashboard', 'customers', 'orders', 'invoices', 'users', 'roles'],
        allowedActions: ['create', 'read', 'update', 'delete', 'export', 'print'],
        isActive: true,
        createdAt: '2024-01-01'
      }
    ];

    // Attempt to load persisted invoices/items for browser fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedInvoices = window.localStorage.getItem(this.LOCAL_INVOICES_KEY);
        if (storedInvoices) {
          this.localData.invoices = JSON.parse(storedInvoices);
        }
        const storedInvoiceItems = window.localStorage.getItem(this.LOCAL_INVOICE_ITEMS_KEY);
        if (storedInvoiceItems) {
          this.localData.invoiceItems = JSON.parse(storedInvoiceItems);
        }
      }
    } catch (error) {
      console.warn('Failed to load local invoices from storage:', error);
    }
  }

  private loadAllFromStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const raw = window.localStorage.getItem(this.LOCAL_DB_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        this.localData.users = Array.isArray(parsed.users) ? parsed.users : this.localData.users;
        this.localData.roles = Array.isArray(parsed.roles) ? parsed.roles : this.localData.roles;
        this.localData.customers = Array.isArray(parsed.customers) ? parsed.customers : this.localData.customers;
        this.localData.orders = Array.isArray(parsed.orders) ? parsed.orders : this.localData.orders;
        this.localData.invoices = Array.isArray(parsed.invoices) ? parsed.invoices : this.localData.invoices;
        this.localData.invoiceItems = Array.isArray(parsed.invoiceItems) ? parsed.invoiceItems : this.localData.invoiceItems;
      }
    } catch (error) {
      console.warn('Failed to load local DB cache:', error);
    }
  }

  private persistAllToStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(this.LOCAL_DB_CACHE_KEY, JSON.stringify(this.localData));
    } catch (error) {
      console.warn('Failed to persist local DB cache:', error);
    }
  }

  // Replace local cache only when remote returns non-empty data
  // Removed remote replace helper in local-only mode

  // Users operations
  async getUsers(): Promise<User[]> {
    if (this.localOnly) return this.localData.users;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, code, name, email, phone, status, role, is_active, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((u: any) => this.mapSupabaseUserToUser(u));
      this.localData.users = mapped;
      this.persistAllToStorage();
      return mapped;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.users;
    }
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (this.localOnly) {
      const newUser: User = { ...user, id: Date.now(), createdAt: new Date().toISOString() } as any;
      this.localData.users.unshift(newUser);
      this.persistAllToStorage();
      return newUser;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          code: user.code,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          role: user.role,
          is_active: user.isActive,
          last_login: user.lastLogin
        })
        .select('id, code, name, email, phone, status, role, is_active, created_at, last_login')
        .single();

      if (error) throw error;
      const created = this.mapSupabaseUserToUser(data);
      this.localData.users = [created, ...this.localData.users];
      this.persistAllToStorage();
      return created;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const newUser: User = {
        ...user,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      this.localData.users.push(newUser);
      this.persistAllToStorage();
      return newUser;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    if (this.localOnly) {
      const idx = this.localData.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.localData.users[idx] = { ...this.localData.users[idx], ...updates } as any;
        this.persistAllToStorage();
        return this.localData.users[idx];
      }
      throw new Error('User not found');
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          code: updates.code,
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          status: updates.status,
          role: updates.role,
          is_active: updates.isActive,
          last_login: updates.lastLogin
        })
        .eq('id', id)
        .select('id, code, name, email, phone, status, role, is_active, created_at, last_login')
        .single();

      if (error) throw error;
      const updated = this.mapSupabaseUserToUser(data);
      const idx = this.localData.users.findIndex(u => u.id === id);
      if (idx !== -1) this.localData.users[idx] = updated;
      this.persistAllToStorage();
      return updated;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const userIndex = this.localData.users.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        this.localData.users[userIndex] = { ...this.localData.users[userIndex], ...updates };
        this.persistAllToStorage();
        return this.localData.users[userIndex];
      }
      throw new Error('User not found');
    }
  }

  async deleteUser(id: number): Promise<void> {
    if (this.localOnly) {
      this.localData.users = this.localData.users.filter(u => u.id !== id);
      this.persistAllToStorage();
      return;
    }
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      this.localData.users = this.localData.users.filter(u => u.id !== id);
      this.persistAllToStorage();
    }
  }

  // Roles operations
  async getRoles(): Promise<Role[]> {
    if (this.localOnly) return this.localData.roles;
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = data || [];
      this.localData.roles = rows as any;
      this.persistAllToStorage();
      return rows as any;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.roles;
    }
  }

  // Customers operations (local-first)
  async getCustomers(): Promise<Customer[]> {
    try {
      const locals = await storage.getCustomers();
      this.localData.customers = locals;
      this.persistAllToStorage();
      return locals;
    } catch (error) {
      console.warn('Local storage error:', error);
      return this.localData.customers;
    }
  }

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    try {
      const created = await storage.createCustomer(customer as any);
      this.localData.customers = [created, ...this.localData.customers];
      this.persistAllToStorage();
      (syncEngine as any).schedule?.();
      try { await (syncEngine as any).sync?.(); } catch {}
      // Admin log: create customer
      try {
        const execName = this.getExecutorName();
        await (storage as any).createAdminLog?.({
          action_type: 'create',
          entity_type: 'customer',
          entity_id: String((created as any).id),
          changed_fields: Object.keys(customer || {}),
          user_name: execName,
        });
      } catch {}
      return created;
    } catch (error) {
      console.warn('Local storage error:', error);
      const newCustomer: Customer = { ...customer, id: Date.now().toString() } as any;
      this.localData.customers.push(newCustomer);
      this.persistAllToStorage();
      return newCustomer;
    } finally {
      // Emit notification only once, regardless of success or fallback
      try {
        const { notifications } = await import('@/services/notifications.service');
        notifications.emit({
          type: 'success',
          title: 'Ø²Ø¨ÙˆÙ† Ø¬Ø¯ÙŠØ¯',
          message: `ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø²Ø¨ÙˆÙ† ${customer.name}`,
          target: { page: 'customers', id: (this.localData.customers[0] as any).id?.toString?.() },
        });
      } catch {}
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>, options?: { silent?: boolean }): Promise<Customer> {
    try {
      // Allow label_auto to persist (Electron DB now migrates it); keep updates as-is
      const storageUpdates: any = { ...(updates as any) };
      // Skip write if no actual change for provided keys
      const idxExisting = this.localData.customers.findIndex(c => String(c.id) === String(id));
      if (idxExisting !== -1) {
        const current = this.localData.customers[idxExisting] as any;
        let changed = false;
        for (const key of Object.keys(storageUpdates || {})) {
          const nextVal = (storageUpdates as any)[key];
          const prevVal = current[key];
          if (typeof nextVal === 'object' && nextVal !== null) {
            if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) { changed = true; break; }
          } else if (prevVal !== nextVal) { changed = true; break; }
        }
        if (!changed) {
          return this.localData.customers[idxExisting];
        }
      }

      const updated = await storage.updateCustomer(id, storageUpdates as any);
      const idx = this.localData.customers.findIndex(c => String(c.id) === String(id));
      if (idx !== -1) this.localData.customers[idx] = { ...(updated as any) } as any; else this.localData.customers.unshift(updated);
      // Overlay transient fields on local cache (e.g., label_auto)
      if (idx !== -1 && 'label_auto' in (updates as any)) {
        (this.localData.customers[idx] as any).label_auto = (updates as any).label_auto;
      }
      this.persistAllToStorage();
      (syncEngine as any).schedule?.();
      try { await (syncEngine as any).sync?.(); } catch {}
      // Admin log: update customer (skip if silent)
      try {
        if (!options?.silent) {
          const execName = this.getExecutorName();
          await (storage as any).createAdminLog?.({
            action_type: 'update',
            entity_type: 'customer',
            entity_id: String(id),
            changed_fields: Object.keys(storageUpdates || {}),
            user_name: execName,
          });
        }
      } catch {}
      return updated;
    } catch (error) {
      console.warn('Local storage error:', error);
      const customerIndex = this.localData.customers.findIndex(c => String(c.id) === String(id));
      if (customerIndex !== -1) {
        this.localData.customers[customerIndex] = { ...this.localData.customers[customerIndex], ...updates } as any;
        this.persistAllToStorage();
        return this.localData.customers[customerIndex];
      }
      throw new Error('Customer not found');
    } finally {
      // Emit notification only once, regardless of success or fallback
      if (!options?.silent) {
        try {
          const { notifications } = await import('@/services/notifications.service');
          notifications.emit({
            type: 'info',
            title: 'ØªØ¹Ø¯ÙŠÙ„ Ø²Ø¨ÙˆÙ†',
            message: `ØªÙ… ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø²Ø¨ÙˆÙ†`,
            target: { page: 'customers', id: id?.toString?.() },
          });
        } catch {}
      }
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      // Use LocalAppService if in Electron, otherwise use storage directly
      const { LocalAppService } = await import('@/services/local-app.service');
      const localApp = LocalAppService.getInstance?.();
      if (localApp?.getConfig?.().isElectron) {
        // Use LocalAppService which calls Electron API directly
        await localApp.deleteCustomer(id);
      } else {
        // Web mode: use storage directly
        await (storage as any).deleteCustomer?.(id);
      }
    } catch (error) {
      console.warn('Primary delete method failed, trying fallback:', error);
      // Fallback to direct storage call
      try {
        await (storage as any).deleteCustomer?.(id);
      } catch (fallbackError) {
        console.error('Fallback delete also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    // Update local cache to remove deleted customer
    const beforeCount = this.localData.customers.length;
    this.localData.customers = this.localData.customers.filter(c => String((c as any).id) !== String(id));
    const afterCount = this.localData.customers.length;
    console.log(`Local cache updated: ${beforeCount} -> ${afterCount} customers (deleted: ${id})`);
    this.persistAllToStorage();
    (syncEngine as any).schedule?.();
    try { await (syncEngine as any).sync?.(); } catch {}
    
    // Admin log: delete customer
    try {
      const execName = this.getExecutorName();
      await (storage as any).createAdminLog?.({
        action_type: 'delete',
        entity_type: 'customer',
        entity_id: String(id),
        changed_fields: ['deleted'],
        user_name: execName,
      });
    } catch {}
  }

  // Delete customer and all related invoices/items (local-first cascade)
  async deleteCustomerCascade(id: string): Promise<void> {
    try {
      // Snapshot relevant invoices by id or alias
      const invoices = await this.getInvoices();
      const customer = this.localData.customers.find(c => String((c as any).id) === String(id));
      const name = (customer as any)?.name?.trim?.() || '';
      const phone = (customer as any)?.phone?.trim?.() || '';
      const alias = `${name}|${phone}`;

      const related = invoices.filter(inv =>
        String((inv as any).customer_id || '') === String(id)
        || `${(inv.customer_name || '').trim()}|${(inv.customer_phone || '').trim()}` === alias
      );

      for (const inv of related) {
        try { await this.deleteInvoice(String(inv.id)); } catch {}
      }

      await this.deleteCustomer(id);
    } catch (e) {
      // Fallback: at least delete the customer
      try { await this.deleteCustomer(id); } catch {}
      console.warn('deleteCustomerCascade fallback:', e);
    }
  }

  // Orders operations (local-first)
  async getOrders(): Promise<Order[]> { try { const rows = await storage.getOrders(); this.localData.orders = rows; this.persistAllToStorage(); return rows; } catch { return this.localData.orders; } }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> { const all = await this.getOrders(); return all.filter(o => (o as any).customer_id === customerId); }

  async createOrder(order: NewOrder): Promise<Order> { const created = await storage.createOrder(order); this.localData.orders = [created, ...this.localData.orders]; this.persistAllToStorage(); (syncEngine as any).schedule?.(); try { await (syncEngine as any).sync?.(); } catch {}; return created; }

  // Invoice operations (local-first)
  async getInvoices(): Promise<Invoice[]> {
    try {
      let rows = await storage.getInvoices();
      // Fallback: migrate legacy localStorage keys if current storage is empty
      if ((!rows || rows.length === 0) && typeof window !== 'undefined' && (window as any).localStorage) {
        try {
          const legacy = window.localStorage.getItem('qf_local_invoices');
          if (legacy) {
            rows = JSON.parse(legacy);
          } else {
            const cache = window.localStorage.getItem('qf_local_db_cache_v1');
            if (cache) {
              const parsed = JSON.parse(cache);
              if (Array.isArray(parsed?.invoices)) rows = parsed.invoices;
            }
          }
        } catch {}
      }
      // Filter out deleted invoices (soft delete: deleted = 1 or deleted = true)
      const filtered = (rows || []).filter(inv => {
        const deleted = (inv as any).deleted;
        return !deleted && deleted !== 1 && deleted !== '1' && deleted !== true;
      });
      this.localData.invoices = filtered;
      this.persistAllToStorage();
      return this.localData.invoices;
    } catch {
      // Filter local data as well
      const filtered = this.localData.invoices.filter(inv => {
        const deleted = (inv as any).deleted;
        return !deleted && deleted !== 1 && deleted !== '1' && deleted !== true;
      });
      return filtered;
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const all = await this.getInvoices();
    const idStr = String(id ?? '').trim();
    const idNum = Number(idStr);
    const hasNumericId = !Number.isNaN(idNum) && Number.isFinite(idNum);

    const matches = (invoice: Invoice): boolean => {
      const invId = (invoice as any)?.id;
      const invNumber = (invoice as any)?.invoice_number;
      const invIdStr = String(invId ?? '').trim();
      const invNumberStr = String(invNumber ?? '').trim();

      if (idStr && (invIdStr === idStr || invNumberStr === idStr)) {
        return true;
      }

      if (hasNumericId) {
        const invIdNum = Number(invId);
        const invNumberNum = Number(invNumber);
        if ((Number.isFinite(invIdNum) && invIdNum === idNum) ||
            (Number.isFinite(invNumberNum) && invNumberNum === idNum)) {
          return true;
        }
      }

      return false;
    };

    return all.find(matches) || null;
  }

  async createInvoice(invoice: NewInvoice): Promise<Invoice> {
    // Local-first write for instant UX
    const created = await storage.createInvoice(invoice as any);
    // Prevent duplicate push if same id already present (defensive)
    if (!this.localData.invoices.find(i => String(i.id) === String((created as any).id))) {
      this.localData.invoices = [created, ...this.localData.invoices];
      this.persistAllToStorage();
    }
    
    // Auto-upsert customer from the created invoice to keep lists linked
    try {
      const customerName = (created as any).customer_name?.trim?.() || invoice.customer_name?.trim?.();
      const customerPhone = (created as any).customer_phone?.trim?.() || invoice.customer_phone?.trim?.();
      const customerAddress = (created as any).customer_address?.trim?.() || invoice.customer_address?.trim?.();
      const candidateId = (created as any).customer_id || invoice.customer_id;

      const existing = this.localData.customers.find(c => String(c.id) === String(candidateId))
        || (customerPhone ? this.localData.customers.find(c => (c.phone || '').trim() === customerPhone) : undefined)
        || (customerName ? this.localData.customers.find(c => (c.name || '').trim() === customerName) : undefined);

      const lastOrderDate = (created as any).invoice_date || (created as any).created_at;
      const paid = (created as any).paid_amount || 0;

      if (existing) {
        await this.updateCustomer(String((existing as any).id), {
          name: customerName || existing.name,
          phone: customerPhone || existing.phone,
          address: customerAddress || existing.address,
          lastOrder: lastOrderDate,
          totalSpent: (existing.totalSpent || 0) + paid,
        }, { silent: true });
      } else if (customerName) {
        const createdCust = await this.createCustomer({
          name: customerName,
          phone: customerPhone || '',
          address: customerAddress || '',
          label: 'Ø¬Ø¯ÙŠØ¯',
          totalSpent: paid,
          lastOrder: lastOrderDate,
          measurements: { height: 0, shoulder: 0, waist: 0, chest: 0, collar: 0 },
          notes: '',
          created_at: (created as any).created_at,
        } as any);
        // link invoice to created customer id for consistency
        try {
          await this.updateInvoice(String((created as any).id), { customer_id: String((createdCust as any).id) } as any);
        } catch {}
      }
    } catch (e) {
      console.warn('Auto-upsert customer from invoice failed (non-fatal):', e);
    }
    // Schedule sync and run non-blocking in background
    if (!this.localOnly) {
      (syncEngine as any).schedule?.();
      try { (syncEngine as any).sync?.().catch?.(() => {}); } catch {}
    }
    // Admin log: create invoice
    try {
      const execName = this.getExecutorName();
      await (storage as any).createAdminLog?.({
        action_type: 'create',
        entity_type: 'invoice',
        entity_id: String((created as any).id),
        changed_fields: Object.keys(invoice || {}),
        user_name: execName,
      });
    } catch {}
    // Notification emit handled at InvoiceService layer to avoid duplicates
    return created;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const updated = await storage.updateInvoice(id, updates as any);
    const idx = this.localData.invoices.findIndex((inv) => {
      const invId = String((inv as any)?.id ?? '').trim();
      const targetId = String(id ?? '').trim();
      if (invId && targetId && invId === targetId) {
        return true;
      }
      const invIdNum = Number((inv as any)?.id);
      const targetIdNum = Number(id);
      if (Number.isFinite(invIdNum) && Number.isFinite(targetIdNum) && invIdNum === targetIdNum) {
        return true;
      }
      const invNumber = String((inv as any)?.invoice_number ?? '').trim();
      if (invNumber && targetId && invNumber === targetId) {
        return true;
      }
      return false;
    });
    if (idx !== -1) this.localData.invoices[idx] = updated;
    this.persistAllToStorage();
    if (!this.localOnly) {
      (syncEngine as any).schedule?.();
      try { await (syncEngine as any).sync?.(); } catch {}
    }
    // Admin log: update invoice
    try {
      const execName = this.getExecutorName();
      await (storage as any).createAdminLog?.({
        action_type: 'update',
        entity_type: 'invoice',
        entity_id: String(id),
        changed_fields: Object.keys(updates || {}),
        user_name: execName,
      });
    } catch {}
    // Notification emit handled at InvoiceService layer to avoid duplicates
    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    // Get invoice before deletion to update customer totals
    const invoiceToDelete = await this.getInvoiceById(id);
    
    await storage.deleteInvoice(id);

    const idStr = String(id ?? '').trim();
    const idNum = Number(idStr);
    const hasNumericId = !Number.isNaN(idNum) && Number.isFinite(idNum);
    const removalKeys = new Set<string>();
    if (idStr) removalKeys.add(idStr);
    if (hasNumericId) removalKeys.add(String(idNum));

    if (invoiceToDelete) {
      const invId = String((invoiceToDelete as any)?.id ?? '').trim();
      const invNumber = String((invoiceToDelete as any)?.invoice_number ?? '').trim();
      if (invId) removalKeys.add(invId);
      if (invNumber) removalKeys.add(invNumber);
      const invIdNum = Number((invoiceToDelete as any)?.id);
      const invNumberNum = Number((invoiceToDelete as any)?.invoice_number);
      if (Number.isFinite(invIdNum)) removalKeys.add(String(invIdNum));
      if (Number.isFinite(invNumberNum)) removalKeys.add(String(invNumberNum));
    }

    const shouldRemove = (candidate: any): boolean => {
      const candidateId = String(candidate?.id ?? '').trim();
      const candidateNumber = String(candidate?.invoice_number ?? '').trim();
      const candidateIdNum = Number(candidate?.id);
      const candidateNumberNum = Number(candidate?.invoice_number);

      if ((candidateId && removalKeys.has(candidateId)) ||
          (candidateNumber && removalKeys.has(candidateNumber))) {
        return true;
      }
      if (Number.isFinite(candidateIdNum) && removalKeys.has(String(candidateIdNum))) {
        return true;
      }
      if (Number.isFinite(candidateNumberNum) && removalKeys.has(String(candidateNumberNum))) {
        return true;
      }
      return false;
    };

    this.localData.invoices = this.localData.invoices.filter(inv => !shouldRemove(inv));

    const invoiceItemKeys = new Set<string>();
    if (invoiceToDelete) {
      const key = String((invoiceToDelete as any)?.id ?? '').trim();
      if (key) invoiceItemKeys.add(key);
      const keyNum = Number((invoiceToDelete as any)?.id);
      if (Number.isFinite(keyNum)) invoiceItemKeys.add(String(keyNum));
    }
    for (const variant of removalKeys) {
      if (variant) invoiceItemKeys.add(variant);
    }

    this.localData.invoiceItems = this.localData.invoiceItems.filter(item => {
      const candidateId = String(item?.invoice_id ?? '').trim();
      if (candidateId && invoiceItemKeys.has(candidateId)) {
        return false;
      }
      const candidateIdNum = Number(item?.invoice_id);
      if (Number.isFinite(candidateIdNum) && invoiceItemKeys.has(String(candidateIdNum))) {
        return false;
      }
      return true;
    });
    this.persistAllToStorage();
    
    // Recalculate customer totals from remaining invoices after deletion
    // This ensures total_spent is always accurate and dynamic
    let remainingInvoices: Invoice[] = [];
    try {
      remainingInvoices = await this.getInvoices();
      await this.reconcileCustomersFromInvoices(remainingInvoices);
      console.log(`Customer totals recalculated after deleting invoice ${id}`);
    } catch (reconcileError) {
      console.warn('Failed to reconcile customer totals after invoice deletion (non-fatal):', reconcileError);
      // Fallback: manually update the customer if we know which one
      if (invoiceToDelete) {
        try {
          // Get remaining invoices if not already fetched
          if (remainingInvoices.length === 0) {
            remainingInvoices = await this.getInvoices();
          }
          
          const customers = await this.getCustomers();
          const customerId = (invoiceToDelete as any).customer_id;
          const customerName = invoiceToDelete.customer_name?.trim();
          const customerPhone = invoiceToDelete.customer_phone?.trim();
          
          const target = customers.find((c: Customer) => 
            (customerId && String((c as any).id) === String(customerId)) ||
            (customerName && (c.name || '').trim() === customerName && 
             customerPhone && (c.phone || '').trim() === customerPhone)
          );
          
          if (target) {
            // Recalculate total from remaining invoices for this customer
            const customerInvoices = remainingInvoices.filter((inv: Invoice) =>
              String((inv as any).customer_id || '') === String((target as any).id) ||
              ((inv.customer_name || '').trim() === (target.name || '').trim() &&
               (inv.customer_phone || '').trim() === (target.phone || '').trim())
            );
            const newTotalSpent = customerInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.paid_amount || 0), 0);
            const lastOrderDate = customerInvoices.length > 0
              ? customerInvoices.sort((a: Invoice, b: Invoice) => new Date(b.invoice_date || b.created_at).getTime() - new Date(a.invoice_date || a.created_at).getTime())[0].invoice_date || customerInvoices[0].created_at
              : null;
            
            await this.updateCustomer(String((target as any).id), {
              totalSpent: newTotalSpent,
              lastOrder: lastOrderDate || undefined,
            }, { silent: true });
            console.log(`Updated customer ${(target as any).id} total_spent to ${newTotalSpent} after invoice deletion`);
          }
        } catch (fallbackError) {
          console.warn('Fallback customer update also failed:', fallbackError);
        }
      }
    }
    
    if (!this.localOnly) {
      (syncEngine as any).schedule?.();
      try { await (syncEngine as any).sync?.(); } catch {}
    }
    // Admin log: delete invoice
    try {
      const execName = this.getExecutorName();
      await (storage as any).createAdminLog?.({
        action_type: 'delete',
        entity_type: 'invoice',
        entity_id: String(id),
        changed_fields: ['deleted'],
        user_name: execName,
      });
    } catch {}
  }

  // Invoice items operations
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> { if ((storage as any).getInvoiceItems) { const items = await (storage as any).getInvoiceItems(invoiceId); const others = this.localData.invoiceItems.filter(i => i.invoice_id !== invoiceId); this.localData.invoiceItems = [...items, ...others]; this.persistAllToStorage(); return items; } return this.localData.invoiceItems.filter(i => i.invoice_id === invoiceId); }

  async createInvoiceItem(item: Omit<InvoiceItem, 'id' | 'created_at'>): Promise<InvoiceItem> { if ((storage as any).createInvoiceItem) { const created = await (storage as any).createInvoiceItem(item); this.localData.invoiceItems.push(created); this.persistAllToStorage(); (syncEngine as any).schedule?.(); return created; } const newItem: InvoiceItem = { ...item, id: Date.now().toString(), created_at: new Date().toISOString() }; this.localData.invoiceItems.push(newItem); this.persistAllToStorage(); return newItem; }

  async updateInvoiceItem(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem> { if ((storage as any).updateInvoiceItem) { const updated = await (storage as any).updateInvoiceItem(id, updates); const idx = this.localData.invoiceItems.findIndex(i => i.id === id); if (idx !== -1) this.localData.invoiceItems[idx] = updated; this.persistAllToStorage(); (syncEngine as any).schedule?.(); return updated; } const itemIndex = this.localData.invoiceItems.findIndex(i => i.id === id); if (itemIndex !== -1) { this.localData.invoiceItems[itemIndex] = { ...this.localData.invoiceItems[itemIndex], ...updates } as any; this.persistAllToStorage(); return this.localData.invoiceItems[itemIndex]; } throw new Error('Invoice item not found'); }

  async deleteInvoiceItem(id: string): Promise<void> { if ((storage as any).deleteInvoiceItem) await (storage as any).deleteInvoiceItem(id); this.localData.invoiceItems = this.localData.invoiceItems.filter(i => i.id !== id); this.persistAllToStorage(); (syncEngine as any).schedule?.(); }

  // Customer measurements operations
  async getCustomerMeasurements(_customerId: number): Promise<any[]> { return []; }

  async createCustomerMeasurement(customerId: number, measurements: any): Promise<any> {
    // Store minimal measurement snapshot inside local customers cache if present
    try {
      const idx = this.localData.customers.findIndex(c => Number((c as any).id) === Number(customerId) || String((c as any).id) === String(customerId));
      if (idx !== -1) {
        const current = this.localData.customers[idx];
        const next = { ...current, measurements: { ...(current as any).measurements, ...measurements } } as any;
        this.localData.customers[idx] = next;
        this.persistAllToStorage();
      }
    } catch {}
    return {
      id: Date.now(),
      customer_id: customerId,
      ...measurements,
      created_at: new Date().toISOString()
    };
  }

  async updateCustomerMeasurement(id: string, measurements: any): Promise<any> {
    // Local-only: return merged object
    return { id, ...measurements };
  }

  async deleteCustomerMeasurement(_id: string): Promise<void> { return; }

  // Ensure customers table reflects all invoices (past and future)
  async reconcileCustomersFromInvoices(invoices: Invoice[]): Promise<void> {
    try {
      // Load current customers snapshot
      const existing = await this.getCustomers();
      const byId = new Map<string, Customer>();
      const byAlias = new Map<string, Customer>();
      for (const c of existing) {
        byId.set(String((c as any).id), c);
        const alias = `${(c.name || '').trim()}|${(c.phone || '').trim()}`;
        if (alias !== '|') byAlias.set(alias, c);
      }

      // First, collect all invoices per customer to recalculate totals from scratch
      const customerInvoicesMap = new Map<string, Invoice[]>();
      
      for (const inv of invoices) {
        // Skip deleted invoices
        const deleted = (inv as any).deleted;
        if (deleted === 1 || deleted === '1' || deleted === true) {
          continue;
        }
        
        const customerId = (inv as any).customer_id ? String((inv as any).customer_id) : '';
        const name = (inv.customer_name || '').trim();
        const phone = (inv.customer_phone || '').trim();
        const alias = `${name}|${phone}`;

        // Skip self-test/demo records
        if (name && name.toLowerCase().includes('test customer')) {
          continue;
        }

        // Group invoices by customer (using ID if available, otherwise alias)
        const key = customerId || alias;
        if (!customerInvoicesMap.has(key)) {
          customerInvoicesMap.set(key, []);
        }
        customerInvoicesMap.get(key)!.push(inv);
      }

      // Now update each customer with recalculated totals from all their invoices
      for (const [, invs] of customerInvoicesMap.entries()) {
        if (invs.length === 0) continue;
        
        const firstInv = invs[0];
        const customerId = (firstInv as any).customer_id ? String((firstInv as any).customer_id) : '';
        const name = (firstInv.customer_name || '').trim();
        const phone = (firstInv.customer_phone || '').trim();
        const address = (firstInv.customer_address || '').trim();
        const alias = `${name}|${phone}`;

        // Find target customer
        let target: Customer | undefined = undefined;
        if (customerId && byId.has(customerId)) {
          target = byId.get(customerId);
        } else if (byAlias.has(alias)) {
          target = byAlias.get(alias);
        }

        // Calculate totals from ALL invoices for this customer (recalculate from scratch)
        const totalSpent = invs.reduce((sum: number, inv: Invoice) => sum + (Number((inv as any).paid_amount || 0) || 0), 0);
        const lastOrderDate = invs.length > 0
          ? invs.sort((a: Invoice, b: Invoice) => 
              new Date(b.invoice_date || b.created_at).getTime() - new Date(a.invoice_date || a.created_at).getTime()
            )[0].invoice_date || invs[0].created_at
          : new Date().toISOString();

        if (!target && name && name.trim()) {
          // Calculate initial label based on spending
          const orderCount = invs.length;
          let initialLabel = 'جديد';
          if (totalSpent >= 1000000 || orderCount >= 50) {
            initialLabel = 'جديد';
          } else if (totalSpent >= 500000 || orderCount >= 20) {
            initialLabel = 'جديد';
          } else if (totalSpent >= 100000 || orderCount >= 5) {
            initialLabel = 'جديد';
          }
          
          // Create a new customer derived from invoices
          const created = await this.createCustomer({
            name: name.trim(),
            phone,
            address,
            label: initialLabel,
            label_auto: true, // Default to auto mode
            totalSpent,
            lastOrder: lastOrderDate,
            measurements: { height: 0, shoulder: 0, waist: 0, chest: 0, collar: 0 },
            notes: '',
            created_at: firstInv.created_at,
          } as any);
          byId.set(String((created as any).id), created);
          if (alias !== '|') byAlias.set(alias, created);
        } else if (target) {
          // Update existing customer with recalculated totals
          // Recalculate label only if label_auto is true (auto mode)
          let updatedLabel = target.label;
          if ((target as any).label_auto !== false) {
            // Calculate label automatically based on spending and orders
            const orderCount = invs.length;
            if (totalSpent >= 1000000 || orderCount >= 50) {
              updatedLabel = 'جديد';
            } else if (totalSpent >= 500000 || orderCount >= 20) {
              updatedLabel = 'جديد';
            } else if (totalSpent >= 100000 || orderCount >= 5) {
              updatedLabel = 'جديد';
            } else {
              updatedLabel = 'جديد';
            }
          }
          
          await this.updateCustomer(String((target as any).id), {
            name: name || target.name,
            phone: phone || target.phone,
            address: address || target.address,
            totalSpent, // Recalculated from ALL invoices, not added incrementally
            lastOrder: lastOrderDate,
            // Update label only if auto mode, preserve manual labels
            ...((target as any).label_auto !== false ? { label: updatedLabel } : {}),
          }, { silent: true });
        }
      }
      
      // Reset customers without any invoices to zero
      for (const [customerId, customer] of byId.entries()) {
        const hasInvoices = Array.from(customerInvoicesMap.values()).some(invs => 
          invs.some((inv: Invoice) => 
            String((inv as any).customer_id || '') === customerId ||
            `${(inv.customer_name || '').trim()}|${(inv.customer_phone || '').trim()}` === `${(customer.name || '').trim()}|${(customer.phone || '').trim()}`
          )
        );
        
        if (!hasInvoices) {
          // Customer has no invoices, reset totals
          await this.updateCustomer(customerId, {
            totalSpent: 0,
            lastOrder: undefined,
          }, { silent: true });
        }
      }
    } catch (e) {
      console.warn('reconcileCustomersFromInvoices failed (non-fatal):', e);
    }
  }

  // Sync local data with Supabase
  async syncWithSupabase(): Promise<void> {
    if (this.localOnly) {
      // No-op in local-only mode
      return;
    }
    try {
      // Sync users
      const users = await this.getUsers();
      this.localData.users = users;

      // Sync roles
      const roles = await this.getRoles();
      this.localData.roles = roles;

      // Sync customers
      const customers = await this.getCustomers();
      this.localData.customers = customers;

      // Sync orders
      const orders = await this.getOrders();
      this.localData.orders = orders;

      // Sync invoices
      const invoices = await this.getInvoices();
      this.localData.invoices = invoices;

      this.persistAllToStorage();
      console.log('Data synced with Supabase successfully');
    } catch (error) {
      console.error('Failed to sync with Supabase:', error);
    }
  }

  // Helper methods for data mapping
  private mapSupabaseUserToUser(data: any): User {
    return {
      id: parseInt(data.id) || data.id,
      code: data.code,
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: data.status,
      role: data.role,
      isActive: data.is_active,
      createdAt: data.created_at,
      lastLogin: data.last_login
    };
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();



