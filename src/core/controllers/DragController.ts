
@shrewd class DragController {

	private _studio: BPStudio;

	/** 目前是否正在進行拖曳 */
	@shrewd public on = false;

	constructor(studio: BPStudio) {
		this._studio = studio;

		document.addEventListener("mouseup", this._dragEnd.bind(this));
		document.addEventListener("touchend", this._dragEnd.bind(this));
	}

	private get draggable() {
		return this._studio.system.selection.draggable;
	}

	@exported public processKey(key: string) {
		let v = new Vector(0, 0);
		switch(key) {
			case "up": v.set(0, 1); break;
			case "down": v.set(0, -1); break;
			case "left": v.set(-1, 0); break;
			case "right": v.set(1, 0); break;
			default: return true;
		}

		// 沒有東西被選取則允許捲動 viewport
		let selections = this.draggable;
		if(selections.length == 0) return true;

		// 如果被選中的是 Gadget，必須把移動量放大兩倍才會有效果
		if(selections[0] instanceof Device) v = v.scale(Fraction.TWO);

		for(let o of selections) v = o.dragConstraint(v);
		for(let o of selections) o.drag(v);
		return false;
	}

	/** 點擊時進行拖曳初始化 */
	public init(event: paper.ToolEvent): void {
		let selections = this.draggable;
		if(selections.length) {
			CursorController.update(new Point(event.downPoint).round());
			for(let o of selections) o.dragStart();
			this.on = true;
		}
	}

	/** 處理拖曳並且傳回是否真的有拖曳發生 */
	public process(event: paper.ToolEvent): boolean {
		// 檢查滑鼠位置是否有發生變化
		let pt = new Point(event.point).round();
		if(!CursorController.update(pt)) return false;

		// 請求拖曳中的 Draggable 去檢查並修正位置
		for(let o of this.draggable) pt = o.dragConstraint(pt);

		// 修正完成之後進行真正的拖曳
		for(let o of this.draggable) o.drag(pt);

		// 通知 Design 現在正在進行拖曳
		this._studio.design!.dragging = true;

		return true;
	}

	/** 結束拖曳 */
	private _dragEnd() {
		this.on = false;
		if(this._studio.design) this._studio.design.dragging = false;
	}
}