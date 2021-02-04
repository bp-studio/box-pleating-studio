
interface JFieldCommand extends JCommand {
	target: string;
	prop: string;
	old: any;
	new: any;
}

class FieldCommand implements ICommand {

	public readonly target: ITagObject;
	public prop: string;
	public old: any;
	public new: any;

	constructor(json: JFieldCommand, design: Design);
	constructor(target: ITagObject, prop: string, value: any);
	constructor(...p: [JFieldCommand, Design] | [ITagObject, string, any]) {
		if(p.length == 2) {
			this.target = p[1].find(p[0].target)!;
			this.prop = p[0].prop;
			this.old = p[0].old;
			this.new = p[0].new;
		} else {
			this.target = p[0];
			this.prop = p[1];
			this.old = p[0][p[1]];
			this.new = p[2];
		}
	}

	public tryAddTo(step: Step): boolean {
		let c: any;
		if((c = step.commands[0]) instanceof FieldCommand && c.target == this.target && c.prop == this.prop) {
			if(c.new != this.old) debugger;
			c.new = this.new;
			return true;
		} else return false;
	}

	public toJSON(): JFieldCommand {
		return {
			type: CommandType.field,
			target: this.target.tag,
			prop: this.prop,
			old: this.old,
			new: this.new
		};
	}

	public undo() {
		this.target[this.prop] = this.old;
	}

	public redo() {
		this.target[this.prop] = this.new;
	}
}
