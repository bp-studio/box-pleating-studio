declare module 'vue-property-decorator' {
	interface Vue {
		$t(path: string, data?: any): string;
		_uid: string;
	}
}

export interface FileFactory {
	name: string;
	content: () => string | Promise<string>;
}

export function sanitize(filename: string): string;

export function readFile(f: File): Promise<ArrayBuffer>;

export function bufferToText(buffer: ArrayBuffer): string;

export function callService(data: any): Promise<any>;

export function registerHotkey(action: () => void, key: string, shift?: boolean);
