
//////////////////////////////////////////////////////////////////
/**
 * `SheetImage` 是指把 Sheet 實際輸出成圖像之後的樣子，
 * 也就是 `Sheet` 再加上必要的邊距。
 */
//////////////////////////////////////////////////////////////////

@shrewd class SheetImage {

	private readonly _MARGIN = 30;

	private readonly _studio: Studio;
	private readonly _viewport: Viewport;

	constructor(studio: Studio, viewport: Viewport) {
		this._studio = studio;
		this._viewport = viewport;
	}

	private get _design(): Design | null {
		return this._studio.$design;
	}

	@shrewd public get $scale() {
		if(this._design) {
			let s = this._getAutoScale(this._design.sheet);
			return this._design.sheet.zoom * s / 100;
		} else {
			return 100;
		}
	}

	/** 因為文字標籤而產生的實際水平邊距 */
	@shrewd private get _horMargin(): number {
		return Math.max((this._design?.sheet.$margin ?? 0) + 10, this._MARGIN);
	};

	/** 輸出圖像的寬度 */
	@shrewd public get $width(): number {
		return (this._design?.sheet?.width ?? 0) * this.$scale + this._horMargin * 2;
	}

	/** 輸出圖像的高度 */
	@shrewd public get $height(): number {
		return (this._design?.sheet?.height ?? 0) * this.$scale + this._MARGIN * 2;
	}

	private _getAutoScale(sheet?: Sheet): number {
		sheet = sheet || this._design?.sheet;
		let ws = (this._viewport.$width - this._horMargin * 2) / (sheet?.width ?? 1);
		let hs = (this._viewport.$height - this._MARGIN * 2) / (sheet?.height ?? 1);
		return Math.min(ws, hs);
	}

	public getPadding(scroll: IPoint): IPoint {
		return {
			x: (scroll.x - this.$width) / 2 + this._horMargin,
			y: (scroll.y + this.$height) / 2 - this._MARGIN
		};
	}
}
