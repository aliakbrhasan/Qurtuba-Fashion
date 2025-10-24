import { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray, nativeImage, session, webContents } from 'electron';
// Supabase disabled in local-only mode
import { existsSync, mkdirSync, readdirSync, copyFileSync, lstatSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { pathToFileURL } from 'url';
import { isDev } from './utils';
import { LocalDatabase } from './local-database';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let localDB: LocalDatabase;
// Sync and remote DB disabled in local-only mode
let supabaseMain: any = null;

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
      experimentalFeatures: true,
      spellcheck: false,
      preload: join(__dirname, 'preload.js'),
    },
    icon: app.isPackaged ? join(process.resourcesPath, 'icon.ico') : join(__dirname, '../build/icon.ico'),
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
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

  // Handle camera permissions
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      // Grant media permissions (camera/microphone)
      callback(true);
    } else {
      callback(false);
    }
  });

  // Set camera permissions for the session
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'media') {
      return true;
    }
    return false;
  });

  // Show window when ready: always start maximized to fill the screen
  mainWindow.once('ready-to-show', () => {
    try { mainWindow?.maximize(); } catch {}
    mainWindow?.show();
    try { mainWindow?.focus(); } catch {}
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Additional runtime protections
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Prevent navigation to arbitrary domains
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
    if (!isDev || !allowedOrigins.some(origin => url.startsWith(origin))) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const { url } = details;
    // Allow in-app print windows created with window.open('about:blank', ...)
    if (url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          show: true,
          width: 900,
          height: 700,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
          },
        },
      };
    }
    // Deny all other external/new windows
    return { action: 'deny' };
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize local database
  try {
    console.log('Starting database initialization...');
    localDB = new LocalDatabase();
    await localDB.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Show error dialog to user
    dialog.showErrorBox(
      'Database Error',
      'Failed to initialize the local database. The application may not work correctly.\n\nError: ' + (error as Error).message
    );
  }
  
  // Local-only: disable sync and supabase initialization
  
  // Copy bundled resources to userData on first run
  try {
    const bundledResources = app.isPackaged ? join(process.resourcesPath, 'resources') : join(__dirname, '../resources');
    const targetResources = join(app.getPath('userData'), 'resources');
    const ensure = (p: string): void => { try { mkdirSync(p, { recursive: true }); } catch {} };
    const copyRecursive = (src: string, dest: string): void => {
      if (!existsSync(src)) return;
      ensure(dest);
      for (const name of readdirSync(src)) {
        const s = join(src, name);
        const d = join(dest, name);
        if (lstatSync(s).isDirectory()) copyRecursive(s, d); else copyFileSync(s, d);
      }
    };
    if (!existsSync(targetResources)) copyRecursive(bundledResources, targetResources);
  } catch {}

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
  contents.setWindowOpenHandler((details) => {
    const { url } = details;
    // Allow print windows
    if (url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          show: true,
          width: 900,
          height: 700,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
          },
        },
      };
    }
    // Deny all other external windows
    return { action: 'deny' };
  });

  // Disable or restrict navigation/permissions
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    event.preventDefault();
  });

  contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    // Allow camera/microphone requests, deny others by default
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(false);
  });
});

