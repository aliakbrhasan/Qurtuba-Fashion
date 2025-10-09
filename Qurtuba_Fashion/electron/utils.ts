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





