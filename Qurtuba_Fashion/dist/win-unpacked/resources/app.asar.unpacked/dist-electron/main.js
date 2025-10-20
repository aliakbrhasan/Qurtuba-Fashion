"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Supabase disabled in local-only mode
const fs_1 = require("fs");
const path_1 = require("path");
const url_1 = require("url");
const utils_1 = require("./utils");
const local_database_1 = require("./local-database");
// Keep a global reference of the window object
let mainWindow = null;
let tray = null;
let localDB;
// Sync and remote DB disabled in local-only mode
let supabaseMain = null;
const createWindow = () => {
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
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
            preload: (0, path_1.join)(__dirname, 'preload.js'),
        },
        icon: electron_1.app.isPackaged ? (0, path_1.join)(process.resourcesPath, 'icon.ico') : (0, path_1.join)(__dirname, '../build/icon.ico'),
        titleBarStyle: 'default',
        show: false, // Don't show until ready
    });
    // Load the app
    if (utils_1.isDev) {
        mainWindow.loadURL('http://localhost:3001');
        // Open DevTools in development
        mainWindow.webContents.openDevTools();
    }
    else {
        // In production, locate build/index.html from several candidates
        const candidates = [
            (0, path_1.join)(__dirname, '../build/index.html'),
            (0, path_1.join)(electron_1.app.getAppPath(), 'build', 'index.html'),
            (0, path_1.join)(process.cwd(), 'build', 'index.html'),
            (0, path_1.join)(__dirname, '../../build/index.html'),
        ];
        const found = candidates.find(p => (0, fs_1.existsSync)(p));
        if (found) {
            mainWindow.loadFile(found).catch((err) => {
                console.error('Failed to load index.html:', err);
                electron_1.dialog.showErrorBox('خطأ في تشغيل التطبيق', 'تعذر تحميل واجهة التطبيق. تأكد من وجود مجلد build ثم أعد المحاولة.');
            });
        }
        else {
            const message = `تعذر العثور على build/index.html\nيرجى تشغيل: npm run build\nالمسارات التي تم البحث فيها:\n${candidates.join('\n')}`;
            console.error(message);
            electron_1.dialog.showErrorBox('الملفات غير موجودة', message);
        }
    }
    // Handle camera permissions
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            // Grant media permissions (camera/microphone)
            callback(true);
        }
        else {
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
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
        if (!utils_1.isDev || !allowedOrigins.some(origin => url.startsWith(origin))) {
            event.preventDefault();
        }
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Deny all new windows/popups
        return { action: 'deny' };
    });
};
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(async () => {
    // Initialize local database
    try {
        console.log('Starting database initialization...');
        localDB = new local_database_1.LocalDatabase();
        await localDB.initialize();
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        // Show error dialog to user
        electron_1.dialog.showErrorBox('Database Error', 'Failed to initialize the local database. The application may not work correctly.\n\nError: ' + error.message);
    }
    // Local-only: disable sync and supabase initialization
    // Copy bundled resources to userData on first run
    try {
        const bundledResources = electron_1.app.isPackaged ? (0, path_1.join)(process.resourcesPath, 'resources') : (0, path_1.join)(__dirname, '../resources');
        const targetResources = (0, path_1.join)(electron_1.app.getPath('userData'), 'resources');
        const ensure = (p) => { try {
            (0, fs_1.mkdirSync)(p, { recursive: true });
        }
        catch { } };
        const copyRecursive = (src, dest) => {
            if (!(0, fs_1.existsSync)(src))
                return;
            ensure(dest);
            for (const name of (0, fs_1.readdirSync)(src)) {
                const s = (0, path_1.join)(src, name);
                const d = (0, path_1.join)(dest, name);
                if ((0, fs_1.lstatSync)(s).isDirectory())
                    copyRecursive(s, d);
                else
                    (0, fs_1.copyFileSync)(s, d);
            }
        };
        if (!(0, fs_1.existsSync)(targetResources))
            copyRecursive(bundledResources, targetResources);
    }
    catch { }
    createWindow();
    createTray();
    createMenu();
    electron_1.app.on('activate', () => {
        // On macOS, re-create window when dock icon is clicked
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows are closed
electron_1.app.on('window-all-closed', () => {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Security: Prevent new window creation
electron_1.app.on('web-contents-created', (_evt, contents) => {
    contents.setWindowOpenHandler(() => {
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
electron_1.ipcMain.handle('cache:readJson', async (_evt, key) => {
    try {
        const dir = (0, path_1.join)(electron_1.app.getPath('userData'), 'qf-cache');
        const file = (0, path_1.join)(dir, `${key}.json`);
        if (!(0, fs_1.existsSync)(file))
            return { ok: true, data: null };
        const raw = (0, fs_1.readFileSync)(file, { encoding: 'utf-8' });
        const data = JSON.parse(raw);
        return { ok: true, data };
    }
    catch (e) {
        return { ok: false, error: String(e?.message || e) };
    }
});
electron_1.ipcMain.handle('cache:writeJson', async (_evt, args) => {
    try {
        const dir = (0, path_1.join)(electron_1.app.getPath('userData'), 'qf-cache');
        try {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
        catch { }
        const file = (0, path_1.join)(dir, `${args.key}.json`);
        (0, fs_1.writeFileSync)(file, JSON.stringify(args.data ?? null), { encoding: 'utf-8' });
        return { ok: true };
    }
    catch (e) {
        return { ok: false, error: String(e?.message || e) };
    }
});
// IPC Handlers for native functionality
electron_1.ipcMain.handle('app:getVersion', () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('app:showMessageBox', async (_, options) => {
    if (!mainWindow)
        return null;
    return await electron_1.dialog.showMessageBox(mainWindow, options);
});
electron_1.ipcMain.handle('app:showOpenDialog', async (_, options) => {
    if (!mainWindow)
        return null;
    return await electron_1.dialog.showOpenDialog(mainWindow, options);
});
electron_1.ipcMain.handle('app:showSaveDialog', async (_, options) => {
    if (!mainWindow)
        return null;
    return await electron_1.dialog.showSaveDialog(mainWindow, options);
});
// Simple file save handler used by renderer for backups
electron_1.ipcMain.handle('file:save', async (_evt, args) => {
    try {
        const file = args.filename;
        (0, fs_1.writeFileSync)(file, args.data ?? '', { encoding: 'utf-8' });
        return { ok: true };
    }
    catch (e) {
        return { ok: false, error: String(e?.message || e) };
    }
});
// Helper to standardize IPC responses
async function ok(fn) {
    try {
        if (!localDB) {
            return { ok: false, error: 'Database not initialized' };
        }
        const data = await Promise.resolve(fn());
        return { ok: true, data };
    }
    catch (e) {
        console.error('Database operation failed:', e);
        return { ok: false, error: String(e?.message || e) };
    }
}
// Local database handlers
electron_1.ipcMain.handle('local:getCustomers', async () => {
    console.log('IPC: getCustomers called');
    return ok(() => localDB.getCustomers());
});
electron_1.ipcMain.handle('local:createCustomer', async (_, customer) => {
    console.log('IPC: createCustomer called with:', customer);
    return ok(() => localDB.createCustomer(customer));
});
electron_1.ipcMain.handle('local:updateCustomer', async (_, id, updates) => {
    console.log('IPC: updateCustomer called with ID:', id);
    return ok(() => localDB.updateCustomer(id, updates));
});
electron_1.ipcMain.handle('local:deleteCustomer', async (_, id) => {
    console.log('IPC: deleteCustomer called with ID:', id);
    return ok(() => localDB.deleteCustomer(id));
});
electron_1.ipcMain.handle('local:getInvoices', async () => {
    console.log('IPC: getInvoices called');
    return ok(() => localDB.getInvoices());
});
electron_1.ipcMain.handle('local:createInvoice', async (_, invoice) => {
    console.log('IPC: createInvoice called with:', invoice);
    return ok(() => localDB.createInvoice(invoice));
});
electron_1.ipcMain.handle('local:updateInvoice', async (_, id, updates) => {
    console.log('IPC: updateInvoice called with ID:', id);
    return ok(() => localDB.updateInvoice(id, updates));
});
electron_1.ipcMain.handle('local:deleteInvoice', async (_, id) => {
    console.log('IPC: deleteInvoice called with ID:', id);
    return ok(() => localDB.deleteInvoice(id));
});
electron_1.ipcMain.handle('local:getOrders', async () => ok(() => localDB.getOrders()));
electron_1.ipcMain.handle('local:createOrder', async (_, order) => ok(() => localDB.createOrder(order)));
electron_1.ipcMain.handle('local:updateOrder', async (_, id, updates) => ok(() => localDB.updateOrder(id, updates)));
electron_1.ipcMain.handle('local:deleteOrder', async (_, id) => ok(() => localDB.deleteOrder(id)));
// Local database self-test
electron_1.ipcMain.handle('local:selfTest', async () => {
    console.log('IPC: selfTest called');
    return ok(() => localDB.selfTest());
});
// Roles handlers
electron_1.ipcMain.handle('local:getRoles', async () => ok(() => localDB.getRoles()));
electron_1.ipcMain.handle('local:createRole', async (_evt, role) => ok(() => localDB.createRole(role)));
electron_1.ipcMain.handle('local:updateRole', async (_evt, id, updates) => ok(() => localDB.updateRole(id, updates)));
electron_1.ipcMain.handle('local:deleteRole', async (_evt, id) => ok(() => localDB.deleteRole(id)));
// Backup/export/import handlers
electron_1.ipcMain.handle('local:exportAll', async () => ok(async () => {
    const data = await localDB.exportAll();
    return data;
}));
electron_1.ipcMain.handle('local:importAll', async (_evt, data) => ok(async () => {
    const res = await localDB.importAll(data);
    return res;
}));
// Sync handlers (no-op in local-only mode)
electron_1.ipcMain.handle('sync:start', async () => ok(() => ({ success: true, message: 'local-only', syncedCount: 0 })));
electron_1.ipcMain.handle('sync:getStatus', async () => ok(() => ({ isOnline: false, lastSync: null, pendingChanges: 0, isSyncing: false })));
electron_1.ipcMain.handle('sync:forceSync', async () => ok(() => ({ success: true })));
electron_1.ipcMain.handle('sync:runOnce', async () => ok(() => ({ success: true })));
// Offline handlers
electron_1.ipcMain.handle('offline:isOnline', () => ok(async () => {
    // Local-only: always offline regarding cloud sync
    return false;
}));
electron_1.ipcMain.handle('offline:getOfflineData', async () => ok(() => localDB.getAllOfflineData()));
// AUTH IPC (local-only stubs)
electron_1.ipcMain.handle('auth:getRoleIdByName', async (_evt, name) => ok(async () => {
    const roles = await localDB.getRoles();
    const found = (roles || []).find((r) => String(r.name).trim() === String(name).trim());
    return found ? String(found.id) : null;
}));
electron_1.ipcMain.handle('auth:findUserByEmail', async (_evt, email) => ok(async () => localDB.findUserByEmail(email)));
electron_1.ipcMain.handle('auth:updateLastLogin', async (_evt, id) => ok(async () => localDB.updateLastLogin(id)));
electron_1.ipcMain.handle('auth:checkEmailExists', async (_evt, email) => ok(async () => localDB.checkEmailExists(email)));
electron_1.ipcMain.handle('auth:checkCodeExists', async (_evt, code) => ok(async () => localDB.checkCodeExists(code)));
electron_1.ipcMain.handle('auth:createUser', async (_evt, payload) => ok(async () => localDB.createUser(payload)));
electron_1.ipcMain.handle('auth:updatePassword', async (_evt, id, password_hash) => ok(async () => localDB.updatePassword(id, password_hash)));
electron_1.ipcMain.handle('auth:listUsers', async () => ok(async () => localDB.getUsers()));
electron_1.ipcMain.handle('auth:updateUser', async (_evt, id, updates) => ok(async () => localDB.updateUser(id, updates)));
electron_1.ipcMain.handle('auth:deleteUser', async (_evt, id) => ok(async () => localDB.deleteUser(id)));
// IMAGE STORAGE IPC
electron_1.ipcMain.handle('image:upload', async (_evt, args) => ok(async () => {
    // Save image locally under userData/images
    const baseDir = (0, path_1.join)(electron_1.app.getPath('userData'), 'images');
    const targetPath = (0, path_1.join)(baseDir, args.fileName);
    const dir = (0, path_1.dirname)(targetPath);
    try {
        (0, fs_1.mkdirSync)(dir, { recursive: true });
    }
    catch { }
    const buf = Buffer.from(args.buffer);
    (0, fs_1.writeFileSync)(targetPath, buf);
    const fileUrl = (0, url_1.pathToFileURL)(targetPath).toString();
    return { url: targetPath, path: args.fileName, publicUrl: fileUrl };
}));
electron_1.ipcMain.handle('image:delete', async (_evt, path) => ok(async () => {
    // Remove local file
    const baseDir = (0, path_1.join)(electron_1.app.getPath('userData'), 'images');
    const targetPath = (0, path_1.join)(baseDir, path);
    try {
        if ((0, fs_1.existsSync)(targetPath))
            (0, fs_1.unlinkSync)(targetPath);
    }
    catch (e) {
        throw e;
    }
    return true;
}));
electron_1.ipcMain.handle('image:getPublicUrl', async (_evt, path) => ok(async () => {
    const baseDir = (0, path_1.join)(electron_1.app.getPath('userData'), 'images');
    const targetPath = (0, path_1.join)(baseDir, path);
    return (0, url_1.pathToFileURL)(targetPath).toString();
}));
// Handle app protocol for deep linking (optional)
electron_1.app.setAsDefaultProtocolClient('qurtuba-fashion');
// Create system tray
const createTray = () => {
    const trayIconPath = electron_1.app.isPackaged ? (0, path_1.join)(process.resourcesPath, 'icon.ico') : (0, path_1.join)(__dirname, '../build/icon.ico');
    tray = new electron_1.Tray(electron_1.nativeImage.createFromPath(trayIconPath));
    const contextMenu = electron_1.Menu.buildFromTemplate([
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
                    electron_1.dialog.showMessageBox(mainWindow, {
                        type: res.ok ? 'info' : 'error',
                        title: 'نتيجة الاختبار',
                        message: res.ok ? 'نجح اختبار القاعدة المحلية' : 'فشل اختبار القاعدة المحلية',
                        detail: res.report,
                    });
                }
                catch (err) {
                    electron_1.dialog.showErrorBox('خطأ', String(err?.message || err));
                }
            }
        },
        { type: 'separator' },
        {
            label: 'خروج',
            click: () => {
                electron_1.app.quit();
            }
        }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('أزياء قرطبة');
};
// Create application menu
const createMenu = () => {
    const template = [
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
                            electron_1.dialog.showMessageBox(mainWindow, {
                                type: res.ok ? 'info' : 'error',
                                title: 'نتيجة الاختبار',
                                message: res.ok ? 'نجح اختبار القاعدة المحلية' : 'فشل اختبار القاعدة المحلية',
                                detail: res.report,
                            });
                        }
                        catch (err) {
                            electron_1.dialog.showErrorBox('خطأ', String(err?.message || err));
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'خروج',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        electron_1.app.quit();
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
                        electron_1.dialog.showMessageBox(mainWindow, {
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
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
};
