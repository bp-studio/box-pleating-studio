
// 有一些環境不支援這個類別
const TOUCH_SUPPORT = typeof TouchEvent != 'undefined';

//////////////////////////////////////////////////////////////////
/**
 * `System` 類別負責管理使用者的 UI 操作。
 */
//////////////////////////////////////////////////////////////////

@shrewd class System {

	/** 傳回 `Control` 被選取的優先順位（當 `Control` 重疊於點擊位置時判斷用），數字越小越優先 */
	private static controlPriority(c: Control) {
		if(c instanceof Device || c instanceof Vertex) return 1;
		if(c instanceof Flap || c instanceof Edge) return 2;
		return 3;
	}

	/** 當前所有活躍的 `Control` 陣列，依照優先度排序 */
	@unorderedArray() private get _controls(): Control[] {
		let c = this._studio.design ? this._studio.design.sheet.activeControls.concat() : [];
		c.sort((a, b) => System.controlPriority(a) - System.controlPriority(b));
		this._dragSelectables = c.filter(Control.isDragSelectable);
		if(!c.length) this._ctrl = [null, null]; // GC
		return c;
	}

	/** 當前所有被選取的 `Control` */
	@unorderedArray() public get selections(): Control[] {
		return this._controls.filter(c => c.selected);
	}

	/**
	 * 持續更新 this._draggableSelections 的反應方法。
	 */
	@shrewd public draggableSelections() {
		// 連裡面的選取邏輯也是乖乖照寫；這是還好啦，不會對效能有真正的影響
		this._draggableSelections = this.selections.filter((o): o is Draggable => o instanceof Draggable);
	}

	/**
	 * 當前選取的 `Control` 之中可以被拖曳的子陣列。
	 *
	 * 當然，理論上這個陣列要嘛為空、要嘛就等於全體的 `selections`，
	 * 但是這邊為了型別檢查上的方便，故意把它獨立成一個屬性。
	 *
	 * 這個東西本身不做成反應方法，以避免觸發 glitch。
	 */
	private _draggableSelections: Draggable[];

	private _dragSelectables: DragSelectableControl[];

	private _studio: BPStudio;

	private _dragSelectView: DragSelectView;

	/** 暫存的滑鼠拖曳位置，用來比較以確認是否有新的位移 */
	private _lastKnownCursorLocation: Point;

	/** 目前是否正在進行拖曳 */
	@shrewd public dragging = false;

	/** 捲動開始的起點；null 表示沒有啟用捲動 */
	private _scrollStart: Point | null;

	/** 目前是否呈現移動手勢狀態 */
	private _spaceDown = false;

	/** 兩個數字分別代表「兩點觸控的初始距離」和「初始尺度」 */
	private _touchScaling = [0, 0];

	/** 長壓計時器 */
	private _longPressTimeout: number;

	/** 自從捲動啟用之後是否真的有捲動發生（用來判斷是否攔截掉 context menu） */
	private _scrolled: boolean = false;

	/** 註冊長壓的 callback */
	public onLongPress: () => void;

	/** 註冊拖曳的 callback */
	public onDrag: () => void;

	constructor(studio: BPStudio) {
		this._studio = studio;

		let canvas = studio.$paper.view.element;
		let tool = studio.$paper.tool = new paper.Tool();
		tool.onKeyDown = this._canvasKeydown.bind(this);
		tool.onKeyUp = this._canvasKeyup.bind(this);
		tool.onMouseDown = this._canvasMousedown.bind(this);
		tool.onMouseDrag = this._canvasMouseDrag.bind(this);
		tool.onMouseUp = this._canvasMouseup.bind(this);

		canvas.addEventListener("wheel", this._canvasWheel.bind(this));
		canvas.addEventListener("touchstart", this._canvasTouch.bind(this));

		document.addEventListener("mousemove", this._bodyMousemove.bind(this));
		document.addEventListener("touchmove", this._bodyMousemove.bind(this));
		document.addEventListener("mouseup", this._bodyMouseup.bind(this));
		document.addEventListener("touchend", this._bodyMouseup.bind(this));
		document.addEventListener("contextmenu", this._bodyMenu.bind(this));

		this._dragSelectView = new DragSelectView(studio);
	}

