// Electron IPC interface
export interface NativePort {
  // App information
  getVersion: () => Promise<string>;
  
  // Dialog functions
  showMessageBox: (options: {
    type?: 'info' | 'warning' | 'error' | 'question';
    title?: string;
    message: string;
    buttons?: string[];
  }) => Promise<{ response: number }>;
  
  showOpenDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: ('openFile' | 'openDirectory' | 'multiSelections')[];
  }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{ canceled: boolean; filePath?: string }>;
  
  // File operations
  saveFile: (data: string, filename: string) => Promise<void>;
  
  // Export functionality
  exportToPDF: (data: any) => Promise<void>;
  
  // Print functionality
  print: (data: any) => Promise<void>;
}
