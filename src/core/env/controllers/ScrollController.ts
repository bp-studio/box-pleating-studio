import { CursorController } from "./CursorController";
import { $isTouch, $MIDDLE } from "./Share";
import type { Studio } from "..";

//////////////////////////////////////////////////////////////////
/**
 * {@link ScrollController} 類別負責管理視圖區域的捲動。
 */
//////////////////////////////////////////////////////////////////

export class ScrollController {

	private static readonly _TIMEOUT = 50;

	private _studio: Studio;

	private _scrolling: boolean;

	private _timeout: number;

	constructor(studio: Studio) {
		this._studio = studio;

		document.addEventListener("mousemove", this._bodyMousemove.bind(this), { passive: true });
		document.addEventListener("touchmove", this._bodyMousemove.bind(this), { passive: true });
		document.addEventListener("contextmenu", this._bodyMenu.bind(this));
		document.addEventListener("mouseup", this._bodyMouseup.bind(this), { passive: true });
		document.addEventListener("touchend", this._bodyMouseup.bind(this), { passive: true });

		studio.$el.addEventListener("scroll", this._onScroll.bind(this), { passive: true });
	}

	public get on(): boolean {
		return this._scrolling;
	}

	public $init(): void {
		this._scrolling = true;
	}

	public $tryEnd(event: paper.ToolEvent): boolean {
		if(this._scrolling) {
			// 空白鍵捲動放開的攔截必須寫在這裡，因為事件會被取消掉
			if(event.event instanceof MouseEvent) {
				this._scrolling = false;
			}
			return true;
		}
		return false;
	}

	private _scrollLock = false;
	private _onScroll(): void {
		if(this._scrollLock) {
			this._scrollLock = false;
			return;
		}
		if(this._scrolling) return;
		let sheet = this._studio.$design?.sheet;
		if(sheet) {
			sheet.$scroll.x = this._studio.$el.scrollLeft;
			sheet.$scroll.y = this._studio.$el.scrollTop;
		}

		// 有的時候捲動太快會錯過一些事件，用這一段程式碼來檢查之
		window.clearTimeout(this._timeout);
		this._timeout = window.setTimeout(() => this._timeoutHandler(), ScrollController._TIMEOUT);
	}

	private _timeoutHandler(): void {
		let sheet = this._studio.$design?.sheet;
		if(sheet && (sheet.$scroll.x != this._studio.$el.scrollLeft ||
			sheet.$scroll.y != this._studio.$el.scrollTop)) {
			this._onScroll();
		}
	}

	public to(x: number, y: number): void {
		this._scrollLock = true;
		this._studio.$el.scrollTo(x, y);
	}

	private _bodyMenu(event: MouseEvent): void {
		// 右鍵捲動的情況中，這個事件會比右鍵放開還要早觸發，
		// 而這個攔截掉也會導致後者不會觸發，所以該做的事情都要在這邊處理
		event.preventDefault();
		this._scrolling = false;
	}

	private _bodyMouseup(event: MouseEvent | TouchEvent): void {
		if(
			$isTouch(event) && event.touches.length == 0 || // paper.js 的奇怪設計使得多點觸控的第二點放開必須獨立攔截
			event instanceof MouseEvent && event.button == $MIDDLE // 新增滑鼠中鍵拖曳支援
		) {
			this._scrolling = false;
		}
	}

	private _bodyMousemove(event: MouseEvent | TouchEvent): void {
		if(!this._studio.$design) return;

		// 處理捲動；後面的條件考慮到可能放開的時候會有短暫瞬間尚有一點殘留
		if(this._scrolling && (event instanceof MouseEvent || event.touches.length >= 2)) {
			let diff = CursorController.$diff(event);
			this._studio.$display.$scrollBy(this._studio.$design, diff);
			if($isTouch(event)) this._studio.$system.$zoom.$process(event);
		}
	}
}
