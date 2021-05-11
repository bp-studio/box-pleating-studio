
interface JoinData {
	readonly size: number;
	readonly c1: JoinCandidate;
	readonly c2: JoinCandidate;
	readonly offset?: IPoint;
	readonly pt: Point;
	readonly bv: Vector; // 軸平行摺痕的角平分線向量
	readonly org: Point;
	readonly f: number;
	addOns?: JAddOn[];
}

//////////////////////////////////////////////////////////////////
/**
 * `JoinerCore` 負責執行把兩個給定的 `Gadget` 融合成一個 `Device` 的核心計算。
 */
//////////////////////////////////////////////////////////////////

class JoinerCore {

	/** extraSize 的權重設定為本體大小的十倍強 */
	private static readonly _EXTRA_SIZE_WEIGHT = 10;

	private joiner: Joiner;
	private data: JoinData;

	constructor(joiner: Joiner, p1: Piece, p2: Piece) {
		let { $oriented, s1, s2, q1, q2 } = this.joiner = joiner;
		let size = p1.sx + p2.sx;

		let b1 = new JoinCandidateBuilder(p1, q1, joiner);
		let b2 = new JoinCandidateBuilder(p2, q2, joiner);

		// 計算接力融合的起點
		if(s1) size += b1.$setup(b2, 1, s1);
		if(s2) size += b2.$setup(b1, -1, s2);
		if(isNaN(size)) return;

		// 從 p2 觀點變成 p1 觀點時的相對位移和需要加上的向量
		let offset: IPoint | undefined;
		if(!$oriented) b2.$additionalOffset = offset = { x: p1.sx - p2.sx, y: p1.sy - p2.sy };

		// 整理所有會用到的重要參數
		let pt = s1 ? b1.$anchor : b2.$anchor;
		let bv = Vector.$bisector(p1.$direction, p2.$direction);
		let f = $oriented ? 1 : -1;

		let org = Point.ZERO;
		if(!$oriented) org = s1 ? b1.$jAnchor : b1.$anchor;

		this.data = { c1: b1.$build(pt), c2: b2.$build(pt), offset, size, pt, bv, org, f };
	}

	/** 嘗試把兩個 GOPS `Piece` 簡單融合成一個 `Device` */
	public *$simpleJoin(): Generator<JoinResult> {
		if(!this.data) return;
		let { c1, c2, pt, bv } = this.data;

		// 找出交點
		let int = c1.e.$intersection(c2.e); // p1 觀點
		if(!int) return;

		// 檢查簡單融合條件
		if(
			!c1.p.$direction.$parallel(c2.p.$direction) &&
			!int.sub(pt).$parallel(bv)
		) return;

		// 完成並輸出
		if(!this._setupAnchor(int)) return;
		this._setupDetour([int], [int]);
		yield this._result();
	}

	@onDemand private get _deltaPt(): Point {
		let { org, c1, c2, f } = this.data;
		let { cw, $intDist } = this.joiner;
		return new Point(
			org.x + ($intDist - (cw ? c2.p : c1.p).ox) * f,
			org.y + ($intDist - (cw ? c1.p : c2.p).oy) * f
		);
	}

	/**
	 * base join 的四個關鍵交點。
	 *
	 * 值得注意的是這四個點不一定總是存在；
	 * 如果兩個 Gadget 的角度非常地「直」，可能只有其中一對會有。
	 */
	private _baseJoinIntersections() {
		let { bv, c1, c2, pt } = this.data;
		let delta = new Line(this._deltaPt, Quadrant.QV[0]), beta = new Line(pt, bv);
		let D1 = c1.e.$intersection(delta)!, D2 = c2.e.$intersection(delta)!;
		let B1 = c1.e.$intersection(beta)!, B2 = c2.e.$intersection(beta)!;
		return { D1, D2, B1, B2, delta };
	}

	public *$baseJoin(): Generator<JoinResult> {
		if(!this.data) return;
		let { D1, D2, B1, B2 } = this._baseJoinIntersections();

		if(B1?.$isIntegral && D2?.$isIntegral && !B1.eq(D2)) {
			if(!this._setupAnchor(D2)) return;
			this._setupDetour([B1], [D2, B1]);
			yield this._result(true);
		}
		if(B2?.$isIntegral && D1?.$isIntegral && !B2.eq(D1)) {
			if(!this._setupAnchor(D1)) return;
			this._setupDetour([D1, B2], [B2]);
			yield this._result();
		}
	}

	/** 把關鍵邊線的其中一個端點換成 B 交點以得到變形前的真正邊線 */
	private _substituteEnd(e: Line, p: Point): Line {
		let [p1, p2] = e.$xOrient();
		return new Line(p, this.joiner.$oriented ? p2 : p1);
	}

	private static _closestGridPoint(e: Line, p: Point): Point {
		let r!: Point, d: number = Number.POSITIVE_INFINITY;
		for(let i of e.$gridPoints()) {
			let dist = i.$dist(p);
			if(dist < d) {
				d = dist;
				r = i;
			}
		}
		return r;
	}

