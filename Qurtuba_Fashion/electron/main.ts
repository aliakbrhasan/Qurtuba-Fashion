import { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray, nativeImage } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';
import { isDev } from './utils';
import { LocalDatabase } from './local-database';
import { SyncService } from './sync-service';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let localDB: LocalDatabase;
let syncService: SyncService;

const createWindow = (): void => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    icon: join(__dirname, '../assets/icon.png'), // Optional: add app icon
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, locate build/index.html from several candidates
    const candidates = [
      join(__dirname, '../build/index.html'),
      join(app.getAppPath(), 'build', 'index.html'),
      join(process.cwd(), 'build', 'index.html'),
      join(__dirname, '../../build/index.html'),
    ];
    const found = candidates.find(p => existsSync(p));
    if (found) {
      mainWindow.loadFile(found).catch((err) => {
        console.error('Failed to load index.html:', err);
        dialog.showErrorBox('خطأ في تشغيل التطبيق', 'تعذر تحميل واجهة التطبيق. تأكد من وجود مجلد build ثم أعد المحاولة.');
      });
    } else {
      const message = `تعذر العثور على build/index.html\nيرجى تشغيل: npm run build\nالمسارات التي تم البحث فيها:\n${candidates.join('\n')}`;
      console.error(message);
      dialog.showErrorBox('الملفات غير موجودة', message);
    }
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize local database
  localDB = new LocalDatabase();
  await localDB.initialize();
  
  // Initialize sync service
  syncService = new SyncService(localDB);
  // Start periodic auto-sync in the background
  await syncService.startAutoSync();
  // Kick off an immediate sync on startup (non-blocking)
  syncService.forceSync().catch((err) => {
    console.error('Startup force sync failed:', err);
  });
  
  createWindow();
  createTray();
  createMenu();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_evt, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// IPC Handlers for native functionality
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:showMessageBox', async (_, options) => {
  if (!mainWindow) return null;
  return await dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('app:showOpenDialog', async (_, options) => {
  if (!mainWindow) return null;
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('app:showSaveDialog', async (_, options) => {
  if (!mainWindow) return null;
  return await dialog.showSaveDialog(mainWindow, options);
});

// Local database handlers
ipcMain.handle('local:getCustomers', async () => {
  return await localDB.getCustomers();
});

ipcMain.handle('local:createCustomer', async (_, customer) => {
  return await localDB.createCustomer(customer);
});

ipcMain.handle('local:updateCustomer', async (_, id, updates) => {
  return await localDB.updateCustomer(id, updates);
});

ipcMain.handle('local:deleteCustomer', async (_, id) => {
  return await localDB.deleteCustomer(id);
});

ipcMain.handle('local:getInvoices', async () => {
  return await localDB.getInvoices();
});

ipcMain.handle('local:createInvoice', async (_, invoice) => {
  return await localDB.createInvoice(invoice);
});

ipcMain.handle('local:updateInvoice', async (_, id, updates) => {
  return await localDB.updateInvoice(id, updates);
});

ipcMain.handle('local:deleteInvoice', async (_, id) => {
  return await localDB.deleteInvoice(id);
});

ipcMain.handle('local:getOrders', async () => {
  return await localDB.getOrders();
});

ipcMain.handle('local:createOrder', async (_, order) => {
  return await localDB.createOrder(order);
});

ipcMain.handle('local:updateOrder', async (_, id, updates) => {
  return await localDB.updateOrder(id, updates);
});

ipcMain.handle('local:deleteOrder', async (_, id) => {
  return await localDB.deleteOrder(id);
});

// Sync handlers
ipcMain.handle('sync:start', async () => {
  return await syncService.syncAll();
});

ipcMain.handle('sync:getStatus', async () => {
  return syncService.getStatus();
});

ipcMain.handle('sync:forceSync', async () => {
  return await syncService.forceSync();
});

// Offline handlers
ipcMain.handle('offline:isOnline', () => {
  try {
    const dns = require('dns');
    return new Promise<boolean>((resolve) => {
      dns.lookup('supabase.io', (err: any) => {
        resolve(!err);
      });
    });
  } catch {
    return false;
  }
});

ipcMain.handle('offline:getOfflineData', async () => {
  return await localDB.getAllOfflineData();
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('qurtuba-fashion');

// Create system tray
const createTray = (): void => {
  const iconPath = join(__dirname, '../assets/tray-icon.png');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'إظهار التطبيق',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'مزامنة البيانات',
      click: async () => {
        try {
          await syncService.syncAll();
          if (mainWindow) {
            mainWindow.webContents.send('sync-completed');
          }
        } catch (error) {
          console.error('Sync error:', error);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'خروج',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip('أزياء قرطبة');
};

// Create application menu
const createMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'مزامنة البيانات',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            try {
              await syncService.syncAll();
            } catch (error) {
              console.error('Sync error:', error);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'خروج',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        { role: 'reload', label: 'إعادة تحميل' },
        { role: 'forceReload', label: 'إعادة تحميل قسري' },
        { role: 'toggleDevTools', label: 'أدوات المطور' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'إعادة تعيين التكبير' },
        { role: 'zoomIn', label: 'تكبير' },
        { role: 'zoomOut', label: 'تصغير' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'ملء الشاشة' }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'حول التطبيق',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'حول أزياء قرطبة',
              message: 'أزياء قرطبة',
              detail: 'نظام إدارة الأزياء والتطريز\nالإصدار: 1.0.0'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};