// Lightweight persistent JSON cache under userData for renderer (roles/users, etc.)
ipcMain.handle('cache:readJson', async (_evt, key: string) => {
  try {
    const dir = join(app.getPath('userData'), 'qf-cache');
    const file = join(dir, `${key}.json`);
    if (!existsSync(file)) return { ok: true, data: null };
    const raw = readFileSync(file, { encoding: 'utf-8' });
    const data = JSON.parse(raw);
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
});

ipcMain.handle('cache:writeJson', async (_evt, args: { key: string; data: any }) => {
  try {
    const dir = join(app.getPath('userData'), 'qf-cache');
    try { mkdirSync(dir, { recursive: true }); } catch {}
    const file = join(dir, `${args.key}.json`);
    writeFileSync(file, JSON.stringify(args.data ?? null), { encoding: 'utf-8' });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
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

// Simple file save handler used by renderer for backups
ipcMain.handle('file:save', async (_evt, args: { data: string; filename: string }) => {
  try {
    const file = args.filename;
    writeFileSync(file, args.data ?? '', { encoding: 'utf-8' });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
});

// Helper to standardize IPC responses
async function ok<T>(fn: () => Promise<T> | T): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    if (!localDB) {
      return { ok: false, error: 'Database not initialized' };
    }
    const data = await Promise.resolve(fn());
    return { ok: true, data };
  } catch (e: any) {
    console.error('Database operation failed:', e);
    return { ok: false, error: String(e?.message || e) };
  }
}

// Local database handlers
ipcMain.handle('local:getCustomers', async () => {
  console.log('IPC: getCustomers called');
  return ok(() => localDB.getCustomers());
});

ipcMain.handle('local:createCustomer', async (_, customer) => {
  console.log('IPC: createCustomer called with:', customer);
  return ok(() => localDB.createCustomer(customer));
});

ipcMain.handle('local:updateCustomer', async (_, id, updates) => {
  console.log('IPC: updateCustomer called with ID:', id);
  return ok(() => localDB.updateCustomer(id, updates));
});

ipcMain.handle('local:deleteCustomer', async (_, id) => {
  console.log('IPC: deleteCustomer called with ID:', id);
  return ok(() => localDB.deleteCustomer(id));
});

ipcMain.handle('local:getInvoices', async () => {
  console.log('IPC: getInvoices called');
  return ok(() => localDB.getInvoices());
});

ipcMain.handle('local:createInvoice', async (_, invoice) => {
  console.log('IPC: createInvoice called with:', invoice);
  return ok(() => localDB.createInvoice(invoice));
});

ipcMain.handle('local:updateInvoice', async (_, id, updates) => {
  console.log('IPC: updateInvoice called with ID:', id);
  return ok(() => localDB.updateInvoice(id, updates));
});

ipcMain.handle('local:deleteInvoice', async (_, id) => {
  console.log('IPC: deleteInvoice called with ID:', id);
  return ok(() => localDB.deleteInvoice(id));
});

ipcMain.handle('local:getOrders', async () => ok(() => localDB.getOrders()));

ipcMain.handle('local:createOrder', async (_, order) => ok(() => localDB.createOrder(order)));

ipcMain.handle('local:updateOrder', async (_, id, updates) => ok(() => localDB.updateOrder(id, updates)));

ipcMain.handle('local:deleteOrder', async (_, id) => ok(() => localDB.deleteOrder(id)));

// Admin logs handlers
ipcMain.handle('local:getAdminLogs', async () => ok(() => (localDB as any).getAdminLogs()));
ipcMain.handle('local:createAdminLog', async (_evt, entry) => ok(() => (localDB as any).createAdminLog(entry)));

// Local database self-test
ipcMain.handle('local:selfTest', async () => {
  console.log('IPC: selfTest called');
  return ok(() => localDB.selfTest());
});

// Roles handlers
ipcMain.handle('local:getRoles', async () => ok(() => (localDB as any).getRoles()));

ipcMain.handle('local:createRole', async (_evt, role) => ok(() => (localDB as any).createRole(role)));

ipcMain.handle('local:updateRole', async (_evt, id, updates) => ok(() => (localDB as any).updateRole(id, updates)));

ipcMain.handle('local:deleteRole', async (_evt, id) => ok(() => (localDB as any).deleteRole(id)));

// Backup/export/import handlers
ipcMain.handle('local:exportAll', async () => ok(async () => {
  const data = await localDB.exportAll();
  return data;
}));

ipcMain.handle('local:importAll', async (_evt, data) => ok(async () => {
  const res = await localDB.importAll(data);
  return res;
}));

// Sync handlers (no-op in local-only mode)
ipcMain.handle('sync:start', async () => ok(() => ({ success: true, message: 'local-only', syncedCount: 0 })));
ipcMain.handle('sync:getStatus', async () => ok(() => ({ isOnline: false, lastSync: null, pendingChanges: 0, isSyncing: false })));
ipcMain.handle('sync:forceSync', async () => ok(() => ({ success: true })));
ipcMain.handle('sync:runOnce', async () => ok(() => ({ success: true })));

// Offline handlers
ipcMain.handle('offline:isOnline', () => ok(async () => {
  // Local-only: always offline regarding cloud sync
  return false;
}));

ipcMain.handle('offline:getOfflineData', async () => ok(() => localDB.getAllOfflineData()));

// AUTH IPC (local-only stubs)
ipcMain.handle('auth:getRoleIdByName', async (_evt, name: string) => ok(async () => {
  const roles = await (localDB as any).getRoles();
  const found = (roles || []).find((r: any) => String(r.name).trim() === String(name).trim());
  return found ? String(found.id) : null;
}));
ipcMain.handle('auth:findUserByEmail', async (_evt, email: string) => ok(async () => (localDB as any).findUserByEmail(email)));
ipcMain.handle('auth:updateLastLogin', async (_evt, id: string) => ok(async () => (localDB as any).updateLastLogin(id)));
ipcMain.handle('auth:checkEmailExists', async (_evt, email: string) => ok(async () => (localDB as any).checkEmailExists(email)));
ipcMain.handle('auth:checkCodeExists', async (_evt, code: string) => ok(async () => (localDB as any).checkCodeExists(code)));
ipcMain.handle('auth:createUser', async (_evt, payload: any) => ok(async () => (localDB as any).createUser(payload)));
ipcMain.handle('auth:updatePassword', async (_evt, id: string, password_hash: string) => ok(async () => (localDB as any).updatePassword(id, password_hash)));
ipcMain.handle('auth:listUsers', async () => ok(async () => (localDB as any).getUsers()));
ipcMain.handle('auth:updateUser', async (_evt, id: string, updates: any) => ok(async () => (localDB as any).updateUser(id, updates)));
ipcMain.handle('auth:deleteUser', async (_evt, id: string) => ok(async () => (localDB as any).deleteUser(id)));

// IMAGE STORAGE IPC
ipcMain.handle('image:upload', async (_evt, args: { buffer: number[]; contentType: string; fileName: string; entityType?: string; entityId?: string; originalName?: string; width?: number; height?: number }) => ok(async () => {
  // Save image locally under userData/images
  const baseDir = join(app.getPath('userData'), 'images');
  const targetPath = join(baseDir, args.fileName);
  const dir = dirname(targetPath);
  try { mkdirSync(dir, { recursive: true }); } catch {}
  const buf = Buffer.from(args.buffer);
  writeFileSync(targetPath, buf);
  const fileUrl = pathToFileURL(targetPath).toString();
  
  // If entity info provided, save to database
  if (args.entityType && args.entityId) {
    console.log('Main process - Saving image to database:', { 
      entityType: args.entityType, 
      entityId: args.entityId, 
      fileName: args.fileName 
    });
    try {
      const imageRecord = await (localDB as any).createImage({
        filename: args.fileName,
        original_name: args.originalName || args.fileName,
        mime_type: args.contentType,
        size: args.buffer.length,
        width: args.width,
        height: args.height,
        data_url: fileUrl,
        entity_type: args.entityType,
        entity_id: args.entityId
      });
      console.log('Main process - Image saved to database with ID:', imageRecord.id);
      return { url: targetPath, path: args.fileName, publicUrl: fileUrl, imageId: imageRecord.id };
    } catch (dbError) {
      console.error('Main process - Failed to save image record to database:', dbError);
      // Continue with file upload even if DB save fails
    }
  } else {
    console.log('Main process - No entity info provided, skipping database save');
  }
  
  return { url: targetPath, path: args.fileName, publicUrl: fileUrl };
}));

ipcMain.handle('image:delete', async (_evt, path: string) => ok(async () => {
  // Remove local file
  const baseDir = join(app.getPath('userData'), 'images');
  const targetPath = join(baseDir, path);
  try {
    if (existsSync(targetPath)) unlinkSync(targetPath);
  } catch (e) {
    throw e;
  }
  return true;
}));

ipcMain.handle('image:getPublicUrl', async (_evt, path: string) => ok(async () => {
  const baseDir = join(app.getPath('userData'), 'images');
  const targetPath = join(baseDir, path);
  return pathToFileURL(targetPath).toString();
}));

ipcMain.handle('image:getByEntity', async (_evt, entityType: string, entityId: string) => ok(async () => {
  console.log('Main process - image:getByEntity called with:', { entityType, entityId });
  try {
    const result = await (localDB as any).getImagesByEntity(entityType, entityId);
    console.log('Main process - getImagesByEntity result:', result);
    return result;
  } catch (error) {
    console.error('Main process - getImagesByEntity error:', error);
    throw error;
  }
}));

ipcMain.handle('image:deleteById', async (_evt, imageId: string) => ok(async () => {
  // Get image record first to find the file path
  const image = await (localDB as any).getImage(imageId);
  if (image) {
    // Delete the file
    const baseDir = join(app.getPath('userData'), 'images');
    const targetPath = join(baseDir, image.filename);
    try {
      if (existsSync(targetPath)) unlinkSync(targetPath);
    } catch (e) {
      console.warn('Failed to delete image file:', e);
    }
  }
  // Delete from database
  await (localDB as any).deleteImage(imageId);
  return true;
}));

// Print handlers
ipcMain.handle('print:document', async (_evt, args: { title: string; content: string; styles?: string }) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Create a new off-screen window for printing
    const printWindow = new BrowserWindow({
      width: 900,
      height: 700,
      // Show on Windows to avoid blank preview with some drivers
      show: process.platform === 'win32',
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        backgroundThrottling: false,
      },
    });

    // Load the print content
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${args.title}</title>
    <style>
      @page { size: A5 landscape; margin: 0; }
      html, body { margin: 0; padding: 0; background: #ffffff; }
      html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { font-family: 'Tajawal', system-ui, 'Segoe UI', Arial, sans-serif; direction: rtl; }
      ${args.styles || ''}
    </style>
  </head>
  <body>
    ${args.content}
  </body>
</html>`;
    // Wait for content to load and fully render, then trigger native print dialog
    printWindow.webContents.once('did-finish-load', async () => {
      try {
        await printWindow.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const done = () => requestAnimationFrame(() => requestAnimationFrame(resolve));
            const imgs = Array.from(document.images || []);
            const imgPromises = imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; }));
            const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready.catch(()=>{}) : Promise.resolve();
            Promise.all([Promise.all(imgPromises), fontsReady]).then(done).catch(done);
          });
        `, true);

        const printOptions: any = {
          silent: false,
          printBackground: true,
          landscape: true,
          pageSize: 'A5',
        };

        await new Promise<void>((resolve) => {
          printWindow.webContents.print(printOptions, () => resolve());
        });
      } catch (err) {
        console.error('Print pipeline error:', err);
      } finally {
        setTimeout(() => { try { printWindow.close(); } catch {} }, 300);
      }
    });

    // Load the content (listener above will fire once it finishes)
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    return { ok: true };
  } catch (e: any) {
    console.error('Print error:', e);
    return { ok: false, error: String(e?.message || e) };
  }
});

