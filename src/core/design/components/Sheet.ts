import { action } from "bp/content/changes";
import { Mountable } from "bp/class";
import { Draggable, IndependentDraggable } from "bp/design/class";
import { Fraction, Point, Rectangle } from "bp/math";
import { unorderedArray } from "bp/global";
import { Constants } from "bp/content/json";
import { ViewService } from "bp/env/service";
import type { JSheet } from "bp/content/json";
import type { Design } from "..";
import type { ITagObject } from "bp/content/interface";
import type { Control } from "bp/design/class";
import type { IPoint, Vector } from "bp/math";

//////////////////////////////////////////////////////////////////
/**
 * {@link Sheet} 是代表一個工作區域。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class Sheet extends Mountable implements ISerializable<JSheet>, ITagObject {

	public readonly $tag: string;

	@unorderedArray public get $controls(): Control[] {
		this.$disposeEvent();
		let result: Control[] = [];
		for(let map of this._controlMaps) result.push(...map());
		return result;
	}

	/** 所有活躍的控制 */
	@shrewd public get $activeControls(): readonly Control[] {
		this.$disposeEvent();
		if(!this.$design.$dragging) {
			// 因為 isActive 是一個會完整更新 Pattern 的龐大計算，我們只有在非拖曳的時候完整更新清單，
			// 以避免拖曳的時候被 Vue.js 的呼叫觸發了多餘的計算和繪製
			this._activeControlCache = this.$controls.filter(c => Mountable.$isActive(c));
		}
		return this._activeControlCache;
	}
	private _activeControlCache: Control[] = [];

	/** 考慮一個點進行指定位移之後的結果來修正位移 */
	public $constraint(v: Vector, p: Readonly<IPoint>): Vector {
		return v.$range(
			new Fraction(-p.x), new Fraction(this.width - p.x),
			new Fraction(-p.y), new Fraction(this.height - p.y)
		);
	}

	/** @exports */
	public get width(): number { return this.mWidth; }
	public set width(v: number) {
		if(v >= Constants.$MIN_SIZE && v >= this._independentRect.width) {
			let d = v - this._independentRect.right;
			if(d < 0) {
				for(let i of this.$independents) {
					Draggable.$move(i, { x: d, y: 0 });
				}
			}
			this.mWidth = v;
		}
	}
	@action private mWidth: number;

	/** @exports */
	public get height(): number { return this.mHeight; }
	public set height(v: number) {
		if(v >= Constants.$MIN_SIZE && v >= this._independentRect.height) {
			let d = v - this._independentRect.top;
			if(d < 0) {
				for(let i of this.$independents) {
					Draggable.$move(i, { x: 0, y: d });
				}
			}
			this.mHeight = v;
		}
	}
	@action private mHeight: number;

	/** @exports */
	public get zoom(): number { return this._zoom; }
	public set zoom(v: number) {
		if(v < Constants.$FULL_ZOOM) v = Constants.$FULL_ZOOM;
		this.onZoom?.(v);
	}
	@shrewd public _zoom: number;

	constructor(design: Design, tag: string, sheet: JSheet, ...maps: IterableFactory<Control>[]) {
		super(design);
		this.$tag = tag;
		this.width = sheet.width;
		this.height = sheet.height;
		this._zoom = sheet.zoom ?? Constants.$FULL_ZOOM;
		this.$scroll = sheet.scroll ?? { x: 0, y: 0 };
		this._controlMaps = maps;
		ViewService.$createView(this);
	}

	protected $onDispose(): void {
		//@ts-ignore
		delete this._controlMaps;
		super.$onDispose();
	}

	/** 提供 Zoom 改變的時候的 callback */
	public onZoom?: (zoom: number) => void;

	/** 記載所有這個 {@link Sheet} 中的 {@link Control} 來源 */
	private _controlMaps: IterableFactory<Control>[];

	public get $design(): Design {
		return this.$mountTarget as Design;
	}

	@shrewd public get _isActive(): boolean {
		return this.$design.sheet == this;
	}

	public toJSON(session: boolean = false): JSheet {
		let result: JSheet = { width: this.width, height: this.height };
		if(session) {
			result.zoom = this._zoom;
			result.scroll = this.$scroll;
		}
		return result;
	}

	@shrewd get size(): number {
		return Math.max(this.width, this.height);
	}

	// 暫時沒用到
	// public contains(p: IPoint): boolean {
	// 	return 0 <= p.x && p.x <= this.width && 0 <= p.y && p.y <= this.height;
	// }

	@unorderedArray public get $independents(): IndependentDraggable[] {
		return this.$controls.filter(
			(c: Control): c is IndependentDraggable => c instanceof IndependentDraggable
		);
	}

	/**
	 * 所有的 {@link IndependentDraggable} 所佔據空間的矩形。
	 *
	 * 這個資料故意不採用計算屬性而是採用一個反應方法來持續更新它，
	 * 為的是避免導致循環參照。
	 */
	private _independentRect: Rectangle = new Rectangle(Point.ZERO, Point.ZERO);

	/** 更新 {@link Sheet._independentRect _independentRect} 的反應方法 */
	@shrewd private _getIndependentRect(): void {
		let x1 = Number.POSITIVE_INFINITY, y1 = Number.POSITIVE_INFINITY;
		let x2 = Number.NEGATIVE_INFINITY, y2 = Number.NEGATIVE_INFINITY;
		for(let i of this.$independents) {
			let l = i.$location;
			if(l.x < x1) x1 = l.x;
			if(l.x + i.width > x2) x2 = l.x + i.width;
			if(l.y < y1) y1 = l.y;
			if(l.y + i.height > y2) y2 = l.y + i.height;
		}
		this._independentRect = new Rectangle(new Point(x1, y1), new Point(x2, y2));
	}

	@shrewd public $scroll: IPoint;

	public $clearSelection(): void {
		for(let c of this.$controls) c.$selected = false;
	}
}
