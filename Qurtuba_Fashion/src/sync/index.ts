import { storage } from '@/storage';
import { SyncEngine } from './SyncEngine';

export const syncEngine = new SyncEngine(storage);

try {
	// Start periodic sync in browser runtime
	(syncEngine as any).schedule?.(30000);
	// Trigger an immediate sync on app load
	(syncEngine as any).sync?.();
	// Re-sync when connection comes back online
	if (typeof window !== 'undefined') {
		window.addEventListener('online', () => {
			(syncEngine as any).sync?.();
		});
	}
} catch {}


