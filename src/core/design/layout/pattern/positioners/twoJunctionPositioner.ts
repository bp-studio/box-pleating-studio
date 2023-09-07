import { Point } from "core/math/geometry/point";
import { QV } from "../quadrant";

import type { PositioningContext } from "./positioningContext";
import type { JJunction } from "shared/json";
import type { Gadget } from "../gadget";

//=================================================================
/**
 * {@link twoJunctionPositioner} is for a two {@link JJunction}s.
 */
//=================================================================
export function twoJunctionPositioner(context: PositioningContext): boolean {
	if(context.devices.length == 1) return makeSingeJoinDevicePattern(context);
	if(context.devices.length == 2) return makeTwoDeviceRelayPattern(context);
	return false;
}

function makeSingeJoinDevicePattern(context: PositioningContext): boolean {
	const [o1, o2] = context.devices[0].$partition.$overlaps;
	const [j1, j2] = [o1, o2].map(o => context.junctions[o.parent]);
	const oriented = j1.c[0].e == j2.c[0].e;
	const device = context.devices[0];
	const gadgets = device.$gadgets;
	if(gadgets[0].sx > j1.sx || gadgets[1].sx > j2.sx) return false;
	if(!oriented) device.$offset = j1.sx - gadgets[0].sx;
	return true;
}

/**
 * For now this algorithm is nearly brute-force.
 * Still need to think about a more generalized approach.
 */
function makeTwoDeviceRelayPattern(context: PositioningContext): boolean {
	let [g1, g2] = context.devices.map(d => d.$gadgets[0]);
	let [o1, o2] = context.devices.map(d => d.$partition.$overlaps[0]);

	// Pick the cut-off JOverlap (called it o1), since the other one can't go wrong
	const reversed = o1.c[0].e! >= 0 && o1.c[2].e! >= 0;
	if(reversed) {
		[g1, g2] = [g2, g1];
		[o1, o2] = [o2, o1];
	}
	const [j1, j2] = [o1, o2].map(o => context.junctions[o.parent]);
	const oriented = o1.c[0].e! < 0; // Share lower-left corner
	const q = oriented ? 0 : 2, tq = o1.c[q].q!;

	let sx = j1.sx;
	const tx = g1.sx;
	const s = g1.$setupConnectionSlack(g2, q, tq);
	sx -= Math.ceil(g2.rx(tq, q)) + s;

	// Push them towards the shared corner as much as possible
	const offsets = oriented ? [s ?? 0, 0] : [sx - tx, j2.sx - g2.sx];
	if(reversed) offsets.reverse();

	if(tx > sx) return false;

	// If after the pushing, the delta line is still closer than g2
	// (the one getting relayed), then it won't work
	const delta = getRelativeDelta(context, j1, j2, g2);
	if(g2.$intersects(delta, oriented ? QV[0] : QV[2])) return false;

	context.devices.forEach((d, i) => d.$offset = offsets[i]);
	return true;
}

function getRelativeDelta(context: PositioningContext, j1: JJunction, j2: JJunction, g: Gadget): Point {
	const oriented = j1.c[0].e == j2.c[0].e;
	const r = context.repo.$getMaxIntersectionDistance(j1, j2, oriented);
	if(j2.ox > j1.ox) [j1, j2] = [j2, j1];
	let p: IPoint = { x: r - j2.ox, y: r - j1.oy };
	if(!oriented) p = { x: g.sx - p.x, y: g.sy - p.y };
	return new Point(p);
}
