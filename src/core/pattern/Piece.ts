
interface JPiece {
	ox: number;
	oy: number;
	u: number;
	v: number;

	/** 繞道，沿著順時鐘方向運行；其座標都是沒有加上 shift 之前的 */
	detours?: IPoint[][];

	/**
	 * 這個 Piece 相對於 Partition 的參考原點的（相位變換前）偏移。
	 *
	 * 這包括了非整數解的偏移，或是較複雜的 join 中的偏移
	 */
	shift?: IPoint;
}

//////////////////////////////////////////////////////////////////
/**
 * `Piece` 是 `Gadget` 裡面的一個 `Region`。
 *
 * `Piece` 本身實作了 `JPiece` 介面，並且在執行 `setup` 方法之前可以跟普通的 `JPiece` 一樣操作數值。
 */
//////////////////////////////////////////////////////////////////

class Piece extends Region implements JPiece, ISerializable<JPiece> {

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

		// 處理繞道
		(this.detours || []).forEach(d => {
			// 把資料進行變換
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
				if(eq || ridges[i].$contains(start)) {
					for(let j = 1; j < l; j++) {
						let k = (j + i) % l;
						// 找到了，進行替換
						if(ridges[k].p1.eq(end) || ridges[k].$contains(end)) {
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
					}
					// 跑到這裡來的話表示指定的繞道有問題，找到了頭卻找不到尾
					debugger;
				}
			}
		});
		return { contour, ridges };
	}

	/** 這個 Piece 對應的四個（相位變換後）連接點，若不負責對應的連結點則傳回 null */
	@onDemand public get $anchors(): (Point | null)[] {
		let p = this._points;
		let { contour } = this.$shape;
		return [
			contour.some(c => c.eq(p[0])) ? p[0] : null,
			contour.includes(p[1]) ? p[1] : null,
			contour.some(c => c.eq(p[2])) ? p[2] : null,
			contour.includes(p[3]) ? p[3] : null
		];
	}

	@onDemand public get $direction(): Vector {
		let { oy, v } = this;
		return new Vector(oy + v, v).$doubleAngle().$reduceToInt();
	}

	public get sx() {
		return this.oy + this.u + this.v;
	}

	public get sy() {
		return this.ox + this.u + this.v;
	}

	/** 計算一個 Piece 的 rank，數字越小越好 */
	@onDemand public get $rank() {
		let r1 = MathUtil.$reduce(this.oy + this.v, this.oy)[0];
		let r2 = MathUtil.$reduce(this.ox + this.u, this.ox)[0];
		return Math.max(r1, r2);
	}

	/** 在指定的 SCR 之下反轉自己 */
	public $reverse(tx: number, ty: number) {
		let { shift, detours, sx, sy } = this;
		shift = shift || { x: 0, y: 0 };
		let s = { x: tx - sx - shift.x, y: ty - sy - shift.y };
		if(s.x || s.y) this.shift = s;
		detours?.forEach(c =>
			c.forEach(p => { p.x = sx - p.x; p.y = sy - p.y; })
		);
	}

	/** 等比例縮小一個 Piece；會重設計算快取 */
	public $shrink(by: number = 2) {
		onDemandMap.delete(this);
		this.ox /= by;
		this.oy /= by;
		this.u /= by;
		this.v /= by;
		return this;
	}

	/** 根據 `Gadget` 偏移來進行設置；必要時會重設計算快取 */
	public $offset(o?: IPoint) {
		if(!o || this._offset && this._offset.x == o.x && this._offset.y == o.y) return;
		this._offset = o;
		onDemandMap.delete(this);
	}

	/**
	 * 加入一個繞道；會重設計算快取。
	 *
	 * 加入的繞道會被複製；其座標應該是要不包含 offset。
	 */
	public $addDetour(detour: IPoint[]) {
		detour = clone(detour);
		// 檢查輸入的繞道
		for(let i = 0; i < detour.length - 1; i++) {
			if(detour[i].x == detour[i + 1].x && detour[i].y == detour[i + 1].y) detour.splice(i--, 1);
		}
		if(detour.length == 1) return;

		// 正式加入
		this.detours = this.detours || [];
		this.detours.push(detour);
		onDemandMap.delete(this);
	}

	public $clearDetour() {
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

	/** 基礎的整數 GOPS 搜尋 */
	public static *$gops(overlap: Readonly<JOverlap>, sx?: number): Generator<JPiece> {
		let { ox, oy } = overlap;
		if([ox, oy].some(n => !Number.isSafeInteger(n))) return;
		if(ox % 2 && oy % 2) return;
		if(sx === undefined) sx = Number.POSITIVE_INFINITY;
		let ha = ox * oy / 2; // half area of the overlap rectangle
		for(
			let u = Math.floor(Math.sqrt(ha)), v: number;	// 從靠近根號 ha 的數開始搜尋
			u > 0 && u + (v = ha / u) + oy <= sx;			// 必須滿足 u + v + oy <= sx 的關係式，不然塞不下
			u--												// 反向往下搜尋，會盡量優先傳回效率最高的
		) {
			if(ha % u == 0) {
				if(u == v) yield { ox, oy, u, v };
				if(u != v) {
					let p1 = new Piece({ ox, oy, u, v });
					let p2 = new Piece({ ox, oy, u: v, v: u });
					let r1 = p1.$rank, r2 = p2.$rank;
					if(r1 > r2) {
						yield p2; yield p1;
					} else {
						yield p1; yield p2;
					}
				}
			}
		}
	}

	/** 把一個 JPiece 實體化成 Piece；如果已經實體化過，直接傳回（除非設置 alwaysNew） */
	public static $instantiate(p: JPiece, alwaysNew = false): Piece {
		return p instanceof Piece && !alwaysNew ? p : new Piece(p);
	}
}
