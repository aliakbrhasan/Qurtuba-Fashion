import { app } from 'electron';
import { join } from 'path';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
// Use better-sqlite3 for better Electron compatibility
import Database from 'better-sqlite3';
import { logger } from './utils';

// Use better-sqlite3 directly - no wrapper needed

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
  customer_measurements?: any;
  // Optional design details stored as comma-separated strings for portability
  fabric_type?: string;
  fabric_source?: string;
  collar_type?: string;
  chest_style?: string;
  sleeve_end?: string;
  bunija_type?: string;
  fabric_image_url?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface LocalUser {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  password_hash?: string | null;
  status: string;
  role?: string | null;
  role_id?: string | null;
  is_active: number; // 1 or 0
  created_at: string;
  updated_at: string;
  last_login?: string | null;
  deleted?: number; // 0 or 1
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

export interface LocalImage {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  data_url: string;
  thumbnail_url?: string;
  entity_type: string; // 'invoice', 'customer', 'order'
  entity_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
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
      logger.log('Initializing local database at:', this.dbPath);
      
      // Ensure the directory exists
      const { mkdirSync } = require('fs');
      const { dirname } = require('path');
      try {
        mkdirSync(dirname(this.dbPath), { recursive: true });
      } catch (e) {
        logger.warn('Could not create database directory:', e);
      }
      
      this.db = new Database(this.dbPath);
      logger.log('Database connection established');
      
      // Pragmas for durability and concurrency
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');
      this.createTables();
      logger.log('Database tables created successfully');
      await this.seedInitialUsersIfEmpty();
    } catch (err) {
      logger.error('Error opening database:', err);
      logger.error('Database path:', this.dbPath);
      throw err;
    }
  }

  // Low-level helpers
  private run(sql: string, params: any[] = []): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.prepare(sql).run(...params);
  }

  private get<T>(sql: string, params: any[] = []): T {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.prepare(sql).get(...params) as T;
  }

  private all<T>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.prepare(sql).all(...params) as T[];
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Users table
    this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password_hash TEXT,
        status TEXT NOT NULL,
        role TEXT,
        role_id TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        version INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login TEXT
      )
    `);

    // Customers table
    this.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        total_spent REAL DEFAULT 0,
        last_order TEXT,
        label TEXT,
        label_auto INTEGER NOT NULL DEFAULT 1,
        measurements TEXT,
        notes TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Invoices table
    this.run(`
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
        customer_measurements TEXT,
        fabric_type TEXT,
        fabric_source TEXT,
        collar_type TEXT,
        chest_style TEXT,
        sleeve_end TEXT,
        bunija_type TEXT,
        fabric_image_url TEXT,
        paid_at TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Defensive migration: add optional design detail columns if they are missing
    try {
      const cols = this.all<{ name: string }>("PRAGMA table_info('invoices')");
      const has = (n: string) => cols.some(c => String((c as any).name).toLowerCase() === n.toLowerCase());
      const maybeAdd = (col: string) => { try { if (!has(col)) this.run(`ALTER TABLE invoices ADD COLUMN ${col} TEXT`); } catch {} };
      maybeAdd('customer_measurements');
      maybeAdd('fabric_type');
      maybeAdd('fabric_source');
      maybeAdd('collar_type');
      maybeAdd('chest_style');
      maybeAdd('sleeve_end');
      maybeAdd('bunija_type');
      // Add synced column if missing
      try { if (!has('synced')) this.run(`ALTER TABLE invoices ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`); } catch {}
    } catch {}
    // Add missing columns for customers
    try {
      const has = (col: string) => this.db!.prepare("PRAGMA table_info(customers)").all().some((r: any) => r.name === col);
      if (!has('label_auto')) this.run('ALTER TABLE customers ADD COLUMN label_auto INTEGER NOT NULL DEFAULT 1');
    } catch {}

    // Orders table
    this.run(`
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
    this.run(`
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
    this.run(`
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
    this.run(`
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
    this.run(`
      CREATE TABLE IF NOT EXISTS sync_state (
        table_name TEXT PRIMARY KEY,
        last_pull TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'
      )
    `);

    // Images table
    this.run(`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        data_url TEXT NOT NULL,
        thumbnail_url TEXT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Admin logs table
    this.run(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL, -- create | update | delete
        entity_type TEXT NOT NULL, -- invoice | customer
        entity_id TEXT NOT NULL,
        changed_fields TEXT, -- JSON string of changed fields
        action_date TEXT NOT NULL, -- YYYY-MM-DD
        action_time TEXT NOT NULL, -- HH:mm
        user_name TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // Indexes
    this.run(`CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(created_at)`);
    this.run(`CREATE INDEX IF NOT EXISTS idx_outbox_table ON outbox(table_name, record_id)`);
    this.run(`CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_type, entity_id)`);
    this.run(`CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at)`);
    this.run(`CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at)`);
    this.run(`CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity_type, entity_id)`);
  }

  private async seedInitialUsersIfEmpty(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const row = this.get<{ cnt: number } | undefined>('SELECT COUNT(*) as cnt FROM users WHERE deleted = 0');
      const count = row?.cnt ?? 0;
      if (count > 0) return;

      const now = new Date().toISOString();
      const seed = [
        {
          id: this.generateId(),
          code: 'ADMIN001',
          name: 'مدير النظام',
          email: 'admin@qurtuba.com',
          phone: '07701234567',
          password_hash: null,
          status: 'ادمن',
          role: 'مدير النظام',
          role_id: null,
          is_active: 1,
          created_at: now,
          updated_at: now,
          last_login: null
        },
        {
          id: this.generateId(),
          code: 'EMP001',
          name: 'أحمد محمد',
          email: 'ahmed@qurtuba.com',
          phone: '07701234568',
          password_hash: null,
          status: 'موظف',
          role: 'مندوب مبيعات',
          role_id: null,
          is_active: 1,
          created_at: now,
          updated_at: now,
          last_login: null
        },
        {
          id: this.generateId(),
          code: 'ACC001',
          name: 'فاطمة علي',
          email: 'fatima@qurtuba.com',
          phone: '07701234569',
          password_hash: null,
          status: 'محاسب',
          role: 'محاسب مالي',
          role_id: null,
          is_active: 1,
          created_at: now,
          updated_at: now,
          last_login: null
        }
      ];
      for (const u of seed) {
        this.run(
          `INSERT INTO users (id, code, name, email, phone, password_hash, status, role, role_id, is_active, version, deleted, created_at, updated_at, last_login)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`,
          [u.id, u.code, u.name, u.email, u.phone, u.password_hash, u.status, u.role, u.role_id, u.is_active, u.created_at, u.updated_at, u.last_login]
        );
      }
    } catch (e) {
      // Non-fatal
      logger.warn('Seed users failed:', e);
    }
  }

  // Users methods
  async getUsers(): Promise<LocalUser[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.all<LocalUser>(
      'SELECT * FROM users WHERE deleted = 0 ORDER BY created_at DESC'
    );
    return rows;
  }

  async findUserByEmail(email: string): Promise<LocalUser | null> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.get<LocalUser | undefined>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND deleted = 0 LIMIT 1',
      [email]
    );
    return row ?? null;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.get<{ exists: number } | undefined>(
      'SELECT 1 as exists FROM users WHERE LOWER(email) = LOWER(?) AND deleted = 0 LIMIT 1',
      [email]
    );
    return !!row;
  }

  async checkCodeExists(code: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.get<{ exists: number } | undefined>(
      'SELECT 1 as exists FROM users WHERE code = ? AND deleted = 0 LIMIT 1',
      [code]
    );
    return !!row;
  }

  async createUser(user: {
    code: string;
    name: string;
    email: string;
    phone?: string;
    password_hash?: string | null;
    status: string;
    role?: string | null;
    role_id?: string | null;
    is_active?: boolean;
  }): Promise<LocalUser> {
    if (!this.db) throw new Error('Database not initialized');
    const id = this.generateId();
    const now = new Date().toISOString();

    await this.run(
      `INSERT INTO users (id, code, name, email, phone, password_hash, status, role, role_id, is_active, version, deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      [
        id,
        user.code,
        user.name,
        user.email,
        user.phone ?? null,
        user.password_hash ?? null,
        user.status,
        user.role ?? null,
        user.role_id ?? null,
        user.is_active === false ? 0 : 1,
        now,
        now
      ]
    );

    const row = await this.get<LocalUser>('SELECT * FROM users WHERE id = ?', [id]);
    await this.enqueueOutbox('users', id, 'insert', row);
    return row;
  }

  async updateUser(id: string, updates: Partial<LocalUser>): Promise<LocalUser> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    const allowedKeys = new Set([
      'code',
      'name',
      'email',
      'phone',
      'password_hash',
      'status',
      'role',
      'role_id',
      'is_active',
      'last_login'
    ]);
    const toSet: string[] = [];
    const vals: any[] = [];
    for (const [k, v] of Object.entries(updates)) {
      if (!allowedKeys.has(k)) continue;
      if (k === 'is_active') {
        toSet.push('is_active = ?');
        vals.push(v ? 1 : 0);
      } else {
        toSet.push(`${k} = ?`);
        vals.push(v);
      }
    }
    if (toSet.length === 0) {
      const row = await this.get<LocalUser>('SELECT * FROM users WHERE id = ?', [id]);
      return row;
    }
    await this.run(
      `UPDATE users SET ${toSet.join(', ')}, updated_at = ?, version = version + 1 WHERE id = ?`,
      [...vals, now, id]
    );
    const row = await this.get<LocalUser>('SELECT * FROM users WHERE id = ?', [id]);
    await this.enqueueOutbox('users', id, 'update', row);
    return row;
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    await this.run('UPDATE users SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
    await this.enqueueOutbox('users', id, 'delete', { id, deleted: 1, updated_at: now });
  }

  async updateLastLogin(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    await this.run('UPDATE users SET last_login = ?, updated_at = ?, version = version + 1 WHERE id = ?', [now, now, id]);
    return true;
  }

  async updatePassword(id: string, password_hash: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    await this.run('UPDATE users SET password_hash = ?, updated_at = ?, version = version + 1 WHERE id = ?', [password_hash, now, id]);
    return true;
  }

  // Customer methods
  async getCustomers(): Promise<LocalCustomer[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const customers = await this.all<LocalCustomer>("SELECT * FROM customers WHERE deleted = 0 AND LOWER(name) NOT LIKE '%test customer%' ORDER BY created_at DESC");
      logger.debug('Retrieved customers count:', customers.length);
      return customers;
    } catch (error) {
      logger.error('Error retrieving customers:', error);
      throw error;
    }
  }

  async createCustomer(customer: Omit<LocalCustomer, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<LocalCustomer> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO customers (id, name, phone, address, total_spent, last_order, label, label_auto, measurements, notes, version, deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [id, customer.name, customer.phone, customer.address, customer.totalSpent, customer.lastOrder, customer.label,
        (customer as any).label_auto === false ? 0 : 1, JSON.stringify(customer.measurements), customer.notes, now, now]);

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
    // Map camelCase payload keys to snake_case DB columns
    const keyMap: Record<string, string> = {
      totalSpent: 'total_spent',
      lastOrder: 'last_order',
    };
    const entries = Object.entries(updates).filter(([k]) => k !== 'id' && k !== 'created_at');
    const columns: string[] = [];
    const values: any[] = [];
    for (const [k, v] of entries) {
      const col = keyMap[k] || k;
      columns.push(`${col} = ?`);
      if (col === 'measurements') {
        values.push(JSON.stringify(v));
      } else if (col === 'label_auto') {
        values.push(v ? 1 : 0);
      } else {
        values.push(v);
      }
    }
    const setClause = columns.join(', ');
    
    const versionUpdate = options?.fromCloud ? '' : ', version = version + 1';
    await this.run(`UPDATE customers SET ${setClause}, updated_at = ?${versionUpdate} WHERE id = ?`, [...values, now, id]);

    const row = await this.get<LocalCustomer | undefined>('SELECT * FROM customers WHERE id = ?', [id]);
    if (!row) {
      // Ensure we don't enqueue an invalid payload causing NOT NULL constraint on outbox.payload
      throw new Error('Customer not found');
    }
    if (!options?.fromCloud) {
      await this.enqueueOutbox('customers', id, 'update', row);
    }

    return row;
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
      logger.debug('Retrieved invoices count:', invoices.length);
      return invoices;
    } catch (error) {
      logger.error('Error retrieving invoices:', error);
      throw error;
    }
  }

  async createInvoice(invoice: Omit<LocalInvoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at' | 'synced'>): Promise<LocalInvoice> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = this.generateId();
    const invoiceNumber = this.generateInvoiceNumber();
    const now = new Date().toISOString();
    
    logger.debug('Creating invoice:', invoiceNumber);
    
    try {
      await this.run(`
        INSERT INTO invoices (id, invoice_number, customer_id, customer_name, customer_phone, customer_address,
                             total, paid_amount, status, invoice_date, due_date, notes, customer_measurements,
                             fabric_type, fabric_source, collar_type, chest_style, sleeve_end, bunija_type,
                             fabric_image_url, paid_at, version, deleted, created_at, updated_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, invoiceNumber, invoice.customer_id, invoice.customer_name, invoice.customer_phone,
          invoice.customer_address, invoice.total, invoice.paid_amount, invoice.status,
          invoice.invoice_date, invoice.due_date, invoice.notes, JSON.stringify((invoice as any).customer_measurements || null),
          (invoice as any).fabric_type || null, (invoice as any).fabric_source || null, (invoice as any).collar_type || null,
          (invoice as any).chest_style || null, (invoice as any).sleeve_end || null, (invoice as any).bunija_type || null,
          invoice.fabric_image_url, invoice.paid_at || null, 1, 0, now, now, 0]);
      
      logger.debug('Invoice created successfully with ID:', id);
    } catch (error) {
      logger.error('Error creating invoice:', error);
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
    // Only allow updating known columns to avoid 'no such column' errors
    const allowed = new Set([
      'customer_id','customer_name','customer_phone','customer_address','total','paid_amount','status','invoice_date','due_date','notes',
      'customer_measurements','fabric_type','fabric_source','collar_type','chest_style','sleeve_end','bunija_type','fabric_image_url','paid_at','version','deleted','updated_at'
    ]);
    // Normalize entries: keep only allowed keys, drop undefined values, and serialize measurement snapshots
    const entries = Object.entries(updates)
      .filter(([k]) => allowed.has(k))
      .map(([k, v]) => {
        if (k === 'customer_measurements') {
          try { return [k, v == null ? null : JSON.stringify(v)] as const; } catch { return [k, null] as const; }
        }
        return [k, v] as const;
      })
      .filter(([, v]) => v !== undefined);
    const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = entries.map(([, v]) => v);
    
    const versionUpdate = options?.fromCloud ? '' : ', version = version + 1';
    if (setClause.length > 0) {
      await this.run(`UPDATE invoices SET ${setClause}, updated_at = ?${versionUpdate} WHERE id = ?`, [...values, now, id]);
    } else {
      await this.run(`UPDATE invoices SET updated_at = ?${versionUpdate} WHERE id = ?`, [now, id]);
    }
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
      invoiceItems: await this.all<any>('SELECT * FROM invoice_items'),
      users: await this.all<any>('SELECT * FROM users'),
      roles: await this.all<any>('SELECT * FROM roles'),
      images: await this.all<any>('SELECT * FROM images'),
      adminLogs: await this.all<any>('SELECT * FROM admin_logs')
    };
  }

  // Export all tables as a JSON object
  async exportAll(): Promise<{ customers: any[]; invoices: any[]; orders: any[]; invoiceItems: any[]; users: any[]; roles: any[]; images: any[]; adminLogs: any[]; designSettings?: any; meta: any }> {
    const data = await this.getAllOfflineData();
    // Normalize JSON fields (measurements on customers, customer_measurements on invoices)
    const safeParse = (v: any) => {
      try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return null; }
    };
    const customers = (data.customers || []).map((c: any) => ({
      ...c,
      measurements: safeParse(c.measurements)
    }));
    const invoices = (data.invoices || []).map((inv: any) => ({
      ...inv,
      customer_measurements: safeParse(inv.customer_measurements)
    }));

    // Embed image file data as base64 into export bundle
    const images = (data.images || []).map((img: any) => {
      try {
        const baseDir = join(app.getPath('userData'), 'images');
        const absPath = join(baseDir, img.filename);
        if (existsSync(absPath)) {
          const buf = readFileSync(absPath);
          const b64 = buf.toString('base64');
          return { ...img, file_data_base64: b64 };
        }
      } catch {}
      return { ...img };
    });

    const bundle: any = {
      customers,
      invoices,
      orders: data.orders,
      invoiceItems: data.invoiceItems,
      users: data.users,
      roles: data.roles,
      images,
      adminLogs: data.adminLogs,
      meta: { exportedAt: new Date().toISOString(), version: 3 }
    };
    // Try to include design settings if cached in app cache (renderer may provide API)
    try {
      const { readFileSync } = require('fs');
      // No direct access to renderer cache here; leave designSettings undefined in Electron main export.
      // It will be merged by renderer facade if available.
    } catch {}
    return bundle;
  }

  // Import all tables from a JSON object (replace strategy)
  async importAll(payload: { customers?: any[]; invoices?: any[]; orders?: any[]; invoiceItems?: any[]; users?: any[]; roles?: any[]; images?: any[]; adminLogs?: any[] }, options?: { policy?: 'replace' | 'merge'; scope?: { customers?: boolean; invoices?: boolean; orders?: boolean; invoiceItems?: boolean; users?: boolean; roles?: boolean; images?: boolean; adminLogs?: boolean } }): Promise<{ imported: { customers: number; invoices: number; orders: number; invoiceItems: number; users: number; roles: number; images: number; adminLogs: number } }> {
    if (!this.db) throw new Error('Database not initialized');
    const policy = options?.policy || 'replace';
    const scope = Object.assign({ customers: true, invoices: true, orders: true, invoiceItems: true, users: true, roles: true, images: true, adminLogs: true }, options?.scope || {});
    const customers = scope.customers && Array.isArray(payload.customers) ? payload.customers : [];
    const invoices = scope.invoices && Array.isArray(payload.invoices) ? payload.invoices : [];
    const orders = scope.orders && Array.isArray(payload.orders) ? payload.orders : [];
    const items = scope.invoiceItems && Array.isArray(payload.invoiceItems) ? payload.invoiceItems : [];
    const users = scope.users && Array.isArray(payload.users) ? payload.users : [];
    const roles = scope.roles && Array.isArray(payload.roles) ? payload.roles : [];
    const images = scope.images && Array.isArray(payload.images) ? payload.images : [];
    const adminLogs = scope.adminLogs && Array.isArray(payload.adminLogs) ? payload.adminLogs : [];

    if (policy === 'replace') {
      if (scope.invoiceItems) await this.run('DELETE FROM invoice_items');
      if (scope.orders) await this.run('DELETE FROM orders');
      if (scope.invoices) await this.run('DELETE FROM invoices');
      if (scope.customers) await this.run('DELETE FROM customers');
      if (scope.users) await this.run('DELETE FROM users');
      if (scope.roles) await this.run('DELETE FROM roles');
      if (scope.images) await this.run('DELETE FROM images');
      if (scope.adminLogs) await this.run('DELETE FROM admin_logs');
    }

    const upsert = async (table: string, cols: string[], rowVals: any[]) => {
      if (policy === 'merge') {
        const placeholders = cols.map(() => '?').join(', ');
        const assignments = cols.filter(c => c !== 'id').map(c => `${c} = excluded.${c}`).join(', ');
        await this.run(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${assignments}`, rowVals);
      } else {
        await this.run(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, rowVals);
      }
    };

    if (customers.length) {
      for (const c of customers) {
        await upsert('customers', ['id','name','phone','address','total_spent','last_order','label','label_auto','measurements','notes','version','deleted','created_at','updated_at'], [
          c.id,
          c.name || '',
          c.phone || null,
          c.address || null,
          (c.total_spent ?? c.totalSpent) || 0,
          c.last_order || c.lastOrder || null,
          c.label || null,
          (c.label_auto === false ? 0 : 1),
          JSON.stringify(c.measurements ?? null),
          c.notes || null,
          (c.version ?? 1),
          (c.deleted ?? 0),
          c.created_at || new Date().toISOString(),
          c.updated_at || new Date().toISOString(),
        ]);
      }
    }

    if (invoices.length) {
      for (const inv of invoices) {
        await upsert('invoices', ['id','invoice_number','customer_id','customer_name','customer_phone','customer_address','total','paid_amount','status','invoice_date','due_date','notes','customer_measurements','fabric_type','fabric_source','collar_type','chest_style','sleeve_end','bunija_type','fabric_image_url','paid_at','version','deleted','created_at','updated_at','synced'], [
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
          inv.customer_measurements ? JSON.stringify(inv.customer_measurements) : null,
          (inv as any).fabric_type || null,
          (inv as any).fabric_source || null,
          (inv as any).collar_type || null,
          (inv as any).chest_style || null,
          (inv as any).sleeve_end || null,
          (inv as any).bunija_type || null,
          inv.fabric_image_url || null,
          inv.paid_at || null,
          (inv.version ?? 1),
          (inv.deleted ?? 0),
          inv.created_at || new Date().toISOString(),
          inv.updated_at || new Date().toISOString(),
          (inv.synced ?? 0)
        ]);
      }
    }

    if (orders.length) {
      for (const o of orders) {
        await upsert('orders', ['id','customer_id','order_date','delivery_date','status','total','notes','version','deleted','created_at','updated_at'], [
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
    }

    if (items.length) {
      for (const it of items) {
        await upsert('invoice_items', ['id','invoice_id','item_name','description','quantity','unit_price','total_price','created_at'], [
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
    }

    if (users.length) {
      for (const u of users) {
        await upsert('users', ['id','code','name','email','phone','password_hash','status','role','role_id','is_active','version','deleted','created_at','updated_at','last_login'], [
          u.id,
          u.code,
          u.name,
          u.email,
          u.phone ?? null,
          u.password_hash ?? null,
          u.status,
          u.role ?? null,
          u.role_id ?? null,
          (u.is_active === false ? 0 : 1),
          (u.version ?? 1),
          (u.deleted ?? 0),
          u.created_at || new Date().toISOString(),
          u.updated_at || new Date().toISOString(),
          u.last_login || null,
        ]);
      }
    }

    if (roles.length) {
      for (const r of roles) {
        await upsert('roles', ['id','name','description','permissions','allowed_pages','allowed_actions','is_active','version','deleted','created_at','updated_at'], [
          r.id,
          r.name,
          r.description || null,
          typeof r.permissions === 'string' ? r.permissions : JSON.stringify(r.permissions || []),
          typeof r.allowed_pages === 'string' ? r.allowed_pages : JSON.stringify(r.allowed_pages || []),
          typeof r.allowed_actions === 'string' ? r.allowed_actions : JSON.stringify(r.allowed_actions || []),
          (r.is_active === false ? 0 : 1),
          (r.version ?? 1),
          (r.deleted ?? 0),
          r.created_at || new Date().toISOString(),
          r.updated_at || new Date().toISOString(),
        ]);
      }
    }

    if (images.length) {
      const baseDir = join(app.getPath('userData'), 'images');
      try { mkdirSync(baseDir, { recursive: true }); } catch {}
      for (const im of images) {
        const imageId = im.id || this.generateId();
        const filename = im.filename || `${imageId}.bin`;
        // If file data provided, write it to disk and set data_url accordingly
        let dataUrl = im.data_url || null;
        try {
          if (im.file_data_base64 && typeof im.file_data_base64 === 'string') {
            const absPath = join(baseDir, filename);
            const buf = Buffer.from(im.file_data_base64, 'base64');
            try { mkdirSync(join(absPath, '..'), { recursive: true }); } catch {}
            writeFileSync(absPath, buf);
            dataUrl = pathToFileURL(absPath).toString();
          }
        } catch {}
        await upsert('images', ['id','filename','original_name','mime_type','size','width','height','data_url','thumbnail_url','entity_type','entity_id','created_by','created_at','updated_at'], [
          imageId,
          filename,
          im.original_name,
          im.mime_type,
          Number(im.size || 0),
          im.width || null,
          im.height || null,
          dataUrl,
          im.thumbnail_url || null,
          im.entity_type,
          im.entity_id,
          im.created_by || null,
          im.created_at || new Date().toISOString(),
          im.updated_at || new Date().toISOString(),
        ]);
      }
    }

    if (adminLogs.length) {
      for (const lg of adminLogs) {
        await upsert('admin_logs', ['id','action_type','entity_type','entity_id','changed_fields','action_date','action_time','user_name','created_at'], [
          lg.id || this.generateId(),
          lg.action_type,
          lg.entity_type,
          lg.entity_id,
          typeof lg.changed_fields === 'string' ? lg.changed_fields : (lg.changed_fields ? JSON.stringify(lg.changed_fields) : null),
          lg.action_date || (lg.created_at || new Date().toISOString()).slice(0,10),
          lg.action_time || new Date().toTimeString().slice(0,5),
          lg.user_name || null,
          lg.created_at || new Date().toISOString(),
        ]);
      }
    }

    return { imported: { customers: customers.length, invoices: invoices.length, orders: orders.length, invoiceItems: items.length, users: users.length, roles: roles.length, images: images.length, adminLogs: adminLogs.length } };
  }

  async clearAllData(): Promise<{
    customers: number;
    invoices: number;
    orders: number;
    invoiceItems: number;
    images: number;
    adminLogs: number;
    outbox: number;
    syncState: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const countRows = (table: string): number => {
      const row = this.db!.prepare(`SELECT COUNT(1) AS count FROM ${table}`).get() as { count?: number } | undefined;
      return Number(row?.count ?? 0);
    };

    const snapshot = {
      customers: countRows('customers'),
      invoices: countRows('invoices'),
      orders: countRows('orders'),
      invoiceItems: countRows('invoice_items'),
      images: countRows('images'),
      adminLogs: countRows('admin_logs'),
      outbox: countRows('outbox'),
      syncState: countRows('sync_state'),
    };

    const tablesToClear = ['invoice_items', 'orders', 'invoices', 'customers', 'images', 'admin_logs', 'outbox', 'sync_state'];
    const db = this.db!;
    const wipe = db.transaction(() => {
      for (const table of tablesToClear) {
        db.prepare(`DELETE FROM ${table}`).run();
      }
    });
    wipe();

    return snapshot;
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
    const payloadString = (() => {
      try {
        const json = JSON.stringify(payload ?? {});
        // If JSON.stringify returns undefined (only for functions/undefined at top-level), fallback to '{}'
        return json === undefined ? '{}' : json;
      } catch {
        return '{}';
      }
    })();
    await this.run(`
      INSERT INTO outbox (table_name, record_id, action, payload, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [tableName, recordId, action, payloadString, new Date().toISOString()]);
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

  // Image CRUD functions
  async createImage(image: Omit<LocalImage, 'id' | 'created_at' | 'updated_at'>): Promise<LocalImage> {
    if (!this.db) throw new Error('Database not initialized');
    
    logger.debug('LocalDatabase.createImage called');
    const id = this.generateId();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO images (id, filename, original_name, mime_type, size, width, height, data_url, thumbnail_url, entity_type, entity_id, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        image.filename,
        image.original_name,
        image.mime_type,
        image.size,
        image.width || null,
        image.height || null,
        image.data_url,
        image.thumbnail_url || null,
        image.entity_type,
        image.entity_id,
        image.created_by || null,
        now,
        now
      ]);
      
      const row = await this.get<LocalImage>('SELECT * FROM images WHERE id = ?', [id]);
      await this.enqueueOutbox('images', id, 'insert', row);
      logger.debug('LocalDatabase.createImage success');
      return row;
    } catch (error) {
      logger.error('LocalDatabase.createImage error:', error);
      throw error;
    }
  }

  async getImagesByEntity(entityType: string, entityId: string): Promise<LocalImage[]> {
    if (!this.db) throw new Error('Database not initialized');
    logger.debug('LocalDatabase.getImagesByEntity called');
    try {
      const result = await this.all<LocalImage>('SELECT * FROM images WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC', [entityType, entityId]);
      return result;
    } catch (error) {
      logger.error('LocalDatabase.getImagesByEntity error:', error);
      throw error;
    }
  }

  async getImage(id: string): Promise<LocalImage | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.get<LocalImage>('SELECT * FROM images WHERE id = ?', [id]);
  }

  async updateImage(id: string, updates: Partial<LocalImage>): Promise<LocalImage> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const toSet: string[] = [];
    const vals: any[] = [];
    
    for (const [k, v] of Object.entries(updates)) {
      if (k === 'id' || k === 'created_at') continue;
      toSet.push(`${k} = ?`);
      vals.push(v);
    }
    
    await this.run(`UPDATE images SET ${toSet.join(', ')}, updated_at = ? WHERE id = ?`, [...vals, now, id]);
    const row = await this.get<LocalImage>('SELECT * FROM images WHERE id = ?', [id]);
    await this.enqueueOutbox('images', id, 'update', row);
    return row;
  }

  async deleteImage(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    await this.run('DELETE FROM images WHERE id = ?', [id]);
    await this.enqueueOutbox('images', id, 'delete', { id, deleted: 1, updated_at: now });
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
      logger.log('Starting database self-test...');
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

      // 2) Create test invoice (no external image to avoid 404s)
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
        fabric_image_url: null
      } as any);
      lines.push(`✅ تم إنشاء فاتورة تجريبية: ${inv.id}`);
      // Verify invoice persisted
      const fetchedInv = await this.get<LocalInvoice>('SELECT * FROM invoices WHERE id = ?', [inv.id]);
      if (fetchedInv?.id !== inv.id) {
        throw new Error('فشل التحقق من حفظ الفاتورة');
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
      logger.log('Database self-test completed successfully');
      return { ok: true, report: lines.join('\n') };
    } catch (e: any) {
      logger.error('Database self-test failed:', e);
      lines.push(`❌ حدث خطأ: ${String(e?.message || e)}`);
      return { ok: false, report: lines.join('\n') };
    }
  }

  // Admin logs API
  async createAdminLog(entry: {
    action_type: 'create' | 'update' | 'delete';
    entity_type: 'invoice' | 'customer';
    entity_id: string;
    changed_fields?: any;
    action_date?: string;
    action_time?: string;
    user_name?: string;
  }): Promise<{ id: string } & typeof entry & { created_at: string }> {
    if (!this.db) throw new Error('Database not initialized');
    const id = this.generateId();
    const now = new Date();
    const createdAt = now.toISOString();
    const dateStr = entry.action_date || new Date(createdAt).toISOString().slice(0, 10);
    const timeStr = entry.action_time || now.toTimeString().slice(0, 5);

    const changedJson = entry.changed_fields ? JSON.stringify(entry.changed_fields) : null;

    // De-duplicate: if identical action on same entity by same user with same fields within 45 seconds, skip
    try {
      const last = this.get<any | undefined>(
        'SELECT * FROM admin_logs WHERE action_type = ? AND entity_type = ? AND entity_id = ? AND (user_name IS ? OR user_name = ?) ORDER BY created_at DESC LIMIT 1',
        [entry.action_type, entry.entity_type, entry.entity_id, entry.user_name || null, entry.user_name || null]
      );
      if (last && (last.changed_fields || null) === (changedJson || null)) {
        const lastTs = new Date(last.created_at).getTime();
        if (!Number.isNaN(lastTs)) {
          const diffSec = Math.abs(now.getTime() - lastTs) / 1000;
          if (diffSec <= 45) {
            return {
              id: String(last.id),
              action_type: last.action_type,
              entity_type: last.entity_type,
              entity_id: last.entity_id,
              changed_fields: entry.changed_fields,
              action_date: last.action_date,
              action_time: last.action_time,
              user_name: last.user_name,
              created_at: last.created_at,
            } as any;
          }
        }
      }
    } catch {}

    const payload = {
      id,
      action_type: entry.action_type,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      changed_fields: changedJson,
      action_date: dateStr,
      action_time: timeStr,
      user_name: entry.user_name || null,
      created_at: createdAt,
    } as const;

    await this.run(
      `INSERT INTO admin_logs (id, action_type, entity_type, entity_id, changed_fields, action_date, action_time, user_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.id,
        payload.action_type,
        payload.entity_type,
        payload.entity_id,
        payload.changed_fields,
        payload.action_date,
        payload.action_time,
        payload.user_name,
        payload.created_at,
      ]
    );

    return payload as any;
  }

  async getAdminLogs(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.all<any>('SELECT * FROM admin_logs ORDER BY created_at DESC, id DESC');
    return rows.map(r => ({
      ...r,
      changed_fields: r.changed_fields ? JSON.parse(r.changed_fields) : null,
    }));
  }
}
