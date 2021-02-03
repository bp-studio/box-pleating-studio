
//////////////////////////////////////////////////////////////////
/**
 * `Line` 是由兩個 `Point` 構成的。
 */
//////////////////////////////////////////////////////////////////

class Line {

	public readonly p1: Point;
	public readonly p2: Point;

	constructor(p: Point, v: Vector);
	constructor(p1: Point, p2: Point);
	constructor(p: Point, c: Point | Vector) {
		if(c instanceof Vector) c = p.add(c);
		this.p1 = p; this.p2 = c;
	}

	/** 把直線以 `(x1, y1), (x2, y2)` 的格式輸出成字串，頂點會排序，因此可以作為識別簽章使用 */
	public toString() { return [this.p1, this.p2].sort().toString(); }

	public get isDegenerated() { return this.p1.eq(this.p2); }

	/**Check if two line segments are identical */
	public eq(l: Line) { return this.p1.eq(l.p1) && this.p2.eq(l.p2) || this.p1.eq(l.p2) && this.p2.eq(l.p1); }

	/** 傳回一個點是否落在這個線段的內部（預設不含端點） */
	public contains(point: Point | IPoint, includeEndpoints: boolean = false) {
		let p = point instanceof Point ? point : new Point(point);
		if(includeEndpoints && (p.eq(this.p1) || p.eq(this.p2))) return true;
		var v1 = p.sub(this.p1), v2 = p.sub(this.p2);
		return v1._x.mul(v2._y).eq(v2._x.mul(v1._y)) && v1.dot(v2) < 0;
	}

	public lineContains(p: Point) {
		return this.vector.parallel(p.sub(this.p1));
	}

	/** 取得這條線段（含端點）與給定動向（視為直線，除非指定 isRay）的交點 */
	public intersection(l: Line): Point | null
	public intersection(p: Point, v: Vector, isRay?: boolean): Point | null;
	public intersection(...t: [Point, Vector, boolean?] | [Line]): Point | null {
		if(t.length == 1) return this.intersection(t[0].p1, t[0].p2.sub(t[0].p1));
		let [p, v, isRay] = t;
		var v1 = this.p2.sub(this.p1);
		var m = (new Matrix(v1._x, v._x, v1._y, v._y)).inverse;
		if(m == null) return null;

		var r = m.multiply(new Point(p.sub(this.p1)));
		var a = r._x, b = r._y.neg;
		if(a.lt(0) || a.gt(1)) return null;
		if(isRay && b.lt(0)) return null;

		return p.add(v.scale(b));
	}

	/** 根據指定的參數變換並傳回一條新的直線 */
	public transform(fx: number, fy: number) {
		return new Line(this.p1.transform(fx, fy), this.p2.transform(fx, fy));
	}

	/** 根據指定的向量移動並傳回一條新的直線 */
	public shift(v: Vector) {
		return new Line(this.p1.add(v), this.p2.add(v));
	}

	/** 過濾掉直線陣列裡面重複的、並且傳回新的陣列 */
	public static distinct(lines: Line[]) {
		let signatures = new Set<string>();
		return lines.filter(l => {
			let signature = l.toString(), ok = !signatures.has(signature);
			if(ok) signatures.add(signature);
			return ok;
		});
	}

	/** 把線段集合 l1 扣除掉任何和線段集 l2 重疊到的部份 */
	public static subtract(l1: readonly Line[], l2: readonly Line[]): Line[] {
		let result: Line[] = [];

		// 由於線段重疊的前提是斜率相同，把 l2 根據斜率來分組以增進效能。
		let slopeMap = new Map<string, Line[]>();
		for(let l of l2) {
			let slope = l.slope.toString();
			let arr = slopeMap.get(slope);
			if(!arr) slopeMap.set(slope, arr = []);
			arr.push(l);
		}

		for(let l of l1) {
			let slope = l.slope.toString();
			if(!slopeMap.has(slope)) result.push(l);
			else result.push(...l.cancel(slopeMap.get(slope)!));
		}
		return result;
	}

