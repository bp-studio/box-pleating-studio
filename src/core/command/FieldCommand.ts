
interface JFieldCommand extends JCommand {
	target: string;
	prop: string;
	old: any;
	new: any;
}

class FieldCommand implements ICommand, ISerializable<JFieldCommand> {

	private _target: ITagObject;
	private _prop: string;
	private _old: any;
	private _new: any;

	constructor(json: JFieldCommand, design: Design);
	constructor(target: ITagObject, prop: string, value: any);
	constructor(...p: [JFieldCommand, Design] | [ITagObject, string, any]) {
		if(p.length == 2) {
			this._target = p[1].find(p[0].target)!;
			this._prop = p[0].prop;
			this._old = p[0].old;
			this._new = p[0].new;
		} else {
			this._target = p[0];
			this._prop = p[1];
			this._old = p[0][p[1]];
			this._new = p[2];
		}
	}

	public toJSON(): JFieldCommand {
		return {
			type: CommandType.field,
			target: this._target.tag,
			prop: this._prop,
			old: this._old,
			"new": this._new
		};
	}

	public undo() {
		this._target[this._prop] = this._old;
	}

	public redo() {
		this._target[this._prop] = this._new;
	}
}
