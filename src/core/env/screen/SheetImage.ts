
//////////////////////////////////////////////////////////////////
/**
 * `SheetImage` 是指把 Sheet 實際輸出成圖像之後的樣子，
 * 也就是 `Sheet` 再加上必要的邊距。
 */
//////////////////////////////////////////////////////////////////

abstract class SheetImage extends Viewport {

	public static readonly $MARGIN_FIX = 15;
	private readonly _MARGIN = 30;

	protected get _design(): Design | null {
		return this._studio.$design;
	}

	@shrewd public get $scale() {
		if(this._design) {
			let sheet = this._design.sheet;
			if(!sheet) return 1;
			return sheet.$getScale(this._viewWidth, this._viewHeight, this._MARGIN);
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
		return Math.max((this._design?.sheet.$margin ?? 0) + SheetImage.$MARGIN_FIX, this._MARGIN);
	}
}
