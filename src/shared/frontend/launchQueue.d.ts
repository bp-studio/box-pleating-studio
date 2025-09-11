
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/launchQueue
 */
declare const launchQueue: LaunchQueue;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/LaunchQueue
 */
interface LaunchQueue {
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/LaunchQueue/setConsumer
	 */
	setConsumer(consumer: (launchParams: LaunchParams) => void): void;
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/LaunchParams
 */
interface LaunchParams {
	readonly files: FileHandleList;
}

type FileHandleList = readonly FileSystemFileHandle[];
