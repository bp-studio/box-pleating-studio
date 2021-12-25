import { Viewport } from "./Viewport";
import { Constants } from "bp/content/json";
import type { SheetView } from "bp/view";
import type { Studio } from "..";
import type { Design } from "bp/design";
import type { IPoint } from "bp/math";

//////////////////////////////////////////////////////////////////
/**
 * {@link SheetImage} 是指把 Sheet 實際輸出成圖像之後的樣子，
 * 也就是 {@link Sheet} 再加上必要的邊距。
 */
//////////////////////////////////////////////////////////////////

export abstract class SheetImage extends Viewport {

	private static readonly _MARGIN_FIX = 15;
	private static readonly _MARGIN = 30;

	protected readonly _studio: Studio;

	constructor(studio: Studio) {
		super(studio.$el);
		this._studio = studio;
	}

	protected get _design(): Design | null {
		return this._studio.$design;
	}

	@shrewd public get $scale(): number {
		if(this._design) {
			let sheet = this._design.sheet;
			if(!sheet) return 1;
			let view = this._design.$viewManager.$get(sheet) as SheetView;
			return view.$getScale(
				this._viewWidth, this._viewHeight,
				SheetImage._MARGIN, SheetImage._MARGIN_FIX
			);
		} else {
			return Constants.$FULL_ZOOM;
		}
	}

	/** 輸出圖像的高度 */
	@shrewd protected get _imgHeight(): number {
		return (this._design?.sheet?.height ?? 0) * this.$scale + SheetImage._MARGIN * 2;
	}

	/** 輸出圖像的寬度 */
	@shrewd protected get _imgWidth(): number {
		return (this._design?.sheet?.width ?? 0) * this.$scale + this._horMargin * 2;
	}

	protected _getPadding(scroll: IPoint): IPoint {
		return {
			x: (scroll.x - this._imgWidth) / 2 + this._horMargin,
			y: (scroll.y + this._imgHeight) / 2 - SheetImage._MARGIN,
		};
	}

	/** 因為文字標籤而產生的實際水平邊距 */
	@shrewd private get _horMargin(): number {
		let margin = 0;
		if(this._design?.sheet) {
			let view = this._design.$viewManager.$get(this._design.sheet) as SheetView;
			margin = view.$margin;
		}
		return Math.max(margin + SheetImage._MARGIN_FIX, SheetImage._MARGIN);
	}
}
