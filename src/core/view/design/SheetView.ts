import { LabeledView } from "../class/LabeledView";
import { PaperUtil } from "../util/PaperUtil";
import { View } from "../class/View";
import { ViewService } from "bp/env/service";
import { Layer, shrewdStatic, Style, unorderedArray } from "bp/global";
import { Constants } from "bp/content/json";
import type { Sheet } from "bp/design";
import type { Control } from "bp/design/class";

//=================================================================
/**
 * {@link SheetView} 是對應於 {@link Sheet} 的 {@link View}。
 */
//=================================================================

@shrewd export class SheetView extends View {

	private _border: paper.Path;
	private _grid: paper.CompoundPath;
	private _sheet: Sheet;

	constructor(sheet: Sheet) {
		super(sheet);
		this._sheet = sheet;

		this._border = new paper.Path.Rectangle({
			point: [0, 0],
			size: [0, 0],
			strokeWidth: 3,
		});
		this.$addItem(Layer.$sheet, this._border);

		this._grid = new paper.CompoundPath(Style.$sheet);
		this.$addItem(Layer.$sheet, this._grid);
	}

	public $contains(point: paper.Point): boolean {
		return this._border.contains(point);
	}

	@shrewdStatic private _renderDark(): void {
		if(this.$dark) {
			this._border.strokeColor = PaperUtil.$gray;
			this._grid.strokeColor = PaperUtil.$white;
		} else {
			this._border.strokeColor = PaperUtil.$black;
			this._grid.strokeColor = PaperUtil.$black;
		}
	}

	protected $render(): void {
		if(!this.$display) return;
		let width = this._sheet.width;
		let height = this._sheet.height;

		PaperUtil.$setRectangleSize(this._border, width, height);

		this._grid.visible = this.$display.$settings.showGrid;
		this._grid.removeChildren();
		for(let i = 1; i < height; i++) {
			PaperUtil.$addLine(this._grid, new paper.Point(0, i), new paper.Point(width, i));
		}
		for(let i = 1; i < width; i++) {
			PaperUtil.$addLine(this._grid, new paper.Point(i, 0), new paper.Point(i, height));
		}
	}

	@unorderedArray private get _labeledControls(): Control[] {
		this.$disposeEvent();
		return this._sheet.$controls.filter((c: Control) =>
			ViewService.$get(c) instanceof LabeledView
		);
	}

	@shrewd public get $margin(): number {
		this.$disposeEvent();
		if(!this._isActive || !this._sheet.$design._isActive) return 0;
		let controls = this._labeledControls;
		if(controls.length == 0 || !this.$display || !this.$display.$settings.showLabel) return 0;

		let overflows = controls.map(c => (ViewService.$get(c) as LabeledView<Control>).$overflow);
		return Math.max(...overflows);
	}

	/** 根據所有的文字標籤來逆推適合的尺度 */
	public $getScale(viewWidth: number, viewHeight: number, margin: number, fix: number): number {
		let factor = this._sheet.zoom / Constants.$FULL_ZOOM;
		let controls = this._labeledControls, width = this._sheet.width;
		let horizontalScale = (viewWidth - 2 * margin) * factor / width;
		if(controls.length == 0) return horizontalScale;

		if(this.$display?.$settings.showLabel) {
			let views = controls.map(c => ViewService.$get(c) as LabeledView<Control>);
			let scales = views.map(v =>
				v.$getHorizontalScale(width, viewWidth - 2 * fix, factor)
			);
			horizontalScale = Math.min(horizontalScale, ...scales);
		}

		let verticalScale = (viewHeight * factor - margin * 2) / this._sheet.height;
		return Math.min(horizontalScale, verticalScale);
	}
}
