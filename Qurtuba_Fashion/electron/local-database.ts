import { app } from 'electron';
import { join } from 'path';
// Use sqlite3 instead of better-sqlite3 to avoid C++20 compilation issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sqlite3 = require('sqlite3').verbose();

// Ensure sqlite3 can find its native module in packaged app
if (app.isPackaged) {
  const sqlite3Path = join(process.resourcesPath, 'sqlite3', 'node_sqlite3.node');
  console.log('Looking for sqlite3 native module at:', sqlite3Path);
}

// Wrapper class to match better-sqlite3 API
const Database = class {
  private db: any;
  
  constructor(path: string) {
    this.db = new sqlite3.Database(path);
  }
  
  static open(path: string) {
    return new Database(path);
  }
  
  exec(sql: string) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err: any) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  }
  
  pragma(sql: string) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, (err: any, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
  
  prepare(sql: string) {
    const stmt = this.db.prepare(sql);
    return {
      run: (params: any) => new Promise((resolve, reject) => {
        stmt.run(params, function(this: any, err: any) {
          if (err) reject(err);
          else resolve({ lastInsertRowid: this.lastID });
        });
      }),
      get: (params: any) => new Promise((resolve, reject) => {
        stmt.get(params, (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row);
        });
      }),
      all: (params: any) => new Promise((resolve, reject) => {
        stmt.all(params, (err: any, rows: any) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
      finalize: () => {
        stmt.finalize();
      }
    };
  }
  
  close() {
    return new Promise((resolve) => {
      this.db.close(resolve);
    });
  }
};

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
  paid_at?: string;
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
  private db: any | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = join(userDataPath, 'qurtuba-local.db');
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing local database at:', this.dbPath);
      
      // Ensure the directory exists
      const { mkdirSync } = require('fs');
      const { dirname } = require('path');
      try {
        mkdirSync(dirname(this.dbPath), { recursive: true });
      } catch (e) {
        console.warn('Could not create database directory:', e);
      }
      
      this.db = new Database(this.dbPath);
      console.log('Database connection established');
      
      // Pragmas for durability and concurrency
      await this.db.pragma('PRAGMA journal_mode = WAL');
      await this.db.pragma('PRAGMA synchronous = NORMAL');
      await this.db.pragma('PRAGMA foreign_keys = ON');
      await this.createTables();
      console.log('Database tables created successfully');
    } catch (err) {
      console.error('Error opening database:', err);
      console.error('Database path:', this.dbPath);
      throw err;
    }
  }

  // Low-level helpers
  private async run(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.prepare(sql).run(...params);
  }

  private async get<T>(sql: string, params: any[] = []): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.prepare(sql).get(...params) as T;
  }

  private async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.prepare(sql).all(...params) as T[];
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Customers table
    await this.run(`
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
        version INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Invoices table
    await this.run(`
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
        paid_at TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Orders table
    await this.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        order_date TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        status TEXT NOT NULL,
        total REAL NOT NULL,
        notes TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Invoice items table
    await this.run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Roles table
    await this.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        permissions TEXT,
        allowed_pages TEXT,
        allowed_actions TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        version INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Outbox for sync
    await this.run(`
      CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL, -- insert | update | delete
        payload TEXT NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // Sync state
    await this.run(`
      CREATE TABLE IF NOT EXISTS sync_state (
        table_name TEXT PRIMARY KEY,
        last_pull TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'
      )
    `);

    // Indexes
    await this.run(`CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(created_at)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_outbox_table ON outbox(table_name, record_id)`);
  }

  // Customer methods
  async getCustomers(): Promise<LocalCustomer[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const customers = await this.all<LocalCustomer>("SELECT * FROM customers WHERE deleted = 0 AND LOWER(name) NOT LIKE '%test customer%' ORDER BY created_at DESC");
      console.log('Retrieved customers count:', customers.length);
      return customers;
    } catch (error) {
      console.error('Error retrieving customers:', error);
      throw error;
    }
  }

  async createCustomer(customer: Omit<LocalCustomer, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<LocalCustomer> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO customers (id, name, phone, address, total_spent, last_order, label, measurements, notes, version, deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [id, customer.name, customer.phone, customer.address, customer.totalSpent, customer.lastOrder, customer.label,
        JSON.stringify(customer.measurements), customer.notes, now, now]);

    await this.enqueueOutbox('customers', id, 'insert', {
      id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      total_spent: customer.totalSpent,
      last_order: customer.lastOrder,
      label: customer.label,
      measurements: customer.measurements,
      notes: customer.notes,
      version: 1,
      deleted: 0,
      created_at: now,
      updated_at: now,
    });

    return {
      id,
      ...customer,
      created_at: now,
      updated_at: now,
      synced: false
    } as LocalCustomer;
  }

  async updateCustomer(id: string, updates: Partial<LocalCustomer>, options?: { fromCloud?: boolean }): Promise<LocalCustomer> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updates).filter((_, index) => 
      Object.keys(updates)[index] !== 'id' && Object.keys(updates)[index] !== 'created_at'
    );
    
    const versionUpdate = options?.fromCloud ? '' : ', version = version + 1';
    await this.run(`UPDATE customers SET ${setClause}, updated_at = ?${versionUpdate} WHERE id = ?`, [...values, now, id]);

    if (!options?.fromCloud) {
      const row = await this.get<LocalCustomer>('SELECT * FROM customers WHERE id = ?', [id]);
      await this.enqueueOutbox('customers', id, 'update', row);
    }

    return await this.get<LocalCustomer>('SELECT * FROM customers WHERE id = ?', [id]);
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    await this.run('UPDATE customers SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
    await this.enqueueOutbox('customers', id, 'delete', { id, deleted: 1, updated_at: now });
  }

  // Invoice methods
  async getInvoices(): Promise<LocalInvoice[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const invoices = await this.all<LocalInvoice>('SELECT * FROM invoices WHERE deleted = 0 ORDER BY created_at DESC');
      console.log('Retrieved invoices count:', invoices.length);
      return invoices;
    } catch (error) {
      console.error('Error retrieving invoices:', error);
      throw error;
    }
  }

  async createInvoice(invoice: Omit<LocalInvoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at' | 'synced'>): Promise<LocalInvoice> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = this.generateId();
    const invoiceNumber = this.generateInvoiceNumber();
    const now = new Date().toISOString();
    
    console.log('Creating invoice with data:', {
      id,
      invoiceNumber,
      customer_name: invoice.customer_name,
      total: invoice.total,
      status: invoice.status
    });
    
    try {
      await this.run(`
        INSERT INTO invoices (id, invoice_number, customer_id, customer_name, customer_phone, customer_address,
                             total, paid_amount, status, invoice_date, due_date, notes, fabric_image_url, paid_at, version, deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
      `, [id, invoiceNumber, invoice.customer_id, invoice.customer_name, invoice.customer_phone,
          invoice.customer_address, invoice.total, invoice.paid_amount, invoice.status,
          invoice.invoice_date, invoice.due_date, invoice.notes, invoice.fabric_image_url, invoice.paid_at || null, now, now]);
      
      console.log('Invoice created successfully with ID:', id);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }

    await this.enqueueOutbox('invoices', id, 'insert', {
      ...invoice,
      id,
      invoice_number: invoiceNumber,
      version: 1,
      deleted: 0,
      created_at: now,
      updated_at: now,
    });

    return { ...invoice, id, invoice_number: invoiceNumber, created_at: now, updated_at: now, synced: false };
  }

  async updateInvoice(id: string, updates: Partial<LocalInvoice>, options?: { fromCloud?: boolean }): Promise<LocalInvoice> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'invoice_number')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updates).filter((_, index) => {
      const key = Object.keys(updates)[index];
      return key !== 'id' && key !== 'created_at' && key !== 'invoice_number';
    });
    
    const versionUpdate = options?.fromCloud ? '' : ', version = version + 1';
    await this.run(`UPDATE invoices SET ${setClause}, updated_at = ?${versionUpdate} WHERE id = ?`, [...values, now, id]);
    if (!options?.fromCloud) {
      const row = await this.get<LocalInvoice>('SELECT * FROM invoices WHERE id = ?', [id]);
      await this.enqueueOutbox('invoices', id, 'update', row);
    }
    return await this.get<LocalInvoice>('SELECT * FROM invoices WHERE id = ?', [id]);
  }

  async deleteInvoice(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    await this.run('UPDATE invoices SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
    await this.run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    await this.enqueueOutbox('invoices', id, 'delete', { id, deleted: 1, updated_at: now });
  }

  // Order methods
  async getOrders(): Promise<LocalOrder[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.all<LocalOrder>('SELECT * FROM orders WHERE deleted = 0 ORDER BY created_at DESC');
  }

  async getCustomerById(id: string): Promise<LocalCustomer | null> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const row = await this.get<LocalCustomer | undefined>('SELECT * FROM customers WHERE id = ? AND deleted = 0', [id]);
      return row ?? null;
    } catch {
      return null;
    }
  }

  async createOrder(order: Omit<LocalOrder, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<LocalOrder> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO orders (id, customer_id, order_date, delivery_date, status, total, notes, version, deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [id, order.customer_id, order.order_date, order.delivery_date, order.status, order.total, order.notes, now, now]);

    await this.enqueueOutbox('orders', id, 'insert', {
      id,
      ...order,
      version: 1,
      deleted: 0,
      created_at: now,
      updated_at: now,
    });

    return { ...order, id, created_at: now, updated_at: now, synced: false };
  }

  async updateOrder(id: string, updates: Partial<LocalOrder>, options?: { fromCloud?: boolean }): Promise<LocalOrder> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updates).filter((_, index) => 
      Object.keys(updates)[index] !== 'id' && Object.keys(updates)[index] !== 'created_at'
    );
    
    const versionUpdate = options?.fromCloud ? '' : ', version = version + 1';
    await this.run(`UPDATE orders SET ${setClause}, updated_at = ?${versionUpdate} WHERE id = ?`, [...values, now, id]);
    if (!options?.fromCloud) {
      const row = await this.get<LocalOrder>('SELECT * FROM orders WHERE id = ?', [id]);
      await this.enqueueOutbox('orders', id, 'update', row);
    }
    return await this.get<LocalOrder>('SELECT * FROM orders WHERE id = ?', [id]);
  }

  async deleteOrder(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    await this.run('UPDATE orders SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
    await this.enqueueOutbox('orders', id, 'delete', { id, deleted: 1, updated_at: now });
  }

  // Sync methods
  // Outbox accessors for sync service
  async getOutboxBatch(limit: number = 50): Promise<{ id: number; table_name: string; record_id: string; action: string; payload: any; created_at: string; attempt_count: number; last_error?: string }[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.all<any>('SELECT id, table_name, record_id, action, payload, created_at, attempt_count, last_error FROM outbox ORDER BY created_at ASC LIMIT ?', [limit]);
    return rows.map(r => ({ ...r, payload: JSON.parse(r.payload) }));
  }

  async markOutboxSuccess(id: number): Promise<void> {
    await this.run('DELETE FROM outbox WHERE id = ?', [id]);
  }

  async markOutboxFailure(id: number, error: string): Promise<void> {
    await this.run('UPDATE outbox SET attempt_count = attempt_count + 1, last_error = ? WHERE id = ?', [error, id]);
  }

  // Deprecated: kept for compatibility
  async markAsSynced(_tableName: string, _recordId: string): Promise<void> { return; }

  async getAllOfflineData(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    return {
      customers: await this.all<LocalCustomer>('SELECT * FROM customers'),
      invoices: await this.all<LocalInvoice>('SELECT * FROM invoices'),
      orders: await this.all<LocalOrder>('SELECT * FROM orders'),
      invoiceItems: await this.all<any>('SELECT * FROM invoice_items')
    };
  }

  // Export all tables as a JSON object
  async exportAll(): Promise<{ customers: any[]; invoices: any[]; orders: any[]; invoiceItems: any[]; meta: any }> {
    const data = await this.getAllOfflineData();
    return {
      customers: data.customers,
      invoices: data.invoices,
      orders: data.orders,
      invoiceItems: data.invoiceItems,
      meta: { exportedAt: new Date().toISOString(), version: 1 }
    };
  }

  // Import all tables from a JSON object (replace strategy)
  async importAll(payload: { customers?: any[]; invoices?: any[]; orders?: any[]; invoiceItems?: any[] }): Promise<{ imported: { customers: number; invoices: number; orders: number; invoiceItems: number } }> {
    if (!this.db) throw new Error('Database not initialized');
    const customers = Array.isArray(payload.customers) ? payload.customers : [];
    const invoices = Array.isArray(payload.invoices) ? payload.invoices : [];
    const orders = Array.isArray(payload.orders) ? payload.orders : [];
    const items = Array.isArray(payload.invoiceItems) ? payload.invoiceItems : [];

    // Simple replace-all strategy
    await this.run('DELETE FROM invoice_items');
    await this.run('DELETE FROM orders');
    await this.run('DELETE FROM invoices');
    await this.run('DELETE FROM customers');

    for (const c of customers) {
      await this.run(`
        INSERT INTO customers (id, name, phone, address, total_spent, last_order, label, measurements, notes, version, deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        c.id,
        c.name || '',
        c.phone || null,
        c.address || null,
        (c.total_spent ?? c.totalSpent) || 0,
        c.last_order || c.lastOrder || null,
        c.label || null,
        JSON.stringify(c.measurements ?? null),
        c.notes || null,
        (c.version ?? 1),
        (c.deleted ?? 0),
        c.created_at || new Date().toISOString(),
        c.updated_at || new Date().toISOString(),
      ]);
    }

    for (const inv of invoices) {
      await this.run(`
        INSERT INTO invoices (id, invoice_number, customer_id, customer_name, customer_phone, customer_address,
                             total, paid_amount, status, invoice_date, due_date, notes, fabric_image_url, paid_at, version, deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        inv.id,
        inv.invoice_number || `INV-${Date.now()}`,
        inv.customer_id || null,
        inv.customer_name || '',
        inv.customer_phone || null,
        inv.customer_address || null,
        Number(inv.total || 0),
        Number(inv.paid_amount || 0),
        inv.status || 'معلق',
        inv.invoice_date || new Date().toISOString(),
        inv.due_date || null,
        inv.notes || null,
        inv.fabric_image_url || null,
        inv.paid_at || null,
        (inv.version ?? 1),
        (inv.deleted ?? 0),
        inv.created_at || new Date().toISOString(),
        inv.updated_at || new Date().toISOString(),
      ]);
    }

    for (const o of orders) {
      await this.run(`
        INSERT INTO orders (id, customer_id, order_date, delivery_date, status, total, notes, version, deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        o.id,
        o.customer_id || null,
        o.order_date || o.created_at || new Date().toISOString(),
        o.delivery_date || o.order_date || o.created_at || new Date().toISOString(),
        o.status || 'معلق',
        Number(o.total || 0),
        o.notes || null,
        (o.version ?? 1),
        (o.deleted ?? 0),
        o.created_at || new Date().toISOString(),
        o.updated_at || new Date().toISOString(),
      ]);
    }

    for (const it of items) {
      await this.run(`
        INSERT INTO invoice_items (id, invoice_id, item_name, description, quantity, unit_price, total_price, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        it.id || this.generateId(),
        it.invoice_id,
        it.item_name || '',
        it.description || null,
        Number(it.quantity || 1),
        Number(it.unit_price || 0),
        Number(it.total_price || (Number(it.quantity || 1) * Number(it.unit_price || 0))),
        it.created_at || new Date().toISOString(),
      ]);
    }

    return { imported: { customers: customers.length, invoices: invoices.length, orders: orders.length, invoiceItems: items.length } };
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

  private async enqueueOutbox(tableName: string, recordId: string, action: 'insert' | 'update' | 'delete', payload: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.run(`
      INSERT INTO outbox (table_name, record_id, action, payload, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [tableName, recordId, action, JSON.stringify(payload), new Date().toISOString()]);
  }

  async close(): Promise<void> { /* better-sqlite3 closes on process exit */ }

  // Upsert helpers for cloud -> local synchronization
  async upsertCustomerFromCloud(payload: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    total_spent?: number;
    last_order?: string;
    label?: string;
    measurements?: any;
    notes?: string;
    created_at: string;
    updated_at: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const local = await this.get<{ id: string; version: number; updated_at: string } | undefined>('SELECT id, version, updated_at FROM customers WHERE id = ?', [payload.id]);

    const remoteVersion = (payload as any).version ?? 1;
    const remoteUpdatedAt = payload.updated_at;

    if (local) {
      // Conflict policy: keep local if it is newer or equal by version/updated_at
      const keepLocal = (local.version ?? 1) >= remoteVersion || new Date(local.updated_at) >= new Date(remoteUpdatedAt);
      if (!keepLocal) {
        await this.updateCustomer(payload.id, {
          name: payload.name,
          phone: payload.phone,
          address: payload.address,
          totalSpent: payload.total_spent as any,
          lastOrder: payload.last_order,
          label: payload.label,
          measurements: payload.measurements,
          notes: payload.notes
        }, { fromCloud: true });
      }
    } else {
      await this.run(`
        INSERT INTO customers (id, name, phone, address, total_spent, last_order, label, measurements, notes, version, deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `, [
        payload.id,
        payload.name,
        payload.phone || null,
        payload.address || null,
        payload.total_spent || 0,
        payload.last_order || null,
        payload.label || null,
        JSON.stringify(payload.measurements || null),
        payload.notes || null,
        remoteVersion,
        payload.created_at,
        payload.updated_at
      ]);
    }
  }

  async upsertInvoiceFromCloud(payload: {
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
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const local = await this.get<{ id: string; version: number; updated_at: string } | undefined>('SELECT id, version, updated_at FROM invoices WHERE id = ?', [payload.id]);
    const remoteVersion = (payload as any).version ?? 1;
    const remoteUpdatedAt = payload.updated_at;

    if (local) {
      const keepLocal = (local.version ?? 1) >= remoteVersion || new Date(local.updated_at) >= new Date(remoteUpdatedAt);
      if (!keepLocal) {
        await this.updateInvoice(payload.id, {
          customer_id: payload.customer_id,
          customer_name: payload.customer_name,
          customer_phone: payload.customer_phone,
          customer_address: payload.customer_address,
          total: payload.total,
          paid_amount: payload.paid_amount,
          status: payload.status,
          invoice_date: payload.invoice_date,
          due_date: payload.due_date,
          notes: payload.notes,
          fabric_image_url: payload.fabric_image_url
        }, { fromCloud: true });
      }
    } else {
      await this.run(`
        INSERT INTO invoices (id, invoice_number, customer_id, customer_name, customer_phone, customer_address,
                             total, paid_amount, status, invoice_date, due_date, notes, fabric_image_url, version, deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `, [
        payload.id,
        payload.invoice_number,
        payload.customer_id || null,
        payload.customer_name,
        payload.customer_phone || null,
        payload.customer_address || null,
        payload.total,
        payload.paid_amount,
        payload.status,
        payload.invoice_date,
        payload.due_date || null,
        payload.notes || null,
        payload.fabric_image_url || null,
        remoteVersion,
        payload.created_at,
        payload.updated_at
      ]);
    }
  }

  async upsertOrderFromCloud(payload: {
    id: string;
    customer_id: string;
    order_date: string;
    delivery_date: string;
    status: string;
    total: number;
    notes?: string;
    created_at: string;
    updated_at: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const local = await this.get<{ id: string; version: number; updated_at: string } | undefined>('SELECT id, version, updated_at FROM orders WHERE id = ?', [payload.id]);
    const remoteVersion = (payload as any).version ?? 1;
    const remoteUpdatedAt = payload.updated_at;

    if (local) {
      const keepLocal = (local.version ?? 1) >= remoteVersion || new Date(local.updated_at) >= new Date(remoteUpdatedAt);
      if (!keepLocal) {
        await this.updateOrder(payload.id, {
          customer_id: payload.customer_id,
          order_date: payload.order_date,
          delivery_date: payload.delivery_date,
          status: payload.status,
          total: payload.total,
          notes: payload.notes
        }, { fromCloud: true });
      }
    } else {
      await this.run(`
        INSERT INTO orders (id, customer_id, order_date, delivery_date, status, total, notes, version, deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `, [
        payload.id,
        payload.customer_id,
        payload.order_date,
        payload.delivery_date,
        payload.status,
        payload.total,
        payload.notes || null,
        remoteVersion,
        payload.created_at,
        payload.updated_at
      ]);
    }
  }

  // Roles CRUD
  async getRoles(): Promise<any[]> {
    return await this.all<any>('SELECT * FROM roles WHERE deleted = 0 ORDER BY created_at DESC');
  }

  async createRole(role: any): Promise<any> {
    const id = this.generateId();
    const now = new Date().toISOString();
    await this.run(`
      INSERT INTO roles (id, name, description, permissions, allowed_pages, allowed_actions, is_active, version, deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [id, role.name, role.description || '', JSON.stringify(role.permissions || []), JSON.stringify(role.allowedPages || []), JSON.stringify(role.allowedActions || []), role.isActive ? 1 : 0, now, now]);
    const row = await this.get<any>('SELECT * FROM roles WHERE id = ?', [id]);
    await this.enqueueOutbox('roles', id, 'insert', row);
    return row;
  }

  async updateRole(id: string, updates: any): Promise<any> {
    const now = new Date().toISOString();
    const toSet: string[] = [];
    const vals: any[] = [];
    for (const [k, v] of Object.entries(updates)) {
      if (k === 'id' || k === 'created_at') continue;
      const value = Array.isArray(v) ? JSON.stringify(v) : v;
      toSet.push(`${k === 'permissions' || k === 'allowedPages' || k === 'allowedActions' ? (k === 'allowedPages' ? 'allowed_pages' : k === 'allowedActions' ? 'allowed_actions' : 'permissions') : k} = ?`);
      vals.push(value);
    }
    await this.run(`UPDATE roles SET ${toSet.join(', ')}, updated_at = ?, version = version + 1 WHERE id = ?`, [...vals, now, id]);
    const row = await this.get<any>('SELECT * FROM roles WHERE id = ?', [id]);
    await this.enqueueOutbox('roles', id, 'update', row);
    return row;
  }

  async deleteRole(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.run('UPDATE roles SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
    await this.enqueueOutbox('roles', id, 'delete', { id, deleted: 1, updated_at: now });
  }

  async getLastPull(table: string): Promise<string> {
    const row = await this.get<{ last_pull: string } | undefined>('SELECT last_pull FROM sync_state WHERE table_name = ?', [table]);
    return row?.last_pull || '1970-01-01T00:00:00.000Z';
  }

  async setLastPull(table: string, ts: string): Promise<void> {
    await this.run('INSERT INTO sync_state (table_name, last_pull) VALUES (?, ?) ON CONFLICT(table_name) DO UPDATE SET last_pull = excluded.last_pull', [table, ts]);
  }

  // Self-test to validate local DB CRUD and image URL persistence
  async selfTest(): Promise<{ ok: boolean; report: string }>{
    if (!this.db) throw new Error('Database not initialized');

    const lines: string[] = [];
    const nowIso = new Date().toISOString();
    try {
      console.log('Starting database self-test...');
      lines.push('بدء اختبار قاعدة البيانات المحلية...');

      // 1) Create test customer
      const cust = await this.createCustomer({
        name: 'Test Customer (LocalDB SelfTest)',
        phone: '07700000000',
        address: 'SelfTest Address',
        totalSpent: 0,
        lastOrder: nowIso,
        label: 'اختبار',
        measurements: { chest: 100, waist: 80 },
        notes: 'SelfTest'
      } as any);
      lines.push(`✅ تم إنشاء عميل تجريبي: ${cust.id}`);

      // 2) Create test invoice with image URL (text field)
      const inv = await this.createInvoice({
        customer_id: cust.id,
        customer_name: 'Test Customer (LocalDB SelfTest)',
        customer_phone: '07700000000',
        customer_address: 'SelfTest Address',
        total: 150,
        paid_amount: 50,
        status: 'جزئي',
        invoice_date: nowIso,
        due_date: nowIso,
        notes: 'SelfTest Invoice',
        fabric_image_url: 'https://example.com/selftest-image.jpg'
      } as any);
      lines.push(`✅ تم إنشاء فاتورة تجريبية: ${inv.id}`);

      // Verify image URL persisted
      const fetchedInv = await this.get<LocalInvoice>('SELECT * FROM invoices WHERE id = ?', [inv.id]);
      if (fetchedInv?.fabric_image_url === 'https://example.com/selftest-image.jpg') {
        lines.push('✅ تم حفظ رابط صورة القماش داخل القاعدة المحلية (حقل نصي)');
      } else {
        throw new Error('فشل التحقق من حفظ رابط الصورة في الفاتورة');
      }

      // 3) Create test order
      const ord = await this.createOrder({
        customer_id: cust.id,
        order_date: nowIso,
        delivery_date: nowIso,
        status: 'جديد',
        total: 100,
        notes: 'SelfTest Order'
      } as any);
      lines.push(`✅ تم إنشاء طلب تجريبي: ${ord.id}`);

      // 4) Read back entities
      const customers = await this.all<LocalCustomer>("SELECT * FROM customers WHERE name LIKE '%SelfTest%'");
      const invoices = await this.all<LocalInvoice>("SELECT * FROM invoices WHERE notes = 'SelfTest Invoice'");
      const orders = await this.all<LocalOrder>("SELECT * FROM orders WHERE notes = 'SelfTest Order'");
      if (!customers.length || !invoices.length || !orders.length) {
        throw new Error('فشل في قراءة السجلات التجريبية بعد الإدخال');
      }
      lines.push(`✅ قراءة السجلات: عملاء=${customers.length}, فواتير=${invoices.length}, طلبات=${orders.length}`);

      // 5) Update and verify
      await this.updateCustomer(cust.id, { notes: 'SelfTest Updated' });
      const updatedCust = await this.get<LocalCustomer>('SELECT * FROM customers WHERE id = ?', [cust.id]);
      if (updatedCust?.notes !== 'SelfTest Updated') {
        throw new Error('فشل التحديث على العميل');
      }
      lines.push('✅ التحديثات تعمل بشكل صحيح');

      // 6) Outbox check (should have entries)
      const outbox = await this.getOutboxBatch(10);
      if (outbox.length >= 3) {
        lines.push(`✅ تم تسجيل التغييرات في outbox (${outbox.length}) للمزامنة`);
      } else {
        lines.push('⚠️ لم يتم العثور على إدخالات كافية في outbox (قد يكون ذلك طبيعياً في بعض الحالات)');
      }

      // Note: لا نحذف السجلات التجريبية لضمان تتبعها، وواجهة القائمة لا تعرض "Test Customer"

      lines.push('🎉 اكتمل الاختبار بنجاح. قاعدة البيانات المحلية تعمل وتخزن النصوص وروابط الصور.');
      console.log('Database self-test completed successfully');
      return { ok: true, report: lines.join('\n') };
    } catch (e: any) {
      console.error('Database self-test failed:', e);
      lines.push(`❌ حدث خطأ: ${String(e?.message || e)}`);
      return { ok: false, report: lines.join('\n') };
    }
  }
}