	/** 把當前的線段扣除掉傳入的線段集中任何重疊到的部份，並傳回剩下的各部份線段。 */
	private cancel(set: Line[]): Line[] {

		let result: Line[] = [this];
		for(let l2 of set) {
			let next: Line[] = [];
			for(let l1 of result) next.push(...l1._cancel(l2));
			result = next;
		}
		return result;
	}

	private *_cancel(l: Line): Generator<Line> {
		let a = this.contains(l.p1, true), b = this.contains(l.p2, true);
		let c = l.contains(this.p1, true), d = l.contains(this.p2, true);

		// 自己完全被包含在對方之中，則會完全消滅
		if(c && d) return;

		// 不然如果自己並未包含對方的任何一端點，表示自己和對方完全無交集，傳回自身
		if(!a && !b) yield this;

		else if(a && b) {
			let l11 = new Line(this.p1, l.p1), l12 = new Line(this.p1, l.p2);
			let l21 = new Line(this.p2, l.p1), l22 = new Line(this.p2, l.p2);
			if(l11.isDegenerated) yield l22;
			else if(l12.isDegenerated) yield l21;
			else if(l21.isDegenerated) yield l12;
			else if(l22.isDegenerated) yield l11;
			else if(l11.contains(l.p2)) {
				yield l12; yield l21;
			} else {
				yield l11; yield l22;
			}
		} else {
			let p1 = a ? l.p1 : l.p2;
			let p2 = d ? this.p1 : this.p2;
			if(!p1.eq(p2)) yield new Line(p1, p2);
		}
	}

	/** 傳回分數斜率 */
	public get slope(): Fraction {
		return this.p1._x.sub(this.p2._x).d(this.p1._y.sub(this.p2._y));
	}

	/** 把自身的頂點依 x 座標排序並且傳回 */
	public xOrient(): [Point, Point] {
		if(this.p1._x.gt(this.p2._x)) return [this.p2, this.p1];
		return [this.p1, this.p2];
	}

	/** 傳回位於這個線段上的所有格子點 */
	public *gridPoints(): Generator<Point> {
		let { p1, p2 } = this;
		let dx = p2.x - p1.x, dy = p2.y - p1.y;
		if(Math.abs(dx) < Math.abs(dy)) {
			let f = Math.sign(dx);
			for(let x = MathUtil.int(p1.x, f); x * f <= p2.x * f; x += f) {
				let p = this.xIntersection(x);
				if(p.isIntegral) yield p;
			}
		} else {
			let f = Math.sign(dy);
			for(let y = MathUtil.int(p1.y, f); y * f <= p2.y * f; y += f) {
				let p = this.yIntersection(y);
				if(p.isIntegral) yield p;
			}
		}
	}

	public xIntersection(x: number) {
		let v = this.p2.sub(this.p1);
		return new Point(x, this.p1._y.sub(v.slope.mul(this.p1._x.sub(x))).smp());
	}

	public yIntersection(y: number) {
		let v = this.p2.sub(this.p1);
		return new Point(this.p1._x.sub(this.p1._y.sub(y).div(v.slope)).smp(), y);
	}

	/** 把給定的向量對於這條線作鏡射 */
	public reflect(v: Vector): Vector {
		v = v.neg;
		var m = new Matrix(v._x, v._y.neg, v._y, v._x);
		var mi = m.inverse!;
		v = mi.multiply(this.p2.sub(this.p1));
		v = v.doubleAngle();
		return m.multiply(v).reduce();
	}

	// 疑似暫時用不到
	// public get isOrthogonal() {
	// 	return this.p1._x.eq(this.p2._x) || this.p1._y.eq(this.p2._y);
	// }

	/** 直線是否和給定的向量垂直 */
	public perpendicular(v: Vector): boolean {
		return this.vector.dot(v) == 0;
	}

	public get vector() {
		return this.p1.sub(this.p2);
	}
}
