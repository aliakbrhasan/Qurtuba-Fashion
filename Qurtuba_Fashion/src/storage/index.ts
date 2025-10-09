import { isElectronRuntime } from './StoragePort';
import { ElectronSQLiteStorage } from './electron-sqlite';
import { WebIndexedDBStorage } from './web-indexeddb';

export const storage = isElectronRuntime() ? new ElectronSQLiteStorage() : new WebIndexedDBStorage();


