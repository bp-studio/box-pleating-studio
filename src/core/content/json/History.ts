import type { CommandType } from "./Enum";
import type { DesignMode } from "./Design";

export interface JHistory {

	/** 現在所在的位置 */
	index: number;

	/** 上次存檔時的位置 */
	savedIndex: number;

	/** 所有的歷史記錄 */
	steps: JStep[];
}

export interface JStep<T extends JCommand = JCommand> {
	commands: readonly T[];
	construct?: Memento[];
	destruct?: Memento[];
	mode: DesignMode;
	before: string[];
	after: string[];
}

export type Memento = [string, object];

export interface JCommand {
	readonly type: CommandType;

	/**
	 * 受影響的物件的 tag。
	 *
	 * 考量到 GC 的需求，{@link JCommand} 介面並不保留物件的參照。
	 */
	readonly tag: string;
}

