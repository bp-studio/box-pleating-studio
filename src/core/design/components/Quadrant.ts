
type CoveredInfo = [number, number, Point[]];

//////////////////////////////////////////////////////////////////
/**
 * `Quadrant` 是負責管理一個 `Flap` 的其中一個象限的抽象物件。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Quadrant extends QuadrantBase {

	@shrewd public get $pattern(): Pattern | null {
		let stretch = this.$design.$stretches.$getByQuadrant(this);
		return stretch ? stretch.$pattern : null;
	}

	@orderedArray("qvj") private get _validJunctions(): readonly Junction[] {
		return this._flap.$validJunctions.filter(j => this._isIn(j));
	}

	@orderedArray("qcj") public get $coveredJunctions(): readonly Junction[] {
		return this._validJunctions.filter(j => j.$isCovered);
	}

	@noCompare public get $coveredInfo(): readonly CoveredInfo[] {
		return this.$coveredJunctions.map(j =>
			[j.ox, j.oy, j.$coveredBy.map(c => c.q1!.q == this.q ? c.q1!.$point : c.q2!.$point)]
		);
	}

	/** 傳回此向量目前所有的活躍 `Junction` 物件 */
	@orderedArray("qaj") public get $activeJunctions(): readonly Junction[] {
		return this._validJunctions.filter(j => !j.$isCovered);
	}

	/** 將指定的 Junction 移動到指定的基準點上，取得覆蓋比較矩形 */
	public $getBaseRectangle(j: Junction, base: TreeNode): Rectangle {
		let distance = this.$design.$tree.$dist(base, this._flap.node);
		let radius = this._flap.radius;
		let shift = this.qv.$scale(new Fraction(distance - radius));
		return new Rectangle(
			new Point(this.x(radius), this.y(radius)).addBy(shift),
			new Point(this.x(radius - j.ox), this.y(radius - j.oy)).addBy(shift)
		);
	}

	protected _isIn(j: Junction): boolean {
		return j.q1 == this || j.q2 == this;
	}

	protected _getOppositeQuadrant(j: Junction): Quadrant {
		return j.q1 == this ? j.q2! : j.q1!;
	}

	/** 產生此象限距離 d（不含半徑）的逆時鐘順序輪廓 */
	public $makeContour(d: number): Path {
		let contourRadius = this._flap.radius + d;
		let contourRadiusFraction = new Fraction(contourRadius);
		let startPt = this._getStart(contourRadiusFraction);
		let pattern = this.$pattern;
		let trace: Path;

		if(!pattern) {
			trace = [startPt, this.$point.add(this.qv.$scale(contourRadiusFraction))];
		} else {
			let initDisplacement = this.sv.$scale(contourRadiusFraction);
			let endPt = this.$point.add(initDisplacement.$rotate90());

			let lines = pattern.$linesForTracing[this.q].concat();
			if(debugEnabled && debug) {
				console.log(lines.map(l => l.toString()));
			}
			let junctions = pattern.$stretch.$junctions;

			// 在牽涉到融合的情況中，一個 Quadrant 需要負責的軌跡絕對不會超過 delta 線的範圍，
			// 所以如果 delta 線可以被定義就以該線為終點，否則就採用直觀上的縱橫終點線
			let end = this._findNextDelta(junctions, false);
			let inflections = new Set<string>();
			let lead = this._findLead(junctions, contourRadius, lines, inflections);
			let start = lead ? this._findNextDelta(junctions, true) : undefined;
			trace = Trace.$create(
				lines, lead ?? startPt, endPt,
				this.pv, inflections, end ?? new Line(endPt, this.pv), start
			);

			// 下面這一行去掉一些在非法導繪模式中可能產生的無效點；
			// 那些點會干擾 PolyBool 演算法
			while(this._isInvalidHead(trace[0], contourRadius, this.q % 2 != 1)) trace.shift();

			// 底下這部份的程式碼是為了在 join 的場合中順利聯集兩組輪廓而不會在中間出現缺口而設置的，
			// 未來採用比較具宏觀性的演算法的話這段可以拿掉。
			this._fixStart(trace, contourRadius, startPt, start);
			this._fixEnd(trace, contourRadius, endPt, end);
			Quadrant._trimEnd(trace, endPt);
		}

		// 底下這一行是用來偵錯數值爆表用的
		// if(trace.some(p => p._x.$isDangerous || p._y.$isDangerous)) console.log("danger");

		return trace;
	}

	private _fixStart(trace: Path, contourRadius: number, startPt: Point, start?: Line) {
		if(start && this._outside(trace[0], contourRadius, this.q % 2 != 1)) {
			trace.unshift(
				this.q % 2 ?
					start.$yIntersection(this.y(contourRadius)) :
					start.$xIntersection(this.x(contourRadius))
			);
		} else {
			// 底下的程式碼是為了確保輸出和前一種情況一致
			let l: number;
			while((l = trace.length) > 1 && new Line(startPt, trace[1]).$lineContains(trace[0])) {
				trace.shift();
			}
			trace.unshift(startPt);
		}
	}

	private _fixEnd(trace: Path, contourRadius: number, endPt: Point, end?: Line) {
		if(end) {
			if(this._outside(trace[trace.length - 1], contourRadius, this.q % 2 == 1)) {
				trace.push(this.q % 2 ?
					end.$xIntersection(this.x(contourRadius)) :
					end.$yIntersection(this.y(contourRadius))
				);
			}
			let last = trace[trace.length - 1];
			let append = this.q % 2 ? new Point(last._x, endPt._y) : new Point(endPt._x, last._y);
			if(!append.eq(endPt)) trace.push(append);
		}
	}

	/** 去掉尾端多餘的點，以確保輸出一致 */
	private static _trimEnd(trace: Path, end: Point) {
		let l: number;
		while((l = trace.length) > 1 && new Line(end, trace[l - 2]).$contains(trace[l - 1])) {
			trace.pop();
		}
	}

	/** 產生此象限距離 d（含半徑！）的輪廓起點 */
	private _getStart(d: Fraction) {
		return this.$point.add(this.sv.$scale(d));
	}

	/** 指定的點是否是在非法導繪模式中產生的無效點 */
	private _isInvalidHead(p: Point, r: number, x: boolean): boolean {
		if(!p) return false;
		let prevQ = this._flap.$quadrants[(this.q + 3) % 4];
		return (x ?
			(p.y - this.$point.y) * this.fy < 0 && p.x == this.x(r) :
			(p.x - this.$point.x) * this.fx < 0 && p.y == this.y(r)) &&
			prevQ._outside(p, r, !x);
	}

	/** 指定的點是否某個座標超過了自身的給定半徑範圍 */
	private _outside(p: Point, r: number, x: boolean): boolean {
		if(!p) return false;
		return x ? p.x * this.fx > this.x(r) * this.fx : p.y * this.fy > this.y(r) * this.fy;
	}

	private _findNextDelta(junctions: readonly Junction[], cw: boolean): Line | undefined {
		let find = this._findJoinNextQ(junctions, cw, true);
		if(!find) return undefined;

		let { joinQ, nextQ, mode } = find;
		let { d1, d2 } = this.$design.$tree
			.$distTriple(this._flap.node, nextQ._flap.node, joinQ._flap.node);
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
	private _findJoinNextQ(junctions: readonly Junction[], cw: boolean, next: boolean) {
		if(junctions.length == 1) return undefined;

		let mode = Boolean(this.q % 2) == cw;
		let key: JunctionDimension = mode ? "oy" : "ox";
		let minJ = Junction.$findMinMax(junctions.filter(j => this._isIn(j)), key, -1);
		let joinQ = this._getOppositeQuadrant(minJ);
		if(joinQ.$activeJunctions.length == 1) return undefined;

		let nextJ: Junction;
		if(next) {
			let sort = joinQ.$activeJunctions.concat().sort((a, b) => a[key] - b[key]);
			nextJ = sort[sort.indexOf(minJ) + 1];
			if(!nextJ) return undefined;
		} else {
			nextJ = Junction.$findMinMax(joinQ.$activeJunctions, key, 1);
			if(nextJ == minJ) return undefined;
		}

		let nextQ = nextJ.q1 == joinQ ? nextJ.q2! : nextJ.q1!;
		return { joinQ, nextQ, mode };
	}

	/** 判定在產生軌跡的時候是否有必要從更遠的地方開始描繪（導繪） */
	private _findLead(
		junctions: readonly Junction[], d: number, lines: Line[], inflections: Set<string>
	): Point | undefined {
		let find = this._findJoinNextQ(junctions, true, false);
		if(!find) return undefined;

		let { joinQ, nextQ } = find;
		let junction = this.$design.$junctions.get(this._flap, nextQ._flap)!;
		let ok = junction.$status == JunctionStatus.tooFar;
		let dist = this.$design.$tree
			.$distTriple(this._flap.node, nextQ._flap.node, joinQ._flap.node);

		// 一般來說只有當 d > dist.d1 的時候有必要作導繪，
		// 但是當 !ok 的時候整個情況會特別奇怪，因此額外開放。
		if(d <= dist.d1 && ok) return undefined;

		let d2 = d - dist.d1 + dist.d2;

		// 加入反曲點
		let inflection = this.q % 2 ?
			new Point(nextQ.x(d2), this.y(d)) :
			new Point(this.x(d), nextQ.y(d2));
		inflections.add(inflection.toString());
		if(d2 == 0) inflections.add(nextQ.$point.toString());

		// 距離更小的時候的特殊處理
		if(d < dist.d1) {
			let i = lines.findIndex(l => l.$contains(inflection));
			if(i >= 0) {
				// 如果 delta 線包含了反曲點，那軌跡繪製的時候必須忽略 delta 線，否則結果會有 bug
				lines.splice(i, 1);
			} else {
				// 否則加入額外線條
				lines.push(new Line(inflection, this.qv));
			}
		}

		return nextQ._findLead(junctions, d2, lines, inflections) ??
			nextQ._getStart(new Fraction(d2));
	}

	/**
	 * 偵錯用；列印 makeContour(d) 的過程
	 *
	 * @exports
	 */
	public debug(d: number = 0) {
		debug = true;
		console.log(this.$makeContour(d).map(p => p.toString()));
		debug = false;
	}
}
