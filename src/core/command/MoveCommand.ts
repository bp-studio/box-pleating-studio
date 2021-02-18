
interface JMoveCommand extends JCommand {
	readonly old: IPoint;
	readonly new: IPoint;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者對於某個欄位值進行修改的操作。
 */
//////////////////////////////////////////////////////////////////

class MoveCommand extends Command implements JMoveCommand {

	public static create(target: Draggable, loc: IPoint) {
		new MoveCommand(target.design, {
			tag: target.tag,
			old: clone(target.location),
			new: loc
		});
		MoveCommand.assign(target.location, loc);
	}

	private static assign(target: IPoint, value: IPoint) {
		target.x = value.x;
		target.y = value.y;
	}

	public readonly type = CommandType.move;
	public readonly tag: string;
	public old: IPoint;
	public new: IPoint;

	constructor(design: Design, json: Omit<JMoveCommand, 'type'>) {
		super(design, json);
		this.old = json.old;
		this.new = json.new;
	}

	public undo() {
		let target = this._design.find(this.tag)!;
		MoveCommand.assign(target['location'], this.old);
	}

	public redo() {
		let target = this._design.find(this.tag)!;
		MoveCommand.assign(target['location'], this.new);
	}
}
