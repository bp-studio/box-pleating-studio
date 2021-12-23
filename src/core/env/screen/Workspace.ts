import { SheetImage } from "./SheetImage";
import type { Studio } from "..";
import type { IPoint, Vector } from "bp/math";
import type { Design } from "bp/design";

//////////////////////////////////////////////////////////////////
/**
 * {@link Workspace} 物件負責管理介於 {@link Viewport} 和 {@link Sheet} 之間的配置計算；
 * 我們把這個部份稱為工作區域，是一個可以被捲動的空間。
 */
//////////////////////////////////////////////////////////////////

export abstract class Workspace extends SheetImage {

	private _spaceHolder: HTMLDivElement;

	constructor(studio: Studio) {
		super(studio);

		// 加入一個填充空間、在 desktop 環境製造原生捲軸的 div
		this._el.appendChild(this._spaceHolder = document.createElement("div"));
		this._spaceHolder.style.zIndex = "-10"; // 修正 iPhone 6 的問題
	}

	public $zoom(zoom: number, center: IPoint): void {
		let sheet = this._design!.sheet;

		let offset = this._offset, scale = this.$scale;
		let cx = (center.x - offset.x) / scale, cy = (offset.y - center.y) / scale;

		sheet._zoom = zoom; // 執行完這行之後，再次存取 this.$scale 和 this._offset 會發生改變
		offset = this._offset;
		scale = this.$scale;

		this._scrollTo(
			sheet.$scroll.x + cx * scale + offset.x - center.x,
			sheet.$scroll.y + offset.y - cy * scale - center.y
		);
	}

	public $scrollBy(design: Design, diff: Vector): void {
		let { x, y } = design.sheet.$scroll;
		if(this._isXScrollable) x -= diff.x;
		if(this._isYScrollable) y -= diff.y;
		this._scrollTo(x, y);
	}

	/** 設置捲軸的顯示與否、並且傳回當前是否可捲動 */
	@shrewd public $isScrollable(): boolean {
		this._studio.$el.classList.toggle("scroll-x", this._isXScrollable);
		this._studio.$el.classList.toggle("scroll-y", this._isYScrollable);
		setTimeout(() => this._setSize(), 0); // 捲軸有變化的時候也要重新確認 viewport 大小
		return this._isXScrollable || this._isYScrollable;
	}

	/** 傳回全部（包括超出視界範圍的）要輸出的範圍 */
	protected _getBound(): paper.Rectangle {
		let sw = this._scrollWidth;
		let sh = this._scrollHeight;
		let x = (sw - this._imgWidth) / 2 - this._scroll.x;
		let y = (sh - this._imgHeight) / 2 - this._scroll.y;
		return new paper.Rectangle(x, y, this._imgWidth, this._imgHeight);
	}

	/** 目前工作區域的捲動偏移 */
	@shrewd protected get _offset(): IPoint {
		let scroll = { x: this._scrollWidth, y: this._scrollHeight };
		let padding = this._getPadding(scroll);
		return { x: padding.x - this._scroll.x, y: padding.y - this._scroll.y };
	}

	protected _createImg(): HTMLImageElement {
		let img = new Image();
		img.alt = "";
		this._spaceHolder.appendChild(img);
		return img;
	}

	@shrewd private _onSheetChange(): void {
		let sheet = this._design?.sheet;
		if(sheet) {
			this._spaceHolder.style.width = this._scrollWidth + "px";
			this._spaceHolder.style.height = this._scrollHeight + "px";
			this._studio.$system.$scroll.to(sheet.$scroll.x, sheet.$scroll.y);
		}
	}

	private get _scroll(): IPoint {
		return this._design?.sheet.$scroll ?? { x: 0, y: 0 };
	}

	private _scrollTo(x: number, y: number): void {
		let w = this._scrollWidth - this._viewWidth;
		let h = this._scrollHeight - this._viewHeight;
		if(x < 0) x = 0;
		if(y < 0) y = 0;
		if(x > w) x = w;
		if(y > h) y = h;
		this._scroll.x = Math.round(x);
		this._scroll.y = Math.round(y);
	}

	/** 全部的捲動寬度 */
	@shrewd private get _scrollWidth(): number {
		return Math.max(this._imgWidth, this._viewWidth);
	}

	/** 全部的捲動高度 */
	@shrewd private get _scrollHeight(): number {
		return Math.max(this._imgHeight, this._viewHeight);
	}

	@shrewd private get _isXScrollable(): boolean {
		return this._imgWidth > this._viewWidth + 1; // 加 1 以避免浮點數誤觸
	}

	@shrewd private get _isYScrollable(): boolean {
		return this._imgHeight > this._viewHeight + 1; // 加 1 以避免浮點數誤觸
	}
}
