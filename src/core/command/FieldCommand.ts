
interface JFieldCommand extends JCommand {
	readonly prop: string;
	readonly old: any;
	readonly new: any;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者對於某個欄位值進行修改的操作。
 */
//////////////////////////////////////////////////////////////////

class FieldCommand extends Command implements JFieldCommand {

	public static create(target: ITagObject, prop: string, oldValue: any, newValue: any) {
		new FieldCommand(target.design, {
			tag: target.tag,
			prop,
			old: oldValue,
			new: newValue
		});
	}

	public readonly type = CommandType.field;
	public readonly prop: string;
	public old: any;
	public new: any;

	constructor(design: Design, json: Omit<JFieldCommand, 'type'>) {
		super(design, json);
		this.prop = json.prop;
		this.old = json.old;
		this.new = json.new;
	}

	public undo() {
		let target = this._design.find(this.tag)!;
		target[this.prop] = this.old;
	}

	public redo() {
		let target = this._design.find(this.tag)!;
		target[this.prop] = this.new;
	}
}
