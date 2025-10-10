import { storage } from '@/storage';
import { SyncEngine } from './SyncEngine';

export const syncEngine = new SyncEngine(storage);

try {
	// Local-only: disable browser sync
} catch {}


