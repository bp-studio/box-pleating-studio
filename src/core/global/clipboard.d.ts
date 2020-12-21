
declare class ClipboardItem {
	constructor(options: any);
}

interface Clipboard {
	write(items: any[]): Promise<void>;
}
