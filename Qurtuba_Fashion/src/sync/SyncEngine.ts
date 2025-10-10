// Reuse the shared Supabase client to avoid multiple GoTrue instances
// Local-only: Supabase disabled
import type { StoragePort } from '@/storage/StoragePort';

export class SyncEngine {
	private storage: StoragePort;
	private timer: any = null;

	constructor(storage: StoragePort) {
		this.storage = storage;
		// Touch the storage reference to satisfy linters in local-only mode
		void this.storage;
	}

	schedule(intervalMs: number = 60000) {
		if (this.timer) return;
		this.timer = setInterval(() => {
			this.sync().catch(() => {});
		}, intervalMs);
	}

	async sync(): Promise<void> {
		// No-op in local-only mode
		return;
	}

	// local-only: removed remote push

	// local-only: removed remote pull
}


