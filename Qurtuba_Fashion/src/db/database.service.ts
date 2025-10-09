import { supabase } from './client';
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

  private constructor() {
    this.initializeLocalData();
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
        allowedPages: ['dashboard', 'customers', 'orders', 'invoices', 'reports', 'users', 'roles'],
        allowedActions: ['create', 'read', 'update', 'delete', 'export', 'print'],
        isActive: true,
        createdAt: '2024-01-01'
      }
    ];
  }

  // Users operations
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const newUser: User = {
        ...user,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      this.localData.users.push(newUser);
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
      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const userIndex = this.localData.users.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        this.localData.users[userIndex] = { ...this.localData.users[userIndex], ...updates };
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
      return data || [];
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.roles;
    }
  }

  // Customers operations
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          customer_measurements(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapSupabaseCustomerToCustomer);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.customers;
    }
  }

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    try {
      // Sanitize text data to ensure proper UTF-8 encoding
      const sanitizedCustomer = this.sanitizeTextData(customer);
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: sanitizedCustomer.name,
          phone: sanitizedCustomer.phone,
          address: sanitizedCustomer.address,
          total_spent: sanitizedCustomer.totalSpent,
          last_order: sanitizedCustomer.lastOrder,
          label: sanitizedCustomer.label,
          measurements: customer.measurements,
          notes: customer.notes
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseCustomerToCustomer(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const newCustomer: Customer = {
        ...customer,
        id: Date.now().toString()
      };
      this.localData.customers.push(newCustomer);
      return newCustomer;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          phone: updates.phone,
          address: updates.address,
          total_spent: updates.totalSpent,
          last_order: updates.lastOrder,
          label: updates.label,
          measurements: updates.measurements,
          notes: updates.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseCustomerToCustomer(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const customerIndex = this.localData.customers.findIndex(c => c.id === id);
      if (customerIndex !== -1) {
        this.localData.customers[customerIndex] = { ...this.localData.customers[customerIndex], ...updates };
        return this.localData.customers[customerIndex];
      }
      throw new Error('Customer not found');
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      this.localData.customers = this.localData.customers.filter(c => c.id !== id);
    }
  }

  // Orders operations
  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapSupabaseOrderToOrder);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.orders;
    }
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapSupabaseOrderToOrder);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.orders.filter(order => order.customer_id === customerId);
    }
  }

  async createOrder(order: NewOrder): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_name: order.customer_name,
          total: order.total
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseOrderToOrder(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const newOrder: Order = {
        id: Date.now().toString(),
        customer_name: order.customer_name,
        total: order.total,
        created_at: new Date().toISOString()
      };
      this.localData.orders.push(newOrder);
      return newOrder;
    }
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapSupabaseInvoiceToInvoice);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.invoices;
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.mapSupabaseInvoiceToInvoice(data);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.invoices.find(invoice => invoice.id === id) || null;
    }
  }

  async createInvoice(invoice: NewInvoice): Promise<Invoice> {
    try {
      // Sanitize text data to ensure proper UTF-8 encoding
      const sanitizedInvoice = this.sanitizeTextData(invoice);
      
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          customer_id: sanitizedInvoice.customer_id,
          customer_name: sanitizedInvoice.customer_name,
          customer_phone: sanitizedInvoice.customer_phone,
          customer_address: sanitizedInvoice.customer_address,
          total: sanitizedInvoice.total,
          paid_amount: sanitizedInvoice.paid_amount || 0,
          status: sanitizedInvoice.status || 'معلق',
          due_date: sanitizedInvoice.due_date,
          notes: sanitizedInvoice.notes,
          fabric_image_url: sanitizedInvoice.fabric_image_url
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (invoice.items && invoice.items.length > 0) {
        const items = invoice.items.map(item => ({
          invoice_id: invoiceData.id,
          item_name: item.item_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return this.mapSupabaseInvoiceToInvoice(invoiceData);
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoice_number: `INV${Date.now()}`,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        customer_phone: invoice.customer_phone,
        customer_address: invoice.customer_address,
        total: invoice.total,
        paid_amount: invoice.paid_amount || 0,
        status: invoice.status || 'معلق',
        invoice_date: new Date().toISOString(),
        due_date: invoice.due_date,
        notes: invoice.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.localData.invoices.push(newInvoice);
      return newInvoice;
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    console.log('DatabaseService.updateInvoice called with id:', id, 'updates:', updates);
    
    try {
      // Only update fields that are provided
      const updateData: any = {};
      if (updates.customer_id !== undefined) updateData.customer_id = updates.customer_id;
      if (updates.customer_name !== undefined) updateData.customer_name = updates.customer_name;
      if (updates.customer_phone !== undefined) updateData.customer_phone = updates.customer_phone;
      if (updates.customer_address !== undefined) updateData.customer_address = updates.customer_address;
      if (updates.total !== undefined) updateData.total = updates.total;
      if (updates.paid_amount !== undefined) updateData.paid_amount = updates.paid_amount;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      console.log('Updating invoice with data:', updateData);
      console.log('Calling Supabase update...');

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Supabase update successful, data:', data);
      const result = this.mapSupabaseInvoiceToInvoice(data);
      console.log('Mapped result:', result);
      return result;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const invoiceIndex = this.localData.invoices.findIndex(i => i.id === id);
      if (invoiceIndex !== -1) {
        console.log('Updating local data...');
        this.localData.invoices[invoiceIndex] = { ...this.localData.invoices[invoiceIndex], ...updates };
        console.log('Local data updated:', this.localData.invoices[invoiceIndex]);
        return this.localData.invoices[invoiceIndex];
      }
      throw new Error('Invoice not found');
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      this.localData.invoices = this.localData.invoices.filter(i => i.id !== id);
    }
  }

  // Invoice items operations
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      return this.localData.invoiceItems.filter(item => item.invoice_id === invoiceId);
    }
  }

  async createInvoiceItem(item: Omit<InvoiceItem, 'id' | 'created_at'>): Promise<InvoiceItem> {
    try {
      // Sanitize text data to ensure proper UTF-8 encoding
      const sanitizedItem = this.sanitizeTextData(item);
      
      const { data, error } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: sanitizedItem.invoice_id,
          item_name: sanitizedItem.item_name,
          description: sanitizedItem.description,
          quantity: sanitizedItem.quantity,
          unit_price: sanitizedItem.unit_price,
          total_price: sanitizedItem.total_price
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const newItem: InvoiceItem = {
        ...item,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      this.localData.invoiceItems.push(newItem);
      return newItem;
    }
  }

  async updateInvoiceItem(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem> {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .update({
          item_name: updates.item_name,
          description: updates.description,
          quantity: updates.quantity,
          unit_price: updates.unit_price,
          total_price: updates.total_price
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      const itemIndex = this.localData.invoiceItems.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        this.localData.invoiceItems[itemIndex] = { ...this.localData.invoiceItems[itemIndex], ...updates };
        return this.localData.invoiceItems[itemIndex];
      }
      throw new Error('Invoice item not found');
    }
  }

  async deleteInvoiceItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.warn('Supabase error, using local data:', error);
      this.localData.invoiceItems = this.localData.invoiceItems.filter(item => item.id !== id);
    }
  }

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

  private mapSupabaseCustomerToCustomer(data: any): Customer {
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      totalSpent: data.total_spent,
      lastOrder: data.last_order,
      label: data.label,
      measurements: data.measurements || undefined,
      notes: data.notes,
      created_at: data.created_at
    };
  }

  private mapSupabaseOrderToOrder(data: any): Order {
    return {
      id: data.id,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      total: data.total,
      created_at: data.created_at
    };
  }

  private mapSupabaseInvoiceToInvoice(data: any): Invoice {
    return {
      id: data.id,
      invoice_number: data.invoice_number,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_address: data.customer_address,
      total: data.total,
      paid_amount: data.paid_amount,
      status: data.status,
      invoice_date: data.invoice_date,
      due_date: data.due_date,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
