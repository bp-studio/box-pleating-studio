
interface JIntersection {
	point: Point;
	dist: Fraction;
	angle: number;

	/** 交點是否在線段內部 */
	interior: boolean;
}

interface TraceNode {
	point: Point;
	vector: Vector;
	shift?: Vector;
}

interface ShootingNode {
	intersection: JIntersection;
	line: Line;
}

//////////////////////////////////////////////////////////////////
/**
 * 產生軌跡的工具類別。
 */
//////////////////////////////////////////////////////////////////

class Trace {

	private readonly _full: Path = [];
	private readonly _trace: Path = [];
	private readonly _record = new Set<string>();
	private readonly _candidates: Set<Line>;

	/**
	 * 軌跡產生演算法。
	 *
	 * @param _inflections 反曲點座標字串的集合；如果遇到這些點的話，內外側的判定要顛倒
	 * @param _endLine 終點線；如果過程中撞到這條線則停止
	 * @param _startLine 指定起點線；這個值有指定表示要用導繪模式
	 */
	constructor(
		lines: readonly Line[],
		private readonly _endPt: Point,
		private readonly _inflections: Set<string>,
		private readonly _endLine: Line,
		private readonly _startLine?: Line
	) {
		this._candidates = new Set(lines);
	}

	/**
	 * 產生路徑的核心程式碼
	 * @param startPt 軌跡的起點
	 * @param sv 軌跡的初始方向向量
	 */
	public $create(startPt: Point, sv: Vector): Path {
		let node: TraceNode = {
			point: startPt,
			vector: sv,
		};
		let isInLeadMode = Boolean(this._startLine);
		let shooting = this.lineShooting(node);

		if(debugEnabled && debug) {
			console.log("StartPt: " + startPt.toString());
			console.log("Start: " + this._startLine?.toString());
			console.log("Inflections: ", [...this._inflections].toString());
		}

		while(shooting != null) {
			let pt = shooting.intersection.point;
			let segment = new Line(node.point, pt);

			if(isInLeadMode) isInLeadMode = !this._processLeadMode(segment);
			if(this._processGoal(segment)) break;
			this.detectLoop(pt);

			// 自動化簡輸出，不連續輸出同樣的點
			if(!isInLeadMode) Trace._pushIfNotEqual(this._trace, pt);

			node = Trace._reflect(node, shooting);

			// 反射過的線就不再列入考慮；理論上只要輸入資料沒錯，不可能同一條線會用到兩次
			this._candidates.delete(shooting.line);

			shooting = this.lineShooting(node);
		}

		return this._trace;
	}

	/** 導繪模式的處理 */
	private _processLeadMode(segment: Line): boolean {
		let p = segment.$intersection(this._startLine!);
		if(p) { // 撞到了起點線，加入交點
			this._trace.push(p);
			return true;
		}
		return false;
	}

	/** 是否有撞到了終點（優先）或終點線 */
	private _processGoal(currentSegment: Line): boolean {
		if(currentSegment.$contains(this._endPt, true)) return true;
		let goal = currentSegment.$intersection(this._endLine);
		if(goal) {
			this._trace.push(goal);
			return true;
		}
		return false;
	}

	/** 偵測迴圈；迴圈是只有當有 meandering 的時候才會產生 */
	private detectLoop(pt: Point) {
		let sg = pt.toString();
		if(this._record.has(sg)) {
			if(!pt.eq(this._full[this._full.length - 1])) this.processLoop(pt);
		} else {
			this._record.add(sg);
		}
		Trace._pushIfNotEqual(this._full, pt);
	}

