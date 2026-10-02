import { debugAssert } from "core/utils/debug";
import { JoinStrategy } from "shared/json/enum";

import type { JAnchor, JDevice, JGadget } from "shared/json/pattern";
import type { JOverlap } from "shared/json/layout";
import type { Repository } from "../repository";

/** The number of {@link JOverlap}s in a fan (see {@link fanJoin}). */
export const FAN_SIZE = 3;

//=================================================================
/**
 * Join three {@link JOverlap}s sharing the same corner (a "fan"), where the
 * first one is in the middle, and joins with each of the other two.
 *
 * The two joins are performed separately with the same {@link JPiece} for the
 * middle {@link JOverlap}, and then merged into one {@link JDevice}.
 * For the moment, only simple joins (including perfect joins) are supported,
 * and the {@link JoinStrategy} of each side is given by the corresponding outer
 * {@link JOverlap}.
 */
//=================================================================
export function* fanJoin(
	overlaps: readonly JOverlap[], repo: Repository
): Generator<JDevice> {
	const [o0, o1, o2] = overlaps;
	const joiner1 = repo.$getJoiner([o0, o1]);
	const joiner2 = repo.$getJoiner([o0, o2]);
	const s1 = toSimpleJoin(o1), s2 = toSimpleJoin(o2);
	for(const piece of joiner1.$firstPieces) {
		const devices = [...joiner2.$simpleJoin(s2, piece)];
		if(!devices.length) continue;
		for(const d1 of joiner1.$simpleJoin(s1, piece)) {
			for(const d2 of devices) yield merge(d1, d2);
		}
	}
}

function toSimpleJoin(
	o: JOverlap
): JoinStrategy.simple | JoinStrategy.perfect {
	debugAssert(
		() => o.join == JoinStrategy.simple || o.join == JoinStrategy.perfect,
		"Unsupported join strategy in a fan"
	);
	return o.join as JoinStrategy.simple | JoinStrategy.perfect;
}

/**
 * Merge two joins sharing the first {@link JGadget}.
 */
function merge(d1: JDevice, d2: JDevice): JDevice {
	// The gadgets could be Gadget instances, so we go through JSON to make
	// plain deep copies (see Gadget.toJSON).
	const [m1, g1] = toJSON(d1.gadgets);
	const [m2, g2] = toJSON(d2.gadgets);

	debugAssert(
		() => JSON.stringify(m1.offset) == JSON.stringify(m2.offset),
		"Inconsistent offset of the middle gadget"
	);

	// Each join modifies the middle piece on its own side, by adding a detour
	// and setting up an intersection anchor.
	const [p1] = m1.pieces, [p2] = m2.pieces;
	const detours = [...p1.detours!, ...p2.detours!];
	const piece = { ...p1, detours };
	const anchors = mergeAnchors(m1.anchors!, m2.anchors!);
	const middle: JGadget = { ...m1, pieces: [piece], anchors };

	return { gadgets: [middle, g1, g2] };
}

function mergeAnchors(a1: JAnchor[], a2: JAnchor[]): JAnchor[] {
	const result: JAnchor[] = [];
	for(let q = 0; q < Math.max(a1.length, a2.length); q++) {
		debugAssert(() => !a1[q] || !a2[q], "Conflicting anchors");
		result[q] = a1[q] ?? a2[q];
	}
	return result;
}

function toJSON(gadgets: readonly JGadget[]): JGadget[] {
	return JSON.parse(JSON.stringify(gadgets)) as JGadget[];
}
