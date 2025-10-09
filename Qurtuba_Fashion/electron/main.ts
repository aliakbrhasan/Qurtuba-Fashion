import { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray, nativeImage } from 'electron';
import { createClient } from '@supabase/supabase-js';
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
let supabaseMain: any;

const createWindow = (): void => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      // Security hardening
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      spellcheck: false,
      preload: join(__dirname, 'preload.js'),
    },
    icon: join(process.resourcesPath || __dirname, 'icon.ico'),
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

  // Additional runtime protections
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Prevent navigation to arbitrary domains
    const allowedOrigins = ['http://localhost:3000'];
    if (!isDev || !allowedOrigins.some(origin => url.startsWith(origin))) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Deny all new windows/popups
    return { action: 'deny' };
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize local database
  localDB = new LocalDatabase();
  await localDB.initialize();
  
  // Initialize sync service
  syncService = new SyncService(localDB);
  // Initialize Supabase client for main process services
  try {
    const fallbackSupabaseUrl = 'https://dbjaogpesmyrqjwtzzwr.supabase.co';
    const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamFvZ3Blc215cnFqd3R6endyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Nzk1MzksImV4cCI6MjA3NDA1NTUzOX0.mioc1bAd_RYxcKS546MuBB3-DpLdyxxJiumJW4zv6Rw';
    const supabaseUrl = process.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;
    supabaseMain = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn('Failed to initialize Supabase in main process:', e);
  }
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

  // Disable or restrict navigation/permissions
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    event.preventDefault();
  });

  contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    // Deny all permission requests by default
    callback(false);
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

// Helper to standardize IPC responses
async function ok<T>(fn: () => Promise<T> | T): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const data = await Promise.resolve(fn());
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

// Local database handlers
ipcMain.handle('local:getCustomers', async () => ok(() => localDB.getCustomers()));

ipcMain.handle('local:createCustomer', async (_, customer) => ok(() => localDB.createCustomer(customer)));

ipcMain.handle('local:updateCustomer', async (_, id, updates) => ok(() => localDB.updateCustomer(id, updates)));

ipcMain.handle('local:deleteCustomer', async (_, id) => ok(() => localDB.deleteCustomer(id)));

ipcMain.handle('local:getInvoices', async () => ok(() => localDB.getInvoices()));

ipcMain.handle('local:createInvoice', async (_, invoice) => ok(() => localDB.createInvoice(invoice)));

ipcMain.handle('local:updateInvoice', async (_, id, updates) => ok(() => localDB.updateInvoice(id, updates)));

ipcMain.handle('local:deleteInvoice', async (_, id) => ok(() => localDB.deleteInvoice(id)));

ipcMain.handle('local:getOrders', async () => ok(() => localDB.getOrders()));

ipcMain.handle('local:createOrder', async (_, order) => ok(() => localDB.createOrder(order)));

ipcMain.handle('local:updateOrder', async (_, id, updates) => ok(() => localDB.updateOrder(id, updates)));

ipcMain.handle('local:deleteOrder', async (_, id) => ok(() => localDB.deleteOrder(id)));

// Local database self-test
ipcMain.handle('local:selfTest', async () => ok(() => localDB.selfTest()));

// Roles handlers
ipcMain.handle('local:getRoles', async () => ok(() => (localDB as any).getRoles()));

ipcMain.handle('local:createRole', async (_evt, role) => ok(() => (localDB as any).createRole(role)));

ipcMain.handle('local:updateRole', async (_evt, id, updates) => ok(() => (localDB as any).updateRole(id, updates)));

ipcMain.handle('local:deleteRole', async (_evt, id) => ok(() => (localDB as any).deleteRole(id)));

// Sync handlers
ipcMain.handle('sync:start', async () => ok(() => syncService.syncAll()));

ipcMain.handle('sync:getStatus', async () => ok(() => syncService.getStatus()));

ipcMain.handle('sync:forceSync', async () => ok(() => syncService.forceSync()));

ipcMain.handle('sync:runOnce', async () => ok(() => syncService.syncAll()));

// Offline handlers
ipcMain.handle('offline:isOnline', () => ok(async () => {
  const dns = require('dns');
  return await new Promise<boolean>((resolve) => {
    dns.lookup('supabase.io', (err: any) => resolve(!err));
  });
}));

ipcMain.handle('offline:getOfflineData', async () => ok(() => localDB.getAllOfflineData()));

