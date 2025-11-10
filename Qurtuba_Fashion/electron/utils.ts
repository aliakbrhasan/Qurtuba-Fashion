import { app } from 'electron';

// Consider development when the app is not packaged (safer than NODE_ENV)
export const isDev = !app.isPackaged;

export const getAppPath = (): string => {
  return app.getAppPath();
};

export const getUserDataPath = (): string => {
  return app.getPath('userData');
};

export const getDocumentsPath = (): string => {
  return app.getPath('documents');
};

// Production-safe logging utilities
// Only log in development mode to avoid exposing sensitive information in production
export const logger = {
  log: (...args: any[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args: any[]): void => {
    // Always log errors, but sanitize in production
    if (isDev) {
      console.error(...args);
    } else {
      // In production, log to file only (no console)
      console.error('[ERROR]', args[0]);
    }
  },
  warn: (...args: any[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },
  debug: (...args: any[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  }
};





