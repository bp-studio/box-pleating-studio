import { Point } from "core/math/geometry/point";

import type { Configuration } from "../../configuration";
import type { QuadrantDirection } from "shared/types/direction";
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
	public readonly $config: Configuration;
	public readonly $junctions: JJunctions;
	public readonly $devices: readonly Device[];

	constructor(config: Configuration, devices: readonly Device[]) {
		this.$config = config;
		this.$junctions = config.$repo.$junctions;
		this.$devices = devices;
	}

	public $getRelativeDelta(j1: JJunction, j2: JJunction, g: Gadget): Point {
		const oriented = j1.c[0].e == j2.c[0].e;
		const r = this.$config.$repo.$getMaxIntersectionDistance(j1, j2, oriented);
		if(j2.ox > j1.ox) [j1, j2] = [j2, j1];
		let p: IPoint = { x: r - j2.ox, y: r - j1.oy };
		if(!oriented) p = { x: g.sx - p.x, y: g.sy - p.y };
		return new Point(p);
	}

	public $getJunctions(device: Device): JJunctions {
		return device.$partition.$overlaps.map(o => this.$junctions[o.parent]);
	}
}
