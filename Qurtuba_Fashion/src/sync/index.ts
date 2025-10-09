import { storage } from '@/storage';
import { SyncEngine } from './SyncEngine';

export const syncEngine = new SyncEngine(storage);

try {
	// Start periodic sync in browser runtime
	(syncEngine as any).schedule?.(60000);
} catch {}


