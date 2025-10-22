"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Define the API that will be exposed to the renderer process
const wrap = async (fn) => {
    try {
        const data = await fn();
        return { ok: true, data };
    }
    catch (e) {
        return { ok: false, error: String(e?.message || e) };
    }
};
const electronAPI = {
    // App information
    getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    // Dialog functions
    showMessageBox: (options) => electron_1.ipcRenderer.invoke('app:showMessageBox', options),
    showOpenDialog: (options) => electron_1.ipcRenderer.invoke('app:showOpenDialog', options),
    showSaveDialog: (options) => electron_1.ipcRenderer.invoke('app:showSaveDialog', options),
    // File operations (for future use)
    saveFile: (data, filename) => {
        return electron_1.ipcRenderer.invoke('file:save', { data, filename });
    },
    // Export functionality (for future use)
    exportToPDF: (data) => {
        return electron_1.ipcRenderer.invoke('export:pdf', data);
    },
    // Print functionality
    print: (data) => {
        return electron_1.ipcRenderer.invoke('print:document', data);
    },
    printPreview: (data) => {
        return electron_1.ipcRenderer.invoke('print:preview', data);
    },
    // Local database functions
    local: {
        // Customers
        getCustomers: () => electron_1.ipcRenderer.invoke('local:getCustomers'),
        createCustomer: (customer) => electron_1.ipcRenderer.invoke('local:createCustomer', customer),
        updateCustomer: (id, updates) => electron_1.ipcRenderer.invoke('local:updateCustomer', id, updates),
        deleteCustomer: (id) => electron_1.ipcRenderer.invoke('local:deleteCustomer', id),
        // Invoices
        getInvoices: () => electron_1.ipcRenderer.invoke('local:getInvoices'),
        createInvoice: (invoice) => electron_1.ipcRenderer.invoke('local:createInvoice', invoice),
        updateInvoice: (id, updates) => electron_1.ipcRenderer.invoke('local:updateInvoice', id, updates),
        deleteInvoice: (id) => electron_1.ipcRenderer.invoke('local:deleteInvoice', id),
        // Orders
        getOrders: () => electron_1.ipcRenderer.invoke('local:getOrders'),
        createOrder: (order) => electron_1.ipcRenderer.invoke('local:createOrder', order),
        updateOrder: (id, updates) => electron_1.ipcRenderer.invoke('local:updateOrder', id, updates),
        deleteOrder: (id) => electron_1.ipcRenderer.invoke('local:deleteOrder', id),
        // Self-test
        selfTest: () => electron_1.ipcRenderer.invoke('local:selfTest'),
        // Roles
        getRoles: () => electron_1.ipcRenderer.invoke('local:getRoles'),
        createRole: (role) => electron_1.ipcRenderer.invoke('local:createRole', role),
        updateRole: (id, updates) => electron_1.ipcRenderer.invoke('local:updateRole', id, updates),
        deleteRole: (id) => electron_1.ipcRenderer.invoke('local:deleteRole', id),
        // Backup/export
        exportAll: () => electron_1.ipcRenderer.invoke('local:exportAll'),
        importAll: (data) => electron_1.ipcRenderer.invoke('local:importAll', data),
    },
    // Sync functions
    sync: {
        // Local-only: return no-op results
        start: () => electron_1.ipcRenderer.invoke('sync:start'),
        getStatus: () => electron_1.ipcRenderer.invoke('sync:getStatus'),
        forceSync: () => electron_1.ipcRenderer.invoke('sync:forceSync'),
        runOnce: () => electron_1.ipcRenderer.invoke('sync:runOnce'),
    },
    // Offline functions
    offline: {
        isOnline: () => electron_1.ipcRenderer.invoke('offline:isOnline'),
        getOfflineData: () => electron_1.ipcRenderer.invoke('offline:getOfflineData'),
    },
    // Listen for sync events
    onSyncCompleted: (callback) => {
        electron_1.ipcRenderer.on('sync-completed', callback);
    },
    onSyncError: (callback) => {
        electron_1.ipcRenderer.on('sync-error', callback);
    },
    // Auth (proxied to main)
    auth: {
        getRoleIdByName: (name) => electron_1.ipcRenderer.invoke('auth:getRoleIdByName', name),
        findUserByEmail: (email) => electron_1.ipcRenderer.invoke('auth:findUserByEmail', email),
        updateLastLogin: (id) => electron_1.ipcRenderer.invoke('auth:updateLastLogin', id),
        checkEmailExists: (email) => electron_1.ipcRenderer.invoke('auth:checkEmailExists', email),
        checkCodeExists: (code) => electron_1.ipcRenderer.invoke('auth:checkCodeExists', code),
        createUser: (payload) => electron_1.ipcRenderer.invoke('auth:createUser', payload),
        updatePassword: (id, password_hash) => electron_1.ipcRenderer.invoke('auth:updatePassword', id, password_hash),
        listUsers: () => electron_1.ipcRenderer.invoke('auth:listUsers'),
        updateUser: (id, updates) => electron_1.ipcRenderer.invoke('auth:updateUser', id, updates),
        deleteUser: (id) => electron_1.ipcRenderer.invoke('auth:deleteUser', id),
    },
    // Images
    images: {
        upload: (buffer, contentType, fileName, entityType, entityId, originalName, width, height) => electron_1.ipcRenderer.invoke('image:upload', { buffer, contentType, fileName, entityType, entityId, originalName, width, height }),
        delete: (path) => electron_1.ipcRenderer.invoke('image:delete', path),
        deleteById: (imageId) => electron_1.ipcRenderer.invoke('image:deleteById', imageId),
        getPublicUrl: (path) => electron_1.ipcRenderer.invoke('image:getPublicUrl', path),
        getByEntity: (entityType, entityId) => electron_1.ipcRenderer.invoke('image:getByEntity', entityType, entityId),
    },
    // Persistent JSON cache
    cache: {
        readJson: (key) => electron_1.ipcRenderer.invoke('cache:readJson', key),
        writeJson: (key, data) => electron_1.ipcRenderer.invoke('cache:writeJson', { key, data }),
    },
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
