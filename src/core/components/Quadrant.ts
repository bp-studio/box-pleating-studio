
type CoveredInfo = [number, number, Point[]];

//////////////////////////////////////////////////////////////////
/**
 * `Quadrant` 是負責管理一個 `Flap` 的其中一個象限的抽象物件。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Quadrant extends SheetObject {

	/** 指著象限斜方向的向量 */
	public static readonly QV: readonly Vector[] = [
		new Vector(1, 1),
		new Vector(-1, 1),
		new Vector(-1, -1),
		new Vector(1, -1)
	];

	/** 指著象限追蹤起點方向的向量 */
	private static readonly SV: readonly Vector[] = [
		new Vector(1, 0),
		new Vector(0, 1),
		new Vector(-1, 0),
		new Vector(0, -1)
	];

	public readonly q: QuadrantDirection;
	public readonly flap: Flap;

	/** 角落方位向量 */
	public readonly qv: Vector;

	/** 起始點方位向量 */
	private readonly sv: Vector;

	/** 起始方向向量 */
	private readonly pv: Vector;

	public readonly fx: number;
	public readonly fy: number;

	constructor(sheet: Sheet, flap: Flap, q: QuadrantDirection) {
		super(sheet);
		this.flap = flap;
		this.q = q;

		this.qv = Quadrant.QV[q];
		this.sv = Quadrant.SV[q];
		this.pv = Quadrant.SV[(q + 1) % 4];

		this.fx = this.q == 0 || this.q == 3 ? 1 : -1;
		this.fy = this.q == 0 || this.q == 1 ? 1 : -1;
	}

	/**
	 * 在有河的情況下，計算相對於當前 `Quadrant` 的重疊區域的角落
	 *
	 * @param q 要取得哪一個未經相位變換之前的角
	 * @param d 額外距離
	 */
	public getOverlapCorner(ov: JOverlap, parent: JJunction, q: number, d: number): Point {
		let r = this.flap.radius + d;
		let sx = ov.shift?.x ?? 0;
		let sy = ov.shift?.y ?? 0;

		// 如果當前的 Quadrant 是位於 parent 的對面方向，則位置要相反計算
		if(this.flap.node.id != parent.c[0].e) {
			sx = parent.ox - (ov.ox + sx);
			sy = parent.oy - (ov.oy + sy);
		}

		return new Point(
			this.x(r - (q == 3 ? 0 : ov.ox) - sx),
			this.y(r - (q == 1 ? 0 : ov.oy) - sy)
		);
	}

	/** 產生此象限距離 d（不含半徑）的逆時鐘順序輪廓 */
	public makeContour(d: number): Path {
		let r = this.flap.radius + d;
		let s = new Fraction(r);
		let v = this.sv.scale(s);
		let startPt = this.getStart(s);
		let endPt = this.point.add(v.rotate90());
		let pattern = this.pattern;
		let trace: Path;

		if(!pattern) {
			trace = [startPt, this.point.add(this.qv.scale(s))];
		} else {
			let lines = pattern.linesForTracing[this.q].concat();
			if(debugEnabled && debug) {
				console.log(lines.map(l => l.toString()));
			}
			let junctions = pattern.stretch.junctions;

			// 在牽涉到融合的情況中，一個 Quadrant 需要負責的軌跡絕對不會超過 delta 線的範圍，
			// 所以如果 delta 線可以被定義就以該線為終點，否則就採用直觀上的縱橫終點線
			let end = this.findNextDelta(junctions, false);
			let inflections = new Set<string>();
			let lead = this.findLead(junctions, r, lines, inflections);
			let start = lead ? this.findNextDelta(junctions, true) : undefined;
			trace = Trace.create(lines, lead ?? startPt, endPt, this.pv, inflections, end ?? new Line(endPt, this.pv), start);

			// 下面這一行去掉一些在非法導繪模式中可能產生的無效點；
			// 那些點會干擾 PolyBool 演算法
			while(this.isInvalidHead(trace[0], r, this.q % 2 != 1)) trace.shift();

			// 底下這部份的程式碼是為了在 join 的場合中順利聯集兩組輪廓而不會在中間出現缺口而設置的，
			// 未來採用比較具宏觀性的演算法的話這段可以拿掉。
			if(start && this.outside(trace[0], r, this.q % 2 != 1)) {
				trace.unshift(this.q % 2 ? start.yIntersection(this.y(r)) : start.xIntersection(this.x(r)));
			} else {
				// 底下的程式碼是為了確保輸出和前一種情況一致
				let l: number;
				while((l = trace.length) > 1 && new Line(startPt, trace[1]).lineContains(trace[0])) {
					trace.shift();
				}
				trace.unshift(startPt);
			}

			if(end) {
				if(this.outside(trace[trace.length - 1], r, this.q % 2 == 1)) {
					trace.push(this.q % 2 ? end.xIntersection(this.x(r)) : end.yIntersection(this.y(r)));
				}
				let last = trace[trace.length - 1];
				let append = this.q % 2 ? new Point(last._x, endPt._y) : new Point(endPt._x, last._y);
				if(!append.eq(endPt)) trace.push(append);
			}
		}

		// 底下的程式碼是為了確保輸出一致
		let l: number;
		while((l = trace.length) > 1 && new Line(endPt, trace[l - 2]).contains(trace[l - 1])) {
			trace.pop();
		}

		// 底下這一行是用來偵錯數值爆表用的
		// if(trace.some(p => p._x.$isDangerous || p._y.$isDangerous)) console.log("danger");

		return trace;
	}

	/** 指定的點是否是在非法導繪模式中產生的無效點 */
	private isInvalidHead(p: Point, r: number, x: boolean): boolean {
		if(!p) return false;
		let prevQ = this.flap.quadrants[(this.q + 3) % 4];
		return (x ?
			(p.y - this.point.y) * this.fy < 0 && p.x == this.x(r) :
			(p.x - this.point.x) * this.fx < 0 && p.y == this.y(r)) &&
			prevQ.outside(p, r, !x);
	}

	/** 指定的點是否某個座標超過了自身的給定半徑範圍 */
	private outside(p: Point, r: number, x: boolean): boolean {
		if(!p) return false;
		return x ? p.x * this.fx > this.x(r) * this.fx : p.y * this.fy > this.y(r) * this.fy;
	}

	/** 產生此象限距離 d（含半徑！）的輪廓起點 */
	private getStart(d: Fraction) {
		return this.point.add(this.sv.scale(d));
	}

	/** 取得象限點沿著象限方線距離 d 的 y 座標 */
	private y(d: number) {
		return this.point.y + this.fy * d;
	}

	/** 取得象限點沿著象限方線距離 d 的 x 座標 */
	private x(d: number) {
		return this.point.x + this.fx * d;
	}

	private findNextDelta(junctions: readonly Junction[], cw: boolean): Line | undefined {
		let find = this.findJoinNextQ(junctions, cw, true);
		if(!find) return undefined;

		let { joinQ, nextQ, mode } = find;
		let { d1, d2 } = this.design.tree.distTriple(this.flap.node, nextQ.flap.node, joinQ.flap.node);
		let int = mode ? new Point(nextQ.x(d2), this.y(d1)) : new Point(this.x(d1), nextQ.y(d2));

		// 傳回 delta 直線
		return new Line(int, this.qv);
	}

	/**
	 * 在 Pattern 中找出指定方向中的下一個（或最遠的）Quadrant。
	 * @param junctions Pattern 對應的全體 Junction
	 * @param cw 是否要找順時鐘方向
	 * @param next 傳入 true 表示找下一個；否表示找最遠的
	 */
	private findJoinNextQ(junctions: readonly Junction[], cw: boolean, next: boolean) {
		if(junctions.length == 1) return undefined;

		let mode = !!(this.q % 2) == cw;
		let key: JunctionDimension = mode ? "oy" : "ox";
		let minJ = Junction.findMinMax(junctions.filter(j => j.q1 == this || j.q2 == this), key, -1);
		let joinQ = minJ.q1 == this ? minJ.q2! : minJ.q1!;
		if(joinQ.activeJunctions.length == 1) return undefined;

		let nextJ: Junction;
		if(next) {
			let sort = joinQ.activeJunctions.concat().sort((a, b) => a[key] - b[key]);
			nextJ = sort[sort.indexOf(minJ) + 1];
			if(!nextJ) return undefined;
		} else {
			nextJ = Junction.findMinMax(joinQ.activeJunctions, key, 1);
			if(nextJ == minJ) return undefined;
		}

		let nextQ = nextJ.q1 == joinQ ? nextJ.q2! : nextJ.q1!;
		return { joinQ, nextQ, mode };
	}

	/** 判定在產生軌跡的時候是否有必要從更遠的地方開始描繪（導繪） */
	private findLead(junctions: readonly Junction[], d: number, lines: Line[], inflections: Set<string>): Point | undefined {
		let find = this.findJoinNextQ(junctions, true, false);
		if(!find) return undefined;

		let { joinQ, nextQ } = find;
		let ok = this.design.junctions.get(this.flap, nextQ.flap)!.status == JunctionStatus.tooFar;
		let dist = this.design.tree.distTriple(this.flap.node, nextQ.flap.node, joinQ.flap.node);

		// 一般來說只有當 d > dist.d1 的時候有必要作導繪，
		// 但是當 !ok 的時候整個情況會特別奇怪，因此額外開放。
		if(d <= dist.d1 && ok) return undefined;

		let d2 = d - dist.d1 + dist.d2;

		// 加入反曲點
		let inflection = this.q % 2 ? new Point(nextQ.x(d2), this.y(d)) : new Point(this.x(d), nextQ.y(d2));
		inflections.add(inflection.toString());
		if(d2 == 0) inflections.add(nextQ.point.toString());

		// 距離更小的時候的特殊處理
		if(d < dist.d1) {
			let i = lines.findIndex(l => l.contains(inflection));
			if(i >= 0) {
				// 如果 delta 線包含了反曲點，那軌跡繪製的時候必須忽略 delta 線，否則結果會有 bug
				lines.splice(i, 1);
			} else {
				// 否則加入額外線條
				lines.push(new Line(inflection, this.qv));
			}
		}

		return nextQ.findLead(junctions, d2, lines, inflections) ?? nextQ.getStart(new Fraction(d2));
	}

	@shrewd public get pattern(): Pattern | null {
		let stretch = this.design.getStretchByQuadrant(this);
		return stretch ? stretch.pattern : null;
	}

	@shrewd public get corner(): Point {
		let r = new Fraction(this.flap.radius);
		return this.point.add(this.qv.scale(r));
	}

	@orderedArray("qvj") private get validJunctions(): readonly Junction[] {
		return this.flap.validJunctions.filter(j => j.q1 == this || j.q2 == this);
	}

	@orderedArray("qcj") public get coveredJunctions(): readonly Junction[] {
		return this.validJunctions.filter(j => j.isCovered);
	}

	@noCompare public get coveredInfo(): readonly CoveredInfo[] {
		return this.coveredJunctions.map(j =>
			[j.ox, j.oy, j.coveredBy.map(c => c.q1!.q == this.q ? c.q1!.point : c.q2!.point)]
		);
	}

	@shrewd public get point(): Point {
		return this.flap.points[this.q];
	}

	/** 傳回此向量目前所有的活躍 `Junction` 物件 */
	@orderedArray("qaj") public get activeJunctions(): readonly Junction[] {
		return this.validJunctions.filter(j => !j.isCovered);
	}

	/** 把一個象限方向作相位變換處理 */
	public static transform(dir: number, fx: number, fy: number) {
		if(fx < 0) dir += dir % 2 ? 3 : 1;
		if(fy < 0) dir += dir % 2 ? 1 : 3;
		return dir % 4;
	}

	/** 將指定的 Junction 移動到指定的基準點上，取得覆蓋比較矩形 */
	public getBaseRectangle(j: Junction, base: TreeNode): Rectangle {
		let d = this.design.tree.dist(base, this.flap.node);
		let r = this.flap.radius;
		let v = this.qv.scale(new Fraction(d - r));
		return new Rectangle(
			new Point(this.x(r), this.y(r)).addBy(v),
			new Point(this.x(r - j.ox), this.y(r - j.oy)).addBy(v)
		);
	}

	/** 偵錯用；列印 makeContour(d) 的過程 */
	public debug(d: number = 0) {
		debug = true;
		console.log(this.makeContour(d).map(p => p.toString()));
		debug = false;
	}
}
