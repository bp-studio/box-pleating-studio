
interface JStep {
	commands: JCommand[];
}

class Step implements ISerializable<JStep> {

	constructor(...commands: ICommand[]) {
		this.commands = commands;
	}

	public readonly commands: ICommand[];

	public toJSON(): JStep {
		return { commands: this.commands.map(c => c.toJSON()) };
	}

	public undo() {
		for(let c of this.commands) c.undo();
	}

	public redo() {
		for(let c of this.commands) c.redo();
	}
}
