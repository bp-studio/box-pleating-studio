import { Container, Text } from "pixi.js";

import { BLACK, DARK, LIGHT, WHITE } from "client/shared/constant";
import ProjectService from "client/services/projectService";
import { Direction } from "client/types/enum";
import { PIXI } from "./inspector";

import type { Sheet } from "client/project/components/sheet";

const SMOOTHNESS = 2;
const FONT_SIZE = 14;
const HALF = 0.5;

//=================================================================
/**
 * {@link Label} 類別繼承自 PIXI 的 {@link Container} 類別，是繪製文字標籤的基準。
 */
//=================================================================
export class Label extends Container {

	private readonly _sheet: Sheet;
	private readonly _label: Text = new Text();
	private readonly _glow: Text = new Text();

	public $color?: number;
	public $distance: number = 1;

	constructor(sheet: Sheet) {
		super();
		this._sheet = sheet;

		this.addChild(this._glow);
		this.addChild(this._label);
		this._label.anchor.set(HALF);
		this._glow.anchor.set(HALF);

		if(DEBUG_ENABLED) {
			this._label.name = "Label";
			this._glow.name = "Glow";
		}
	}

	/**
	 * 繪製文字標籤
	 * @param text 要繪製的文字字串內容
	 * @param x 繪製的參考座標
	 * @param y 繪製的參考座標
	 * @param direction 繪製的方向（不指定的話則由格線決定）
	 */
	public $draw(text: string, x: number, y: number, direction?: Direction): void {
		// 設定文字
		text = text.trim();
		this.visible = Boolean(text);
		if(!this.visible) return;
		this._label.text = text;
		this._glow.text = text;

		// 粗略定位
		const s = ProjectService.scale.value;
		this.scale = { x: 1 / s / SMOOTHNESS, y: -1 / s / SMOOTHNESS };
		this.x = x;
		this.y = y;
		const fontSize = FONT_SIZE * Math.sqrt(ProjectService.shrink.value);

		// 這邊 Label 本身是一個讓 _glow 和 _label 可以對齊中心的外部容器，
		// 但是在定位的時候我們要的是對齊 _label 而不是較大的外框，
		// 因此這邊我們需要計算修正的大小
		const outerBounds = this.getLocalBounds();
		const innerBounds = this._label.getLocalBounds();
		const xFix = (outerBounds.width - innerBounds.width) / 2;
		const yFix = (outerBounds.height - innerBounds.height) / 2;

		// 決定位置
		direction ??= this._sheet.grid.$getLabelDirection(x, y);
		const offset = directionalOffsets[direction];
		this.pivot.set(
			-(Math.sign(offset.x) * (innerBounds.width / 2 - xFix) + offset.x * this.$distance),
			Math.sign(offset.y) * (fontSize * SMOOTHNESS - yFix) + offset.y * this.$distance
		);

		// 決定繪製的顏色
		const dark = app.isDark.value;
		const fill = this.$color ?? (dark ? LIGHT : BLACK);
		const stroke = dark ? DARK : WHITE;
		this._label.style = {
			fill,
			fontSize: fontSize * SMOOTHNESS,
			stroke: fill,
			strokeThickness: 1,
		};
		this._glow.style = {
			fill: stroke,
			fontSize: fontSize * SMOOTHNESS,
			stroke,
			strokeThickness: 6,
			lineJoin: "bevel",
		};
	}
}

/**
 * 各種方位上的文字偏移量；這是透過經驗法則決定出來的。
 */
const directionalOffsets: Record<Direction, IPoint> = {
	[Direction.UR]: { x: 12, y: 5 },
	[Direction.UL]: { x: -12, y: 5 },
	[Direction.LL]: { x: -12, y: -5 },
	[Direction.LR]: { x: 12, y: -5 },
	[Direction.T]: { x: 0, y: 7 },
	[Direction.L]: { x: -20, y: 0 },
	[Direction.B]: { x: 0, y: -7 },
	[Direction.R]: { x: 20, y: 0 },
	[Direction.none]: { x: 0, y: 0 },
};

if(DEBUG_ENABLED) PIXI.Label = Label;
