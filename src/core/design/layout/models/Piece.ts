import { Region } from "./Region";
import { Line, Point, Vector } from "bp/math";
import { nonEnumerable, onDemand, onDemandMap } from "bp/global";
import { clone, deepCopy } from "bp/util";
import type { JPiece } from "bp/content/json";
import type { IPoint } from "bp/math";
import type { ISerializable } from "bp/global";
import type { IRegionShape } from "./Region";

//////////////////////////////////////////////////////////////////
/**
 * {@link Piece} 是 {@link Gadget} 裡面的一個 {@link Region}。
 */
//////////////////////////////////////////////////////////////////

export class Piece extends Region implements JPiece, ISerializable<JPiece> {

	/** @exports */
	public ox: number;

	/** @exports */
	public oy: number;

	/** @exports */
	public u: number;

	/** @exports */
	public v: number;

	/** @exports */
	public detours?: IPoint[][];

	/** @exports */
	public shift?: IPoint;

	// 建構式單純就是拷貝資料
	constructor(piece: JPiece) {
		super();
		deepCopy(this, piece);
	}

	@onDemand private get _points(): Point[] {
		let { ox, oy, u, v } = this;

		// 因為 GOPS 跟 Overlap 區域之間是一個顛倒的關係，頂點的對應會是從左下角開始的順時鐘排列
		let result = [
			Point.ZERO,
			new Point(u, ox + u),
			new Point(oy + u + v, ox + u + v),
			new Point(oy + v, v),
		];
		result.forEach(p => p.addBy(this._shift));
		return result;
	}

	@nonEnumerable private _offset?: IPoint;

	@onDemand private get _shift(): Vector {
		return new Vector(
			(this.shift?.x ?? 0) + (this._offset?.x ?? 0),
			(this.shift?.y ?? 0) + (this._offset?.y ?? 0)
		);
	}

	/** 計算未經過相位變換的形體 */
	@onDemand public get $shape(): IRegionShape {
		let contour = this._points.concat();
		let ridges = contour.map((p, i, c) => new Line(p, c[(i + 1) % c.length]));
		(this.detours || []).forEach(d => this._processDetour(ridges, contour, d));
		return { contour, ridges };
	}

	/** 處理繞道 */
	private _processDetour(ridges: Line[], contour: Point[], d: IPoint[]): void {
		let detour = d.map(p => new Point(p.x, p.y).addBy(this._shift));
		let start = detour[0], end = detour[detour.length - 1];

		let lines: Line[] = [];
		for(let i = 0; i < detour.length - 1; i++) {
			lines.push(new Line(detour[i], detour[i + 1]));
		}

		// 尋找繞道對應的位置
		let l = ridges.length;
		for(let i = 0; i < l; i++) {
			let eq = ridges[i].p1.eq(start);
			if(!eq && !ridges[i].$contains(start)) continue;

			for(let j = 1; j < l; j++) {
				let k = (j + i) % l;
				if(!ridges[k].p1.eq(end) && !ridges[k].$contains(end)) continue;

				// 找到了，進行替換
				let tail = k < i ? l - i : j + 1, head = j + 1 - tail;
				let pts = detour.concat();
				lines.push(new Line(end, ridges[k].p2));
				if(!eq) {
					pts.unshift(ridges[i].p1);
					lines.unshift(new Line(ridges[i].p1, start));
				}
				contour.splice(i, tail, ...pts);
				ridges.splice(i, tail, ...lines);
				contour.splice(0, head);
				ridges.splice(0, head);
				return;
			}

			// 跑到這裡來的話表示指定的繞道有問題，找到了頭卻找不到尾
			debugger;
		}
	}

	/** 這個 Piece 對應的四個（相位變換後）連接點，若不負責對應的連結點則傳回 null */
	@onDemand public get $anchors(): (Point | null)[] {
		let p = this._points;
		let { contour } = this.$shape;
		return [
			contour.some(c => c.eq(p[0])) ? p[0] : null,
			contour.includes(p[1]) ? p[1] : null,
			contour.some(c => c.eq(p[2])) ? p[2] : null,
			contour.includes(p[3]) ? p[3] : null,
		];
	}

	@onDemand public get $direction(): Vector {
		let { oy, v } = this;
		return new Vector(oy + v, v).$doubleAngle().$reduceToInt();
	}

	public get sx(): number {
		return this.oy + this.u + this.v;
	}

	public get sy(): number {
		return this.ox + this.u + this.v;
	}

	/** 在指定的 SCR 之下反轉自己 */
	public $reverse(tx: number, ty: number): void {
		let { shift, detours, sx, sy } = this;
		shift = shift || { x: 0, y: 0 };
		let s = { x: tx - sx - shift.x, y: ty - sy - shift.y };
		if(s.x || s.y) this.shift = s;
		detours?.forEach(c =>
			c.forEach(p => { p.x = sx - p.x; p.y = sy - p.y; })
		);
	}

	/** 等比例縮小一個 Piece；會重設計算快取 */
	public $shrink(by: number = 2): this {
		onDemandMap.delete(this);
		this.ox /= by;
		this.oy /= by;
		this.u /= by;
		this.v /= by;
		return this;
	}

	/** 根據 {@link Gadget} 偏移來進行設置；必要時會重設計算快取 */
	public $offset(o?: IPoint): void {
		if(!o || this._offset && this._offset.x == o.x && this._offset.y == o.y) return;
		this._offset = o;
		onDemandMap.delete(this);
	}

	/**
	 * 加入一個繞道；會重設計算快取。
	 *
	 * 加入的繞道會被複製；其座標應該是要不包含 offset。
	 */
	public $addDetour(detour: IPoint[]): void {
		detour = clone(detour);
		// 檢查輸入的繞道
		for(let i = 0; i < detour.length - 1; i++) {
			if(detour[i].x == detour[i + 1].x && detour[i].y == detour[i + 1].y) {
				detour.splice(i--, 1);
			}
		}
		if(detour.length == 1) return;

		// 正式加入
		this.detours = this.detours || [];
		this.detours.push(detour);
		onDemandMap.delete(this);
	}

	public $clearDetour(): void {
		if(this.detours?.length) {
			this.detours = undefined;
			onDemandMap.delete(this);
		}
	}

	public toJSON(): JPiece {
		return clone<JPiece>(this);
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	// 靜態方法
	//////////////////////////////////////////////////////////////////////////////////////////

	/** 把一個 JPiece 實體化成 Piece；如果已經實體化過，直接傳回（除非設置 alwaysNew） */
	public static $instantiate(p: JPiece, alwaysNew = false): Piece {
		return p instanceof Piece && !alwaysNew ? p : new Piece(p);
	}
}
