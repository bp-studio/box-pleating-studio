import { Gadget } from "../pattern/gadget";
import { AddOn } from "../pattern/addOn";
import { CornerType } from "shared/json";
import { convertIndex } from "shared/utils/pattern";
import { opposite } from "shared/types/direction";
import { getRegions } from "../pattern/positioners/positioningContext";

import type { Direction, QuadrantDirection } from "shared/types/direction";
import type { JDevice, JGadget, OverlapId } from "shared/json";
import type { Configuration } from "../configuration";
import type { PositioningContext } from "../pattern/positioners/positioningContext";
import type { RationalPath } from "core/math/geometry/rationalPath";

type TipDirection = Direction.UR | Direction.LL;

/**
 * A term in the span of a {@link Gadget} chain, depending only on the
 * {@link JDevice}s chosen for the given {@link Partition}s.
 */
interface Term {
	readonly partitions: readonly number[];
	readonly value: (devices: readonly JDevice[]) => number;
}

/** A {@link Gadget} chain that must fit the span of its junction. */
interface Chain {
	readonly sx: number;
	readonly terms: readonly Term[];
}

/**
 * The bounds to be checked as soon as the {@link JDevice} of a given
 * {@link Partition} is chosen, indexed by the {@link Partition}.
 */
export type SpanBounds = readonly (readonly Chain[])[];

//=================================================================
/**
 * {@link createSpanBounds} creates the lower bounds of the spans checked by
 * {@link PositioningContext.$checkJunctions}, so that the combinations of
 * {@link JDevice}s that cannot pass the check can be skipped before the
 * combinations are complete.
 *
 * The span of a chain consists of the width span of the starting
 * {@link Gadget}, and the remaining x-components and the slacks of the
 * relays along the chain. The former two depend only on the individual
 * {@link JDevice}s, and the slack of a relay depends only on the
 * {@link JDevice}s on both ends (see PositioningContext._setupSlackForOverlap).
 * So a chain is checked as soon as the last {@link Partition} involved is
 * decided. The slacks are cached for each pair of {@link JDevice}s, as there
 * are far fewer pairs than combinations.
 *
 * Only the chain starting from the first overlap of each junction is
 * considered. It is always fully evaluated in the check, while the other
 * chains could be skipped if their overlaps are visited along the way.
 */
//=================================================================
export function createSpanBounds(config: Configuration): SpanBounds {
	const overlaps = config.$overlaps;
	const junctions = config.$repo.$junctions;
	const bounds: Chain[][] = config.$partitions.map(() => []);

	// Mirroring the junctions checked in PositioningContext.$checkJunctions
	if(junctions.length == 1 && overlaps.length == 1) return bounds;
	const indices = config.$singleMode ?
		[overlaps[0].parent] : junctions.map((_, i) => i);

	for(const j of indices) {
		const start = overlaps.findIndex(o => o.parent == j);
		/* istanbul ignore next: foolproof */
		if(start < 0) continue;
		const terms = getTerms(config, start);
		const last = Math.max(...terms.flatMap(t => t.partitions));
		bounds[last].push({ sx: junctions[j].sx, terms });
	}
	return bounds;
}

/**
 * Mirroring PositioningContext._checkJunction, collect the {@link Term}s of
 * the chain starting from the given overlap.
 */
function getTerms(config: Configuration, start: number): Term[] {
	const overlaps = config.$overlaps;
	const locate = (index: number): [number, number] =>
		config.$overlapMap.get(convertIndex(index) as OverlapId)!;

	const [p, k] = locate(start);
	const terms: Term[] = [{
		partitions: [p],
		value: ([device]) => getGadget(device, k).widthSpan.value,
	}];
	for(const q of [0, 2] as TipDirection[]) {
		let index = start;
		const visited = new Set<number>([index]);
		while(true) {
			const corner = overlaps[index].c[q];
			if(corner.type == CornerType.flap) break;
			const next = convertIndex(corner.e);
			/* istanbul ignore next: foolproof */
			if(visited.has(next)) break;
			visited.add(next);
			if(corner.type == CornerType.internal) {
				const [p1, k1] = locate(index);
				const [p2, k2] = locate(next);
				const q2 = corner.q!;
				const back = overlaps[next].c[2 - q];
				const mutual = back.type == CornerType.internal &&
					back.e == convertIndex(index);
				terms.push(createSlackTerm(
					{ p: p1, k: k1, q }, { p: p2, k: k2, q: q2 }, mutual
				));
				terms.push({
					partitions: [p2],
					value: ([device]) => getGadget(device, k2).rx(q, q2),
				});
			}
			index = next;
		}
	}
	return terms;
}

