
//////////////////////////////////////////////////////////////////
/**
 * `SheetImage` 是指把 Sheet 實際輸出成圖像之後的樣子，
 * 也就是 `Sheet` 再加上必要的邊距。
 */
//////////////////////////////////////////////////////////////////

abstract class SheetImage extends Viewport {

	private static readonly _MARGIN_FIX = 10;
	private readonly _MARGIN = 30;

	protected get _design(): Design | null {
		return this._studio.$design;
	}

	@shrewd public get $scale() {
		if(this._design) {
			let s = this._getAutoScale(this._design.sheet);
			return this._design.sheet.zoom * s / Sheet.$FULL_ZOOM;
		} else {
			return Sheet.$FULL_ZOOM;
		}
	}

	/** 輸出圖像的高度 */
	@shrewd protected get _imgHeight(): number {
		return (this._design?.sheet?.height ?? 0) * this.$scale + this._MARGIN * 2;
	}

	/** 輸出圖像的寬度 */
	@shrewd protected get _imgWidth(): number {
		return (this._design?.sheet?.width ?? 0) * this.$scale + this._horMargin * 2;
	}

	protected _getPadding(scroll: IPoint): IPoint {
		return {
			x: (scroll.x - this._imgWidth) / 2 + this._horMargin,
			y: (scroll.y + this._imgHeight) / 2 - this._MARGIN,
		};
	}

	/** 因為文字標籤而產生的實際水平邊距 */
	@shrewd private get _horMargin(): number {
		return Math.max((this._design?.sheet.$margin ?? 0) + SheetImage._MARGIN_FIX, this._MARGIN);
	}

	private _getAutoScale(sheet?: Sheet): number {
		sheet = sheet || this._design?.sheet;
		let ws = (this._viewWidth - this._horMargin * 2) / (sheet?.width ?? 1);
		let hs = (this._viewHeight - this._MARGIN * 2) / (sheet?.height ?? 1);
		return Math.min(ws, hs);
	}
}
