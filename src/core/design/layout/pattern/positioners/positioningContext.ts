import { Point } from "core/math/geometry/point";
import { opposite, quadrantNumber } from "shared/types/direction";
import { CornerType } from "shared/json";
import { convertIndex } from "shared/utils/pattern";

import type { QuadrantDirection } from "shared/types/direction";
import type { Repository } from "../../repository";
import type { Pattern } from "../pattern";
import type { JJunction, JJunctions, JOverlap, JCorner } from "shared/json";
import type { Device } from "../device";
import type { Gadget } from "../gadget";

//=================================================================
/**
 * {@link PositioningContext} is the context object for positioning
 * the {@link Device}s.
 */
//=================================================================
export class PositioningContext {
	public readonly $repo: Repository;
	public readonly $overlaps: readonly JOverlap[];
	public readonly $gadgets: readonly Gadget[];
	public readonly $junctions: JJunctions;
	public readonly $devices: readonly Device[];

	private readonly _slackMap = new WeakMap<JCorner, number>();

	constructor(pattern: Pattern) {
		this.$repo = pattern.$config.$repo;
		this.$junctions = this.$repo.$junctions;
		this.$devices = pattern.$devices;
		this.$overlaps = pattern.$config.$overlaps;
		this.$gadgets = pattern.$gadgets;

		for(let i = 0; i < this.$overlaps.length; i++) {
			this._setupSlackForOverlap(i);
		}
	}

	public $getRelativeDelta(j1: JJunction, j2: JJunction, g: Gadget): Point {
		const oriented = j1.c[0].e == j2.c[0].e;
		const r = this.$repo.$getMaxIntersectionDistance(j1, j2, oriented);
		if(j2.ox > j1.ox) [j1, j2] = [j2, j1];
		let p: IPoint = { x: r - j2.ox, y: r - j1.oy };
		if(!oriented) p = { x: g.sx - p.x, y: g.sy - p.y };
		return new Point(p);
	}

	public $getJunctions(device: Device): JJunctions {
		return device.$partition.$overlaps.map(o => this.$junctions[o.parent]);
	}

	public $checkJunctions(singleMode: boolean): boolean {
		// Trivial case
		if(this.$junctions.length == 1 && this.$gadgets.length == 1) return true;

		if(singleMode) {
			const index = this.$overlaps[0].parent;
			if(!this._checkJunction(index)) return false;
		} else {
			for(let i = 0; i < this.$junctions.length; i++) {
				if(!this._checkJunction(i)) return false;
			}
		}
		return true;
	}

	public $getSlack(index: number, q: QuadrantDirection): number {
		const corner = this.$overlaps[index].c[q];
		const gadget = this.$gadgets[index];
		return this._slackMap.get(corner) ?? Math.floor(gadget.$slack[q]);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _setupSlackForOverlap(index: number): void {
		const overlap = this.$overlaps[index];
		const id = convertIndex(index);
		for(let q = 0; q < quadrantNumber; q++) {
			const corner = overlap.c[q];
			if(corner.type != CornerType.internal) continue;
			const targetIndex = convertIndex(corner.e);

			const targetOverlap = this.$overlaps[targetIndex];
			const oppositeCorner = targetOverlap.c[2 - q];
			const mutual = oppositeCorner.type == CornerType.internal && oppositeCorner.e == id;

			const g1 = this.$gadgets[index];
			const g2 = this.$gadgets[targetIndex];
			if(!mutual) {
				g1.$setupConnectionSlack(g2, q, corner.q!);
			} else {
				// If there're mutual connections, we don't need to setup
				// the slack for real, but we keep a record for later usage.
				const tx1 = g1.sx + g2.rx(q, corner.q!);
				const tx2 = g2.sx + g1.rx(2 - q, opposite(corner.q!));
				if(tx2 > tx1) this._slackMap.set(corner, tx2 - tx1);
			}
		}
	}

	/**
	 * Given a {@link JJunction}, consider all possible {@link Gadget} chains within,
	 * and make sure that all chains fit the space.
	 */
	private _checkJunction(index: number): boolean {
		const junction = this.$junctions[index];
		const overlapIndices = new Set<number>();

		for(let i = 0; i < this.$overlaps.length; i++) {
			const ov = this.$overlaps[i];
			if(ov.parent != index) continue;
			overlapIndices.add(i);
		}

		let total = 0;
		while(overlapIndices.size > 0) {
			const first = overlapIndices.values().next().value as number;
			overlapIndices.delete(first);
			const result = this.$gadgets[first].sx +
				this._getChainSpanRecursive(overlapIndices, first, 0) +
				this._getChainSpanRecursive(overlapIndices, first, 2);
			if(result > total) total = result;
		}
		return junction.sx >= total;
	}

	private _getChainSpanRecursive(overlapIndices: Set<number>, index: number, q: QuadrantDirection): number {
		const corner = this.$overlaps[index].c[q];
		if(corner.type == CornerType.flap) return 0; // base case
		let result = 0;
		const next = convertIndex(corner.e);
		overlapIndices.delete(next);
		if(corner.type == CornerType.internal) {
			const nextGadget = this.$gadgets[next];
			const slack = this.$getSlack(index, q);
			result = nextGadget.rx(q, corner.q!) + slack;
		} // otherwise it is coincide
		return result + this._getChainSpanRecursive(overlapIndices, next, q);
	}
}
