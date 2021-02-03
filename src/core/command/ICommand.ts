
interface ITagObject {

	/** 用來唯一識別這個物件的字串 */
	readonly tag: string;

	[key: string]: any;
}

interface ICommand {
	undo(): void;
	redo(): void;
}

enum CommandType {
	field = 0,
	move = 1,
}
