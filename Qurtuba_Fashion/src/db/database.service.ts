import { supabase } from './client';
import { storage } from '@/storage';
import { syncEngine } from '@/sync';
import type { User, Role } from '../types/user';
import type { Order, NewOrder } from '../ports/orders';

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
}

// Database service that handles both local and Supabase operations
export class DatabaseService {
  private static instance: DatabaseService;
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

  // Users operations
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
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
        .select()
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
        .select()
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
      return created;
    } catch (error) {
      console.warn('Local storage error:', error);
      const newCustomer: Customer = { ...customer, id: Date.now().toString() } as any;
      this.localData.customers.push(newCustomer);
      this.persistAllToStorage();
      return newCustomer;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const updated = await storage.updateCustomer(id, updates as any);
      const idx = this.localData.customers.findIndex(c => c.id === id);
      if (idx !== -1) this.localData.customers[idx] = updated; else this.localData.customers.unshift(updated);
      this.persistAllToStorage();
      (syncEngine as any).schedule?.();
      return updated;
    } catch (error) {
      console.warn('Local storage error:', error);
      const customerIndex = this.localData.customers.findIndex(c => c.id === id);
      if (customerIndex !== -1) {
        this.localData.customers[customerIndex] = { ...this.localData.customers[customerIndex], ...updates } as any;
        this.persistAllToStorage();
        return this.localData.customers[customerIndex];
      }
      throw new Error('Customer not found');
    }
  }

  async deleteCustomer(id: string): Promise<void> { await (storage as any).deleteCustomer?.(id); this.localData.customers = this.localData.customers.filter(c => c.id !== id); this.persistAllToStorage(); (syncEngine as any).schedule?.(); }

  // Orders operations (local-first)
  async getOrders(): Promise<Order[]> { try { const rows = await storage.getOrders(); this.localData.orders = rows; this.persistAllToStorage(); return rows; } catch { return this.localData.orders; } }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> { const all = await this.getOrders(); return all.filter(o => (o as any).customer_id === customerId); }

  async createOrder(order: NewOrder): Promise<Order> { const created = await storage.createOrder(order); this.localData.orders = [created, ...this.localData.orders]; this.persistAllToStorage(); (syncEngine as any).schedule?.(); return created; }

  // Invoice operations (local-first)
  async getInvoices(): Promise<Invoice[]> { try { const rows = await storage.getInvoices(); this.localData.invoices = rows; this.persistAllToStorage(); return rows; } catch { return this.localData.invoices; } }

  async getInvoiceById(id: string): Promise<Invoice | null> { const all = await this.getInvoices(); return all.find(i => i.id === id) || null; }

  async createInvoice(invoice: NewInvoice): Promise<Invoice> { const created = await storage.createInvoice(invoice as any); this.localData.invoices = [created, ...this.localData.invoices]; this.persistAllToStorage(); (syncEngine as any).schedule?.(); return created; }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> { const updated = await storage.updateInvoice(id, updates as any); const idx = this.localData.invoices.findIndex(i => i.id === id); if (idx !== -1) this.localData.invoices[idx] = updated; this.persistAllToStorage(); (syncEngine as any).schedule?.(); return updated; }

  async deleteInvoice(id: string): Promise<void> { await storage.deleteInvoice(id); this.localData.invoices = this.localData.invoices.filter(i => i.id !== id); this.persistAllToStorage(); (syncEngine as any).schedule?.(); }

  // Invoice items operations
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> { if ((storage as any).getInvoiceItems) { const items = await (storage as any).getInvoiceItems(invoiceId); const others = this.localData.invoiceItems.filter(i => i.invoice_id !== invoiceId); this.localData.invoiceItems = [...items, ...others]; this.persistAllToStorage(); return items; } return this.localData.invoiceItems.filter(i => i.invoice_id === invoiceId); }

  async createInvoiceItem(item: Omit<InvoiceItem, 'id' | 'created_at'>): Promise<InvoiceItem> { if ((storage as any).createInvoiceItem) { const created = await (storage as any).createInvoiceItem(item); this.localData.invoiceItems.push(created); this.persistAllToStorage(); (syncEngine as any).schedule?.(); return created; } const newItem: InvoiceItem = { ...item, id: Date.now().toString(), created_at: new Date().toISOString() }; this.localData.invoiceItems.push(newItem); this.persistAllToStorage(); return newItem; }

  async updateInvoiceItem(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem> { if ((storage as any).updateInvoiceItem) { const updated = await (storage as any).updateInvoiceItem(id, updates); const idx = this.localData.invoiceItems.findIndex(i => i.id === id); if (idx !== -1) this.localData.invoiceItems[idx] = updated; this.persistAllToStorage(); (syncEngine as any).schedule?.(); return updated; } const itemIndex = this.localData.invoiceItems.findIndex(i => i.id === id); if (itemIndex !== -1) { this.localData.invoiceItems[itemIndex] = { ...this.localData.invoiceItems[itemIndex], ...updates } as any; this.persistAllToStorage(); return this.localData.invoiceItems[itemIndex]; } throw new Error('Invoice item not found'); }

  async deleteInvoiceItem(id: string): Promise<void> { if ((storage as any).deleteInvoiceItem) await (storage as any).deleteInvoiceItem(id); this.localData.invoiceItems = this.localData.invoiceItems.filter(i => i.id !== id); this.persistAllToStorage(); (syncEngine as any).schedule?.(); }

  // Customer measurements operations
  async getCustomerMeasurements(customerId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('customer_measurements')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return [];
    }
  }

  async createCustomerMeasurement(customerId: number, measurements: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('customer_measurements')
        .insert({
          customer_id: customerId,
          height: measurements.height,
          shoulder: measurements.shoulder,
          waist: measurements.waist,
          chest: measurements.chest
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return {
        id: Date.now(),
        customer_id: customerId,
        ...measurements,
        created_at: new Date().toISOString()
      };
    }
  }

  async updateCustomerMeasurement(id: string, measurements: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('customer_measurements')
        .update({
          height: measurements.height,
          shoulder: measurements.shoulder,
          waist: measurements.waist,
          chest: measurements.chest
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return { id, ...measurements };
    }
  }

  async deleteCustomerMeasurement(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_measurements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
    }
  }

  // Sync local data with Supabase
  async syncWithSupabase(): Promise<void> {
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