/**
 * Whether the chosen {@link JDevice}s (up to the given depth) could possibly
 * pass the checks of the chains completed at that depth.
 */
export function checkSpanBounds(
	bounds: SpanBounds, depth: number, devices: readonly JDevice[]
): boolean {
	for(const chain of bounds[depth]) {
		let span = 0;
		for(const term of chain.terms) {
			span += term.value(term.partitions.map(p => devices[p]));
		}
		if(span > chain.sx) return false;
	}
	return true;
}

/**
 * The {@link Gadget} instances are cached, as the same {@link JDevice} is
 * checked against many combinations.
 */
const gadgetCache = new WeakMap<JGadget, Gadget>();

function getGadget(device: JDevice, index: number): Gadget {
	const data = device.gadgets[index];
	let gadget = gadgetCache.get(data);
	if(!gadget) gadgetCache.set(data, gadget = new Gadget(data));
	return gadget;
}

/** A corner of a {@link Gadget} in a {@link Partition}. */
interface Corner {
	/** Index of the {@link Partition}. */
	readonly p: number;
	/** Index of the {@link Gadget} in the {@link JDevice}. */
	readonly k: number;
	readonly q: QuadrantDirection;
}

/**
 * Create the {@link Term} of the slack of a relay between the given corners,
 * mirroring PositioningContext._setupSlackForOverlap and
 * PositioningContext._getSlack.
 *
 * The slacks are cached by the identities of the {@link JDevice}s, so the
 * cache is not shared across {@link Configuration}s, as each of them creates
 * its own {@link JDevice}s. In theory, the slack depends only on the contents
 * of the two {@link JDevice}s, so it could be shared by keying on the
 * serialized contents (say, in the Repository). But that is far from
 * being the bottleneck (it took a search from seconds down to ~100ms), so we
 * keep it simple for now.
 */
function createSlackTerm(from: Corner, to: Corner, mutual: boolean): Term {
	const { k: k1, q: q1 } = from, { k: k2, q: q2 } = to;
	const cache = new WeakMap<JDevice, WeakMap<JDevice, number>>();
	const getSlack = (own: JDevice, target: JDevice): number => {
		const g1 = getGadget(own, k1);
		const g2 = getGadget(target, k2);
		const slack = Math.floor(g1.$slack.value[q1]);
		if(mutual) {
			// If the target is joined with other gadgets (as in split joins),
			// there could be additional slack from the collision test, which
			// we ignore here, as it only makes the bound looser. Under the
			// current searching, only the remaining part of a split join is
			// relayed back onto the joined one, and that is never on the
			// chains starting from the first overlaps of the junctions. If
			// split joins are ever combined with other relays (see
			// GeneralConfigGeneratorContext._searchSplitJoin), the slack can
			// be computed exactly as in the other case, for more precise
			// pruning.
			const tx1 = g1.widthSpan.value + g2.rx(q1, q2);
			const tx2 = g2.widthSpan.value + g1.rx(2 - q1, opposite(q2));
			return Math.max(tx2 - tx1, slack, 0);
		}

		// In relayed joins, the other regions in the device of g1 move
		// together with it.
		const g1Contour = g1.$contour.value;
		const companions = getDeviceRegions(own).filter(c => c != g1Contour);
		const obstacles = getDeviceRegions(target);
		const added =
			g1.$getConnectionSlack(g2, q1, q2, obstacles, companions);
		return Math.floor(g1.$slack.value[q1] + added);
	};
	return {
		partitions: [from.p, to.p],
		value: ([own, target]) => {
			let map = cache.get(own);
			if(!map) cache.set(own, map = new WeakMap());
			let slack = map.get(target);
			if(slack === undefined) {
				map.set(target, slack = getSlack(own, target));
			}
			return slack;
		},
	};
}

const regionCache = new WeakMap<JDevice, RationalPath[]>();

/** The contours of all regions of a {@link JDevice}. */
function getDeviceRegions(device: JDevice): RationalPath[] {
	let regions = regionCache.get(device);
	if(!regions) {
		regions = getRegions({
			$gadgets: device.gadgets.map((_, i) => getGadget(device, i)),
			$addOns: device.addOns?.map(a => new AddOn(a)) ?? [],
		});
		regionCache.set(device, regions);
	}
	return regions;
}
