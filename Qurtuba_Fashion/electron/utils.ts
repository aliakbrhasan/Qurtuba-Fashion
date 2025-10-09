import { app } from 'electron';

export const isDev = process.env.NODE_ENV === 'development';

export const getAppPath = (): string => {
  return app.getAppPath();
};

export const getUserDataPath = (): string => {
  return app.getPath('userData');
};

export const getDocumentsPath = (): string => {
  return app.getPath('documents');
};





