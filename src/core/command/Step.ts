
interface JStep<T extends JCommand = JCommand> {
	commands: readonly T[];
	construct?: any[];
	destruct?: any[];
	mode: string;
	before: string[];
	after: string[];
}

class Step implements ISerializable<JStep> {

	public static restore(design: Design, json: JStep): Step {
		json.commands = json.commands.map(c => Command.restore(design, c));
		return new Step(design, json as JStep<Command>);
	}

	/** 將 Command 陣列依照簽章排序並且傳回整體簽章 */
	private static signature(commands: readonly Command[]): string {
		let arr = commands.concat();
		arr.sort((a, b) => a.signature.localeCompare(b.signature));
		return arr.map(c => c.signature).join(";");
	}

	constructor(design: Design, json: JStep<Command>) {
		this._design = design;
		this._signature = Step.signature(json.commands);

		this.commands = json.commands;
		this.construct = json.construct ?? [];
		this.destruct = json.destruct ?? [];
		this.before = json.before;
		this.after = json.after;
		this.mode = json.mode;

		this._reset();
	}

	public readonly commands: readonly Command[];
	public readonly construct: Memento[];
	public readonly destruct: Memento[];
	public readonly mode: string;
	public readonly before: string[];
	public readonly after: string[];

	@nonEnumerable private readonly _design: Design;
	@nonEnumerable private readonly _signature: string;

	/** 已經不允許合併 */
	@nonEnumerable private _fixed: boolean = false;

	@nonEnumerable private _timeout: number;

	/** 重置自動鎖定 */
	private _reset() {
		if(this._timeout) clearTimeout(this._timeout);
		if(!this._fixed) this._timeout = setTimeout(() => this._fix(), 1000);
	}

	/** 自動鎖定自身 */
	private _fix() {
		if(this._design.dragging) this._reset(); // 還在拖曳中的話先不鎖定
		else this._fixed = true;
	}

	public tryAdd(commands: readonly Command[], construct: Memento[], destruct: Memento[]) {
		// 已經操作過的 Step 是無法被合併的
		if(this._fixed) return false;

		// 先確定合併可以執行
		// TODO：這邊要加入考慮到建構解構的 Command
		if(Step.signature(commands) != this._signature) return false;
		for(let i = 0; i < commands.length; i++) {
			if(!commands[i].canAddTo(this.commands[i])) return false;
		}

		// 再正式合併
		for(let i = 0; i < commands.length; i++) {
			commands[i].addTo(this.commands[i]);
		}
		this.construct.push(...construct);
		this.destruct.push(...destruct);
		this._reset();
		return true;
	}

	/** 這整個 `Step` 是否等於什麼都沒做 */
	public get isVoid(): boolean {
		return this.commands.every(c => c.isVoid);
	}

	public undo() {
		// undo 的時候以相反順序執行
		let com = this.commands.concat().reverse();
		for(let c of com) c.undo();
		let des = this.destruct.concat().reverse();
		for(let memento of des) this._design.options.set(...memento);
		this._design.mode = this.mode;
		this._design.restoreSelection(this.before);
		this._fixed = true;
	}

	public redo() {
		for(let c of this.commands) c.redo();
		for(let memento of this.construct) this._design.options.set(...memento);
		this._design.mode = this.mode;
		this._design.restoreSelection(this.after);
		this._fixed = true;
	}

	public toJSON(): JStep {
		let result = clone<JStep>(this);
		if(!this.construct.length) delete result.construct;
		if(!this.destruct.length) delete result.destruct;
		return result;
	}
}
