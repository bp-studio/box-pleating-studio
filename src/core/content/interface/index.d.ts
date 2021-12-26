import type { OptionService } from "bp/env/service/OptionService";
import type { DesignMode } from "bp/content/json";
import type { HistoryService } from "bp/content/changes/HistoryService";
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
	readonly $history: HistoryService | null;
	readonly $tree: Tree;
	readonly $dragging: boolean;
	mode: DesignMode;
	$options: OptionService;
	$clearSelection(): void;
}

/** 選填的 {@link IDesign} 介面，所以直接代入空物件也可以 */
export type IDesignLike = Partial<IDesign>;
