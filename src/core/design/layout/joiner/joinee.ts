import { Vector } from "core/math/geometry/vector";
import { Direction } from "shared/types/direction";
import { clone } from "shared/utils/clone";
import { Gadget } from "../pattern/gadget";

import type { Path } from "shared/types/geometry";
import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Line } from "core/math/geometry/line";
import type { Point } from "core/math/geometry/point";
import type { JAnchor, JGadget } from "shared/json";
import type { QuadrantDirection } from "shared/types/direction";
import type { Piece } from "../pattern/piece";
import type { JoinLogic } from "./logic/joinLogic";

//=================================================================
/**
 * {@link Joinee} is the abstraction of one of the involved {@link JGadget}s.
 * It apportions some of the calculations in {@link JoinLogic}.
 */
//=================================================================

export class Joinee {

	public readonly p: Piece;
	public readonly e: Line;

	private readonly _offset: IPoint;
	private readonly _v: Vector;
	private readonly _pt: IPoint;
	private readonly _anchors: JAnchor[];

	constructor(
		p: Piece,
		offset: IPoint,
		anchors: JAnchor[],
		pt: Point,
		q: QuadrantDirection,
		additionalOffset: Vector = Vector.ZERO
	) {
		this.p = p;
		this._offset = offset;
		this._anchors = anchors;
		this._v = new Vector(offset).$add(additionalOffset).$neg;
		this._pt = pt.$add(this._v).$toIPoint();
		this.e = p.$shape.ridges[q].$shift(additionalOffset);
	}

	public $setupDetour(rawDetour: RationalPath, reverse: boolean): void {
		const detour: Path = rawDetour.map(p => p.$add(this._v).$toIPoint());
		detour.push(this._pt);
		if(reverse) detour.reverse();
		this.p.$clearDetour();
		this.p.$addDetour(detour);
	}

	public $toGadget(shouldClone: boolean, oriented: boolean, offset?: IPoint): JGadget {
		let off: IPoint | undefined = this._offset;
		if(offset) {
			off = { x: off.x + offset.x, y: off.y + offset.y };
		}
		if(off.x == 0 && off.y == 0) off = undefined;
		const result = new Gadget({
			pieces: [shouldClone ? clone(this.p) : this.p],
			offset: off,
			anchors: this._anchors.concat(), // need to make a copy here
		});

		for(const q of [Direction.UL, Direction.LR]) {
			const p = result.$anchorMap[q][0];
			if(!p.$isIntegral) {
				const x = p.x;
				const fractionalPart = x - Math.floor(x);
				const slack = oriented ? 1 - fractionalPart : fractionalPart;
				result.$addSlack(q as QuadrantDirection, slack);
			}
		}

		return result;
	}

	public $isSteeperThan(that: Joinee): boolean {
		return this.p.$direction.$slope.gt(that.p.$direction.$slope);
	}

	public $setupAnchor(upperLeft: boolean, anchor: Point): void {
		const q = upperLeft ? Direction.UL : Direction.LR;
		// We write to the same location every time,
		// so that junk data won't survive in the next round
		this._anchors[q] = { location: anchor.$add(this._v).$toIPoint() };
	}
}
