
interface ITagObject extends IDesignObject {

	/** 用來唯一識別這個物件的字串 */
	readonly tag: string;

	[key: string]: any;
}

interface IQueryable extends ITagObject {
	query(tag: string): ITagObject | undefined;
}

enum CommandType {
	field = 0,
	move = 1,
	add = 2,
	remove = 3
}
