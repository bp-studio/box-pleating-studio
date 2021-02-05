
interface JStep {
	commands: JCommand[];
}

class Step implements JStep {

	constructor(...commands: ICommand[]) {
		this.commands = commands;
	}

	public readonly commands: ICommand[];

	public undo() {
		for(let c of this.commands) c.undo();
	}

	public redo() {
		for(let c of this.commands) c.redo();
	}
}
