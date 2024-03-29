import { Store } from "./store";
import { CornerType } from "shared/json";
import { cache } from "core/utils/cache";
import { Direction, makeQuadrantCode, opposite } from "shared/types/direction";
import { clone } from "shared/utils/clone";
import { State } from "core/service/state";
import { deviceGenerator } from "./generators/deviceGenerator";

import type { Point } from "core/math/geometry/point";
import type { QuadrantDirection } from "shared/types/direction";
import type { JConnection, JDevice, JJunction, JOverlap, JPartition, JCorner, JAnchor, Strategy, NodeId } from "shared/json";
import type { Pattern } from "./pattern/pattern";
import type { Configuration } from "./configuration";
import type { Vector } from "core/math/geometry/vector";
import type { Ridge } from "./pattern/device";

export interface CornerMap {
	/** {@link JCorner} itself. */
	corner: JCorner;

	/** Which {@link JOverlap} in the {@link Partition}  */
	overlapIndex: number;

	/** Which {@link JAnchor} in the {@link JOverlap}. */
	anchorIndex: QuadrantDirection;
}

//=================================================================
/**
 * {@link Partition} is a single unit under {@link Configuration}.
 * {@link Partition} corresponds to a single {@link Device}.
 */
//=================================================================

export class Partition implements ISerializable<JPartition> {

	public readonly $configuration: Configuration;
	public readonly $cornerMap: readonly CornerMap[];
	public readonly $overlaps: readonly JOverlap[];

	/**
	 * Available {@link JDevice} for this {@link Partition}.
	 * They will be assembled into {@link Pattern}.
	 */
	public readonly $devices: Store<JDevice>;

	private readonly _strategy: Strategy | undefined;

	constructor(config: Configuration, data: JPartition) {
		this.$configuration = config;
		this.$overlaps = data.overlaps;
		if(data.overlaps[0].ox < 0) debugger;
		this.$devices = new Store(deviceGenerator(data, config));
		this._strategy = data.strategy;

		// Gather all corners
		const map: CornerMap[] = [];
		for(const [i, o] of data.overlaps.entries()) {
			for(const [j, c] of o.c.entries()) {
				map.push({ corner: c, overlapIndex: i, anchorIndex: j });
			}
		}
		this.$cornerMap = map;
	}

	public toJSON(): JPartition {
		return {
			overlaps: this.$overlaps, // This is OK since the array is readonly
			strategy: this._strategy,
		};
	}

	public $getDisplacement(pattern: Pattern): Vector {
		const connection = this.$displacementReference;
		return pattern.$getConnectionTarget(connection).$sub(pattern.$config.$repo.$origin);
	}

	/** Choose an outward connection point in this Partition. */
	@cache public get $displacementReference(): JConnection {
		// Choose whichever first one that is out-going
		return this.$overlaps.find(o => o.c[0].type != CornerType.coincide)!.c[0] as JConnection;
	}

	/**
	 * Get the "target" of an external connection point.
	 *
	 * It is in general very difficult to determine the actual extend of an external connection ridge,
	 * because that depends on the overall layout of all the flaps nearby,
	 * not just the two flaps involved and tree structure. Therefore,
	 * we draw the external connection ridge only up to the boundary of the flap,
	 * and only when the connection point is within one of the two flap regions.
	 * We then leave the rest of the ridge to be drawn automatically by the turning of rivers.
	 * And by the "target", we mean the intersection of the ridge and the flap boundary.
	 *
	 * @param point The current location of the connection point itself.
	 * @param c The corresponding {@link JCorner} info.
	 * @param q If given, it will force returning the connection target on the given direction.
	 */
	public $getExternalConnectionTarget(point: Point, map: CornerMap, q?: QuadrantDirection): Point | null {
		let [p1, p2] = this.$getExternalConnectionTargets(map);
		if(p1._x.gt(p2._x)) [p1, p2] = [p2, p1];
		if(q === undefined) {
			if(point._x.le(p1._x)) return p1;
			if(point._x.ge(p2._x)) return p2;

			// Otherwise, the connection point is not inside the two flap regions,
			// and we shall return null.
			return null;
		} else {
			return q == Direction.UR || q == Direction.LR ? p1 : p2;
		}
	}

