
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem
 */
declare class ClipboardItem {
	constructor(options: object);
}

interface Clipboard {
	write(items: object[]): Promise<void>;
}
