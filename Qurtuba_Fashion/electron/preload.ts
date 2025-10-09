import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer process
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
  },

  // Sync functions
  sync: {
    start: () => ipcRenderer.invoke('sync:start'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    forceSync: () => ipcRenderer.invoke('sync:forceSync'),
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
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}





