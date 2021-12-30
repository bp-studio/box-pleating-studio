import * as IdbKeyval from 'idb-keyval';
import CoreBase from 'components/mixins/coreBase';
import { Design } from './BPStudio';
import VueI18n from 'vue-i18n';

declare global {

	export const launchQueue: LaunchQueue;

	interface LaunchQueue {
		setConsumer(consumer: LaunchConsumer): void;
	}

	interface LaunchConsumer {
		(launchParams: LaunchParams): void;
	}

	type FileHandleList = readonly FileSystemFileHandle[];

	interface LaunchParams {
		readonly files: FileHandleList;
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

	// 這個的宣告在本地 polyfill 裡面
	export function checkWithBC(id: number): Promise<boolean>;

	// Core
	interface Core extends CoreBase {
		readonly id: number;
		readonly designs: number[];
		readonly session: Session;
		readonly lcpReady: boolean;
		readonly copyright: string;
		readonly shouldShowDPad: boolean;
		readonly updated: boolean;
		loader: {
			show(): Promise<void>;
			hide(): void;
		};
		alert(message: VueI18n.TranslateResult): Promise<void>;
		confirm(message: VueI18n.TranslateResult): Promise<boolean>;
		open(d: string | object): void;
		readonly projects: IProjects;
		readonly handles: IHandles;
		readonly settings: ISettings;
		readonly language: {
			init(build: number): void;
		};
	}

	interface IProjects {
		openWorkspace(buffer: ArrayBuffer): Promise<number | undefined>;
		select(id: number): void;
		add(d: Design, select?: boolean): void;
		create(): void;
		close(id?: number): Promise<void>;
		closeOther(id: number): Promise<void>;
		closeRight(id: number): Promise<void>;
		closeAll(): Promise<void>;
		clone(id?: number): void;
		designs: number[];
	}

	interface IHandles {
		get(id: number): FileSystemFileHandle;
		set(id: number, value: FileSystemFileHandle): void;
		locate(handles: FileHandleList): Promise<(number | undefined)[]>;
		addRecent(handle: FileSystemFileHandle): Promise<void>;
		removeRecent(handle: FileSystemFileHandle): Promise<void>;
		delete(id: number): void;
		save(): Promise<void>;
		clearRecent(): void;
		readonly recent: FileHandleList;
	}

	interface ISettings {
		save(): void;
		reset(): void;
		loadSessionOnQueue: boolean;
		showDPad: boolean;
		autoSave: boolean;
		hotkey: KeyStore;
	}
}
