
interface ITagObject extends IDesignObject {

	/** 用來唯一識別這個物件的字串 */
	readonly tag: string;

	[key: string]: any;
}

interface ICommand extends JCommand {
	undo(): void;
	redo(): void;
	tryAddTo(step: Step): boolean;
}

interface JCommand {
	readonly type: CommandType;

	/**
	 * 受影響的物件的 tag。
	 *
	 * 考量到 GC 的需求，JCommand 介面並不保留物件的參照。
	 */
	readonly tag: string;
}

enum CommandType {
	field = 0,
	move = 1,
}
