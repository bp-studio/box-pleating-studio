import { generate } from "core/math/gops";
import { kamiyaHalfIntegral } from "core/math/kamiya";
import { GadgetStrategy } from "shared/json/enum";
import { debugAssert } from "core/utils/debug";
import { same } from "shared/types/geometry";
import { Piece } from "../pattern/piece";
import { universalGPS } from "../generators/universalGPS";
import { Direction } from "shared/types/direction";

import type { Path } from "shared/types/geometry";
import type { QuadrantDirection } from "shared/types/direction";
import type { JAnchor, JDevice, JGadget, JPiece } from "shared/json/pattern";
import type { JOverlap } from "shared/json/layout";

/**
 * A candidate {@link JGadget} for joining. The joining only concerns the
 * {@link JPiece} at the joint corner (called the main piece), so a candidate
 * consists of the main piece, and the rest of the gadget (if any) to be put
 * back after joining.
 */
export interface JoinCandidate {
	/**
	 * The main piece, without detours. It could be shifted, which aligns its
	 * joint corner to the grid.
	 */
	readonly piece: JPiece;

	/** The rest of the gadget. */
	readonly rest?: {
		/** The detours of the main piece itself. */
		readonly detours: readonly Path[];
		/** The other pieces. */
		readonly pieces: readonly JPiece[];
		readonly anchors?: readonly JAnchor[];
	};
}

/**
 * Generate the {@link JoinCandidate}s for the given {@link JOverlap}.
 *
 * @param sx The width of the flap rectangle.
 * @param q The index of the joint corner among the anchors of the gadget.
 * @param edge The index of the ridge of the main piece facing the delta line
 * (see Joinee.e).
 */
export function* getJoinCandidates(
	o: JOverlap, sx: number, q: QuadrantDirection, edge: QuadrantDirection
): Generator<JoinCandidate> {
	if(o.gadget == GadgetStrategy.halfIntegral) {
		for(const gadget of kamiyaHalfIntegral(o, sx)) {
			const candidate = toCandidate(gadget, q);
			if(candidate) yield candidate;
		}
	} else if(o.gadget == GadgetStrategy.universal) {
		for(const gadget of universalGPS(o, sx)) {
			const candidate = toUniversalCandidate(gadget, q, edge);
			if(candidate) yield candidate;
		}
	} else {
		debugAssert(() => !o.gadget, "Unsupported gadget strategy for joins");
		for(const piece of generate(o.ox, o.oy, sx)) yield { piece };
	}
}

/**
 * Convert a multi-piece {@link JGadget} to a {@link JoinCandidate}, or `null`
 * if the joint corner of its main piece is modified by its own detours (in
 * which case the joining would destroy the gadget).
 */
function toCandidate(
	gadget: JGadget, q: QuadrantDirection
): JoinCandidate | null {
	const [main, ...others] = gadget.pieces;
	const { ox, oy, u, v, shift } = main;
	// Note that the anchors of a gadget start from the lower-left corner,
	// and that the detours are in the coordinates before the shift.
	const corner = q == 0 ? { x: 0, y: 0 } : { x: oy + u + v, y: ox + u + v };
	const detours = main.detours!;
	if(detours.some(d => d.some(p => same(p, corner)))) return null;

	const piece: JPiece = { ox, oy, u, v };
	if(shift) piece.shift = shift;
	const { anchors } = gadget;
	return { piece, rest: { detours, pieces: others, anchors } };
}

/**
 * Convert a universal GPS to a {@link JoinCandidate}. Its two pieces are the
 * two halves of the stretch circumscribing rectangle cut along the diagonal,
 * both containing the joint corner. Only the half containing the ridge facing
 * the delta line takes part in the joining, as the main piece, and the other
 * half is put back afterwards. Returns `null` if the joint corner is not on
 * the grid (see Gadget.$reverseGPS).
 */
function toUniversalCandidate(
	gadget: JGadget, q: QuadrantDirection, edge: QuadrantDirection
): JoinCandidate | null {
	// The upper-left half contains the ridges 0 and 1 (and the anchor 1),
	// and the lower-right half contains the ridges 2 and 3 (and the anchor 3).
	const anchor = edge < Direction.LL ? Direction.UL : Direction.LR;
	const index = gadget.pieces.findIndex(
		p => new Piece(p).$anchors.value[anchor] !== null
	);
	const main = gadget.pieces[index];
	const others = gadget.pieces.filter((_, i) => i != index);
	const { ox, oy, u, v, shift } = main;
	const corner = q == 0 ? { x: 0, y: 0 } : { x: oy + u + v, y: ox + u + v };
	const x = corner.x + (shift?.x ?? 0), y = corner.y + (shift?.y ?? 0);
	if(!Number.isInteger(x) || !Number.isInteger(y)) return null;

	const piece: JPiece = { ox, oy, u, v };
	if(shift) piece.shift = shift;
	const { anchors } = gadget;
	const detours = main.detours!;
	return { piece, rest: { detours, pieces: others, anchors } };
}

/**
 * Put back the rest of the {@link JoinCandidate}s into the joined
 * {@link JDevice}. Returns `null` if the joining conflicts with the rest of the
 * gadgets (which happens only in invalid layouts so far), in which case the
 * detours cannot be applied.
 */
export function restoreCandidates(
	device: JDevice, candidates: readonly JoinCandidate[]
): JDevice | null {
	if(candidates.every(c => !c.rest)) return device;

	// The gadgets could be Gadget instances, so we go through JSON to make
	// plain deep copies (see Gadget.toJSON).
	const gadgets = JSON.parse(JSON.stringify(device.gadgets)) as JGadget[];
	for(const [i, { rest }] of candidates.entries()) {
		if(!rest) continue;
		const gadget = gadgets[i];
		const [main] = gadget.pieces;
		// The joining always adds a detour and sets up anchors
		const detours = [...main.detours!, ...rest.detours];
		if(!new Piece({ ...main, detours }).$isDetourValid) return null;
		const pieces = [{ ...main, detours }, ...rest.pieces];
		const anchors = mergeAnchors(gadget.anchors!, rest.anchors!);
		gadgets[i] = { ...gadget, pieces, anchors };
	}
	return { ...device, gadgets };
}

/**
 * Merge two lists of {@link JAnchor}s, which must not conflict with each other
 * (but they may share the same ones, see fanJoin).
 */
export function mergeAnchors(
	a1: readonly JAnchor[], a2: readonly JAnchor[]
): JAnchor[] {
	const result: JAnchor[] = [];
	for(let q = 0; q < Math.max(a1.length, a2.length); q++) {
		debugAssert(
			() => !a1[q] || !a2[q] ||
				JSON.stringify(a1[q]) == JSON.stringify(a2[q]),
			"Conflicting anchors"
		);
		result[q] = a1[q] ?? a2[q];
	}
	return result;
}
