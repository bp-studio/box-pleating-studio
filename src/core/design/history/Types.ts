import type { IDesignObject } from "..";

export interface ITagObject extends IDesignObject {

	/** 用來唯一識別這個物件的字串 */
	readonly $tag: string;
}

export interface IQueryable extends ITagObject {
	$query(tag: string): ITagObject | undefined;
}
