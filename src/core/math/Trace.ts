
interface JIntersection {
	point: Point;
	dist: Fraction;
	angle: number;

	/** 交點是否在線段內部 */
	interior: boolean;
}

//////////////////////////////////////////////////////////////////
/**
 * 產生軌跡的工具類別。
 */
//////////////////////////////////////////////////////////////////

namespace Trace {

	/**
	 * 軌跡產生演算法。
	 *
	 * @param startPt 軌跡的起點
	 * @param sv 軌跡的初始方向向量
	 * @param inflections 反曲點座標字串的集合；如果遇到這些點的話，內外側的判定要顛倒
	 * @param end 終點線；如果過程中撞到這條線則停止
	 * @param start 指定起點線；這個值有指定表示要用導繪模式
	 */
	export function create(
		lines: readonly Line[],
		startPt: Point, endPt: Point,
		sv: Vector,
		inflections: Set<string>,
		end: Line, start?: Line
	): Path {
		let full: Path = [];
		let trace: Path = [];
		let currentIntersection: JIntersection | null;
		let currentVector = sv;
		let currentPoint = startPt;
		let shift: Vector | undefined;
		let currentLine!: Line;
		let record = new Set<string>();
		let candidates = new Set(lines);

		if(debug) console.log([...inflections].toString());
		do {
			/**
			 * 底下這段程式碼負責解決 ray shooting problem。
			 *
			 * 這邊我使用的是最直觀但也最沒有效率的逐一檢查每一條線段的方法，
			 * 這樣做的話每回合都需要 O(n) 的運算量，再加上全部約有 O(n) 的回合數，
			 * 全部的運算量高達 O(n^2)；然而從效能的角度來看，
			 * 這一部份的計算耗時並不是目前最吃重的部份，所以並不是非常急著改進。
			 */
			currentIntersection = null;
			for(let line of candidates) {
				let intersection = getIntersection(line, currentPoint, currentVector);
				if(intersection) {
					// 完全落在外邊的線不列入考慮，因為那其實跟反射無關
					let angle = shift ? getAngle(currentVector, shift) : undefined;
					let f: Sign = inflections.has(intersection.point.toString()) ? -1 : 1;
					if(!intersection.interior && !isSideTouchable(line, currentPoint, currentVector, f, angle)) continue;

					if(debug) console.log([JSON.stringify(intersection), line.toString()]);
					if(intersectionCloser(intersection, currentIntersection, f)) {
						currentIntersection = intersection;
						currentLine = line;
					}
				}
			}

			/**
			 * 底下這段程式碼負責處理找到最近交點之後的事情。
			 */
			if(currentIntersection) {
				let pt = currentIntersection.point;
				let currentSegment = new Line(currentPoint, pt);

				// 導繪模式的處理
				if(start) {
					let p = currentSegment.intersection(start);
					if(p) { // 撞到了起點線，加入交點
						trace.push(p);
						start = undefined;
					}
				}

				// 撞到了終點（優先）或終點線，停止輸出
				let goal = currentSegment.contains(endPt) ? endPt : currentSegment.intersection(end);
				if(goal) { trace.push(goal); break; }

				// 偵測迴圈；迴圈是只有當有 meandering 的時候才會產生
				let sg = pt.toString();
				if(record.has(sg)) {
					if(!pt.eq(full[full.length - 1])) processLoop(full, pt, candidates);
				} else record.add(sg);
				if(!full.length || !full[full.length - 1].eq(pt)) full.push(pt);

				if(!start) {
					// 自動化簡輸出，不連續輸出同樣的點
					if(!trace.length || !trace[trace.length - 1].eq(pt)) trace.push(pt);
				}

				// 暫存偏移向量以幫助下一次的判斷
				shift = currentLine.vector;

				currentVector = currentLine.reflect(currentVector);
				if(debug) console.log([pt.toString(), currentLine.toString(), currentVector.toString(), shift.toString()]);
				currentPoint = pt;

				// 反射過的線就不再列入考慮；理論上只要輸入資料沒錯，不可能同一條線會用到兩次
				candidates.delete(currentLine);
			}
		} while(currentIntersection != null);

		return trace;
	}

	/** 如果造出軌跡的過程中出現迴圈，排除考慮一切完全落在迴圈裡面的線段 */
	function processLoop(trace: Path, pt: Point, candidates: Set<Line>) {
		let path: Path = [], i = trace.length - 1;
		do { path.push(trace[i]); } while(!trace[i--].eq(pt));
		for(let l of candidates) if(PathUtil.lineInsidePath(l, path)) candidates.delete(l)
	}

	/** 判斷傳入的交點 `r` 是否在特定意義上比起交點 `x` 更「近」 */
	function intersectionCloser(r: JIntersection, x: JIntersection | null, f: Sign): boolean {
		return x == null || r.dist.lt(x.dist) || r.dist.eq(x.dist) && r.angle * f < x.angle * f;
	}

	/** 取得這條線和給定動向的交點 */
	function getIntersection(l: Line, p: Point, v: Vector): JIntersection | null {
		var v1 = l.p2.sub(l.p1);
		var m = (new Matrix(v1._x, v._x, v1._y, v._y)).inverse;
		if(m == null) return null;

		var r = m.multiply(new Point(p.sub(l.p1)));
		var a = r._x, b = r._y.neg;

		// 交點必須是在動向的前方且在線段的內部（含端點）
		if(a.lt(Fraction.ZERO) || a.gt(Fraction.ONE) || b.lt(Fraction.ZERO)) return null;

		return {
			point: p.add(v.scale(b)),
			dist: b,
			angle: getAngle(v, v1),
			interior: a.gt(Fraction.ZERO) && a.lt(Fraction.ONE)
		};
	}

	function getAngle(v1: Vector, v2: Vector) {
		var ang = v1.angle - v2.angle;
		while(ang < 0) ang += Math.PI;
		while(ang > Math.PI) ang -= Math.PI;
		return ang;
	}

	/** 給定一線段，想像一下、把給定的動向稍微往側邊平移，是否還能碰得到？ */
	function isSideTouchable(line: Line, from: Point, v: Vector, f: number, ang?: number): boolean {
		let rv = v.rotate90();
		let v1 = line.p1.sub(from), v2 = line.p2.sub(from);
		let r1 = v1.dot(rv), r2 = v2.dot(rv);
		let d1 = v1.dot(v), d2 = v2.dot(v);
		let result =
			(
				// 線段的任何一端點完全落在指定側向
				r1 * f > 0 || r2 * f > 0
			)
			&&
			(
				// 至少有一個端點位於前方
				d1 > 0 || d2 > 0
				// 或是給定線段的角度比前一次遇到的線段角度要更前面
				|| !!ang && getAngle(v, line.vector) * f > ang * f
			);
		return result;
	}
}
