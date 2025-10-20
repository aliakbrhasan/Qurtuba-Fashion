"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentsPath = exports.getUserDataPath = exports.getAppPath = exports.isDev = void 0;
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
