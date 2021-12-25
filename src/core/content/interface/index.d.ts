import type { OptionManager } from "bp/content/OptionManager";
import type { DesignMode } from "bp/content/json";
import type { HistoryManager } from "bp/content/changes/HistoryManager";
import type { Tree } from "bp/content/context";

interface IQueryable {
	$query(tag: string): ITagObject | undefined;
}

export interface ITagObject {

	/** 用來唯一識別這個物件的字串 */
	readonly $tag: string;
	readonly $design: IDesignLike;
}

export type IQueryableTagObject = ITagObject & IQueryable;

export interface IDesign extends IQueryableTagObject {
	readonly $history: HistoryManager | null;
	readonly $tree: Tree;
	readonly $dragging: boolean;
	mode: DesignMode;
	$options: OptionManager;
	$clearSelection(): void;
}

/** 抽象化的 Design 介面，所有的欄位都是選填，所以直接代入空物件也可以 */
export type IDesignLike = Partial<IDesign>;
