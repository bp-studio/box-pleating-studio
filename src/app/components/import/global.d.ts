import VueI18n from 'vue-i18n';

declare global {

	export interface Executor extends Vue {
		execute(): void;
	}

	export const dropdown: {
		current: unknown;
		skipped: boolean;
	};

	export const i18n: VueI18n;

	// 系統狀態常數
	export const nativeFileEnabled: boolean;
	export const isMac: boolean;

	// 全域宣告的函數
	export function sanitize(filename: string): string;
	export function readFile(f: File): Promise<ArrayBuffer>;
	export function bufferToText(buffer: ArrayBuffer): string;
	export function callService(data: unknown): Promise<unknown>;
	export function registerHotkey(action: () => void, key: string, shift?: boolean): void;
	export function registerHotkeyCore(callback: (e: KeyboardEvent) => void): EventListener;
	export function unregisterHotkeyCore(handler: EventListener): void;
}