	private _ctrl: [Control | null, Control | null];

	private _possiblyReselect: boolean = false;

	private get _canvas(): HTMLCanvasElement { return this._studio.$paper.view.element; }

	private _processSelection(point: paper.Point, ctrlKey: boolean): void {
		let firstCtrl: Control | null = null;	// 重疊之中的第一個 Control
		let nowCtrl: Control | null = null;		// 重疊之中目前被選取的 Control 中的最後一個
		let nextCtrl: Control | null = null;	// 重疊之中下一個尚未被選取的 Control

		// 找出所有點擊位置中的重疊 Control
		let controls = this._controls.filter(o => o.contains(point));

		// 找出前述的三個關鍵 Control
		for(let o of controls) {
			if(!firstCtrl) firstCtrl = o;
			if(o.selected) nowCtrl = o;
			else if(nowCtrl && !nextCtrl) nextCtrl = o;
		}
		if(!nextCtrl && firstCtrl && !firstCtrl.selected) nextCtrl = firstCtrl;

		if(nowCtrl) {
			let p = System.controlPriority(nowCtrl);
			if(controls.some(c => System.controlPriority(c) < p)) {
				this._possiblyReselect = true;
			}
		}

		// 滑鼠按下時的選取邏輯
		if(!ctrlKey) {
			if(!nowCtrl) this.$clearSelection();
			if(!nowCtrl && nextCtrl) this._select(nextCtrl);
		} else {
			if(nowCtrl && !nextCtrl) nowCtrl.toggle();
			if(nextCtrl) this._select(nextCtrl);
		}

		this._ctrl = [nowCtrl, nextCtrl];

		// 選取完之後必須立刻更新以確保 this._draggableSelections 正確
		this._studio.update();
	}

	private _processNextSelection(): void {
		let [nowCtrl, nextCtrl] = this._ctrl;
		if(this._studio.design && !this._studio.design.dragging) {
			if(nowCtrl && nextCtrl) this.$clearSelection();
			if(nowCtrl && !nextCtrl) this.$clearSelection(nowCtrl);
			if(nextCtrl) this._select(nextCtrl);
		}

		// 選取完之後必須立刻更新以確保 this._draggableSelections 正確
		this._studio.update();
	}

	private _select(c: Control): void {
		if(!c.selected && (this.selections.length == 0 || this.selections[0].selectableWith(c))) {
			c.selected = true;
		}
	}

	public $clearSelection(c: Control | null = null): void {
		this._dragSelectView.visible = false;
		for(let control of this.selections) if(control != c) control.selected = false;
	}

	private _checkEvent(event: MouseEvent | TouchEvent): boolean {
		if(this.isTouch(event) && event.touches.length > 1) return false;
		if(event instanceof MouseEvent && event.button != 0) return false;
		return true;
	}

