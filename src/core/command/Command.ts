
interface JCommand {
	readonly type: CommandType;

	/**
	 * 受影響的物件的 tag。
	 *
	 * 考量到 GC 的需求，JCommand 介面並不保留物件的參照。
	 */
	readonly tag: string;
}

//////////////////////////////////////////////////////////////////
/**
 * `Command` 類別是使用者編輯操作的基底類別。
 */
//////////////////////////////////////////////////////////////////

abstract class Command implements JCommand {
	@nonEnumerable protected readonly _design: Design;
	public abstract readonly type: CommandType;
	public readonly tag: string;

	constructor(design: Design, json: Omit<JCommand, 'type'>) {
		this._design = design;
		this.tag = json.tag;
		design.history.queue(this);
	}

	public abstract undo(): void;
	public abstract redo(): void;
}
