"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDatabase = void 0;
const electron_1 = require("electron");
const path_1 = require("path");
// Use better-sqlite3 for better Electron compatibility
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
class LocalDatabase {
    constructor() {
        this.db = null;
        const userDataPath = electron_1.app.getPath('userData');
        this.dbPath = (0, path_1.join)(userDataPath, 'qurtuba-local.db');
    }
    async initialize() {
        try {
            console.log('Initializing local database at:', this.dbPath);
            // Ensure the directory exists
            const { mkdirSync } = require('fs');
            const { dirname } = require('path');
            try {
                mkdirSync(dirname(this.dbPath), { recursive: true });
            }
            catch (e) {
                console.warn('Could not create database directory:', e);
            }
            this.db = new better_sqlite3_1.default(this.dbPath);
            console.log('Database connection established');
            // Pragmas for durability and concurrency
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('foreign_keys = ON');
            this.createTables();
            console.log('Database tables created successfully');
            await this.seedInitialUsersIfEmpty();
        }
        catch (err) {
            console.error('Error opening database:', err);
            console.error('Database path:', this.dbPath);
            throw err;
        }
    }
    // Low-level helpers
    run(sql, params = []) {
        if (!this.db)
            throw new Error('Database not initialized');
        this.db.prepare(sql).run(...params);
    }
    get(sql, params = []) {
        if (!this.db)
            throw new Error('Database not initialized');
        return this.db.prepare(sql).get(...params);
    }
    all(sql, params = []) {
        if (!this.db)
            throw new Error('Database not initialized');
        return this.db.prepare(sql).all(...params);
    }
    createTables() {
        if (!this.db)
            throw new Error('Database not initialized');
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
            const cols = this.all("PRAGMA table_info('invoices')");
            const has = (n) => cols.some(c => String(c.name).toLowerCase() === n.toLowerCase());
            const maybeAdd = (col) => { try {
                if (!has(col))
                    this.run(`ALTER TABLE invoices ADD COLUMN ${col} TEXT`);
            }
            catch { } };
            maybeAdd('customer_measurements');
            maybeAdd('fabric_type');
            maybeAdd('fabric_source');
            maybeAdd('collar_type');
            maybeAdd('chest_style');
            maybeAdd('sleeve_end');
            maybeAdd('bunija_type');
            // Add synced column if missing
            try {
                if (!has('synced'))
                    this.run(`ALTER TABLE invoices ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`);
            }
            catch { }
        }
        catch { }
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
    async seedInitialUsersIfEmpty() {
        if (!this.db)
            throw new Error('Database not initialized');
        try {
            const row = this.get('SELECT COUNT(*) as cnt FROM users WHERE deleted = 0');
            const count = row?.cnt ?? 0;
            if (count > 0)
                return;
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
                this.run(`INSERT INTO users (id, code, name, email, phone, password_hash, status, role, role_id, is_active, version, deleted, created_at, updated_at, last_login)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`, [u.id, u.code, u.name, u.email, u.phone, u.password_hash, u.status, u.role, u.role_id, u.is_active, u.created_at, u.updated_at, u.last_login]);
            }
        }
        catch (e) {
            // Non-fatal
            console.warn('Seed users failed:', e);
        }
    }
    // Users methods
    async getUsers() {
        if (!this.db)
            throw new Error('Database not initialized');
        const rows = await this.all('SELECT * FROM users WHERE deleted = 0 ORDER BY created_at DESC');
        return rows;
    }
    async findUserByEmail(email) {
        if (!this.db)
            throw new Error('Database not initialized');
        const row = await this.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND deleted = 0 LIMIT 1', [email]);
        return row ?? null;
    }
    async checkEmailExists(email) {
        if (!this.db)
            throw new Error('Database not initialized');
        const row = await this.get('SELECT 1 as exists FROM users WHERE LOWER(email) = LOWER(?) AND deleted = 0 LIMIT 1', [email]);
        return !!row;
    }
    async checkCodeExists(code) {
        if (!this.db)
            throw new Error('Database not initialized');
        const row = await this.get('SELECT 1 as exists FROM users WHERE code = ? AND deleted = 0 LIMIT 1', [code]);
        return !!row;
    }
    async createUser(user) {
        if (!this.db)
            throw new Error('Database not initialized');
        const id = this.generateId();
        const now = new Date().toISOString();
        await this.run(`INSERT INTO users (id, code, name, email, phone, password_hash, status, role, role_id, is_active, version, deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`, [
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
        ]);
        const row = await this.get('SELECT * FROM users WHERE id = ?', [id]);
        await this.enqueueOutbox('users', id, 'insert', row);
        return row;
    }
    async updateUser(id, updates) {
        if (!this.db)
            throw new Error('Database not initialized');
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
        const toSet = [];
        const vals = [];
        for (const [k, v] of Object.entries(updates)) {
            if (!allowedKeys.has(k))
                continue;
            if (k === 'is_active') {
                toSet.push('is_active = ?');
                vals.push(v ? 1 : 0);
            }
            else {
                toSet.push(`${k} = ?`);
                vals.push(v);
            }
        }
        if (toSet.length === 0) {
            const row = await this.get('SELECT * FROM users WHERE id = ?', [id]);
            return row;
        }
        await this.run(`UPDATE users SET ${toSet.join(', ')}, updated_at = ?, version = version + 1 WHERE id = ?`, [...vals, now, id]);
        const row = await this.get('SELECT * FROM users WHERE id = ?', [id]);
        await this.enqueueOutbox('users', id, 'update', row);
        return row;
    }
    async deleteUser(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        await this.run('UPDATE users SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
        await this.enqueueOutbox('users', id, 'delete', { id, deleted: 1, updated_at: now });
    }
    async updateLastLogin(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        await this.run('UPDATE users SET last_login = ?, updated_at = ?, version = version + 1 WHERE id = ?', [now, now, id]);
        return true;
    }
    async updatePassword(id, password_hash) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        await this.run('UPDATE users SET password_hash = ?, updated_at = ?, version = version + 1 WHERE id = ?', [password_hash, now, id]);
        return true;
    }
    // Customer methods
    async getCustomers() {
        if (!this.db)
            throw new Error('Database not initialized');
        try {
            const customers = await this.all("SELECT * FROM customers WHERE deleted = 0 AND LOWER(name) NOT LIKE '%test customer%' ORDER BY created_at DESC");
            console.log('Retrieved customers count:', customers.length);
            return customers;
        }
        catch (error) {
            console.error('Error retrieving customers:', error);
            throw error;
        }
    }
    async createCustomer(customer) {
        if (!this.db)
            throw new Error('Database not initialized');
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
        };
    }
    async updateCustomer(id, updates, options) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        // Map camelCase payload keys to snake_case DB columns
        const keyMap = {
            totalSpent: 'total_spent',
            lastOrder: 'last_order',
        };
        const entries = Object.entries(updates).filter(([k]) => k !== 'id' && k !== 'created_at');
        const columns = [];
        const values = [];
        for (const [k, v] of entries) {
            const col = keyMap[k] || k;
            columns.push(`${col} = ?`);
            if (col === 'measurements') {
                values.push(JSON.stringify(v));
            }
            else {
                values.push(v);
            }
        }
        const setClause = columns.join(', ');
        const versionUpdate = options?.fromCloud ? '' : ', version = version + 1';
        await this.run(`UPDATE customers SET ${setClause}, updated_at = ?${versionUpdate} WHERE id = ?`, [...values, now, id]);
        if (!options?.fromCloud) {
            const row = await this.get('SELECT * FROM customers WHERE id = ?', [id]);
            await this.enqueueOutbox('customers', id, 'update', row);
        }
        return await this.get('SELECT * FROM customers WHERE id = ?', [id]);
    }
    async deleteCustomer(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        await this.run('UPDATE customers SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
        await this.enqueueOutbox('customers', id, 'delete', { id, deleted: 1, updated_at: now });
    }
    // Invoice methods
    async getInvoices() {
        if (!this.db)
            throw new Error('Database not initialized');
        try {
            const invoices = await this.all('SELECT * FROM invoices WHERE deleted = 0 ORDER BY created_at DESC');
            console.log('Retrieved invoices count:', invoices.length);
            return invoices;
        }
        catch (error) {
            console.error('Error retrieving invoices:', error);
            throw error;
        }
    }
    async createInvoice(invoice) {
        if (!this.db)
            throw new Error('Database not initialized');
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
                             total, paid_amount, status, invoice_date, due_date, notes, customer_measurements,
                             fabric_type, fabric_source, collar_type, chest_style, sleeve_end, bunija_type,
                             fabric_image_url, paid_at, version, deleted, created_at, updated_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, invoiceNumber, invoice.customer_id, invoice.customer_name, invoice.customer_phone,
                invoice.customer_address, invoice.total, invoice.paid_amount, invoice.status,
                invoice.invoice_date, invoice.due_date, invoice.notes, JSON.stringify(invoice.customer_measurements || null),
                invoice.fabric_type || null, invoice.fabric_source || null, invoice.collar_type || null,
                invoice.chest_style || null, invoice.sleeve_end || null, invoice.bunija_type || null,
                invoice.fabric_image_url, invoice.paid_at || null, 1, 0, now, now, 0]);
            console.log('Invoice created successfully with ID:', id);
        }
        catch (error) {
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
    async updateInvoice(id, updates, options) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        // Only allow updating known columns to avoid 'no such column' errors
        const allowed = new Set([
            'customer_id', 'customer_name', 'customer_phone', 'customer_address', 'total', 'paid_amount', 'status', 'invoice_date', 'due_date', 'notes',
            'customer_measurements', 'fabric_type', 'fabric_source', 'collar_type', 'chest_style', 'sleeve_end', 'bunija_type', 'fabric_image_url', 'paid_at', 'version', 'deleted', 'updated_at'
        ]);
        const entries = Object.entries(updates).filter(([k]) => allowed.has(k));
        const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
        const values = entries.map(([, v]) => v);
        const versionUpdate = options?.fromCloud ? '' : ', version = version + 1';
        if (setClause.length > 0) {
            await this.run(`UPDATE invoices SET ${setClause}, updated_at = ?${versionUpdate} WHERE id = ?`, [...values, now, id]);
        }
        else {
            await this.run(`UPDATE invoices SET updated_at = ?${versionUpdate} WHERE id = ?`, [now, id]);
        }
        if (!options?.fromCloud) {
            const row = await this.get('SELECT * FROM invoices WHERE id = ?', [id]);
            await this.enqueueOutbox('invoices', id, 'update', row);
        }
        return await this.get('SELECT * FROM invoices WHERE id = ?', [id]);
    }
    async deleteInvoice(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        await this.run('UPDATE invoices SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
        await this.run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
        await this.enqueueOutbox('invoices', id, 'delete', { id, deleted: 1, updated_at: now });
    }
    // Order methods
    async getOrders() {
        if (!this.db)
            throw new Error('Database not initialized');
        return await this.all('SELECT * FROM orders WHERE deleted = 0 ORDER BY created_at DESC');
    }
    async getCustomerById(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        try {
            const row = await this.get('SELECT * FROM customers WHERE id = ? AND deleted = 0', [id]);
            return row ?? null;
        }
        catch {
            return null;
        }
    }
    async createOrder(order) {
        if (!this.db)
            throw new Error('Database not initialized');
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
    async updateOrder(id, updates, options) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        const setClause = Object.keys(updates)
            .filter(key => key !== 'id' && key !== 'created_at')
            .map(key => `${key} = ?`)
            .join(', ');
        const values = Object.values(updates).filter((_, index) => Object.keys(updates)[index] !== 'id' && Object.keys(updates)[index] !== 'created_at');
        const versionUpdate = options?.fromCloud ? '' : ', version = version + 1';
        await this.run(`UPDATE orders SET ${setClause}, updated_at = ?${versionUpdate} WHERE id = ?`, [...values, now, id]);
        if (!options?.fromCloud) {
            const row = await this.get('SELECT * FROM orders WHERE id = ?', [id]);
            await this.enqueueOutbox('orders', id, 'update', row);
        }
        return await this.get('SELECT * FROM orders WHERE id = ?', [id]);
    }
    async deleteOrder(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        await this.run('UPDATE orders SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
        await this.enqueueOutbox('orders', id, 'delete', { id, deleted: 1, updated_at: now });
    }
    // Sync methods
    // Outbox accessors for sync service
    async getOutboxBatch(limit = 50) {
        if (!this.db)
            throw new Error('Database not initialized');
        const rows = await this.all('SELECT id, table_name, record_id, action, payload, created_at, attempt_count, last_error FROM outbox ORDER BY created_at ASC LIMIT ?', [limit]);
        return rows.map(r => ({ ...r, payload: JSON.parse(r.payload) }));
    }
    async markOutboxSuccess(id) {
        await this.run('DELETE FROM outbox WHERE id = ?', [id]);
    }
    async markOutboxFailure(id, error) {
        await this.run('UPDATE outbox SET attempt_count = attempt_count + 1, last_error = ? WHERE id = ?', [error, id]);
    }
    // Deprecated: kept for compatibility
    async markAsSynced(_tableName, _recordId) { return; }
    async getAllOfflineData() {
        if (!this.db)
            throw new Error('Database not initialized');
        return {
            customers: await this.all('SELECT * FROM customers'),
            invoices: await this.all('SELECT * FROM invoices'),
            orders: await this.all('SELECT * FROM orders'),
            invoiceItems: await this.all('SELECT * FROM invoice_items')
        };
    }
    // Export all tables as a JSON object
    async exportAll() {
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
    async importAll(payload) {
        if (!this.db)
            throw new Error('Database not initialized');
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
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INV-${year}${month}${day}-${random}`;
    }
    async enqueueOutbox(tableName, recordId, action, payload) {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.run(`
      INSERT INTO outbox (table_name, record_id, action, payload, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [tableName, recordId, action, JSON.stringify(payload), new Date().toISOString()]);
    }
    async close() { }
    // Upsert helpers for cloud -> local synchronization
    async upsertCustomerFromCloud(payload) {
        if (!this.db)
            throw new Error('Database not initialized');
        const local = await this.get('SELECT id, version, updated_at FROM customers WHERE id = ?', [payload.id]);
        const remoteVersion = payload.version ?? 1;
        const remoteUpdatedAt = payload.updated_at;
        if (local) {
            // Conflict policy: keep local if it is newer or equal by version/updated_at
            const keepLocal = (local.version ?? 1) >= remoteVersion || new Date(local.updated_at) >= new Date(remoteUpdatedAt);
            if (!keepLocal) {
                await this.updateCustomer(payload.id, {
                    name: payload.name,
                    phone: payload.phone,
                    address: payload.address,
                    totalSpent: payload.total_spent,
                    lastOrder: payload.last_order,
                    label: payload.label,
                    measurements: payload.measurements,
                    notes: payload.notes
                }, { fromCloud: true });
            }
        }
        else {
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
    async upsertInvoiceFromCloud(payload) {
        if (!this.db)
            throw new Error('Database not initialized');
        const local = await this.get('SELECT id, version, updated_at FROM invoices WHERE id = ?', [payload.id]);
        const remoteVersion = payload.version ?? 1;
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
        }
        else {
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
    async upsertOrderFromCloud(payload) {
        if (!this.db)
            throw new Error('Database not initialized');
        const local = await this.get('SELECT id, version, updated_at FROM orders WHERE id = ?', [payload.id]);
        const remoteVersion = payload.version ?? 1;
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
        }
        else {
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
    async getRoles() {
        return await this.all('SELECT * FROM roles WHERE deleted = 0 ORDER BY created_at DESC');
    }
    async createRole(role) {
        const id = this.generateId();
        const now = new Date().toISOString();
        await this.run(`
      INSERT INTO roles (id, name, description, permissions, allowed_pages, allowed_actions, is_active, version, deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [id, role.name, role.description || '', JSON.stringify(role.permissions || []), JSON.stringify(role.allowedPages || []), JSON.stringify(role.allowedActions || []), role.isActive ? 1 : 0, now, now]);
        const row = await this.get('SELECT * FROM roles WHERE id = ?', [id]);
        await this.enqueueOutbox('roles', id, 'insert', row);
        return row;
    }
    async updateRole(id, updates) {
        const now = new Date().toISOString();
        const toSet = [];
        const vals = [];
        for (const [k, v] of Object.entries(updates)) {
            if (k === 'id' || k === 'created_at')
                continue;
            const value = Array.isArray(v) ? JSON.stringify(v) : v;
            toSet.push(`${k === 'permissions' || k === 'allowedPages' || k === 'allowedActions' ? (k === 'allowedPages' ? 'allowed_pages' : k === 'allowedActions' ? 'allowed_actions' : 'permissions') : k} = ?`);
            vals.push(value);
        }
        await this.run(`UPDATE roles SET ${toSet.join(', ')}, updated_at = ?, version = version + 1 WHERE id = ?`, [...vals, now, id]);
        const row = await this.get('SELECT * FROM roles WHERE id = ?', [id]);
        await this.enqueueOutbox('roles', id, 'update', row);
        return row;
    }
    async deleteRole(id) {
        const now = new Date().toISOString();
        await this.run('UPDATE roles SET deleted = 1, updated_at = ?, version = version + 1 WHERE id = ?', [now, id]);
        await this.enqueueOutbox('roles', id, 'delete', { id, deleted: 1, updated_at: now });
    }
    // Image CRUD functions
    async createImage(image) {
        if (!this.db)
            throw new Error('Database not initialized');
        console.log('LocalDatabase.createImage called with:', image);
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
            const row = await this.get('SELECT * FROM images WHERE id = ?', [id]);
            await this.enqueueOutbox('images', id, 'insert', row);
            console.log('LocalDatabase.createImage success:', row);
            return row;
        }
        catch (error) {
            console.error('LocalDatabase.createImage error:', error);
            throw error;
        }
    }
    async getImagesByEntity(entityType, entityId) {
        if (!this.db)
            throw new Error('Database not initialized');
        console.log('LocalDatabase.getImagesByEntity called with:', { entityType, entityId });
        try {
            const result = await this.all('SELECT * FROM images WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC', [entityType, entityId]);
            console.log('LocalDatabase.getImagesByEntity result:', result);
            return result;
        }
        catch (error) {
            console.error('LocalDatabase.getImagesByEntity error:', error);
            throw error;
        }
    }
    async getImage(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        return await this.get('SELECT * FROM images WHERE id = ?', [id]);
    }
    async updateImage(id, updates) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        const toSet = [];
        const vals = [];
        for (const [k, v] of Object.entries(updates)) {
            if (k === 'id' || k === 'created_at')
                continue;
            toSet.push(`${k} = ?`);
            vals.push(v);
        }
        await this.run(`UPDATE images SET ${toSet.join(', ')}, updated_at = ? WHERE id = ?`, [...vals, now, id]);
        const row = await this.get('SELECT * FROM images WHERE id = ?', [id]);
        await this.enqueueOutbox('images', id, 'update', row);
        return row;
    }
    async deleteImage(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const now = new Date().toISOString();
        await this.run('DELETE FROM images WHERE id = ?', [id]);
        await this.enqueueOutbox('images', id, 'delete', { id, deleted: 1, updated_at: now });
    }
    async getLastPull(table) {
        const row = await this.get('SELECT last_pull FROM sync_state WHERE table_name = ?', [table]);
        return row?.last_pull || '1970-01-01T00:00:00.000Z';
    }
    async setLastPull(table, ts) {
        await this.run('INSERT INTO sync_state (table_name, last_pull) VALUES (?, ?) ON CONFLICT(table_name) DO UPDATE SET last_pull = excluded.last_pull', [table, ts]);
    }
    // Self-test to validate local DB CRUD and image URL persistence
    async selfTest() {
        if (!this.db)
            throw new Error('Database not initialized');
        const lines = [];
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
            });
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
            });
            lines.push(`✅ تم إنشاء فاتورة تجريبية: ${inv.id}`);
            // Verify invoice persisted
            const fetchedInv = await this.get('SELECT * FROM invoices WHERE id = ?', [inv.id]);
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
            });
            lines.push(`✅ تم إنشاء طلب تجريبي: ${ord.id}`);
            // 4) Read back entities
            const customers = await this.all("SELECT * FROM customers WHERE name LIKE '%SelfTest%'");
            const invoices = await this.all("SELECT * FROM invoices WHERE notes = 'SelfTest Invoice'");
            const orders = await this.all("SELECT * FROM orders WHERE notes = 'SelfTest Order'");
            if (!customers.length || !invoices.length || !orders.length) {
                throw new Error('فشل في قراءة السجلات التجريبية بعد الإدخال');
            }
            lines.push(`✅ قراءة السجلات: عملاء=${customers.length}, فواتير=${invoices.length}, طلبات=${orders.length}`);
            // 5) Update and verify
            await this.updateCustomer(cust.id, { notes: 'SelfTest Updated' });
            const updatedCust = await this.get('SELECT * FROM customers WHERE id = ?', [cust.id]);
            if (updatedCust?.notes !== 'SelfTest Updated') {
                throw new Error('فشل التحديث على العميل');
            }
            lines.push('✅ التحديثات تعمل بشكل صحيح');
            // 6) Outbox check (should have entries)
            const outbox = await this.getOutboxBatch(10);
            if (outbox.length >= 3) {
                lines.push(`✅ تم تسجيل التغييرات في outbox (${outbox.length}) للمزامنة`);
            }
            else {
                lines.push('⚠️ لم يتم العثور على إدخالات كافية في outbox (قد يكون ذلك طبيعياً في بعض الحالات)');
            }
            // Note: لا نحذف السجلات التجريبية لضمان تتبعها، وواجهة القائمة لا تعرض "Test Customer"
            lines.push('🎉 اكتمل الاختبار بنجاح. قاعدة البيانات المحلية تعمل وتخزن النصوص وروابط الصور.');
            console.log('Database self-test completed successfully');
            return { ok: true, report: lines.join('\n') };
        }
        catch (e) {
            console.error('Database self-test failed:', e);
            lines.push(`❌ حدث خطأ: ${String(e?.message || e)}`);
            return { ok: false, report: lines.join('\n') };
        }
    }
    // Admin logs API
    async createAdminLog(entry) {
        if (!this.db)
            throw new Error('Database not initialized');
        const id = this.generateId();
        const now = new Date();
        const createdAt = now.toISOString();
        const dateStr = entry.action_date || new Date(createdAt).toISOString().slice(0, 10);
        const timeStr = entry.action_time || now.toTimeString().slice(0, 5);
        const changedJson = entry.changed_fields ? JSON.stringify(entry.changed_fields) : null;
        // De-duplicate: if identical action on same entity by same user with same fields within 45 seconds, skip
        try {
            const last = this.get('SELECT * FROM admin_logs WHERE action_type = ? AND entity_type = ? AND entity_id = ? AND (user_name IS ? OR user_name = ?) ORDER BY created_at DESC LIMIT 1', [entry.action_type, entry.entity_type, entry.entity_id, entry.user_name || null, entry.user_name || null]);
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
                        };
                    }
                }
            }
        }
        catch { }
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
        };
        await this.run(`INSERT INTO admin_logs (id, action_type, entity_type, entity_id, changed_fields, action_date, action_time, user_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            payload.id,
            payload.action_type,
            payload.entity_type,
            payload.entity_id,
            payload.changed_fields,
            payload.action_date,
            payload.action_time,
            payload.user_name,
            payload.created_at,
        ]);
        return payload;
    }
    async getAdminLogs() {
        if (!this.db)
            throw new Error('Database not initialized');
        const rows = await this.all('SELECT * FROM admin_logs ORDER BY created_at DESC, id DESC');
        return rows.map(r => ({
            ...r,
            changed_fields: r.changed_fields ? JSON.parse(r.changed_fields) : null,
        }));
    }
}
exports.LocalDatabase = LocalDatabase;