	private _canvasKeydown(event: paper.KeyEvent): boolean {

		// 如果正在使用輸入框，不處理一切後續
		let active = document.activeElement;
		if(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return true;

		return this.key(event.key);
	}

	public key(key: string) {
		let v = new Vector(0, 0);
		switch(key) {
			case "space":
				if(this._studio.$display.isScrollable()) {
					this._canvas.style.cursor = "grab";
					this._spaceDown = true;
				}
				return false;

			case "delete":
				let s = this.selections[0];
				if(s instanceof Flap) this._studio.design!.deleteFlaps(this.selections as Flap[]);
				if(s instanceof Vertex) this._studio.design!.deleteVertices(this.selections as Vertex[]);
				return false;

			case "up": v.set(0, 1); break;
			case "down": v.set(0, -1); break;
			case "left": v.set(-1, 0); break;
			case "right": v.set(1, 0); break;
			default: return true;
		}

		let sel = this._draggableSelections;

		// 沒有東西被選取則允許捲動 viewport
		if(sel.length == 0) return true;

		// 如果被選中的是 Gadget，必須把移動量放大兩倍才會有效果
		if(sel[0] instanceof Device) v = v.scale(Fraction.TWO);

		for(let o of sel) v = o.dragConstraint(v);
		for(let o of sel) o.drag(v);
		return false;
	}

	private _canvasKeyup() {
		this._canvas.style.cursor = "unset";
		this._spaceDown = false;
	}

	private _canvasMousedown(event: paper.ToolEvent): void {
		// 執行捲動，支援空白鍵捲動和右鍵捲動兩種操作方法
		if(event.event instanceof MouseEvent && (this._spaceDown || event.event.button == 2)) {
			console.log(event.point.round().toString());
			this._setScroll(event.event);
			return;
		}

		let el = document.activeElement;
		if(el instanceof HTMLElement) el.blur();

		if(!this._checkEvent(event.event) || this._scrollStart) return;

		let point = event.point;
		this._processSelection(point, event.modifiers.control || event.modifiers.meta);

		// 設置長壓等待
		if(this.selections.length == 1 && this.isTouch(event.event)) {
			this._longPressTimeout = window.setTimeout(() => {
				this.onLongPress();
			}, 750);
		}

		if(this._draggableSelections.length) {
			// 拖曳初始化
			this._lastKnownCursorLocation = new Point(event.downPoint).round();
			for(let o of this._draggableSelections) o.dragStart(this._lastKnownCursorLocation);
			this.dragging = true;
		}
	}

	private _canvasMouseup(event: paper.ToolEvent): void {
		this._dragSelectView.visible = false;
		if(!this._checkEvent(event.event)) return;
		if(this._scrollStart) {
			// 空白鍵捲動放開的攔截必須寫在這裡，因為事件會被取消掉
			if(event.event instanceof MouseEvent) {
				this._scrollStart = null;
			}
			return;
		}
		if(!event.modifiers.control && !event.modifiers.meta) this._processNextSelection();
	}

	private _reselect(event: paper.ToolEvent) {
		this.$clearSelection();
		this._processSelection(event.point, false);
		this._studio.update();
		for(let o of this._draggableSelections) o.dragStart(this._lastKnownCursorLocation);
		this._possiblyReselect = false;
	}

	/** 處理滑鼠移動 */
	private _canvasMouseDrag(event: paper.ToolEvent) {
		// 捲動中的話就不用在這邊處理了，交給 body 取處理
		if(this._scrollStart) return;

		if(this._possiblyReselect) {
			this._reselect(event);
			this.dragging = true;
		}

		if(this.dragging) {

			// 檢查滑鼠位置是否有發生變化，如果沒有的話後面的就都可不用做了
			let pt = new Point(event.point).round();
			if(this._lastKnownCursorLocation.eq(pt)) return;

			window.clearTimeout(this._longPressTimeout);
			this.onDrag?.apply(null);

			// 更新暫存的位置
			this._lastKnownCursorLocation.set(pt);

			// 請求拖曳中的 Draggable 去檢查並修正位置
			for(let o of this._draggableSelections) pt = o.dragConstraint(pt);

			// 修正完成之後進行真正的拖曳
			for(let o of this._draggableSelections) o.drag(pt);

			// 通知 Design 現在正在進行拖曳
			this._studio.design!.dragging = true;

		} else if(this._dragSelectables.length) {
			if(!this._dragSelectView.visible) {
				// 觸碰的情況中要拖曳至一定距離才開始觸發拖曳選取
				if(this.isTouch(event.event) && event.downPoint.getDistance(event.point) < 1) return;
				this.$clearSelection();
				this._dragSelectView.visible = true;
				this._dragSelectView.down = event.downPoint;
				//this._studio.update();
			}
			this._dragSelectView.now = event.point;
			//this._dragSelectView.draw();
			for(let c of this._dragSelectables) {
				c.selected = this._dragSelectView.contains(new paper.Point(c.dragSelectAnchor));
			}

		}
	}

	private _canvasWheel(event: WheelEvent) {
		if(event.ctrlKey || event.metaKey) {
			event.preventDefault();
			let display = this._studio.$display;
			let d = this._studio.design;
			if(d) {
				if(d.fullscreen) {
					d.sheet.scale = Math.round(display.scale);
					d.fullscreen = false;
				}
				display.zoom(
					d.sheet.scale - Math.round(event.deltaY / 100),
					{ x: event.pageX, y: event.pageY }
				);
			}
		}
	}

	private _canvasTouch(event: TouchEvent) {
		if(event.touches.length > 1) {
			this.$clearSelection();
			this._setScroll(event);
			this._touchScaling = [this.getTouchDistance(event), this._studio.$display.scale];
		}
	}

	private getTouchDistance(event: TouchEvent) {
		let t = event.touches, dx = t[1].screenX - t[0].screenX, dy = t[1].screenY - t[0].screenY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private getTouchCenter(event: TouchEvent): IPoint {
		let t = event.touches;
		return { x: (t[1].pageX + t[0].pageX) / 2, y: (t[1].pageY + t[0].pageY) / 2 };
	}

	private _bodyMousemove(event: MouseEvent | TouchEvent) {
		// 處理捲動；後面的條件考慮到可能放開的時候會有短暫瞬間尚有一點殘留
		if(this._scrollStart && (event instanceof MouseEvent || event.touches.length >= 2)) {
			let e = this.isTouch(event) ? event.touches[0] : event;
			let pt = new Point(e.screenX, e.screenY);
			let diff = pt.sub(this._lastKnownCursorLocation);
			let el = this._studio.$el;

			// 這邊不用考慮範圍問題，瀏覽器會處理掉
			let display = this._studio.$display;
			if(display.isXScrollable) el.scrollLeft = this._scrollStart.x - diff.x;
			if(display.isYScrollable) el.scrollTop = this._scrollStart.y - diff.y;

			if(this.isTouch(event)) {
				let sheet = this._studio.design?.sheet
				if(sheet) {
					// 要一定程度以上的差距才會觸發縮放，以免太容易誤觸
					let raw = this.getTouchDistance(event) - this._touchScaling[0];
					let s = Math.sign(raw) * Math.max(Math.abs(raw) - 40, 0) / 30;

					let auto = display.getAutoScale();
					s = Math.round(s + this._touchScaling[1]);
					if(s <= auto) {
						sheet.scale = Math.ceil(auto);
						sheet.design.fullscreen = true;
					} else {
						display.zoom(Math.ceil(s), this.getTouchCenter(event));
					}
				}
			}
			this._scrolled = true;
		}
	}

	private _setScroll(event: MouseEvent | TouchEvent) {
		let el = this._studio.$el;
		let e = this.isTouch(event) ? event.touches[0] : event;
		window.clearTimeout(this._longPressTimeout);
		this._scrollStart = new Point(el.scrollLeft, el.scrollTop);
		this._scrolled = false;
		this._lastKnownCursorLocation = new Point(e.screenX, e.screenY);
	}

	private _bodyMouseup(event: MouseEvent | TouchEvent) {
		this._dragEnd();
		window.clearTimeout(this._longPressTimeout);
		if(this.isTouch(event) && event.touches.length == 0) {
			// paper.js 的奇怪設計使得多點觸控的第二點放開必須獨立攔截
			this._scrollStart = null;
		}
	}

	private _dragEnd() {
		this.dragging = false;
		if(this._studio.design) this._studio.design.dragging = false;
	}

	private _bodyMenu(event: MouseEvent) {
		// 右鍵捲動的情況中，這個事件會比右鍵放開還要早觸發，
		// 而這個攔截掉也會導致後者不會觸發，所以該做的事情都要在這邊處理
		event.preventDefault();
		this._scrollStart = null;
	}

	private isTouch(event: Event): event is TouchEvent {
		return TOUCH_SUPPORT && event instanceof TouchEvent;
	}
}
