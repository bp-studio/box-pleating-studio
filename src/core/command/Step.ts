
interface JStep {
	commands: JCommand[];
}

class Step implements JStep {

	constructor(commands: Command[]) {
		this.commands = commands;
	}

	public readonly commands: Command[];

	public tryAdd(commands: Command[]) {
		return false;
	}

	public undo() {
		for(let c of this.commands) c.undo();
	}

	public redo() {
		for(let c of this.commands) c.redo();
	}
}