	/**
	 * Mapping the external connection points to the two possible "targets"
	 * (see {@link $getExternalConnectionTarget} for the meaning of that).
	 *
	 * Naively, one might think it suffices to consider the diagonal line
	 * through the external connection point and locate its intersection with
	 * the boundary of the two flaps, but such method would not work for
	 * patterns among multiple flaps. In that case, we need to consult
	 * {@link _getExposedOverlap} method in order to calculate the location of the target.
	 */
	public $getExternalConnectionTargets(map: CornerMap): [Point, Point] {
		const tree = State.$tree;
		const repo = this.$configuration.$repo;

		let ov = this.$overlaps[map.overlapIndex];
		const parent = this._getParent(ov);
		const c1 = parent.c[0], c2 = parent.c[2];
		const n1 = c1.e as NodeId, n2 = c2.e as NodeId;
		const f1 = tree.$nodes[n1]!, f2 = tree.$nodes[n2]!;

		const quad1 = repo.$quadrants.get(makeQuadrantCode(n1, c1.q!))!;
		const quad2 = repo.$quadrants.get(makeQuadrantCode(n2, c2.q!))!;
		let d1 = 0, d2 = 0;

		// For intersections, the actual overlap to retrieve can be a lot more complicated
		// because of the rivers around the flaps, so we need a series of additional
		// calculations here to decide at what distance should we set the overlap.
		const overlaps = this.$overlaps.concat();
		if(map.corner.type == CornerType.intersection) {
			const oriented = ov.c[0].e! < 0;

			const n3 = map.corner.e as NodeId;
			const t = repo.$nodeSet.$distTriple(n1, n2, n3);
			if(oriented) d2 = t.d2 - f2.$length;
			else d1 = t.d1 - f1.$length;

			if(!this._findOverlapForFlap(n3)) {
				for(const p of this.$configuration.$partitions) {
					if(p == this) continue;
					const find = p._findOverlapForFlap(n3);
					if(find) overlaps.push(find);
				}
			}
		}

		ov = this._getExposedOverlap(ov, overlaps);
		const p1 = quad1.$getOverlapCorner(ov, parent, map.anchorIndex, d1);
		const p2 = quad2.$getOverlapCorner(ov, parent, opposite(map.anchorIndex), d2);

		return [p1, p2];
	}

	/**
	 * See {@link Ridge.$division}.
	 * @param q {@link QuadrantDirection} of the intersection ridge.
	 */
	public $resolveDivision(map: CornerMap): [number, number] {
		const ov = this.$overlaps[map.overlapIndex];
		const parent = this.$configuration.$repo.$junctions[ov.parent];

		const n1 = parent.c[0].e!;
		const n2 = parent.c[2].e!;
		const n3 = map.corner.e!;

		let [a, b] = [n1, n3];
		if(a > b) [a, b] = [b, a];
		const fromN1 = this.$configuration.$repo.$junctions.some(j => j.c[0].e == a && j.c[2].e == b);

		[a, b] = [fromN1 ? n2 : n1, n3];
		if(a > b) [a, b] = [b, a];
		return [a, b];
	}

	/** All {@link JCorner}s that are dragging constraints of the current {@link Partition}. */
	@cache public get $constraints(): readonly CornerMap[] {
		return this.$cornerMap.filter(m => {
			const type = m.corner.type;
			return type == CornerType.socket ||
				type == CornerType.internal ||
				type == CornerType.flap;
		});
	}

	@cache public get $externalCornerMaps(): readonly CornerMap[] {
		return this.$cornerMap.filter(m => {
			const type = m.corner.type;
			return type == CornerType.side || type == CornerType.intersection;
		});
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _findOverlapForFlap(id: NodeId): JOverlap | undefined {
		for(const ov of this.$overlaps) {
			for(const corner of ov.c) {
				if(corner.type == CornerType.flap && corner.e == id) return ov;
			}
		}
	}

	/**
	 * Find, in a {@link Partition} containing joins, what is left of a given {@link JOverlap}
	 * after subtracting the other JOverlaps.
	 */
	private _getExposedOverlap(ov: JOverlap, overlaps: readonly JOverlap[]): JOverlap {
		// Trivial case
		if(overlaps.length == 1) return ov;

		const result = clone(ov);
		const parent = this._getParent(ov);
		let shift = result.shift ?? { x: 0, y: 0 };
		for(const o of overlaps) {
			if(o != ov) {
				const p = this._getParent(o);
				const w = result.ox + shift.x;
				const h = result.oy + shift.y;
				if(p.c[0].e == parent.c[0].e) {
					if(p.ox < parent.ox) {
						const x = Math.max(shift.x, p.ox);
						shift = { x, y: shift.y };
						result.ox = w - x;
					}
					if(p.oy < parent.oy) {
						const y = Math.max(shift.y, p.oy);
						shift = { x: shift.x, y };
						result.oy = h - y;
					}
				}
				if(p.c[2].e == parent.c[2].e) {
					if(p.ox < parent.ox) {
						result.ox = parent.ox - Math.max(p.ox, parent.ox - w) - shift.x;
					}
					if(p.oy < parent.oy) {
						result.oy = parent.oy - Math.max(p.oy, parent.oy - h) - shift.y;
					}
				}
			}
		}
		result.shift = shift;
		return result;
	}

	/**
	 * Obtain the original {@link JJunction} corresponding to the give {@link JOverlap}.
	 */
	private _getParent(ov: JOverlap): Readonly<JJunction> {
		return this.$configuration.$repo.$junctions[ov.parent];
	}
}
