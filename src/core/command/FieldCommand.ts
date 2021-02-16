
interface JFieldCommand extends JCommand {
	readonly prop: string;
	readonly old: any;
	readonly new: any;
}

class FieldCommand implements ICommand, JFieldCommand {

	@nonEnumerable private readonly _design: Design;
	public readonly type = CommandType.field;
	public readonly tag: string;
	public readonly prop: string;
	public old: any;
	public new: any;

	constructor(design: Design, json: Omit<JFieldCommand, 'type'>) {
		this._design = design;
		this.tag = json.tag;
		this.prop = json.prop;
		this.old = json.old;
		this.new = json.new;
	}

	public tryAddTo(step: Step): boolean {
		let c: any;
		if(
			(c = step.commands[0]) instanceof FieldCommand
			&& c.tag == this.tag
			&& c.prop == this.prop
			&& c.new == this.old
		) {
			c.new = this.new;
			return true;
		} else return false;
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
