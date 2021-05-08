
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

	public static $create(target: Draggable, loc: IPoint, relative: boolean = true) {
		if(relative) {
			loc.x += target.$location.x;
			loc.y += target.$location.y;
		}
		let command = new MoveCommand(target.$design, {
			tag: target.$tag,
			old: clone(target.$location),
			new: loc,
		});
		MoveCommand.$assign(target.$location, loc);
		target.$design.$history.$queue(command);
	}

	public static $assign(target: IPoint, value: IPoint) {
		target.x = value.x;
		target.y = value.y;
	}

	/** @exports */
	public readonly type = CommandType.move;

	/** @exports */
	public old: IPoint;

	/** @exports */
	public new: IPoint;

	constructor(design: Design, json: Typeless<JMoveCommand>) {
		super(design, json);
		this.old = json.old;
		this.new = json.new;
	}

	public $canAddTo(command: Command): boolean {
		return command instanceof MoveCommand && command.tag == this.tag &&
			command.new.x == this.old.x && command.new.y == this.old.y;
	}

	public $addTo(command: Command) {
		MoveCommand.$assign((command as MoveCommand).new, this.new);
	}

	public get $isVoid(): boolean {
		return this.old.x == this.new.x && this.old.y == this.new.y;
	}

	public $undo() {
		let obj = this._design.$query(this.tag)!;
		if(obj instanceof Draggable) MoveCommand.$assign(obj.$location, this.old);
		else debugger;
	}

	public $redo() {
		let obj = this._design.$query(this.tag)!;
		if(obj instanceof Draggable) MoveCommand.$assign(obj.$location, this.new);
		else debugger;
	}
}
