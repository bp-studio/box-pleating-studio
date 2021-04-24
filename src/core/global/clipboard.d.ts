
declare class ClipboardItem {
	constructor(options: object);
}

interface Clipboard {
	write(items: object[]): Promise<void>;
}
