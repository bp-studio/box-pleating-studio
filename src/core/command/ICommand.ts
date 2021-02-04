
interface ITagObject {

	/** 用來唯一識別這個物件的字串 */
	readonly tag: string;

	[key: string]: any;
}

interface ICommand extends ISerializable<JCommand> {
	undo(): void;
	redo(): void;
	tryAddTo(step: Step): boolean;
}

interface JCommand {
	type: CommandType;
}

enum CommandType {
	field = 0,
	move = 1,
}
