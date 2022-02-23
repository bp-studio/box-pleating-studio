import { JoinCandidate } from "./JoinCandidate";
import { Point, Vector } from "bp/math";
import { opposite } from "bp/global";
import type { Joiner } from "./Joiner";
import type { IPoint, Sign } from "bp/math";
import type { Piece } from "bp/design";
import type { QuadrantDirection } from "bp/global";
import type { JAnchor } from "bp/content/json";

//=================================================================
/**
 * {@link JoinCandidateBuilder} 類別幫忙完成 {@link JoinCandidate} 的複雜建構過程。
 */
//=================================================================

export class JoinCandidateBuilder {

	public a: JAnchor[] = [];
	private offset: IPoint = { x: 0, y: 0 };
	private _additionalOffset?: Vector;

	constructor(
		private readonly p: Piece,
		private readonly q: QuadrantDirection,
		private readonly joiner: Joiner
	) {}

	/** 這部份的程式碼是 {@link JoinCandidate} 建構過程中最複雜的一個環節，今重構成這個方法來管理 */
	public $setup(that: JoinCandidateBuilder, f: Sign, shift: IPoint): number {
		let int = this.joiner.$getRelayJoinIntersection(that.p, shift, opposite(this.q));
		if(!int || !int.$isIntegral) return NaN;

		let off: IPoint;
		if(this.joiner.$oriented) {
			this.offset = off = int.$toIPoint();
			this.p.$offset(off);
			this.a[this.joiner.q] = {
				location: { x: -off.x, y: -off.y },
			};
			return off.x;
		} else {
			let target = f == 1 ? that : this;
			target.offset = off = { x: f * (that.p.sx - int.x), y: f * (that.p.sy - int.y) };
			target.p.$offset(off);
			this.a[this.joiner.q] = {
				location: { x: this.p.sx + f * off.x, y: this.p.sy + f * off.y },
			};
			return f * off.x;
		}
	}

	public set $additionalOffset(offset: IPoint) {
		this._additionalOffset = new Vector(offset);
	}

	public get $anchor(): Point {
		let a = this.p.$anchors[this.joiner.q]!;
		if(this._additionalOffset) a = a.add(this._additionalOffset);
		return a;
	}

	public get $jAnchor(): Point {
		return new Point(this.a[this.joiner.q].location!);
	}

	public $build(pt: Point): JoinCandidate {
		return new JoinCandidate(
			this.p, this.offset, this.a, pt, this.q, this._additionalOffset
		);
	}
}
