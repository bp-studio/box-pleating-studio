
//////////////////////////////////////////////////////////////////
/**
 * `JoinerCore` 負責執行把兩個給定的 `Gadget` 融合成一個 `Device` 的核心計算。
 */
//////////////////////////////////////////////////////////////////

class JoinerCore {

	private joiner: Joiner;
	private data: {
		size: number;
		p1: Piece;
		p2: Piece;
		v1: Vector;
		v2: Vector;
		off1: IPoint;
		off2: IPoint;
		a1: JAnchor[];
		a2: JAnchor[];
		offset?: IPoint;
		pt: Point;
		pt1: IPoint;
		pt2: IPoint;
		e1: Line;
		e2: Line;
		bv: Vector;
		org: Point;
		f: number;
		addOns?: JAddOn[];
	};

	constructor(joiner: Joiner, p1: Piece, p2: Piece) {
		let { oriented, s1, s2, q1, q2, q } = this.joiner = joiner;
		let a1: JAnchor[] = [], a2: JAnchor[] = [];
		let size = p1.sx + p2.sx;

		// 計算接力融合的起點
		let off1: IPoint = { x: 0, y: 0 }, off2: IPoint = { x: 0, y: 0 };
		if(s1) {
			let int = joiner.getRelayJoinIntersection(p2, s1, (q1 + 2) % 4);
			if(!int || !int.isIntegral) return;
			if(oriented) {
				p1.offset(off1 = int.toIPoint());
				size += off1.x;
				a1[q] = { location: { x: -off1.x, y: -off1.y } };
			} else {
				p2.offset(off2 = { x: p2.sx - int.x, y: p2.sy - int.y });
				size += off2.x;
				a1[q] = { location: { x: p1.sx + off2.x, y: p1.sy + off2.y } };
			}
		}
		if(s2) {
			let int = joiner.getRelayJoinIntersection(p1, s2, (q2 + 2) % 4);
			if(!int || !int.isIntegral) return;
			if(oriented) {
				p2.offset(off2 = int.toIPoint());
				size += off2.x;
				a2[q] = { location: { x: -off2.x, y: -off2.y } };
			} else {
				// 特別注意這幾行跟前面 s1 情況中的對應幾行並不是直接對稱
				p2.offset(off2 = { x: int.x - p1.sx, y: int.y - p1.sy });
				size -= off2.x;
				a2[q] = { location: { x: p2.sx - off2.x, y: p2.sy - off2.y } };
			}
		}

		// 從 p2 觀點變成 p1 觀點時的相對位移和需要加上的向量
		let offset: IPoint | undefined, o = Vector.ZERO;
		if(!oriented) {
			offset = { x: p1.sx - p2.sx, y: p1.sy - p2.sy };
			o = new Vector(offset);
		}

		// 整理所有會用到的重要參數
		let v1 = new Vector(off1).neg, v2 = new Vector(off2).addBy(o).neg;
		let pt = (s1 ? p1.anchors[q]! : p2.anchors[q]!.add(o)); // p1 觀點
		let pt1 = pt.add(v1).toIPoint(), pt2 = pt.add(v2).toIPoint();
		let e1 = p1.shape.ridges[q1], e2 = p2.shape.ridges[q2].shift(o);
		let bv = Vector.bisector(p1.direction, p2.direction);
		let org = oriented ? Point.ZERO : s1 ? new Point(a1[q].location!) : p1.anchors[q]!;
		let f = oriented ? 1 : -1;

		this.data = { p1, p2, v1, v2, a1, a2, off1, off2, offset, size, pt, pt1, pt2, e1, e2, bv, org, f };
	}

	/** 嘗試把兩個 GOPS `Piece` 簡單融合成一個 `Device` */
	public *simpleJoin(): Generator<JoinResult> {
		if(!this.data) return;
		let { e1, e2, p1, p2, pt, bv } = this.data;

		// 找出交點
		let int = e1.intersection(e2); // p1 觀點
		if(!int) return;

		// 檢查簡單融合條件
		if(!p1.direction.parallel(p2.direction) && !int.sub(pt).parallel(bv)) return;

		// 完成並輸出
		if(!this.setupAnchor(int)) return;
		this.setupDetour([int], [int]);
		yield this.result();
	}

