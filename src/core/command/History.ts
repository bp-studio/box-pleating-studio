
interface JHistory {

	/** 現在所在的位置 */
	index: number;

	/** 自從上次存檔以來是否有修改過 */
	modified: boolean;

	/** 所有的歷史記錄 */
	steps: JStep[];
}

@shrewd class HistoryManager {

	private readonly design: DesignBase;
	@shrewd private readonly steps: Step[] = [];
	@shrewd private index: number = 0;

	/** 是否正在移動歷史 */
	private _moving: boolean = false;

	private _modified: boolean = false;

	constructor(design: DesignBase) {
		this.design = design;
	}

	public get modified(): boolean {
		// TODO: 以後這邊要根據歷史移動來決定
		return this._modified;
	}

	public notifySave() {
		this._modified = false;
	}

	public takeAction(action: Action) {
		// TODO: 以後這邊要改成歷史機制
		this._modified = true;
		action();
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

	public fieldChange(target: any, prop: string, oldValue: any, newValue: any) {
		if(this._moving) return;
		let c = new FieldCommand(target, prop, newValue), s = this.lastStep;
		if(!s || !c.tryAddTo(s)) this.addStep(new Step(c));
		this._modified = true;
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
