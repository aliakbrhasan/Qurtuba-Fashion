import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer process
const wrap = async <T>(fn: () => Promise<T>): Promise<{ ok: boolean; data?: T; error?: string }> => {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
};

const electronAPI = {
  // App information
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Dialog functions
  showMessageBox: (options: any) => ipcRenderer.invoke('app:showMessageBox', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('app:showOpenDialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('app:showSaveDialog', options),
  
  // File operations (for future use)
  saveFile: (data: string, filename: string) => {
    return ipcRenderer.invoke('file:save', { data, filename });
  },
  
  // Export functionality (for future use)
  exportToPDF: (data: any) => {
    return ipcRenderer.invoke('export:pdf', data);
  },
  
  // Print functionality (for future use)
  print: (data: any) => {
    return ipcRenderer.invoke('print:document', data);
  },

  // Local database functions
  local: {
    // Customers
    getCustomers: () => ipcRenderer.invoke('local:getCustomers'),
    createCustomer: (customer: any) => ipcRenderer.invoke('local:createCustomer', customer),
    updateCustomer: (id: string, updates: any) => ipcRenderer.invoke('local:updateCustomer', id, updates),
    deleteCustomer: (id: string) => ipcRenderer.invoke('local:deleteCustomer', id),

    // Invoices
    getInvoices: () => ipcRenderer.invoke('local:getInvoices'),
    createInvoice: (invoice: any) => ipcRenderer.invoke('local:createInvoice', invoice),
    updateInvoice: (id: string, updates: any) => ipcRenderer.invoke('local:updateInvoice', id, updates),
    deleteInvoice: (id: string) => ipcRenderer.invoke('local:deleteInvoice', id),

    // Orders
    getOrders: () => ipcRenderer.invoke('local:getOrders'),
    createOrder: (order: any) => ipcRenderer.invoke('local:createOrder', order),
    updateOrder: (id: string, updates: any) => ipcRenderer.invoke('local:updateOrder', id, updates),
    deleteOrder: (id: string) => ipcRenderer.invoke('local:deleteOrder', id),

    // Self-test
    selfTest: () => ipcRenderer.invoke('local:selfTest'),

    // Roles
    getRoles: () => ipcRenderer.invoke('local:getRoles'),
    createRole: (role: any) => ipcRenderer.invoke('local:createRole', role),
    updateRole: (id: string, updates: any) => ipcRenderer.invoke('local:updateRole', id, updates),
    deleteRole: (id: string) => ipcRenderer.invoke('local:deleteRole', id),

    // Backup/export
    exportAll: () => ipcRenderer.invoke('local:exportAll'),
    importAll: (data: any) => ipcRenderer.invoke('local:importAll', data),
  },

  // Sync functions
  sync: {
    // Local-only: return no-op results
    start: () => ipcRenderer.invoke('sync:start'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    forceSync: () => ipcRenderer.invoke('sync:forceSync'),
    runOnce: () => ipcRenderer.invoke('sync:runOnce'),
  },

  // Offline functions
  offline: {
    isOnline: () => ipcRenderer.invoke('offline:isOnline'),
    getOfflineData: () => ipcRenderer.invoke('offline:getOfflineData'),
  },

  // Listen for sync events
  onSyncCompleted: (callback: () => void) => {
    ipcRenderer.on('sync-completed', callback);
  },

  onSyncError: (callback: (error: any) => void) => {
    ipcRenderer.on('sync-error', callback);
  },
  
  // Auth (proxied to main)
  auth: {
    getRoleIdByName: (name: string) => ipcRenderer.invoke('auth:getRoleIdByName', name),
    findUserByEmail: (email: string) => ipcRenderer.invoke('auth:findUserByEmail', email),
    updateLastLogin: (id: string) => ipcRenderer.invoke('auth:updateLastLogin', id),
    checkEmailExists: (email: string) => ipcRenderer.invoke('auth:checkEmailExists', email),
    checkCodeExists: (code: string) => ipcRenderer.invoke('auth:checkCodeExists', code),
    createUser: (payload: any) => ipcRenderer.invoke('auth:createUser', payload),
    updatePassword: (id: string, password_hash: string) => ipcRenderer.invoke('auth:updatePassword', id, password_hash),
    listUsers: () => ipcRenderer.invoke('auth:listUsers'),
    updateUser: (id: string, updates: any) => ipcRenderer.invoke('auth:updateUser', id, updates),
    deleteUser: (id: string) => ipcRenderer.invoke('auth:deleteUser', id),
  },

  // Images
  images: {
    upload: (buffer: number[], contentType: string, fileName: string) => ipcRenderer.invoke('image:upload', { buffer, contentType, fileName }),
    delete: (path: string) => ipcRenderer.invoke('image:delete', path),
    getPublicUrl: (path: string) => ipcRenderer.invoke('image:getPublicUrl', path),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}





