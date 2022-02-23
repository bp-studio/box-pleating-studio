import { Trace } from "./Trace";
import { Fraction, Line, Point } from "bp/math";
import { Junction, JunctionStatus } from "bp/design/components/Junction";
import { Settings } from "bp/global";
import type { JunctionDimension, Quadrant } from "bp/design";
import type { Path, Vector } from "bp/math";

//=================================================================
/**
 * {@link TraceBuilder} 負責處理建構 {@link Trace} 之前的複雜前置計算。
 */
//=================================================================

export class TraceBuilder {

	private readonly _junctions: readonly Junction[];
	private readonly _lines: Line[];
	private readonly _quadrant: Quadrant;
	private readonly _startPt: Point;
	private readonly _endPt: Point;
	private readonly _startVector: Vector;
	private readonly _inflections: Set<string> = new Set();

	constructor(
		quadrant: Quadrant,
		junctions: readonly Junction[], lines: readonly Line[],
		start: Point, end: Point
	) {
		this._quadrant = quadrant;
		this._lines = lines.concat();
		this._startPt = start;
		this._endPt = end;
		this._startVector = quadrant.pv;
		this._junctions = junctions;

		if(DEBUG_ENABLED && Settings.debug) {
			console.log(this._lines.map(l => l.toString()));
		}
	}

	public $build(d: number): Path {
		// 在牽涉到融合的情況中，一個 Quadrant 需要負責的軌跡絕對不會超過 delta 線的範圍，
		// 所以如果 delta 線可以被定義就以該線為終點，否則就採用直觀上的縱橫終點線
		let endLine = this._findNextDelta(false);
		let lead = this._findLead(this._quadrant, d);

		let startLine: Line | undefined;
		if(lead) startLine = this._findNextDelta(true);

		let trace = new Trace(
			this._lines,
			this._endPt,
			this._inflections,
			endLine ?? new Line(this._endPt, this._startVector),
			startLine
		)
			.$create(
				lead ?? this._startPt,
				this._startVector
			);

		// 下面這一行去掉一些在非法導繪模式中可能產生的無效點；
		// 那些點會干擾 PolyBool 演算法
		let quad = this._quadrant;
		while(quad.$isInvalidHead(trace[0], d, quad.q % 2 != 1)) trace.shift();

		// 底下這部份的程式碼是為了在 join 的場合中順利聯集兩組輪廓而不會在中間出現缺口而設置的，
		// 未來採用比較具宏觀性的演算法的話這段可以拿掉。
		this._fixStart(trace, d, startLine);
		this._fixEnd(trace, d, endLine);

		return trace;
	}

	/** 判定在產生軌跡的時候是否有必要從更遠的地方開始描繪（導繪） */
	private _findLead(thisQ: Quadrant, d: number): Point | undefined {
		let find = this._findJoinNextQ(thisQ, true, false);
		if(!find) return undefined;

		let { joinQ, nextQ } = find;
		let junction = thisQ.$findJunction(nextQ);
		let ok = junction.$status == JunctionStatus.tooFar;
		let dist = thisQ.$distTriple(nextQ, joinQ);

		// 一般來說只有當 d > dist.d1 的時候有必要作導繪，
		// 但是當 !ok 的時候整個情況會特別奇怪，因此額外開放。
		if(d <= dist.d1 && ok) return undefined;

		let d2 = d - dist.d1 + dist.d2;

		// 加入反曲點
		let inflection = thisQ.q % 2 ?
			new Point(nextQ.x(d2), thisQ.y(d)) :
			new Point(thisQ.x(d), nextQ.y(d2));
		this._inflections.add(inflection.toString());
		if(d2 == 0) this._inflections.add(nextQ.$point.toString());

		// 距離更小的時候的特殊處理
		if(d < dist.d1) {
			let i = this._lines.findIndex(l => l.$contains(inflection));
			if(i >= 0) {
				// 如果 delta 線包含了反曲點，那軌跡繪製的時候必須忽略 delta 線，否則結果會有 bug
				this._lines.splice(i, 1);
			} else {
				// 否則加入額外線條
				this._lines.push(new Line(inflection, thisQ.qv));
			}
		}

		return this._findLead(nextQ, d2) ?? nextQ.$getStart(new Fraction(d2));
	}

	private _fixStart(trace: Path, radius: number, startLine?: Line): void {
		let quad = this._quadrant;
		if(startLine && quad.$outside(trace[0], radius, quad.q % 2 != 1)) {
			trace.unshift(
				quad.q % 2 ?
					startLine.$yIntersection(quad.y(radius)) :
					startLine.$xIntersection(quad.x(radius))
			);
		} else {
			// 底下的程式碼是為了確保輸出和前一種情況一致
			let l: number;
			while(
				(l = trace.length) > 1 &&
				new Line(this._startPt, trace[1]).$lineContains(trace[0])
			) {
				trace.shift();
			}
			trace.unshift(this._startPt);
		}
	}

	private _fixEnd(trace: Path, radius: number, endLine?: Line): void {
		if(endLine) {
			let quad = this._quadrant;
			if(quad.$outside(trace[trace.length - 1], radius, quad.q % 2 == 1)) {
				trace.push(quad.q % 2 ?
					endLine!.$xIntersection(quad.x(radius)) :
					endLine!.$yIntersection(quad.y(radius))
				);
			}
			let last = trace[trace.length - 1];
			let append = quad.q % 2 ?
				new Point(last._x, this._endPt._y) :
				new Point(this._endPt._x, last._y);
			if(!append.eq(this._endPt)) trace.push(append);
		}

		let l: number;
		while(
			(l = trace.length) > 1 &&
			new Line(this._endPt, trace[l - 2]).$contains(trace[l - 1])
		) {
			trace.pop();
		}
	}

	private _findNextDelta(cw: boolean): Line | undefined {
		let quad = this._quadrant;
		let find = this._findJoinNextQ(quad, cw, true);
		if(!find) return undefined;

		let { joinQ, nextQ, mode } = find;
		let { d1, d2 } = quad.$distTriple(nextQ, joinQ);
		let int = mode ? new Point(nextQ.x(d2), quad.y(d1)) : new Point(quad.x(d1), nextQ.y(d2));

		// 傳回 delta 直線
		return new Line(int, this._quadrant.qv);
	}

	/**
	 * 在 {@link Pattern} 中找出指定方向中的下一個（或最遠的）{@link Quadrant}。
	 *
	 * @param junctions {@link Pattern} 對應的全體 {@link Junction}
	 * @param cw 是否要找順時鐘方向
	 * @param next 傳入 true 表示找下一個；否表示找最遠的
	 */
	private _findJoinNextQ(quad: Quadrant, cw: boolean, next: boolean): {
		joinQ: Quadrant; nextQ: Quadrant; mode: boolean;
	} | undefined {
		if(this._junctions.length == 1) return undefined;

		let mode = Boolean(quad.q % 2) == cw;
		let key: JunctionDimension = mode ? "oy" : "ox";
		let adjacent = this._junctions.filter(j => quad.$isInJunction(j));
		let minJ = Junction.$findMinMax(adjacent, key, -1);
		let joinQ = quad.$getOppositeQuadrant(minJ);
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

		let nextQ = joinQ.$getOppositeQuadrant(nextJ);
		return { joinQ, nextQ, mode };
	}
}
