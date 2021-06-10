import VueI18n from 'vue-i18n';

declare module 'vue-property-decorator' {
	interface Vue {
		_uid: string;
	}
}

export declare const dropdown: {
	current: unknown;
	skipped: boolean;
};

export declare const i18n: VueI18n;

export interface FileFactory {
	name: string;
	content: () => null | Blob | Promise<Blob>;
}

export function sanitize(filename: string): string;

export function readFile(f: File): Promise<ArrayBuffer>;

export function bufferToText(buffer: ArrayBuffer): string;

export function callService(data: unknown): Promise<unknown>;

export function registerHotkey(action: () => void, key: string, shift?: boolean): void;

export function registerHotkeyCore(callback: (e: KeyboardEvent) => void): EventListener;

export function unregisterHotkeyCore(handler: EventListener): void;
