import { Point } from "core/math/geometry/point";
import { quadrantNumber } from "shared/types/direction";
import { CornerType } from "shared/json";
import { convertIndex } from "shared/utils/pattern";

import type { Repository } from "../../repository";
import type { Pattern } from "../pattern";
import type { JJunction, JJunctions, JOverlap } from "shared/json";
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

			// If there're mutual connections, there's no need to setup slack.
			const targetOverlap = this.$overlaps[targetIndex];
			if(targetOverlap.c.some(c => c.type == CornerType.internal && c.e == id)) continue;

			const g1 = this.$gadgets[index];
			const g2 = this.$gadgets[targetIndex];
			g1.$setupConnectionSlack(g2, q, corner.q!);
		}
	}
}