// AUTH IPC (main uses supabaseMain)
ipcMain.handle('auth:getRoleIdByName', async (_evt, name: string) => ok(async () => {
  const { data, error } = await supabaseMain.from('roles').select('id').eq('name', name).single();
  if (error || !data) return null;
  return String((data as any).id);
}));

ipcMain.handle('auth:findUserByEmail', async (_evt, email: string) => ok(async () => {
  const { data, error } = await supabaseMain.from('users').select('*').eq('email', email.toLowerCase().trim()).eq('is_active', true).single();
  if (error) throw error;
  return data;
}));

ipcMain.handle('auth:updateLastLogin', async (_evt, id: string) => ok(async () => {
  const { error } = await supabaseMain.from('users').update({ last_login: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return true;
}));

ipcMain.handle('auth:checkEmailExists', async (_evt, email: string) => ok(async () => {
  const { data } = await supabaseMain.from('users').select('id').eq('email', email.toLowerCase().trim()).maybeSingle?.() ?? { data: null };
  return !!data;
}));

ipcMain.handle('auth:checkCodeExists', async (_evt, code: string) => ok(async () => {
  const { data } = await supabaseMain.from('users').select('id').eq('code', code).maybeSingle?.() ?? { data: null };
  return !!data;
}));

ipcMain.handle('auth:createUser', async (_evt, payload: any) => ok(async () => {
  const { data, error } = await supabaseMain.from('users').insert(payload).select().single();
  if (error) throw error;
  return data;
}));

ipcMain.handle('auth:updatePassword', async (_evt, id: string, password_hash: string) => ok(async () => {
  const { error } = await supabaseMain.from('users').update({ password_hash }).eq('id', id);
  if (error) throw error;
  return true;
}));

ipcMain.handle('auth:listUsers', async () => ok(async () => {
  const { data, error } = await supabaseMain.from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}));

ipcMain.handle('auth:updateUser', async (_evt, id: string, updates: any) => ok(async () => {
  const { data, error } = await supabaseMain.from('users').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}));

ipcMain.handle('auth:deleteUser', async (_evt, id: string) => ok(async () => {
  const { error } = await supabaseMain.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
}));

// IMAGE STORAGE IPC
ipcMain.handle('image:upload', async (_evt, args: { buffer: number[]; contentType: string; fileName: string }) => ok(async () => {
  const buf = Buffer.from(args.buffer);
  const { data, error } = await supabaseMain.storage.from('invoice-images').upload(args.fileName, buf, {
    cacheControl: '3600', upsert: false, contentType: args.contentType,
  });
  if (error) throw error;
  const { data: pub } = supabaseMain.storage.from('invoice-images').getPublicUrl(args.fileName);
  return { url: data?.path, path: args.fileName, publicUrl: pub.publicUrl };
}));

ipcMain.handle('image:delete', async (_evt, path: string) => ok(async () => {
  const { error } = await supabaseMain.storage.from('invoice-images').remove([path]);
  if (error) throw error;
  return true;
}));

ipcMain.handle('image:getPublicUrl', async (_evt, path: string) => ok(async () => {
  const { data } = supabaseMain.storage.from('invoice-images').getPublicUrl(path);
  return data.publicUrl;
}));

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('qurtuba-fashion');

// Create system tray
const createTray = (): void => {
  const trayIconPath = join(process.resourcesPath || __dirname, 'icon.ico');
  tray = new Tray(nativeImage.createFromPath(trayIconPath));
  
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
    {
      label: 'اختبار القاعدة المحلية',
      click: async () => {
        try {
          const res = await localDB.selfTest();
          dialog.showMessageBox(mainWindow!, {
            type: res.ok ? 'info' : 'error',
            title: 'نتيجة الاختبار',
            message: res.ok ? 'نجح اختبار القاعدة المحلية' : 'فشل اختبار القاعدة المحلية',
            detail: res.report,
          });
        } catch (err: any) {
          dialog.showErrorBox('خطأ', String(err?.message || err));
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
        {
          label: 'اختبار القاعدة المحلية',
          accelerator: 'CmdOrCtrl+T',
          click: async () => {
            try {
              const res = await localDB.selfTest();
              dialog.showMessageBox(mainWindow!, {
                type: res.ok ? 'info' : 'error',
                title: 'نتيجة الاختبار',
                message: res.ok ? 'نجح اختبار القاعدة المحلية' : 'فشل اختبار القاعدة المحلية',
                detail: res.report,
              });
            } catch (err: any) {
              dialog.showErrorBox('خطأ', String(err?.message || err));
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





