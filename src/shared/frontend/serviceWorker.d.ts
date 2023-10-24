
interface PeriodicSyncManager {
	register(tag: string, options?: { minInterval: number }): Promise<undefined>;
	unregister(tag: string): Promise<void>;
	getTags(): Promise<Array<string>>;
}

interface ServiceWorkerRegistration {
	periodicSync: PeriodicSyncManager;
}