ipcMain.handle('print:preview', async (_evt, args: { title: string; content: string; styles?: string }) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Create a new window for print preview
    const previewWindow = new BrowserWindow({
      width: 900,
      height: 700,
      show: true,
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        backgroundThrottling: false,
      },
      title: `معاينة الطباعة - ${args.title}`,
    });

    // Load the print content
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${args.title}</title>
    <style>
      body { 
        margin: 0; 
        padding: 20px; 
        font-family: 'Tajawal', system-ui, 'Segoe UI', Arial, sans-serif; 
        direction: rtl; 
        background: #f5f5f5;
      }
      .print-content {
        background: white;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border-radius: 8px;
        max-width: 800px;
        margin: 0 auto;
      }
      .print-actions {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1000;
        background: white;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .print-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 5px;
      }
      .print-btn:hover {
        background: #0056b3;
      }
      @media print { .print-actions { display: none !important; } }
      @page { size: A5 landscape; margin: 0; }
      html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      ${args.styles || ''}
    </style>
  </head>
  <body>
    <div class="print-actions">
      <button class="print-btn" onclick="window.print()">طباعة</button>
      <button class="print-btn" onclick="window.close()">إغلاق</button>
    </div>
    <div class="print-content">
      ${args.content}
    </div>
  </body>
</html>`;

    await previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    try {
      await previewWindow.webContents.executeJavaScript(`
        new Promise((resolve) => {
          const done = () => requestAnimationFrame(() => requestAnimationFrame(resolve));
          const imgs = Array.from(document.images || []);
          const imgPromises = imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; }));
          const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready.catch(()=>{}) : Promise.resolve();
          Promise.all([Promise.all(imgPromises), fontsReady]).then(done).catch(done);
        });
      `, true);
    } catch {}
    
    return { ok: true };
  } catch (e: any) {
    console.error('Print preview error:', e);
    return { ok: false, error: String(e?.message || e) };
  }
});

// OS-native PDF preview: render to PDF and open in default viewer
ipcMain.handle('print:pdfPreview', async (_evt, args: { title: string; content: string; styles?: string; pageSize?: Electron.PrintToPDFOptions['pageSize']; landscape?: boolean }) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    const pdfWindow = new BrowserWindow({
      width: 900,
      height: 700,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${args.title}</title>
    <style>
      @page { size: ${args.pageSize || 'A5'} ${args.landscape ?? true ? 'landscape' : 'portrait'}; margin: 0; }
      html, body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { font-family: 'Tajawal', system-ui, 'Segoe UI', Arial, sans-serif; direction: rtl; }
      ${args.styles || ''}
    </style>
  </head>
  <body>
    ${args.content}
  </body>
</html>`;

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    const pdfOptions: Electron.PrintToPDFOptions = {
      pageSize: args.pageSize || 'A5',
      landscape: args.landscape ?? true,
      printBackground: true,
    };

    const pdf = await pdfWindow.webContents.printToPDF(pdfOptions);
    const tempDir = app.getPath('temp');
    const file = join(tempDir, `qurtuba-preview-${Date.now()}.pdf`);
    writeFileSync(file, pdf);
    try { pdfWindow.close(); } catch {}

    await shell.openPath(file);
    return { ok: true, path: file };
  } catch (e: any) {
    console.error('PDF preview error:', e);
    return { ok: false, error: String(e?.message || e) };
  }
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('qurtuba-fashion');

// Create system tray
const createTray = (): void => {
  const trayIconPath = app.isPackaged ? join(process.resourcesPath, 'icon.ico') : join(__dirname, '../build/icon.ico');
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
    // Sync removed in local-only mode
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
          label: 'مزامنة البيانات (معطلة محلياً)',
          accelerator: 'CmdOrCtrl+S',
          enabled: false
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
