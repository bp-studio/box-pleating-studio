
declare const launchQueue: LaunchQueue;

interface LaunchQueue {
	setConsumer(consumer: LaunchConsumer): void;
}

interface LaunchConsumer {
	(launchParams: LaunchParams): void;
}

interface LaunchParams {
	readonly files: FileHandleList;
}

type FileHandleList = readonly FileSystemFileHandle[];