	public *$standardJoin(): Generator<JoinResult> {
		if(!this.data) return;
		let { D1, D2, B1, B2, delta } = this._baseJoinIntersections();
		let { f } = this.data;

		if(B1 && D2 && !B1.eq(D2)) {
			if(D2.x * f > B1.x * f) yield* this._obtuseStandardJoin(B1, D2, 0);
			else yield* this._acuteStandardJoin(B1, D2, 1, delta);
		}
		if(B2 && D1 && !B2.eq(D1)) {
			if(D1.x * f > B2.x * f) yield* this._obtuseStandardJoin(B2, D1, 1);
			else yield* this._acuteStandardJoin(B2, D1, 0, delta);
		}
	}

	/** 鈍角標準融合 */
	private *_obtuseStandardJoin(B: Point, D: Point, i: number): Generator<JoinResult> {
		if(B.$isIntegral) return; // 退化成 base join，不考慮
		let { c1, c2, pt, f } = this.data;
		let e = [c1.e, c2.e][i], p = [c1.p, c2.p][i];

		// 若兩個 Gadget 的方向是內聚而非發散的，則鈍角融合不可能成立（至少目前沒有這種變換概念存在）
		// TODO: 仔細思考這一點
		if(this.joiner.cw != c1.$isSteeperThan(c2)) return;

		if(!this._setupAnchor(D)) return;
		let P = D.sub(B).$slope.gt(Fraction.ONE) ? e.$xIntersection(D.x) : e.$yIntersection(D.y);
		let T = JoinerCore._closestGridPoint(this._substituteEnd(e, B), D);

		// 如果找到的最近整點就是整個 Gadget 的尖端，
		// 這樣的變形是暫時的 river 演算法無法處理的，暫時不考慮
		// TODO: 未來改進 river 的演算法以接受這樣的 pattern
		if(T.eq(e.p1) || T.eq(e.p2)) return;

		let R = PathUtil.$triangleTransform([D, P, B], T);

		// 太過細小的三角形可能會超出範圍，此時不考慮
		if(R.x * f < pt.x * f) return;

		// 利用線段交叉來檢查變換之後的 R 點有沒有跑到外面去
		e = this._substituteEnd([c1.e, c2.e][1 - i], D);
		let test = e.$intersection(new Line(T, R));
		if(test && !test.eq(T) && !test.eq(R)) return;

		this.data.addOns = [{
			contour: [D, T, R].map(point => point.$toIPoint()),
			dir: new Line(T, R).$reflect(p.$direction).$toIPoint(),
		}];
		this._setupDetour([i == 0 ? T : D, R], [i == 0 ? D : T, R]);
		yield this._result(true, R.$dist(T));
	}

	/** 銳角標準融合 */
	private *_acuteStandardJoin(B: Point, D: Point, i: number, delta: Line): Generator<JoinResult> {
		if(D.$isIntegral) return; // 退化成 base join，不考慮
		let { c1, c2 } = this.data;
		let e = [c1.e, c2.e][i], p = [c1.p, c2.p][i];
		let T = JoinerCore._closestGridPoint(this._substituteEnd(e, D), B);

		// 如果找到的最近整點就是整個 Gadget 的尖端，
		// 這樣的變形是暫時的 river 演算法無法處理的，暫時不考慮
		// TODO: 未來改進 river 的演算法以接受這樣的 pattern
		if(T.eq(e.p1) || T.eq(e.p2)) return;

		let P = D.sub(B).$slope.gt(Fraction.ONE) ?
			delta.$yIntersection(T.y) : delta.$xIntersection(T.x);
		let R = PathUtil.$triangleTransform([T, D, P], B);
		if(!this._setupAnchor(R)) return;
		this.data.addOns = [{
			contour: [B, T, R].map(point => point.$toIPoint()),
			dir: new Line(T, B).$reflect(p.$direction).$toIPoint(),
		}];
		this._setupDetour(i == 0 ? [T, B] : [B], i == 0 ? [B] : [T, B]);
		yield this._result(true, B.$dist(T));
	}

	/**
	 * 設定兩個 `Piece` 的繞道。
	 *
	 * 傳入的兩個陣列參數是從離融合點最遠的頂點開始列舉（不包含融合點本身）。
	 */
	private _setupDetour(dt1: Point[], dt2: Point[]) {
		let { c1, c2 } = this.data;
		let shouldReverse2 = this.joiner.cw;
		c1.$setupDetour(dt1, !shouldReverse2);
		c2.$setupDetour(dt2, shouldReverse2);
	}

	/** 根據指定的點來設定交叉點的錨點，並傳回是否成功 */
	private _setupAnchor(a: Point): boolean {
		let { c1, c2, f } = this.data;
		let { $oriented, cw } = this.joiner;

		// 交叉錨點超過 delta 點的範圍則失敗
		if(a.x * f > this._deltaPt.x * f) return false;

		c1.$setupAnchor($oriented != cw, a);
		c2.$setupAnchor($oriented == cw, a);
		return true;
	}

	/** 產生要輸出的結果 */
	private _result(json?: boolean, extraSize?: number): JoinResult {
		let { c1, c2, offset, size, addOns } = this.data;
		this.data.addOns = undefined;
		return [
			{
				gadgets: [c1.$toGadget(json), c2.$toGadget(json, offset)],
				addOns,
			},
			size + (extraSize ?? 0) * JoinerCore._EXTRA_SIZE_WEIGHT,
		];
	}
}
