
interface JStep {
	commands: JCommand[];
	construct?: any[];
	destruct?: any[];
}

class Step implements ISerializable<JStep> {

	/** 將 Command 陣列依照簽章排序並且傳回整體簽章 */
	private static signature(commands: Command[]): string {
		commands.sort((a, b) => a.signature.localeCompare(b.signature));
		return commands.map(c => c.signature).join(";");
	}

	constructor(commands: Command[], construct: any[], destruct: any[]) {
		this.commands = commands;
		this.signature = Step.signature(commands);
		this.construct = construct;
		this.destruct = destruct;
		this.reset();
	}

	public readonly commands: Command[];
	public readonly construct: Memento[];
	public readonly destruct: Memento[];

	@nonEnumerable public readonly signature: string;

	/** 已經不允許合併 */
	@nonEnumerable private _fixed: boolean = false;

	@nonEnumerable private _timeout: number;

	/** 一秒鐘之後自動鎖定自身 */
	public reset() {
		if(this._timeout) clearTimeout(this._timeout);
		this._timeout = setTimeout(() => this._fixed = true, 1000);
	}

	public tryAdd(commands: Command[], construct: Memento[], destruct: Memento[]) {
		// 已經操作過的 Step 是無法被合併的
		if(this._fixed) return false;

		// 先確定合併可以執行
		// TODO：這邊要加入考慮到建構解構的 Command
		if(Step.signature(commands) != this.signature) return false;
		for(let i = 0; i < commands.length; i++) {
			if(!commands[i].canAddTo(this.commands[i])) return false;
		}

		// 再正式合併
		for(let i = 0; i < commands.length; i++) {
			commands[i].addTo(this.commands[i]);
		}
		this.construct.push(...construct);
		this.destruct.push(...destruct);
		this.reset();
		return true;
	}

	public undo(design: Design) {
		for(let c of this.commands) c.undo();
		for(let memento of this.destruct) design.options.set(...memento);
		this._fixed = true;
	}

	public redo(design: Design) {
		for(let c of this.commands) c.redo();
		for(let memento of this.construct) design.options.set(...memento);
		this._fixed = true;
	}

	public toJSON(): JStep {
		let result = clone<JStep>(this);
		if(!this.construct.length) delete result.construct;
		if(!this.destruct.length) delete result.destruct;
		return result;
	}
}