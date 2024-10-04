import { CornerType } from "shared/json";
import { clone } from "shared/utils/clone";

import type { JOverlap, JPartition, Strategy } from "shared/json";
import type { QuadrantDirection } from "shared/types/direction";
import type { JointItem } from "./types";

export function* searchRelay(
	items: readonly JointItem[],
	o1: JOverlap, o2: JOverlap,
	s1?: Strategy, s2?: Strategy
): Generator<JPartition[]> {
	const oriented = o1.c[2].e == o2.c[2].e; // They share lower-left corner
	if(o1.ox > o2.ox) [o1, o2] = [o2, o1];

	/// #if DEBUG
	/* istanbul ignore next: debug */
	if(o1.id === undefined || o2.id === undefined) debugger;
	/// #endif

	// Perform two possible cuttings
	if(!items[0].split) {
		yield makeXRelay(clone(o1), clone(o2), oriented, s1, s2);
		if(s1 !== s2) yield makeXRelay(clone(o1), clone(o2), oriented, s2, s1);
	}
	if(!items[1].split) {
		yield makeYRelay(clone(o1), clone(o2), oriented, s1, s2);
		if(s1 !== s2) yield makeYRelay(clone(o1), clone(o2), oriented, s2, s1);
	}
}

function getRelayParameters(oriented: boolean): QuadrantDirection[] {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	return oriented ? [0, 1, 2, 3] : [2, 3, 0, 1];
}

function makeXRelay(o1: JOverlap, o2: JOverlap, oriented: boolean, s1?: Strategy, s2?: Strategy): JPartition[] {
	o2.ox -= o1.ox;
	const [a, b, c, d] = getRelayParameters(oriented);
	o2.c[c] = { type: CornerType.internal, e: o1.id, q: d };
	o2.c[b] = { type: CornerType.intersection, e: o1.c[a].e };
	o1.c[d] = { type: CornerType.socket, e: o2.id, q: c };
	if(!oriented) o2.shift = { x: o1.ox, y: 0 };
	return [
		{ overlaps: [o1], strategy: s1 },
		{ overlaps: [o2], strategy: s2 },
	];
}

function makeYRelay(o1: JOverlap, o2: JOverlap, oriented: boolean, s1?: Strategy, s2?: Strategy): JPartition[] {
	o1.oy -= o2.oy;
	const [a, b, c, d] = getRelayParameters(oriented);
	o1.c[c] = { type: CornerType.internal, e: o2.id, q: b };
	o1.c[d] = { type: CornerType.intersection, e: o2.c[a].e };
	o2.c[b] = { type: CornerType.socket, e: o1.id, q: c };
	if(!oriented) o1.shift = { x: 0, y: o2.oy };
	return [
		{ overlaps: [o1], strategy: s1 },
		{ overlaps: [o2], strategy: s2 },
	];
}
