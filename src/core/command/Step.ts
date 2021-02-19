
interface JStep {
	commands: JCommand[];
}

class Step implements JStep {

	/** 將 Command 陣列依照簽章排序並且傳回整體簽章 */
	private static signature(commands: Command[]): string {
		commands.sort((a, b) => a.signature.localeCompare(b.signature));
		return commands.map(c => c.signature).join(";");
	}

	constructor(commands: Command[]) {
		this.commands = commands;
		this.signature = Step.signature(commands);
		this.reset();
	}

	public readonly commands: Command[];
	public readonly signature: string;

	/** 已經不允許合併 */
	private _fixed: boolean = false;

	private _timeout: number;

	/** 一秒鐘之後自動鎖定自身 */
	public reset() {
		if(this._timeout) clearTimeout(this._timeout);
		this._timeout = setTimeout(() => this._fixed = true, 1000);
	}

	public tryAdd(commands: Command[]) {
		// 已經操作過的 Step 是無法被合併的
		if(this._fixed) return false;

		// 先確定合併可以執行
		if(Step.signature(commands) != this.signature) return false;
		for(let i = 0; i < commands.length; i++) {
			if(!commands[i].canAddTo(this.commands[i])) return false;
		}

		// 再正式合併
		for(let i = 0; i < commands.length; i++) {
			commands[i].addTo(this.commands[i]);
		}
		this.reset();
		return true;
	}

	public undo() {
		for(let c of this.commands) c.undo();
		this._fixed = true;
	}

	public redo() {
		for(let c of this.commands) c.redo();
		this._fixed = true;
	}
}
