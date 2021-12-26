import * as CT from "./controllers";
import type { Studio } from "./Studio";

//////////////////////////////////////////////////////////////////
/**
 * {@link System} 類別負責管理使用者的 UI 操作。
 */
//////////////////////////////////////////////////////////////////

export class System {

	private _studio: Studio;

	public readonly $selection: CT.SelectionController;
	public readonly $drag: CT.DragController;
	public readonly $scroll: CT.ScrollController;
	public readonly $zoom: CT.ZoomController;
	private readonly _longPress: CT.LongPressController;

	constructor(studio: Studio) {
		this._studio = studio;

		let canvas = studio.$display.$paper.view.element;
		let tool = studio.$display.$paper.tool = new paper.Tool();
		tool.onKeyDown = this._canvasKeydown.bind(this);
		tool.onKeyUp = this._canvasKeyup.bind(this);
		tool.onMouseDown = this._canvasPointerDown.bind(this);
		tool.onMouseDrag = this._canvasMouseDrag.bind(this);
		tool.onMouseUp = this._canvasMouseup.bind(this);

		canvas.addEventListener("touchstart", this._canvasTouch.bind(this), { passive: true });

		this._longPress = new CT.LongPressController(() => this._studio.$option.onLongPress?.());
		this.$zoom = new CT.ZoomController(studio, canvas);
		this.$scroll = new CT.ScrollController(studio);
		this.$selection = new CT.SelectionController(studio);
		this.$drag = new CT.DragController(studio);
		CT.KeyboardController.$init();
	}

	private get _canvas(): HTMLCanvasElement { return this._studio.$display.$paper.view.element; }

	private _canvasKeydown(event: paper.KeyEvent): boolean {
		if(event.key == "space") {
			if(this._studio.$display.$isScrollable()) {
				this._canvas.style.cursor = "grab";
			}
			return false;
		}

		let design = this._studio.$design;
		if(design && event.key == "delete") {
			design.$delete(this.$selection.$items);
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

		// 執行捲動，支援空白鍵捲動、中鍵和右鍵捲動三種操作方法
		let space = CT.KeyboardController.$isPressed("space");
		if(event.event instanceof MouseEvent) {
			let bt = event.event.button;
			if(space || bt == CT.$RIGHT || bt == CT.$MIDDLE) {
				console.log(event.point.round().toString());
				this._longPress.$cancel();
				this.$scroll.$init();
				CT.CursorController.$tryUpdate(event.event);
				return;
			}
		}

		if(!System._isSelectEvent(ev) || this.$scroll.on) return;

		if(CT.$isTouch(ev)) this._canvasTouchDown(event);
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
			CT.CursorController.$tryUpdate(event);
		}
	}

	/** 檢查事件是否符合「選取」的前提（單點觸控或者滑鼠左鍵操作） */
	private static _isSelectEvent(event: MouseEvent | TouchEvent): boolean {
		if(CT.$isTouch(event) && event.touches.length > 1) return false;
		if(event instanceof MouseEvent && event.button != CT.$LEFT) return false;
		return true;
	}
}
