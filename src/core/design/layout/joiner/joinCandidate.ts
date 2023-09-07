import { Vector } from "core/math/geometry/vector";
import { Direction } from "shared/types/direction";
import { clone } from "shared/utils/clone";

import type { Line } from "core/math/geometry/line";
import type { Point } from "core/math/geometry/point";
import type { JAnchor, JGadget } from "shared/json";
import type { QuadrantDirection } from "shared/types/direction";
import type { Piece } from "../pattern/piece";
import type { JoinLogic } from "./logic/joinLogic";

//=================================================================
/**
 * {@link JoinCandidate} is the abstraction of one of the involved {@link JGadget}s.
 * It apportions some of the calculations in {@link JoinLogic}.
 */
//=================================================================

export class JoinCandidate {

	public readonly p: Piece;
	public readonly o: IPoint;
	public readonly a: JAnchor[];
	public readonly v: Vector;
	public readonly pt: IPoint;
	public readonly e: Line;

	constructor(
		p: Piece,
		offset: IPoint,
		a: JAnchor[],
		pt: Point,
		q: QuadrantDirection,
		additionalOffset: Vector = Vector.ZERO
	) {
		this.p = p;
		this.o = offset;
		this.a = a;
		this.v = new Vector(offset).addBy(additionalOffset).neg;
		this.pt = pt.$add(this.v).$toIPoint();
		this.e = p.$shape.ridges[q].$shift(additionalOffset);
	}

	public $setupDetour(rawDetour: Point[], reverse: boolean): void {
		const detour = rawDetour.map(p => p.$add(this.v).$toIPoint());
		detour.push(this.pt);
		if(reverse) detour.reverse();
		this.p.$clearDetour();
		this.p.$addDetour(detour);
	}

	public $toGadget(json?: boolean, offset?: IPoint): JGadget {
		let off: IPoint | undefined = clone(this.o);
		if(offset) {
			off = { x: off.x + offset.x, y: off.y + offset.y };
		}
		if(off.x == 0 && off.y == 0) off = undefined;
		return {
			pieces: [json ? clone(this.p) : this.p],
			offset: off,
			anchors: this.a.concat(), // need to make a copy here, as `this.a` will still be in use
		};
	}

	public $isSteeperThan(that: JoinCandidate): boolean {
		return this.p.$direction.$slope.gt(that.p.$direction.$slope);
	}

	public $setupAnchor(upperLeft: boolean, anchor: Point): void {
		const q = upperLeft ? Direction.UL : Direction.LR;
		// We write to the same location every time,
		// so that junk data won't survive in the next round
		this.a[q] = { location: anchor.$add(this.v).$toIPoint() };
	}
}
