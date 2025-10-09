import type { NativePort } from '@/ports/ipc';

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const electronAdapter: NativePort = {
  getVersion: async () => {
    if (!isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return window.electronAPI.getVersion();
  },

  showMessageBox: async (options) => {
    if (!isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return window.electronAPI.showMessageBox(options);
  },

  showOpenDialog: async (options) => {
    if (!isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return window.electronAPI.showOpenDialog(options);
  },

  showSaveDialog: async (options) => {
    if (!isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return window.electronAPI.showSaveDialog(options);
  },

  saveFile: async (data, filename) => {
    if (!isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return window.electronAPI.saveFile(data, filename);
  },

  exportToPDF: async (data) => {
    if (!isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return window.electronAPI.exportToPDF(data);
  },

  print: async (data) => {
    if (!isElectron) {
      throw new Error('Not running in Electron environment');
    }
    return window.electronAPI.print(data);
  },
};





