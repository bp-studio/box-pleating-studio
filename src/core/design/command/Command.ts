
interface JCommand {
	readonly type: CommandType;

	/**
	 * 受影響的物件的 tag。
	 *
	 * 考量到 GC 的需求，{@link JCommand} 介面並不保留物件的參照。
	 */
	readonly tag: string;
}

type Typeless<T extends JCommand> = Omit<T, 'type'>;

//////////////////////////////////////////////////////////////////
/**
 * {@link Command} 類別是使用者編輯操作的基底類別。
 */
//////////////////////////////////////////////////////////////////

abstract class Command implements JCommand {

	/** 將一個 {@link JCommand} 還原成 {@link Command} 物件實體 */
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

	public get $signature(): string { return this.type + ":" + this.tag; }

	constructor(design: Design, json: Typeless<JCommand>) {
		this._design = design;
		this.tag = json.tag;
	}

	/** 是否這個 {@link Command} 實際上並沒有改變任何東西、可以被當作沒發生 */
	public abstract get $isVoid(): boolean;

	/** 判斷這個 {@link Command} 是否可以被整合至另外一個給定的 {@link Command} 當中 */
	public abstract $canAddTo(command: Command): boolean;

	/** 將這個 {@link Command} 整合至另外一個給定的 {@link Command} 當中 */
	public abstract $addTo(command: Command): void;

	/** 取消這個 {@link Command} 的效果 */
	public abstract $undo(): void;

	/** 重做這個 {@link Command} 的效果 */
	public abstract $redo(): void;
}
