
interface JHistory {

	/** 現在所在的位置 */
	index: number;

	/** 自從上次存檔以來是否有修改過 */
	modified: boolean;

	/** 所有的歷史記錄 */
	actions: JAction[];
}

interface JAction {

}

class HistoryManager {

	private design: DesignBase;

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

	public takeAction(action: () => void) {
		// TODO: 以後這邊要改成歷史機制
		this._modified = true;
		action();
	}

	public fieldChange(obj: any, prop: string, oldValue: any, newValue: any) {
		// TODO: 以後這邊要改成歷史機制
		this._modified = true;
	}
}