	@onDemand private get deltaPt(): Point {
		let { org, p1, p2, f } = this.data;
		let { cw, intDist } = this.joiner;
		return new Point(org.x + (intDist - (cw ? p2 : p1).ox) * f, org.y + (intDist - (cw ? p1 : p2).oy) * f);
	}

	/**
	 * base join 的四個關鍵交點。
	 *
	 * 值得注意的是這四個點不一定總是存在；
	 * 如果兩個 Gadget 的角度非常地「直」，可能只有其中一對會有。
	 */
	private baseJoinIntersections() {
		let { bv, e1, e2, pt } = this.data;
		let delta = new Line(this.deltaPt, Quadrant.QV[0]), beta = new Line(pt, bv);
		let D1 = e1.intersection(delta)!, D2 = e2.intersection(delta)!;
		let B1 = e1.intersection(beta)!, B2 = e2.intersection(beta)!;
		return { D1, D2, B1, B2, delta };
	}

	public *baseJoin(): Generator<JoinResult> {
		if(!this.data) return;
		let { D1, D2, B1, B2 } = this.baseJoinIntersections();

		if(B1?.isIntegral && D2?.isIntegral && !B1.eq(D2)) {
			if(!this.setupAnchor(D2)) return;
			this.setupDetour([B1], [D2, B1]);
			yield this.result(true);
		}
		if(B2?.isIntegral && D1?.isIntegral && !B2.eq(D1)) {
			if(!this.setupAnchor(D1)) return;
			this.setupDetour([D1, B2], [B2]);
			yield this.result();
		}
	}

	/** 把關鍵邊線的其中一個端點換成 B 交點以得到變形前的真正邊線 */
	private substituteEnd(e: Line, p: Point): Line {
		let [p1, p2] = e.xOrient();
		return new Line(p, this.joiner.oriented ? p2 : p1);
	}

	private closestGridPoint(e: Line, p: Point): Point {
		let r!: Point, d: number = Number.POSITIVE_INFINITY;
		for(let i of e.gridPoints()) {
			let dist = i.dist(p);
			if(dist < d) { d = dist; r = i; }
		}
		return r;
	}

	public *standardJoin(): Generator<JoinResult> {
		if(!this.data) return;
		let { D1, D2, B1, B2, delta } = this.baseJoinIntersections();
		let { f } = this.data;

		if(B1 && D2 && !B1.eq(D2)) {
			if(D2.x * f > B1.x * f) yield* this.obtuseStandardJoin(B1, D2, 0);
			else yield* this.acuteStandardJoin(B1, D2, 1, delta);
		}
		if(B2 && D1 && !B2.eq(D1)) {
			if(D1.x * f > B2.x * f) yield* this.obtuseStandardJoin(B2, D1, 1);
			else yield* this.acuteStandardJoin(B2, D1, 0, delta);
		}
	}

	/** 鈍角標準融合 */
	private *obtuseStandardJoin(B: Point, D: Point, i: number): Generator<JoinResult> {
		if(B.isIntegral) return; // 退化成 base join，不考慮
		let { e1, e2, p1, p2, pt, f } = this.data;
		let { cw } = this.joiner;
		let e = [e1, e2][i], p = [p1, p2][i];

		// 若兩個 Gadget 的方向是內聚而非發散的，則鈍角融合不可能成立（至少目前沒有這種變換概念存在）
		// TODO: 仔細思考這一點
		if(cw != (p1.direction.slope.gt(p2.direction.slope))) return;

		if(!this.setupAnchor(D)) return;
		let P = D.sub(B).slope.gt(1) ? e.xIntersection(D.x) : e.yIntersection(D.y);
		let T = this.closestGridPoint(this.substituteEnd(e, B), D);

		// 如果找到的最近整點就是整個 Gadget 的尖端，
		// 這樣的變形是暫時的 river 演算法無法處理的，暫時不考慮
		// TODO: 未來改進 river 的演算法以接受這樣的 pattern
		if(T.eq(e.p1) || T.eq(e.p2)) return;

		let R = PathUtil.triangleTransform([D, P, B], T);

		// 太過細小的三角形可能會超出範圍，此時不考慮
		if(R.x * f < pt.x * f) return;

		this.data.addOns = [{
			contour: [D, T, R].map(p => p.toIPoint()),
			dir: new Line(T, R).reflect(p.direction).toIPoint()
		}];
		this.setupDetour([i == 0 ? T : D, R], [i == 0 ? D : T, R]);
		yield this.result(true, R.dist(T));
	}

