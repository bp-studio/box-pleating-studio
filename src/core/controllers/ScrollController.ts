
//////////////////////////////////////////////////////////////////
/**
 * `ScrollController` 類別負責管理視圖區域的捲動。
 */
//////////////////////////////////////////////////////////////////

class ScrollController {

	private _studio: BPStudio;

	private _scrolling: boolean;

	constructor(studio: BPStudio) {
		this._studio = studio;

		document.addEventListener("mousemove", this._bodyMousemove.bind(this));
		document.addEventListener("touchmove", this._bodyMousemove.bind(this));
		document.addEventListener("contextmenu", this._bodyMenu.bind(this));
		document.addEventListener("mouseup", this._bodyMouseup.bind(this));
		document.addEventListener("touchend", this._bodyMouseup.bind(this));

		studio.$el.addEventListener("scroll", this.onScroll.bind(this));
	}

	public get on() {
		return this._scrolling;
	}

	public init() {
		this._scrolling = true;
	}

	public tryEnd(event: paper.ToolEvent): boolean {
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
	private onScroll(): void {
		if(this._scrollLock) {
			this._scrollLock = false;
			return;
		}
		if(this._scrolling) return;
		let sheet = this._studio.design?.sheet;
		if(sheet) {
			sheet.scroll.x = this._studio.$el.scrollLeft;
			sheet.scroll.y = this._studio.$el.scrollTop;
		}
	}

	public process(diff: Vector) {
		let display = this._studio.$display;
		let { x, y } = this._studio.design!.sheet.scroll;
		if(display.isXScrollable) x -= diff.x;
		if(display.isYScrollable) y -= diff.y;
		display.scrollTo(x, y);
	}

	public to(x: number, y: number) {
		this._scrollLock = true;
		this._studio.$el.scrollTo(x, y);
	}

	private _bodyMenu(event: MouseEvent) {
		// 右鍵捲動的情況中，這個事件會比右鍵放開還要早觸發，
		// 而這個攔截掉也會導致後者不會觸發，所以該做的事情都要在這邊處理
		event.preventDefault();
		this._scrolling = false;
	}

	private _bodyMouseup(event: MouseEvent | TouchEvent) {
		if(System.isTouch(event) && event.touches.length == 0) {
			// paper.js 的奇怪設計使得多點觸控的第二點放開必須獨立攔截
			this._scrolling = false;
		}
	}

	private _bodyMousemove(event: MouseEvent | TouchEvent) {
		if(!this._studio.design) return;

		// 處理捲動；後面的條件考慮到可能放開的時候會有短暫瞬間尚有一點殘留
		if(this._scrolling && (event instanceof MouseEvent || event.touches.length >= 2)) {
			let diff = CursorController.instance.diff(event);
			this.process(diff);
			if(System.isTouch(event)) this._studio.system.zoom.process(event);
		}
	}
}
