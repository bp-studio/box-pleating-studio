
interface JCommand {
	readonly type: CommandType;

	/**
	 * 受影響的物件的 tag。
	 *
	 * 考量到 GC 的需求，JCommand 介面並不保留物件的參照。
	 */
	readonly tag: string;
}

type Typeless<T extends JCommand> = Omit<T, 'type'>;

//////////////////////////////////////////////////////////////////
/**
 * `Command` 類別是使用者編輯操作的基底類別。
 */
//////////////////////////////////////////////////////////////////

abstract class Command implements JCommand {

	public static $restore(design: Design, c: JCommand): Command {
		if(c.type == CommandType.field) return new FieldCommand(design, c as JFieldCommand);
		if(c.type == CommandType.move) return new MoveCommand(design, c as JMoveCommand);
		if(c.type == CommandType.add || c.type == CommandType.remove) {
			return new EditCommand(design, c as JEditCommand);
		}
		throw new Error();
	}

	@nonEnumerable protected readonly _design: Design;

	/** @exports */
	public abstract readonly type: CommandType;

	/** @exports */
	public readonly tag: string;

	public get $signature() { return this.type + ":" + this.tag; }

	constructor(design: Design, json: Typeless<JCommand>) {
		this._design = design;
		this.tag = json.tag;
	}

	public abstract $canAddTo(command: Command): boolean;
	public abstract $addTo(command: Command): void;
	public abstract get $isVoid(): boolean;
	public abstract $undo(): void;
	public abstract $redo(): void;
}
