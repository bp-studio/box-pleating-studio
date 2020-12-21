

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

	private readonly qv: Vector; // 角落方位向量
	private readonly sv: Vector; // 起始點方位向量
	private readonly pv: Vector; // 起始方向向量

	private readonly fx: number;
	private readonly fy: number;

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
	public makeContour(d: number): paper.Point[] {
		let r = this.flap.radius + d;
		let v = this.sv.scale(r);
		let startPt = this.getStart(r);
		let endPt = this.point.add(v.rotate90());
		let pattern = this.pattern;
		let trace: Path;

		if(!pattern) {
			trace = [startPt, this.point.add(this.qv.scale(r))];
		} else {
			let lines = pattern.linesForTracing[this.q].concat();
			let junctions = pattern.stretch.junctions;

			// 在牽涉到融合的情況中，一個 Quadrant 需要負責的軌跡絕對不會超過 delta 線的範圍，
			// 所以如果 delta 線可以被定義就以該線為終點，否則就採用直觀上的縱橫終點線
			let end = this.findNextDelta(junctions, false);
			let lead = this.findLead(junctions, r, lines);
			let start = lead ? this.findNextDelta(junctions, true) : undefined;
			trace = Trace.create(lines, lead ?? startPt, this.pv, end ?? new Line(endPt, this.pv), start);

			// 底下這部份的程式碼是為了在 join 的場合中順利聯集兩組輪廓而不會在中間出現缺口而設置的，
			// 未來採用比較具宏觀性的演算法的話這段可以拿掉。
			if(start && this.outside(trace[0], r, this.q % 2 != 1)) {
				trace.unshift(this.q % 2 ? start.yIntersection(this.y(r)) : start.xIntersection(this.x(r)));
			}
			if(end &&this.outside(trace[trace.length - 1], r, this.q % 2 == 1)) {
				trace.push(this.q % 2 ? end.xIntersection(this.x(r)) : end.yIntersection(this.y(r)));
			}
		}
		return trace.map(p => p.toPaper())
	}

	private outside(p: Point, r: number, x: boolean) {
		return x ? p.x * this.fx > this.x(r) * this.fx : p.y * this.fy > this.y(r) * this.fy;
	}

	/** 產生此象限距離 d（含半徑！）的輪廓起點 */
	private getStart(d: number) {
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
	private findLead(junctions: readonly Junction[], d: number, lines: Line[]): Point | undefined {
		let find = this.findJoinNextQ(junctions, true, false);
		if(!find) return undefined;

		let { joinQ, nextQ } = find;
		let ok = this.design.junctions.get(this.flap, nextQ.flap)!.status != JunctionStatus.tooClose;
		let dist = this.design.tree.distTriple(this.flap.node, nextQ.flap.node, joinQ.flap.node);

		// 一般來說只有當 d > dist.d1 的時候有必要作導繪，
		// 但是當 !ok 的時候整個情況會特別奇怪，因此額外開放。
		if(d <= dist.d1 && ok) return undefined;

		let d2 = d - dist.d1 + dist.d2;

		// 必要的時候在線條清單裡面加入一小條額外的轉向線。
		// 注意這個條件在此是比 !ok 更嚴格的。
		if(d <= dist.d1) {
			let p1 = this.q % 2 ? new Point(nextQ.x(d2), this.y(d)) : new Point(this.x(d), nextQ.y(d2));
			lines.push(new Line(p1, this.qv.neg));
		}

		return nextQ.findLead(junctions, d2, lines) ?? nextQ.getStart(d2);
	}

	/** 在找出延伸河道輪廓的時候，應該被扣除的不該考慮部份 */
	public getOverriddenPath(d: number): paper.PathItem[] {
		let result: paper.PathItem[] = [];
		if(this.pattern) return result;
		let r = this.flap.radius + d;
		for(let [j, pts] of this.coveredJunctions) {
			let { ox, oy } = j;
			let p = this.point.add(this.qv.scale(r));

			// 扣除的部份不要超過覆蓋者所能夠繪製的輪廓範圍，否則會扣太多
			for(let pt of pts) {
				let diff = pt.sub(p);
				ox = Math.min(-diff.x * this.fx, ox);
				oy = Math.min(-diff.y * this.fy, oy);
			}

			let v = new Vector(ox * this.fx, oy * this.fy);
			result.push(new paper.Path.Rectangle(p.toPaper(), p.sub(v).toPaper()));
		}
		return result;
	}

	@shrewd public get pattern(): Pattern | null {
		let stretch = this.design.getStretchByQuadrant(this);
		return stretch ? stretch.pattern : null;
	}

	@shrewd public get corner(): paper.Point {
		let r = this.flap.radius;
		return this.point.add(this.qv.scale(r)).toPaper();
	}

	@shrewd private get junctions(): readonly Junction[] {
		return this.design.junctionsByQuadrant.get(this) ?? [];
	}

	@shrewd private get coveredJunctions(): readonly [Junction, Point[]][] {
		return this.junctions
			.filter(j => j.isValid && j.isCovered)
			.map(j => {
				let q3 = j.q1 == this ? j.q2 : j.q1;
				return [j, j.coveredBy.map(c => c.q1 == q3 ? c.q2!.point : c.q1!.point)];
			});
	}

	// 有待釐清：疑似用不到（參見 Junction.isValid）
	// @shrewd public get isValid(): boolean {
	// 	return !this.junctions.some(j => j.status == JunctionStatus.tooClose);
	// }

	@shrewd public get point(): Point {
		return this.flap.points[this.q];
	}

	/** 傳回此向量目前所有的活躍 `Junction` 物件 */
	@shrewd public get activeJunctions(): readonly Junction[] {
		let result = this.design.activeJunctionsByQuadrant.get(this);
		return result ? result : [];
	}

	public createSideRidge(pt: Point): Line | null {
		let r = this.flap.radius;
		let { x, y } = pt.sub(this.point).scale(this.qv);
		if(!(0 < x && x < r && 0 < y && y < r)) return null;
		let d = Math.min(r - x, r - y);
		let v = this.qv.scale(d);
		return new Line(pt, pt.add(v));
	}

	/** 把一個象限方向作相位變換處理 */
	public static transform(dir: number, fx: number, fy: number) {
		if(fx < 0) dir += dir % 2 ? 3 : 1;
		if(fy < 0) dir += dir % 2 ? 1 : 3;
		return dir % 4;
	}

	public getBaseRectangle(j: Junction): Rectangle {
		let r = this.flap.radius;
		return new Rectangle(
			new Point(this.x(r), this.y(r)),
			new Point(this.x(r - j.ox), this.y(r - j.oy))
		);
	}

	/** 偵錯用；列印 makeContour(d) 的過程 */
	public debug(d: number = 0) {
		debug = true;
		console.log(this.makeContour(d).map(p => p.toString()));
		debug = false;
	}
}
