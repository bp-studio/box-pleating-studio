
interface JHistory {

	/** 現在所在的位置 */
	index: number;

	/** 自從上次存檔以來是否有修改過 */
	modified: boolean;

	/** 所有的歷史記錄 */
	steps: JStep[];
}

@shrewd class HistoryManager extends Disposable implements ISerializable<JHistory> {

	private readonly design: Design;
	@shrewd private readonly steps: Step[] = [];
	@shrewd private index: number = 0;

	private _queue: Command[] = [];

	/** 是否正在移動歷史 */
	private _moving: boolean = false;

	private _savedIndex: number = 0;

	constructor(design: Design, json?: JHistory) {
		super(design);
		this.design = design;
	}

	public toJSON(): JHistory {
		return {
			index: this.index,
			modified: this.modified,
			steps: this.steps
		}
	}

	public queue(command: Command) {
		for(let q of this._queue) {
			if(command.canAddTo(q)) return command.addTo(q);
		}
		this._queue.push(command);
	}

	public flush(): void {
		if(this._queue.length) {
			let s = this.lastStep;
			if(!s  || !s.tryAdd(this._queue)) {
				this.addStep(new Step(this._queue));
			}
			this._queue = [];
		}
	}

	public get modified(): boolean {
		return this._savedIndex != this.index;
	}

	public notifySave() {
		this._savedIndex = this.index;
	}

	private addStep(step: Step) {
		// 移除所有後面的 Step
		if(this.steps.length > this.index) this.steps.length = this.index;
		this.steps[this.index++] = step;
	}

	private get lastStep() {
		if(this.index == 0 || this.index < this.steps.length) return undefined;
		return this.steps[this.index - 1];
	}

	public fieldChange(target: ITagObject, prop: string, oldValue: any, newValue: any) {
		if(this._moving) return;
		FieldCommand.create(target, prop, oldValue, newValue);
	}

	@shrewd public get canUndo() {
		return this.index > 0;
	}

	@shrewd public get canRedo() {
		return this.index < this.steps.length;
	};

	public undo() {
		if(this.canUndo) {
			this._moving = true;
			this.steps[--this.index].undo();
			this._moving = false;
		}
	}

	public redo() {
		if(this.canRedo) {
			this._moving = true;
			this.steps[this.index++].redo();
			this._moving = false;
		}
	}
}
