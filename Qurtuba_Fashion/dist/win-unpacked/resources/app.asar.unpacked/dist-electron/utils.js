"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.getDocumentsPath = exports.getUserDataPath = exports.getAppPath = exports.isDev = void 0;
const electron_1 = require("electron");
// Consider development when the app is not packaged (safer than NODE_ENV)
exports.isDev = !electron_1.app.isPackaged;
const getAppPath = () => {
    return electron_1.app.getAppPath();
};
exports.getAppPath = getAppPath;
const getUserDataPath = () => {
    return electron_1.app.getPath('userData');
};
exports.getUserDataPath = getUserDataPath;
const getDocumentsPath = () => {
    return electron_1.app.getPath('documents');
};
exports.getDocumentsPath = getDocumentsPath;
// Production-safe logging utilities
// Only log in development mode to avoid exposing sensitive information in production
exports.logger = {
    log: (...args) => {
        if (exports.isDev) {
            console.log(...args);
        }
    },
    error: (...args) => {
        // Always log errors, but sanitize in production
        if (exports.isDev) {
            console.error(...args);
        }
        else {
            // In production, log to file only (no console)
            console.error('[ERROR]', args[0]);
        }
    },
    warn: (...args) => {
        if (exports.isDev) {
            console.warn(...args);
        }
    },
    debug: (...args) => {
        if (exports.isDev) {
            console.debug(...args);
        }
    }
};
