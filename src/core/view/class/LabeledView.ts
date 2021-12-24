import { View } from "./View";
import { ControlView } from "./ControlView";
import { LabelUtil } from "../util/LabelUtil";
import { Layer, Style } from "bp/global";
import type { Control } from "bp/design/class";
import type { IPoint } from "bp/math";

//////////////////////////////////////////////////////////////////
/**
 * {@link LabeledView} 是附帶有文字標籤的 {@link ControlView}。
 */
//////////////////////////////////////////////////////////////////

export abstract class LabeledView<T extends Control> extends ControlView<T> {

	private static readonly _SQRT = 2 / Math.sqrt(View._MIN_SCALE);
	private static readonly _FONT_SIZE = 14;
	private static readonly _EXTRA_FIX = 5; // 這是實驗得到的數字

	protected readonly _label: paper.PointText;
	protected readonly _glow: paper.PointText;

	/**
	 * {@link LabeledView} 要額外實作這個方法來繪製跟比例尺無關的東西。
	 *
	 * 必要的前置檢查已經在底層裡面完成。
	 */
	protected abstract $renderUnscaled(): void;

	/** 繼承類別必須實作這個屬性來傳回文字標籤的參考點 */
	protected abstract get _labelLocation(): IPoint;

	/** 繼承類別必須實作這個屬性來傳回文字標籤要避開的路徑 */
	protected abstract get _labelAvoid(): paper.Path[];

	private _contentCache: string = '';

	@shrewd private _labelWidth: number = 0;

	constructor(control: T) {
		super(control);
		this.$addItem(Layer.$label, this._glow = new paper.PointText(Style.$glow));
		this.$addItem(Layer.$label, this._label = new paper.PointText(Style.$label));
	}

	@shrewd private _drawUnscaled(): void {
		this.$mountEvents();
		if(!this.$studio) return;
		this.$studio.$display.$render();
		this.$renderUnscaled();

		LabelUtil.$setLabel(
			this._control.$sheet, this._label, this._glow, this._labelLocation, ...this._labelAvoid
		);

		let factor = this._factor;
		let size = LabeledView._FONT_SIZE * factor;
		this._label.fontSize = size;
		this._glow.fontSize = size;

		if(this._contentCache != this._label.content) {
			this._contentCache = this._label.content;
			let width = Math.ceil(this._label.bounds.width / factor);

			// 延遲設定以避免循環參照
			setTimeout(() => this._labelWidth = width, 0);
		}
	}

	/** 一個 {@link View} 的標籤的橫向溢出大小 */
	@shrewd public get $overflow(): number {
		if(this.$disposed || !this.$studio) return 0;

		let result = 0;
		let sheetWidth = this._control.$sheet.width;
		let scale = this.$studio.$display.$scale;
		let w = scale * sheetWidth;
		let width = this._labelWidth * this._factor;
		let center = this._labelLocation.x;
		if(center != 0 && center != sheetWidth) width /= 2;

		let left = center * scale - width;
		let right = center * scale + width;
		if(left < 0) result = -left;
		if(right > w) result = Math.max(result, right - w);

		return Math.ceil(result);
	}

	@shrewd private get _factor(): number {
		return Math.sqrt(this._drawScale);
	}

	/** 透過解方程式來逆推考量到當前的標籤之下應該採用何種自動尺度 */
	public $getHorizontalScale(sheetWidth: number, viewWidth: number, factor: number): number {
		let labelWidth = this._labelWidth, c = this._labelLocation.x;
		if(c != 0 && c != sheetWidth) labelWidth /= 2;
		let vw = (viewWidth - LabeledView._EXTRA_FIX) * factor;
		let size = Math.abs(2 * c - sheetWidth);
		let result = LabeledView._solveEq(-vw, labelWidth * LabeledView._SQRT, size);
		if(result > View._MIN_SCALE) {
			if(size != 0) result = (vw - 2 * labelWidth) / size;
			else result = vw / sheetWidth;
		}
		return result;
	}

	/** 解型如 o * x + s * Math.sqrt(x) + z == 0 的二次方程 */
	private static _solveEq(z: number, s: number, o: number): number {
		if(o == 0) return z * z / (s * s); // 退化情況
		let f = 2 * o * z, b = s * s - f;
		let inner = b * b - f * f;
		return (b - Math.sqrt(inner)) / (2 * o * o);
	}
}