	/**
	 * 底下這段程式碼負責解決 ray shooting problem。
	 *
	 * 這邊我使用的是最直觀但也最沒有效率的逐一檢查每一條線段的方法，
	 * 這樣做的話每回合都需要 O(n) 的運算量，再加上全部約有 O(n) 的回合數，
	 * 全部的運算量高達 O(n^2)；然而從效能的角度來看，
	 * 這一部份的計算耗時並不是目前最吃重的部份，所以並不是非常急著改進。
	 */
	private lineShooting(node: TraceNode): ShootingNode | null {
		let currentIntersection: JIntersection | null = null;
		let currentLine: Line | null = null;
		let { point, vector, shift } = node;

		for(let line of this._candidates) {
			let intersection = Trace.$getIntersection(line, point, vector);
			if(intersection) {
				// 完全落在外邊的線不列入考慮，因為那其實跟反射無關
				let angle = shift ? Trace._getAngle(vector, shift) : undefined;
				let f: Sign = this._inflections.has(intersection.point.toString()) ? -1 : 1;
				if(
					!intersection.interior &&
					!Trace._isSideTouchable(line, point, vector, f, angle)
				) continue;

				if(debugEnabled && debug) {
					console.log([JSON.stringify(intersection), line.toString()]);
				}
				if(Trace._intersectionCloser(intersection, currentIntersection, f)) {
					currentIntersection = intersection;
					currentLine = line;
				}
			}
		}

		if(currentIntersection == null || currentLine == null) return null;
		return {
			intersection: currentIntersection,
			line: currentLine,
		};
	}

	/** 如果造出軌跡的過程中出現迴圈，排除考慮一切完全落在迴圈裡面的線段 */
	private processLoop(pt: Point) {
		let path: Path = [], i = this._full.length - 1;
		do { path.push(this._full[i]); } while(!this._full[i--].eq(pt));
		for(let l of this._candidates) {
			if(PathUtil.$lineInsidePath(l, path)) this._candidates.delete(l);
		}
	}

	//////////////////////////////////////////////////////////////////
	// 靜態方法
	//////////////////////////////////////////////////////////////////

	private static _reflect(node: TraceNode, shooting: ShootingNode): TraceNode {
		let pt = shooting.intersection.point;
		let line = shooting.line;

		let result: TraceNode = {
			shift: line.$vector,
			vector: line.$reflect(node.vector),
			point: pt,
		};

		if(debugEnabled && debug) {
			console.log([
				pt.toString(), line.toString(),
				result.vector.toString(), line.$vector.toString(),
			]);
		}
		return result;
	}

	/** 取得指定線段和給定動向的交點 */
	public static $getIntersection(l: Line, p: Point, v: Vector): JIntersection | null {
		let v1 = l.p2.sub(l.p1);
		let m = new Matrix(v1._x, v._x, v1._y, v._y).$inverse;
		if(m == null) return null;

		let r = m.$multiply(p.sub(l.p1));
		let a = r._x, b = r._y.neg;

		// 交點必須是在動向的前方且在線段的內部（含端點）
		if(a.lt(Fraction.ZERO) || a.gt(Fraction.ONE) || b.lt(Fraction.ZERO)) return null;

		return {
			point: p.add(v.$scale(b)),
			dist: b,
			angle: Trace._getAngle(v, v1),
			interior: a.gt(Fraction.ZERO) && a.lt(Fraction.ONE),
		};
	}

	/** 判斷傳入的交點 `r` 是否在特定意義上比起交點 `x` 更「近」 */
	private static _intersectionCloser(
		r: JIntersection, x: JIntersection | null, f: Sign
	): boolean {
		return x == null || r.dist.lt(x.dist) || r.dist.eq(x.dist) && r.angle * f < x.angle * f;
	}

	private static _getAngle(v1: Vector, v2: Vector) {
		let ang = v1.$angle - v2.$angle;
		while(ang < 0) ang += Math.PI;
		while(ang > Math.PI) ang -= Math.PI;
		return ang;
	}

	/** 給定一線段，想像一下、把給定的動向稍微往側邊平移，是否還能碰得到？ */
	private static _isSideTouchable(
		line: Line, from: Point, v: Vector, f: number, ang?: number
	): boolean {
		let rv = v.$rotate90();
		let v1 = line.p1.sub(from), v2 = line.p2.sub(from);
		let r1 = v1.dot(rv), r2 = v2.dot(rv);
		let d1 = v1.dot(v), d2 = v2.dot(v);
		let result =
			(
				// 線段的任何一端點完全落在指定側向
				r1 * f > 0 || r2 * f > 0
			) &&
			(
				// 至少有一個端點位於前方
				d1 > 0 || d2 > 0 ||
				// 或是給定線段的角度比前一次遇到的線段角度要更前面
				Boolean(ang) && Trace._getAngle(v, line.$vector) * f > ang! * f
			);
		return result;
	}

	private static _pushIfNotEqual(array: Point[], pt: Point) {
		if(!array.length || !array[array.length - 1].eq(pt)) array.push(pt);
	}
}
