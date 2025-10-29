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
  fabric_type?: string;   // e.g. "صيفي، شتوي"
  fabric_source?: string; // e.g. "داخل المحل، خارج المحل"
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
    return 'مسؤول النظام';
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
        name: 'أحمد محمد',
        email: 'ahmed@qurtuba.com',
        phone: '07701234567',
        status: 'ادمن',
        role: 'مدير النظام',
        isActive: true,
        createdAt: '2024-01-01',
        lastLogin: '2024-01-15'
      }
    ];

    this.localData.roles = [
      {
        id: 1,
        name: 'مدير النظام',
        description: 'مدير النظام الكامل',
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
          title: 'زبون جديد',
          message: `تم إضافة الزبون ${customer.name}`,
          target: { page: 'customers', id: (this.localData.customers[0] as any).id?.toString?.() },
        });
      } catch {}
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>, options?: { silent?: boolean }): Promise<Customer> {
    try {
      // Skip write if no actual change for provided keys
      const idxExisting = this.localData.customers.findIndex(c => String(c.id) === String(id));
      if (idxExisting !== -1) {
        const current = this.localData.customers[idxExisting] as any;
        let changed = false;
        for (const key of Object.keys(updates || {})) {
          const nextVal = (updates as any)[key];
          const prevVal = current[key];
          if (typeof nextVal === 'object' && nextVal !== null) {
            if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) { changed = true; break; }
          } else if (prevVal !== nextVal) { changed = true; break; }
        }
        if (!changed) {
          return this.localData.customers[idxExisting];
        }
      }

      const updated = await storage.updateCustomer(id, updates as any);
      const idx = this.localData.customers.findIndex(c => String(c.id) === String(id));
      if (idx !== -1) this.localData.customers[idx] = updated; else this.localData.customers.unshift(updated);
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
            changed_fields: Object.keys(updates || {}),
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
            title: 'تعديل زبون',
            message: `تم تعديل بيانات الزبون`,
            target: { page: 'customers', id: id?.toString?.() },
          });
        } catch {}
      }
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    await (storage as any).deleteCustomer?.(id);
    this.localData.customers = this.localData.customers.filter(c => c.id !== id);
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
      this.localData.invoices = rows || [];
      this.persistAllToStorage();
      return this.localData.invoices;
    } catch {
      return this.localData.invoices;
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> { const all = await this.getInvoices(); return all.find(i => i.id === id) || null; }

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
          label: 'جديد',
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
    const idx = this.localData.invoices.findIndex(i => i.id === id);
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
    await storage.deleteInvoice(id);
    this.localData.invoices = this.localData.invoices.filter(i => i.id !== id);
    this.persistAllToStorage();
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

      for (const inv of invoices) {
        const customerId = (inv as any).customer_id ? String((inv as any).customer_id) : '';
        const name = (inv.customer_name || '').trim();
        const phone = (inv.customer_phone || '').trim();
        const address = (inv.customer_address || '').trim();
        const alias = `${name}|${phone}`;

        // Skip self-test/demo records to avoid noisy duplicates and notifications
        // Electron local DB self-test uses a customer named "Test Customer (LocalDB SelfTest)"
        // which is intentionally hidden from the UI. Since getCustomers() excludes it,
        // reconciliation would recreate it on every load and emit notifications.
        if (name && name.toLowerCase().includes('test customer')) {
          continue;
        }

        let target: Customer | undefined = undefined;
        if (customerId && byId.has(customerId)) target = byId.get(customerId);
        else if (byAlias.has(alias)) target = byAlias.get(alias);

        const paid = Number((inv as any).paid_amount || 0) || 0;
        const lastOrderDate = inv.invoice_date || inv.created_at || new Date().toISOString();

        if (!target && name && name.trim()) {
          // Create a new customer derived from invoice
          const created = await this.createCustomer({
            name: name.trim(),
            phone,
            address,
            label: 'جديد',
            totalSpent: paid,
            lastOrder: lastOrderDate,
            measurements: { height: 0, shoulder: 0, waist: 0, chest: 0, collar: 0 },
            notes: '',
            created_at: inv.created_at,
          } as any);
          byId.set(String((created as any).id), created);
          if (alias !== '|') byAlias.set(alias, created);
        } else if (target) {
          // Update existing aggregate fields
          const nextTotal = (target.totalSpent || 0) + paid;
          const newerDate = !target.lastOrder || new Date(lastOrderDate) > new Date(target.lastOrder) ? lastOrderDate : target.lastOrder;
          await this.updateCustomer(String((target as any).id), {
            name: name || target.name,
            phone: phone || target.phone,
            address: address || target.address,
            totalSpent: nextTotal,
            lastOrder: newerDate,
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