	/** 銳角標準融合 */
	private *acuteStandardJoin(B: Point, D: Point, i: number, delta: Line): Generator<JoinResult> {
		if(D.isIntegral) return; // 退化成 base join，不考慮
		let { e1, e2, p1, p2 } = this.data;
		let e = [e1, e2][i], p = [p1, p2][i];
		let T = this.closestGridPoint(this.substituteEnd(e, D), B);

		// 如果找到的最近整點就是整個 Gadget 的尖端，
		// 這樣的變形是暫時的 river 演算法無法處理的，暫時不考慮
		// TODO: 未來改進 river 的演算法以接受這樣的 pattern
		if(T.eq(e.p1) || T.eq(e.p2)) return;

		let P = D.sub(B).slope.gt(1) ? delta.yIntersection(T.y) : delta.xIntersection(T.x);
		let R = PathUtil.triangleTransform([T, D, P], B);
		if(!this.setupAnchor(R)) return;
		this.data.addOns = [{
			contour: [B, T, R].map(p => p.toIPoint()),
			dir: new Line(T, B).reflect(p.direction).toIPoint()
		}];
		this.setupDetour(i == 0 ? [T, B] : [B], i == 0 ? [B] : [T, B]);
		yield this.result(true, B.dist(T));
	}

	/**
	 * 設定兩個 `Piece` 的繞道。
	 *
	 * 傳入的兩個陣列參數是從離融合點最遠的頂點開始列舉（不包含融合點本身）。
	 */
	private setupDetour(dt1: Point[], dt2: Point[]) {
		let { p1, p2, v1, v2, pt1, pt2 } = this.data;
		let d1 = dt1.map(p => p.add(v1).toIPoint()); d1.push(pt1);
		let d2 = dt2.map(p => p.add(v2).toIPoint()); d2.push(pt2);
		(this.joiner.cw ? d2 : d1).reverse();
		p1.clearDetour(); p1.addDetour(d1);
		p2.clearDetour(); p2.addDetour(d2);
	}

	/** 根據指定的點來設定交叉點的錨點，並傳回是否成功 */
	private setupAnchor(a: Point): boolean {
		let { a1, a2, v1, v2, f } = this.data;
		let { oriented, cw } = this.joiner;

		// 交叉錨點超過 delta 點的範圍則失敗
		if(a.x * f > this.deltaPt.x * f) return false;

		let left = oriented == cw;
		a1[left ? 3 : 1] = { location: a.add(v1).toIPoint() };
		a2[left ? 1 : 3] = { location: a.add(v2).toIPoint() };
		return true;
	}

	/** 產生要輸出的結果 */
	private result(json = false, extraSize?: number): JoinResult {
		let { p1, p2, a1, a2, off1, off2, offset, size, addOns } = this.data;
		this.data.addOns = undefined;
		if(offset) off2 = { x: off2.x + offset.x, y: off2.y + offset.y };
		return [{
			gadgets: [
				{ pieces: [json ? p1.toJSON() : p1], offset: this.simplifyIPoint(off1), anchors: a1.concat() },
				{ pieces: [json ? p2.toJSON() : p2], offset: this.simplifyIPoint(off2), anchors: a2.concat() }
			],
			addOns
		}, size + (extraSize ?? 0) * 10]; // extraSize 的權重設定為本體大小的十倍強
	}

	private simplifyIPoint(p: IPoint | undefined): IPoint | undefined {
		return p && p.x == 0 && p.y == 0 ? undefined : p;
	}
}
