
interface ITagObject extends IDesignObject {

	/** 用來唯一識別這個物件的字串 */
	readonly tag: string;

	[key: string]: any;
}

enum CommandType {
	field = 0,
	move = 1,
}
