
interface JIntersection {
	point: Point;
	dist: Fraction;
	angle: number;
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
	 * @param end 終點線；如果過程中撞到這條線則停止
	 * @param start 指定起點線；這個值有指定表示要用導繪模式
	 */
	export function create(lines: readonly Line[], startPt: Point, sv: Vector, end: Line, start?: Line): Path {
		let history: Path = [];
		let trace: Path = [];
		let x: JIntersection | null;
		let v = sv;
		let p = startPt;
		let shift: Vector | undefined;
		let line!: Line;
		let record = new Set<string>();
		let candidates = new Set(lines);

		do {
			x = null;
			for(let l of candidates) {
				// 完全落在右邊的線不列入考慮，因為那其實跟反射無關
				let ang = shift ? getAngle(v, shift) : undefined;
				if(!isLeftTouchable(l, p, v, ang)) continue;

				// 找出最接近的交點
				let r = getIntersection(l, p, v);
				if(debug && r) console.log([JSON.stringify(r), l.toString()]);
				if(intersectionCloser(r, x)) {
					x = r; line = l;
				}
			}
			if(x) {
				let pt = x.point;
				let l = new Line(p, pt);

				// 導繪模式的處理
				if(start) {
					let p = l.intersection(start);
					if(p) { // 撞到了起點線，加入交點
						trace.push(p);
						start = undefined;
					}
				}

				// 撞到了終點線，停止輸出
				let goal = l.intersection(end);
				if(goal) { trace.push(goal); break; }

				// 偵測迴圈；迴圈是只有當有 meandering 的時候才會產生
				let sg = pt.toString();
				if(record.has(sg)) processLoop(history, pt, candidates);
				else record.add(sg);
				history.push(pt);

				if(!start) {
					// 自動化簡輸出，不連續輸出同樣的點
					if(!trace.length || !trace[trace.length - 1].eq(pt)) trace.push(pt);
				}


				// 暫存偏移向量以幫助下一次的判斷
				shift = line.vector;

				v = line.reflect(v);
				if(debug) console.log([pt.toString(), line.toString(), v.toString(), shift.toString()]);
				p = pt;

				// 反射過的線就不再列入考慮；理論上只要輸入資料沒錯，不可能同一條線會用到兩次
				candidates.delete(line);
			}
		} while(x != null);

		return trace;
	}

	/** 如果造出軌跡的過程中出現迴圈，排除考慮一切完全落在迴圈裡面的線段 */
	function processLoop(trace: Path, pt: Point, candidates: Set<Line>) {
		let path: Path = [], i = trace.length - 1;
		do { path.push(trace[i]); } while(!trace[i--].eq(pt));
		if(path.length <= 2) return; // 三角形以上才需要處理
		for(let l of candidates) if(PathUtil.lineInsidePath(l, path)) candidates.delete(l)
	}

	/** 判斷傳入的交點 `r` 是否在特定意義上比起交點 `x` 更「近」 */
	function intersectionCloser(r: JIntersection | null, x: JIntersection | null): boolean {
		return r != null && (x == null || r.dist.lt(x.dist) || r.dist.eq(x.dist) && r.angle < x.angle);
	}

	/** 取得這條線和給定動向的交點 */
	function getIntersection(l: Line, p: Point, v: Vector): JIntersection | null {
		var v1 = l.p2.sub(l.p1);
		var m = (new Matrix(v1._x, v._x, v1._y, v._y)).inverse;
		if(m == null) return null;

		var r = m.multiply(new Point(p.sub(l.p1)));
		var a = r._x, b = r._y.neg;

		// 交點必須是在動向的前方且在線段的內部（含端點）
		if(a.lt(0) || a.gt(1) || b.lt(0)) return null;

		return {
			point: p.add(v.scale(b)),
			dist: b,
			angle: getAngle(v, v1)
		};
	}

	function getAngle(v1: Vector, v2: Vector) {
		var ang = v1.angle - v2.angle;
		while(ang < 0) ang += Math.PI;
		while(ang > Math.PI) ang -= Math.PI;
		return ang;
	}

	/** 給定一線段，想像一下、把給定的動向稍微往左平移，是否還能碰得到？ */
	function isLeftTouchable(l: Line, p: Point, v: Vector, ang?: number): boolean {
		let rv = v.rotate90();
		let v1 = l.p1.sub(p), v2 = l.p2.sub(p);
		let r1 = v1.dot(rv), r2 = v2.dot(rv);
		let d1 = v1.dot(v), d2 = v2.dot(v);
		return (r1 > 0 || r2 > 0) && (d1 > 0 || d2 > 0 || !!ang && getAngle(v, l.vector) > ang);
	}
}
