import { CornerType } from "shared/json";
import { clone } from "shared/utils/clone";
import { debugAssert } from "core/utils/debug";

import type { GadgetStrategy, JOverlap, JPartition } from "shared/json";
import type { QuadrantDirection } from "shared/types/direction";
import type { JointItem } from "./types";

export function* searchRelay(
	items: readonly JointItem[],
	o1: JOverlap, o2: JOverlap,
	s1?: GadgetStrategy, s2?: GadgetStrategy
): Generator<JPartition[]> {
	const oriented = o1.c[2].e == o2.c[2].e; // They share lower-left corner
	if(o1.ox > o2.ox) [o1, o2] = [o2, o1];

	debugAssert(
		() => o1.id !== undefined && o2.id !== undefined,
		"Overlap without id"
	);

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

function makeXRelay(
	o1: JOverlap, o2: JOverlap, oriented: boolean,
	s1?: GadgetStrategy, s2?: GadgetStrategy
): JPartition[] {
	cutX(o1, o2, oriented);
	return toPartitions(o1, o2, s1, s2);
}

function makeYRelay(
	o1: JOverlap, o2: JOverlap, oriented: boolean,
	s1?: GadgetStrategy, s2?: GadgetStrategy
): JPartition[] {
	cutY(o1, o2, oriented);
	return toPartitions(o1, o2, s1, s2);
}

/**
 * Relay the given outer {@link JOverlap} onto the given inner one, by cutting
 * off the part of the outer one that overlaps the inner one, and connecting
 * the remaining part to the gadget of the inner one. Used in fans, where the
 * inner one is the middle one, which also joins with the other outer one.
 */
export function relayOnto(outer: JOverlap, inner: JOverlap): void {
	const oriented = outer.c[2].e == inner.c[2].e;
	if(outer.ox > inner.ox) cutX(inner, outer, oriented);
	else cutY(outer, inner, oriented);
}

/** Cut {@link o2} (the wider one) horizontally and relay it onto {@link o1}. */
function cutX(o1: JOverlap, o2: JOverlap, oriented: boolean): void {
	o2.ox -= o1.ox;
	const [a, b, c, d] = getRelayParameters(oriented);
	o2.c[c] = { type: CornerType.internal, e: o1.id, q: d };
	o2.c[b] = { type: CornerType.intersection, e: o1.c[a].e };
	o1.c[d] = { type: CornerType.socket, e: o2.id, q: c };
	if(!oriented) o2.shift = { x: o1.ox, y: 0 };
}

/** Cut {@link o1} (the taller one) vertically and relay it onto {@link o2}. */
function cutY(o1: JOverlap, o2: JOverlap, oriented: boolean): void {
	o1.oy -= o2.oy;
	const [a, b, c, d] = getRelayParameters(oriented);
	o1.c[c] = { type: CornerType.internal, e: o2.id, q: b };
	o1.c[d] = { type: CornerType.intersection, e: o2.c[a].e };
	o2.c[b] = { type: CornerType.socket, e: o1.id, q: c };
	if(!oriented) o1.shift = { x: 0, y: o2.oy };
}

function toPartitions(
	o1: JOverlap, o2: JOverlap, s1?: GadgetStrategy, s2?: GadgetStrategy
): JPartition[] {
	if(s1) o1.gadget = s1;
	if(s2) o2.gadget = s2;
	return [{ overlaps: [o1] }, { overlaps: [o2] }];
}
