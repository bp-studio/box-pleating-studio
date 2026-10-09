import { debugAssert } from "core/utils/debug";
import { mergeAnchors } from "./joinCandidate";
import { Gadget } from "../pattern/gadget";
import { AddOn } from "../pattern/addOn";
import { Overlap } from "core/math/sweepLine/clip/overlap";
import { toPath } from "core/math/geometry/rationalPath";

import type { JDevice, JGadget } from "shared/json/pattern";
import type { JOverlap } from "shared/json/layout";
import type { Repository } from "../repository";

/** The number of {@link JOverlap}s in a fan (see {@link fanJoin}). */
export const FAN_SIZE = 3;

//=================================================================
/**
 * Join three {@link JOverlap}s sharing the same corner (a "fan"), where the
 * first one is in the middle, and joins with each of the other two.
 *
 * The two joins are performed separately with the same {@link JPiece} of the
 * middle {@link JOverlap}, and then merged into one {@link JDevice}. The
 * {@link JoinStrategy} of each side is given by the corresponding outer
 * {@link JOverlap}. Any of them could be half-integral, in which case only the
 * main piece takes part in the joins (see JoinCandidate). In particular, a
 * half-integral gadget in the middle (which is GPS-like) allows the two sides
 * to be joined with different directions of axis-parallel creases.
 */
//=================================================================
export function* fanJoin(
	overlaps: readonly JOverlap[], repo: Repository
): Generator<JDevice> {
	const [o0, o1, o2] = overlaps;
	const joiner1 = repo.$getJoiner([o0, o1]);
	const joiner2 = repo.$getJoiner([o0, o2]);
	for(const candidate of joiner1.$firstCandidates) {
		const devices = [...joiner2.$join(o2.join!, candidate)];
		if(!devices.length) continue;
		for(const d1 of joiner1.$join(o1.join!, candidate)) {
			for(const d2 of devices) {
				const device = merge(d1, d2);
				if(device) yield device;
			}
		}
	}
}

/**
 * Merge two joins sharing the first {@link JGadget}. Each of the joins is
 * valid on its own, but they could conflict with each other near the joint,
 * where both of them modify the middle gadget. In that case, return `null`.
 */
function merge(d1: JDevice, d2: JDevice): JDevice | null {
	// The gadgets could be Gadget instances, so we go through JSON to make
	// plain deep copies (see Gadget.toJSON).
	const [m1, g1] = toJSON(d1.gadgets);
	const [m2, g2] = toJSON(d2.gadgets);

	debugAssert(
		() => JSON.stringify(m1.offset) == JSON.stringify(m2.offset),
		"Inconsistent offset of the middle gadget"
	);

	// Each join modifies the main piece of the middle gadget on its own side,
	// by adding a detour and setting up an intersection anchor. The rest of the
	// middle gadget (if any, see restoreCandidates) is the same in both joins.
	const [p1, ...rest] = m1.pieces, [p2] = m2.pieces;
	const detours = [...p1.detours!];
	const keys = new Set(detours.map(d => JSON.stringify(d)));
	detours.push(...p2.detours!.filter(d => !keys.has(JSON.stringify(d))));
	const piece = { ...p1, detours };
	const anchors = mergeAnchors(m1.anchors!, m2.anchors!);
	const middle: JGadget = { ...m1, pieces: [piece, ...rest], anchors };

	const addOns = [...d1.addOns ?? [], ...d2.addOns ?? []];
	const result: JDevice = { gadgets: [middle, g1, g2] };
	if(addOns.length) result.addOns = addOns;
	return hasOverlappingRegions(result) ? null : result;
}

/**
 * Whether any two regions (pieces or add-ons) of the {@link JDevice} overlap.
 * For example, the triangle of a standard join on one side could overlap the
 * middle piece modified by the other side.
 */
function hasOverlappingRegions(device: JDevice): boolean {
	const contours = [
		...device.gadgets.flatMap(
			g => new Gadget(g).pieces.map(p => p.$shape.value.contour)
		),
		...(device.addOns ?? []).map(a => new AddOn(a).$shape.value.contour),
	].map(toPath);
	return contours.some((c1, i) =>
		contours.slice(i + 1).some(c2 => Overlap.$test(c1, c2))
	);
}

function toJSON(gadgets: readonly JGadget[]): JGadget[] {
	return JSON.parse(JSON.stringify(gadgets)) as JGadget[];
}
