import { app } from 'electron';
import { join } from 'path';
import { Database } from 'sqlite3';
import { promisify } from 'util';

export interface LocalCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalSpent: number;
  lastOrder: string;
  label: string;
  measurements?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface LocalInvoice {
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
  fabric_image_url?: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface LocalOrder {
  id: string;
  customer_id: string;
  order_date: string;
  delivery_date: string;
  status: string;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export class LocalDatabase {
  private db: Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = join(userDataPath, 'qurtuba-local.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

    // Customers table
    await run(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        total_spent REAL DEFAULT 0,
        last_order TEXT,
        label TEXT,
        measurements TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `);

    // Invoices table
    await run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_address TEXT,
        total REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        status TEXT NOT NULL,
        invoice_date TEXT NOT NULL,
        due_date TEXT,
        notes TEXT,
        fabric_image_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `);

    // Orders table
    await run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        order_date TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        status TEXT NOT NULL,
        total REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `);

    // Invoice items table
    await run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `);

    // Sync log table
    await run(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `);

    // Create indexes
    await run(`CREATE INDEX IF NOT EXISTS idx_customers_synced ON customers(synced)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_invoices_synced ON invoices(synced)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_orders_synced ON orders(synced)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced)`);
  }

  // Customer methods
  async getCustomers(): Promise<LocalCustomer[]> {
    if (!this.db) throw new Error('Database not initialized');
    const all = promisify(this.db.all.bind(this.db));
    return await all('SELECT * FROM customers ORDER BY created_at DESC') as LocalCustomer[];
  }

  async createCustomer(customer: Omit<LocalCustomer, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<LocalCustomer> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      this.db!.run(`
        INSERT INTO customers (id, name, phone, address, total_spent, last_order, label, measurements, notes, created_at, updated_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, [id, customer.name, customer.phone, customer.address, customer.totalSpent, customer.lastOrder, customer.label,
          JSON.stringify(customer.measurements), customer.notes, now, now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            ...customer,
            created_at: now,
            updated_at: now,
            synced: false
          } as LocalCustomer);
        }
      });
    });

    // Log sync action
    await this.logSyncAction('customers', id, 'create');

    return { ...customer, id, created_at: now, updated_at: now, synced: false };
  }

  async updateCustomer(id: string, updates: Partial<LocalCustomer>): Promise<LocalCustomer> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    const now = new Date().toISOString();
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updates).filter((_, index) => 
      Object.keys(updates)[index] !== 'id' && Object.keys(updates)[index] !== 'created_at'
    );
    
    await run(`UPDATE customers SET ${setClause}, updated_at = ?, synced = 0 WHERE id = ?`, 
      [...values, now, id]);

    // Log sync action
    await this.logSyncAction('customers', id, 'update');

    const get = promisify(this.db.get.bind(this.db));
    return await get('SELECT * FROM customers WHERE id = ?', [id]);
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    await run('DELETE FROM customers WHERE id = ?', [id]);
    
    // Log sync action
    await this.logSyncAction('customers', id, 'delete');
  }

  // Invoice methods
  async getInvoices(): Promise<LocalInvoice[]> {
    if (!this.db) throw new Error('Database not initialized');
    const all = promisify(this.db.all.bind(this.db));
    return await all('SELECT * FROM invoices ORDER BY created_at DESC');
  }

  async createInvoice(invoice: Omit<LocalInvoice, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<LocalInvoice> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    const id = this.generateId();
    const invoiceNumber = this.generateInvoiceNumber();
    const now = new Date().toISOString();
    
    await run(`
      INSERT INTO invoices (id, invoice_number, customer_id, customer_name, customer_phone, customer_address, 
                           total, paid_amount, status, invoice_date, due_date, notes, fabric_image_url, created_at, updated_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [id, invoiceNumber, invoice.customer_id, invoice.customer_name, invoice.customer_phone, 
        invoice.customer_address, invoice.total, invoice.paid_amount, invoice.status, 
        invoice.invoice_date, invoice.due_date, invoice.notes, invoice.fabric_image_url, now, now]);

    // Log sync action
    await this.logSyncAction('invoices', id, 'create');

    return { ...invoice, id, invoice_number: invoiceNumber, created_at: now, updated_at: now, synced: false };
  }

  async updateInvoice(id: string, updates: Partial<LocalInvoice>): Promise<LocalInvoice> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    const now = new Date().toISOString();
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'invoice_number')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updates).filter((_, index) => {
      const key = Object.keys(updates)[index];
      return key !== 'id' && key !== 'created_at' && key !== 'invoice_number';
    });
    
    await run(`UPDATE invoices SET ${setClause}, updated_at = ?, synced = 0 WHERE id = ?`, 
      [...values, now, id]);

    // Log sync action
    await this.logSyncAction('invoices', id, 'update');

    const get = promisify(this.db.get.bind(this.db));
    return await get('SELECT * FROM invoices WHERE id = ?', [id]);
  }

  async deleteInvoice(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    await run('DELETE FROM invoices WHERE id = ?', [id]);
    await run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    
    // Log sync action
    await this.logSyncAction('invoices', id, 'delete');
  }

  // Order methods
  async getOrders(): Promise<LocalOrder[]> {
    if (!this.db) throw new Error('Database not initialized');
    const all = promisify(this.db.all.bind(this.db));
    return await all('SELECT * FROM orders ORDER BY created_at DESC');
  }

  async createOrder(order: Omit<LocalOrder, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<LocalOrder> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await run(`
      INSERT INTO orders (id, customer_id, order_date, delivery_date, status, total, notes, created_at, updated_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [id, order.customer_id, order.order_date, order.delivery_date, order.status, order.total, order.notes, now, now]);

    // Log sync action
    await this.logSyncAction('orders', id, 'create');

    return { ...order, id, created_at: now, updated_at: now, synced: false };
  }

  async updateOrder(id: string, updates: Partial<LocalOrder>): Promise<LocalOrder> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    const now = new Date().toISOString();
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updates).filter((_, index) => 
      Object.keys(updates)[index] !== 'id' && Object.keys(updates)[index] !== 'created_at'
    );
    
    await run(`UPDATE orders SET ${setClause}, updated_at = ?, synced = 0 WHERE id = ?`, 
      [...values, now, id]);

    // Log sync action
    await this.logSyncAction('orders', id, 'update');

    const get = promisify(this.db.get.bind(this.db));
    return await get('SELECT * FROM orders WHERE id = ?', [id]);
  }

  async deleteOrder(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    await run('DELETE FROM orders WHERE id = ?', [id]);
    
    // Log sync action
    await this.logSyncAction('orders', id, 'delete');
  }

  // Sync methods
  async getUnsyncedRecords(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const all = promisify(this.db.all.bind(this.db));
    
    const customers = await all('SELECT * FROM customers WHERE synced = 0');
    const invoices = await all('SELECT * FROM invoices WHERE synced = 0');
    const orders = await all('SELECT * FROM orders WHERE synced = 0');
    
    return { customers, invoices, orders };
  }

  async markAsSynced(tableName: string, recordId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    await run(`UPDATE ${tableName} SET synced = 1 WHERE id = ?`, [recordId]);
  }

  async getAllOfflineData(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    const all = promisify(this.db.all.bind(this.db));
    
    return {
      customers: await all('SELECT * FROM customers'),
      invoices: await all('SELECT * FROM invoices'),
      orders: await all('SELECT * FROM orders'),
      invoiceItems: await all('SELECT * FROM invoice_items')
    };
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  }

  private async logSyncAction(tableName: string, recordId: string, action: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db));
    
    await run(`
      INSERT INTO sync_log (table_name, record_id, action, timestamp, synced)
      VALUES (?, ?, ?, ?, 0)
    `, [tableName, recordId, action, new Date().toISOString()]);
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close((err) => {
          if (err) console.error('Error closing database:', err);
          resolve();
        });
      });
    }
  }
}
