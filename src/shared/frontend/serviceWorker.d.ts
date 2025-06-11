
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PeriodicSyncManager
 */
interface PeriodicSyncManager {
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/PeriodicSyncManager/unregister
	 */
	register(tag: string, options?: { minInterval: number }): Promise<undefined>;

	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/PeriodicSyncManager/register
	 */
	unregister(tag: string): Promise<void>;

	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/PeriodicSyncManager/getTags
	 */
	getTags(): Promise<Array<string>>;
}

interface ServiceWorkerRegistration {
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/periodicSync
	 */
	readonly periodicSync: PeriodicSyncManager;
}
