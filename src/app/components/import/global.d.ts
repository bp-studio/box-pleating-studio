import * as IdbKeyval from 'idb-keyval';
import VueI18n from 'vue-i18n';

declare global {

	export const launchQueue: LaunchQueue;

	interface LaunchQueue {
		setConsumer(consumer: LaunchConsumer): void;
	}

	interface LaunchConsumer {
		(launchParams: LaunchParams): void;
	}

	interface LaunchParams {
		readonly files: readonly FileSystemFileHandle[];
	}

	export interface Executor extends Vue {
		execute(): void;
	}

	export interface IShow extends Vue {
		show(): void;
	}

	export const dropdown: {
		current: unknown;
		skipped: boolean;
	};

	// 第三方程式庫相關
	export const i18n: VueI18n;
	export const idbKeyval: typeof IdbKeyval;
	export const gtag: (...args: unknown[]) => void;
	export const libReady: Promise<void>;

	// 系統狀態常數
	export const isFileApiEnabled: boolean;
	export const isMac: boolean;
	export const isPWA: boolean;

	// 全域宣告的函數
	export function sanitize(filename: string): string;
	export function readFile(f: File): Promise<ArrayBuffer>;
	export function bufferToText(buffer: ArrayBuffer): string;
	export function callService(data: unknown): Promise<unknown>;
	export function registerHotkey(action: () => void, key: string, shift?: boolean): void;
	export function registerHotkeyCore(callback: (e: KeyboardEvent) => void): EventListener;
	export function unregisterHotkeyCore(handler: EventListener): void;
	export function checkWithBC(id: number): Promise<boolean>;
	export function toKey(e: KeyboardEvent): string | null;
	export function findKey(key: string | null, store: object): string | null;
	export function formatKey(key: string): string;
	export function zoomStep(zoom: number): number;
}
