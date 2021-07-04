
// 有一些環境不支援這個類別
const TOUCH_SUPPORT = typeof TouchEvent != 'undefined';

//////////////////////////////////////////////////////////////////
/**
 * {@link System} 類別負責管理使用者的 UI 操作。
 */
//////////////////////////////////////////////////////////////////

class System {

	private _studio: Studio;

	public readonly $selection: SelectionController;
	public readonly $drag: DragController;
	public readonly $scroll: ScrollController;
	public readonly $zoom: ZoomController;
	private readonly _longPress: LongPressController;

	constructor(studio: Studio) {
		this._studio = studio;

		let canvas = studio.$paper.view.element;
		let tool = studio.$paper.tool = new paper.Tool();
		tool.onKeyDown = this._canvasKeydown.bind(this);
		tool.onKeyUp = this._canvasKeyup.bind(this);
		tool.onMouseDown = this._canvasPointerDown.bind(this);
		tool.onMouseDrag = this._canvasMouseDrag.bind(this);
		tool.onMouseUp = this._canvasMouseup.bind(this);

		canvas.addEventListener("touchstart", this._canvasTouch.bind(this));

		this._longPress = new LongPressController(() => this._studio.$option.onLongPress?.());
		this.$zoom = new ZoomController(studio, canvas);
		this.$scroll = new ScrollController(studio);
		this.$selection = new SelectionController(studio);
		this.$drag = new DragController(studio);
		KeyboardController.$init();
	}

	private get _canvas(): HTMLCanvasElement { return this._studio.$paper.view.element; }

	private _canvasKeydown(event: paper.KeyEvent): boolean {
		if(event.key == "space") {
			if(this._studio.$display.$isScrollable()) {
				this._canvas.style.cursor = "grab";
			}
			return false;
		}

		let design = this._studio.$design;
		if(design && event.key == "delete") {
			let items = this.$selection.$items;
			let first = items[0];
			if(isTypedArray(items, Flap)) design.$flaps.$delete(items);
			if(isTypedArray(items, Vertex)) design.$vertices.$delete(items);
			if(first instanceof River) first.$delete();
			return false;
		}

		return this.$drag.$processKey(event.key);
	}

	private _canvasKeyup(): void {
		this._canvas.style.cursor = "unset";
	}

	private _canvasPointerDown(event: paper.ToolEvent): void {
		let ev = event.event;

		let el = document.activeElement;
		if(el instanceof HTMLElement) el.blur();

		// 執行捲動，支援空白鍵捲動和右鍵捲動兩種操作方法
		let space = KeyboardController.$isPressed("space");
		if(event.event instanceof MouseEvent && (space || event.event.button == 2)) {
			console.log(event.point.round().toString());
			this._longPress.$cancel();
			this.$scroll.$init();
			CursorController.$tryUpdate(event.event);
			return;
		}

		if(!System._isSelectEvent(ev) || this.$scroll.on) return;

		if(System.$isTouch(ev)) this._canvasTouchDown(event);
		else this._canvasMouseDown(event);
	}

	private _canvasTouchDown(event: paper.ToolEvent): void {
		let ok = this.$selection.$compare(event);

		// 設置長壓等待
		if(this.$selection.$items.length == 1) this._longPress.$init();

		// 觸控的情況中，規定一定要先選取才能拖曳，不能直接拖（不然太容易誤觸）
		if(ok) this.$drag.$init(event);
	}

	private _canvasMouseDown(event: paper.ToolEvent): void {
		this.$selection.$process(event);

		// 滑鼠操作時可以直接點擊拖曳
		this.$drag.$init(event);
	}

	private _canvasMouseup(event: paper.ToolEvent): void {
		let dragging = this.$selection.$endDrag();
		if(!System._isSelectEvent(event.event)) return;
		if(this.$scroll.$tryEnd(event)) return;
		if(!dragging && !event.modifiers.control && !event.modifiers.meta) {
			this.$selection.$processNext();
		}
	}

	/** 處理滑鼠移動 */
	private _canvasMouseDrag(event: paper.ToolEvent): void {
		// 捲動中的話就不用在這邊處理了，交給 body 上註冊的 handler 去處理
		if(this.$scroll.on) return;

		if(this.$selection.$tryReselect(event)) {
			this.$drag.$on = true;
		}

		if(this.$drag.$on) {
			if(this.$drag.$process(event)) {
				this._longPress.$cancel();
				this._studio.$option.onDrag?.();
			}
		} else if(this.$selection.$dragSelectables.length) {
			this._longPress.$cancel();
			this.$selection.$processDragSelect(event);
			this._studio.$option.onDrag?.();
		}
	}

	private _canvasTouch(event: TouchEvent): void {
		if(event.touches.length > 1 && !this.$scroll.on && this._studio.$design) {
			this.$selection.$clear();
			this._longPress.$cancel();
			this.$scroll.$init();
			this.$zoom.$init(event);
			CursorController.$tryUpdate(event);
		}
	}

	/** 檢查事件是否符合「選取」的前提（單點觸控或者滑鼠左鍵操作） */
	private static _isSelectEvent(event: MouseEvent | TouchEvent): boolean {
		if(System.$isTouch(event) && event.touches.length > 1) return false;
		if(event instanceof MouseEvent && event.button != 0) return false;
		return true;
	}

	public static $isTouch(event: Event): event is TouchEvent {
		return TOUCH_SUPPORT && event instanceof TouchEvent;
	}

	public static $getEventCenter(event: MouseEvent | TouchEvent): IPoint {
		if(System.$isTouch(event)) {
			let t = event.touches;
			return { x: (t[1].pageX + t[0].pageX) / 2, y: (t[1].pageY + t[0].pageY) / 2 };
		} else {
			return { x: event.pageX, y: event.pageY };
		}
	}
}
