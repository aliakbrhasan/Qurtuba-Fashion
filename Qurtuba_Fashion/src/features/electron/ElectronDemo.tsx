import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { electronAdapter } from '@/adapters/electron.adapter';
import { toast } from 'sonner';

export function ElectronDemo() {
  const [appVersion, setAppVersion] = useState<string>('');
  const [isElectron, setIsElectron] = useState(false);

  React.useEffect(() => {
    // Check if running in Electron
    const checkElectron = () => {
      try {
        return typeof window !== 'undefined' && !!window.electronAPI;
      } catch {
        return false;
      }
    };
    
    setIsElectron(checkElectron());
  }, []);

  const handleGetVersion = async () => {
    try {
      const version = await electronAdapter.getVersion();
      setAppVersion(version);
      toast.success(`App version: ${version}`);
    } catch (error) {
      toast.error('Failed to get app version');
    }
  };

  const handleShowMessage = async () => {
    try {
      await electronAdapter.showMessageBox({
        type: 'info',
        title: 'أزياء قرطبة',
        message: 'مرحباً بك في تطبيق أزياء قرطبة!',
        buttons: ['موافق']
      });
    } catch (error) {
      toast.error('Failed to show message');
    }
  };

  const handleOpenFile = async () => {
    try {
      const result = await electronAdapter.showOpenDialog({
        title: 'اختر ملف',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled) {
        toast.success(`Selected: ${result.filePaths[0]}`);
      }
    } catch (error) {
      toast.error('Failed to open file dialog');
    }
  };

  const handleSaveFile = async () => {
    try {
      const result = await electronAdapter.showSaveDialog({
        title: 'حفظ ملف',
        defaultPath: 'order-export.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] }
        ]
      });
      
      if (!result.canceled && result.filePath) {
        await electronAdapter.saveFile(
          JSON.stringify({ message: 'Hello from أزياء قرطبة!' }, null, 2),
          result.filePath
        );
        toast.success(`File saved to: ${result.filePath}`);
      }
    } catch (error) {
      toast.error('Failed to save file');
    }
  };

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Electron Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This demo is only available when running in Electron. 
            Run <code>npm run electron:dev</code> to see Electron features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Electron Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Test Electron functionality:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGetVersion} variant="outline">
              Get App Version
            </Button>
            <Button onClick={handleShowMessage} variant="outline">
              Show Message
            </Button>
            <Button onClick={handleOpenFile} variant="outline">
              Open File
            </Button>
            <Button onClick={handleSaveFile} variant="outline">
              Save File
            </Button>
          </div>
        </div>
        
        {appVersion && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              <strong>App Version:</strong> {appVersion}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





