"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const electron_1 = require("electron");
const path_1 = require("path");
const fs_1 = require("fs");
class SyncService {
    constructor(localDB) {
        this.isOnline = false;
        this.lastSync = null;
        this.isSyncing = false;
        this.localDB = localDB;
        this.initializeSupabase();
        this.checkOnlineStatus();
        // Listen to online/offline events (main process has no window, rely on timer + lightweight probe)
        // Check online status every 15 seconds and trigger sync on reconnection
        setInterval(async () => {
            const wasOnline = this.isOnline;
            await this.checkOnlineStatus();
            if (!wasOnline && this.isOnline && !this.isSyncing) {
                const pending = await this.getPendingChangesCount();
                if (pending > 0) {
                    await this.syncAll();
                }
            }
        }, 15000);
    }
    logError(message) {
        try {
            const dir = (0, path_1.join)(electron_1.app.getPath('userData'), 'logs');
            if (!(0, fs_1.existsSync)(dir))
                (0, fs_1.mkdirSync)(dir, { recursive: true });
            const file = (0, path_1.join)(dir, 'logs.txt');
            (0, fs_1.appendFileSync)(file, `[${new Date().toISOString()}] ${message}\n`);
        }
        catch { }
    }
    initializeSupabase() {
        // Fallbacks allow sync even if env vars are missing in Electron
        const fallbackSupabaseUrl = 'https://dbjaogpesmyrqjwtzzwr.supabase.co';
        const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamFvZ3Blc215cnFqd3R6endyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Nzk1MzksImV4cCI6MjA3NDA1NTUzOX0.mioc1bAd_RYxcKS546MuBB3-DpLdyxxJiumJW4zv6Rw';
        const supabaseUrl = process.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;
        if (supabaseUrl && supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        }
    }
    async checkOnlineStatus() {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase.from('users').select('count').limit(1);
                this.isOnline = !error;
            }
            else {
                this.isOnline = false;
            }
        }
        catch (error) {
            this.isOnline = false;
        }
    }
    async syncAll() {
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
            // Push outbox ordered by created_at with idempotency
            const batch = await this.localDB.getOutboxBatch(100);
            for (const entry of batch) {
                try {
                    const payload = entry.payload;
                    if (entry.table_name === 'customers') {
                        if (entry.action === 'insert') {
                            const { error } = await this.supabase.from('customers').insert(payload);
                            if (error && String(error.message || '').toLowerCase().includes('duplicate')) {
                                await this.supabase.from('customers').update(payload).eq('id', payload.id);
                            }
                        }
                        else if (entry.action === 'update') {
                            await this.supabase.from('customers').update(payload).eq('id', payload.id);
                        }
                        else if (entry.action === 'delete') {
                            await this.supabase.from('customers').update({ deleted: 1, updated_at: payload.updated_at }).eq('id', payload.id);
                        }
                    }
                    else if (entry.table_name === 'invoices') {
                        if (entry.action === 'insert') {
                            const { error } = await this.supabase.from('invoices').insert(payload);
                            if (error && String(error.message || '').toLowerCase().includes('duplicate')) {
                                await this.supabase.from('invoices').update(payload).eq('id', payload.id);
                            }
                        }
                        else if (entry.action === 'update') {
                            await this.supabase.from('invoices').update(payload).eq('id', payload.id);
                        }
                        else if (entry.action === 'delete') {
                            await this.supabase.from('invoices').update({ deleted: 1, updated_at: payload.updated_at }).eq('id', payload.id);
                        }
                    }
                    else if (entry.table_name === 'orders') {
                        // Normalize payload for Supabase schema
                        const isValidUuid = typeof payload.id === 'string' && /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/.test(payload.id);
                        const normalized = {
                            customer_id: payload.customer_id ?? null,
                            customer_name: payload.customer_name || 'غير معروف',
                            total: payload.total,
                            status: payload.status || 'معلق',
                            order_date: payload.order_date || payload.created_at,
                            delivery_date: payload.delivery_date || payload.order_date || payload.created_at,
                            notes: payload.notes ?? null,
                            created_at: payload.created_at,
                            updated_at: payload.updated_at || new Date().toISOString(),
                        };
                        if (entry.action === 'insert') {
                            if (isValidUuid) {
                                const { error } = await this.supabase.from('orders').upsert({ id: payload.id, ...normalized });
                                if (error && String(error.message || '').toLowerCase().includes('duplicate')) {
                                    await this.supabase.from('orders').update(normalized).eq('id', payload.id);
                                }
                            }
                            else {
                                await this.supabase.from('orders').insert(normalized);
                            }
                        }
                        else if (entry.action === 'update') {
                            await this.supabase.from('orders').update(normalized).eq('id', payload.id);
                        }
                        else if (entry.action === 'delete') {
                            await this.supabase.from('orders').update({ deleted: 1, updated_at: normalized.updated_at }).eq('id', payload.id);
                        }
                    }
                    else if (entry.table_name === 'roles') {
                        if (entry.action === 'insert') {
                            const { error } = await this.supabase.from('roles').insert(payload);
                            if (error && String(error.message || '').toLowerCase().includes('duplicate')) {
                                await this.supabase.from('roles').update(payload).eq('id', payload.id);
                            }
                        }
                        else if (entry.action === 'update') {
                            await this.supabase.from('roles').update(payload).eq('id', payload.id);
                        }
                        else if (entry.action === 'delete') {
                            await this.supabase.from('roles').update({ is_active: false, updated_at: payload.updated_at }).eq('id', payload.id);
                        }
                    }
                    this.localDB.markOutboxSuccess(entry.id);
                    syncedCount++;
                }
                catch (err) {
                    const msg = String(err?.message || err);
                    this.localDB.markOutboxFailure(entry.id, msg);
                    this.logError(`push error on ${entry.table_name}/${entry.record_id}: ${msg}`);
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
        }
        catch (error) {
            console.error('Sync error:', error);
            return {
                success: false,
                message: 'حدث خطأ أثناء المزامنة',
                syncedCount
            };
        }
        finally {
            this.isSyncing = false;
        }
    }
    async downloadChanges() {
        if (!this.supabase)
            return;
        try {
            const tables = [
                { name: 'customers' },
                { name: 'invoices' },
                { name: 'orders' },
                { name: 'roles' },
            ];
            for (const t of tables) {
                const last = this.localDB.getLastPull(t.name);
                const { data, error } = await this.supabase
                    .from(t.name)
                    .select('*')
                    .gt('updated_at', last)
                    .order('updated_at', { ascending: true })
                    .limit(500);
                if (error)
                    continue;
                const rows = data || [];
                for (const row of rows) {
                    if (t.name === 'customers')
                        await this.localDB.upsertCustomerFromCloud?.({ ...row });
                    else if (t.name === 'invoices')
                        await this.localDB.upsertInvoiceFromCloud?.({ ...row });
                    else if (t.name === 'orders')
                        await this.localDB.upsertOrderFromCloud?.({ ...row });
                    else if (t.name === 'roles')
                        await this.localDB.updateRole?.(String(row.id), {
                            name: row.name,
                            description: row.description,
                            permissions: row.permissions,
                            allowedPages: row.allowed_pages,
                            allowedActions: row.allowed_actions,
                            is_active: row.is_active,
                        });
                }
                const newest = rows.length ? rows[rows.length - 1].updated_at : last;
                this.localDB.setLastPull(t.name, newest);
            }
        }
        catch (error) {
            this.logError(`pull error: ${String(error?.message || error)}`);
        }
    }
    async forceSync() {
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
        }
        catch (error) {
            console.error('Force sync error:', error);
            return {
                success: false,
                message: 'حدث خطأ أثناء المزامنة القسرية'
            };
        }
    }
    getStatus() {
        // Note: pendingChanges is computed asynchronously elsewhere; provide best-effort sync value here
        // For accurate number, callers can invoke getPendingChangesCount()
        return {
            isOnline: this.isOnline,
            lastSync: this.lastSync,
            pendingChanges: this._lastPendingCount ?? 0,
            isSyncing: this.isSyncing
        };
    }
    async getPendingChangesCount() {
        try {
            const outbox = await this.localDB.getOutboxBatch(1000);
            const count = outbox.length;
            this._lastPendingCount = count;
            return count;
        }
        catch (error) {
            console.error('Error getting pending changes count:', error);
            return 0;
        }
    }
    // Auto-sync when online
    async startAutoSync() {
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
exports.SyncService = SyncService;
