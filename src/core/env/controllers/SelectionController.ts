
//////////////////////////////////////////////////////////////////
/**
 * `SelectionController` 類別負責管理元件的選取。
 */
//////////////////////////////////////////////////////////////////

@shrewd class SelectionController {

	/** 傳回 `Control` 被選取的優先順位（當 `Control` 重疊於點擊位置時判斷用），數字越小越優先 */
	private static _controlPriority(c: Control): number {
		if(c instanceof Device || c instanceof Vertex) return 1;
		if(c instanceof Flap || c instanceof Edge) return 2;
		return 3;
	}

	/**
	 * 當前選取的 `Control` 之中可以被拖曳的子陣列。
	 *
	 * 當然，理論上這個陣列要嘛為空、要嘛就等於全體的 `selections`，
	 * 但是這邊為了型別檢查上的方便，故意把它獨立成一個屬性。
	 *
	 * 這個東西本身不做成反應方法，以避免觸發 glitch。
	 */
	public $draggable: Draggable[];

	public $dragSelectables: DragSelectableControl[];

	private _studio: Studio;

	private _view: DragSelectView;

	private _cache: [Control | null, Control | null];

	private _possiblyReselect: boolean = false;

	constructor(studio: Studio) {
		this._studio = studio;
		this._view = new DragSelectView(studio);
	}

	/** 當前所有被選取的 `Control` */
	@unorderedArray() public get $items(): Control[] {
		return this._controls.filter(c => c.$selected);
	}

	public $compare(event: paper.ToolEvent) {
		let oldSel = this.$draggable.concat();
		this.$process(event);
		let newSel = this.$draggable.concat();
		return Shrewd.comparer.unorderedArray(oldSel, newSel);
	}

	public $process(event: paper.ToolEvent, ctrlKey?: boolean): void {
		let point = event.point;
		ctrlKey ??= event.modifiers.control || event.modifiers.meta;

		let firstCtrl: Control | null = null;	// 重疊之中的第一個 Control
		let nowCtrl: Control | null = null;		// 重疊之中目前被選取的 Control 中的最後一個
		let nextCtrl: Control | null = null;	// 重疊之中下一個尚未被選取的 Control

		// 找出所有點擊位置中的重疊 Control
		let controls = this._controls.filter(o => o.$contains(point));

		// 找出前述的三個關鍵 Control
		for(let o of controls) {
			if(!firstCtrl) firstCtrl = o;
			if(o.$selected) nowCtrl = o;
			else if(nowCtrl && !nextCtrl) nextCtrl = o;
		}
		if(!nextCtrl && firstCtrl && !firstCtrl.$selected) nextCtrl = firstCtrl;

		if(nowCtrl) {
			let p = SelectionController._controlPriority(nowCtrl);
			if(controls.some(c => SelectionController._controlPriority(c) < p)) {
				this._possiblyReselect = true;
			}
		}

		// 滑鼠按下時的選取邏輯
		if(!ctrlKey) {
			if(!nowCtrl) this.$clear();
			if(!nowCtrl && nextCtrl) this._select(nextCtrl);
		} else {
			if(nowCtrl && !nextCtrl) nowCtrl.$toggle();
			if(nextCtrl) this._select(nextCtrl);
		}

		this._cache = [nowCtrl, nextCtrl];

		this.$hasDraggable();
	}

	public $processNext(): void {
		let [nowCtrl, nextCtrl] = this._cache;
		if(this._studio.$design && !this._studio.$design.$dragging) {
			if(nowCtrl && nextCtrl) this.$clear();
			if(nowCtrl && !nextCtrl) this.$clear(nowCtrl);
			if(nextCtrl) this._select(nextCtrl);
		}

		this.$hasDraggable();
	}

	private _select(c: Control): void {
		if(!c.$selected && (this.$items.length == 0 || this.$items[0].$selectableWith(c))) {
			c.$selected = true;
		}
	}

	public $clear(c: Control | null = null): void {
		this._view.$visible = false;
		for(let control of this.$items) if(control != c) control.$selected = false;
	}

	public $processDragSelect(event: paper.ToolEvent) {
		if(!this._view.$visible) {
			// 觸碰的情況中要拖曳至一定距離才開始觸發拖曳選取
			if(System.$isTouch(event.event) && event.downPoint.getDistance(event.point) < 1) return;
			this.$clear();
			this._view.$visible = true;
			this._view.$down = event.downPoint;
		}

		this._view.$now = event.point;
		for(let c of this.$dragSelectables) {
			c.$selected = this._view.$contains(new paper.Point(c.$dragSelectAnchor));
		}
	}

	/** 終止並且傳回是否正在進行拖曳選取 */
	public $endDrag(): boolean {
		let result = this._view.$visible;
		this._view.$visible = false;
		return result;
	}

	public $tryReselect(event: paper.ToolEvent): boolean {
		if(!this._possiblyReselect) return false;

		this.$clear();
		this.$process(event, false);
		this.$hasDraggable();
		for(let o of this.$draggable) o.$dragStart();
		this._possiblyReselect = false;
		return true;
	}

	/** 當前所有活躍的 `Control` 陣列，依照優先度排序 */
	@unorderedArray() private get _controls(): Control[] {
		let c = this._studio.$design ? this._studio.$design.sheet.$activeControls.concat() : [];
		c.sort((a, b) =>
			SelectionController._controlPriority(a) - SelectionController._controlPriority(b)
		);
		this.$dragSelectables = c.filter(Control.$isDragSelectable);
		if(!c.length) this._cache = [null, null]; // GC
		return c;
	}

	/**
	 * 持續更新 this.$draggable 的反應方法，並傳回是否裡面非空。
	 *
	 * 這個方法也會在一些場合中被單獨呼叫以便立即更新。
	 */
	@shrewd public $hasDraggable() {
		// 連裡面的選取邏輯也是乖乖照寫；這是還好啦，不會對效能有真正的影響
		this.$draggable = this.$items.filter((o): o is Draggable => o instanceof Draggable);
		return this.$draggable.length > 0;
	}
}
