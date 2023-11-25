import { Gadget } from "./gadget";
import { AddOn } from "./addOn";
import { cache } from "core/utils/cache";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { CornerType } from "shared/json";
import { Vector } from "core/math/geometry/vector";
import { clone } from "shared/utils/clone";
import { getNodeId, getQuadrant, opposite } from "shared/types/direction";
import { toPath } from "core/math/geometry/rationalPath";
import { convertIndex } from "shared/utils/pattern";

import type { PerQuadrant, QuadrantDirection } from "shared/types/direction";
import type { CornerMap, Partition } from "../partition";
import type { JDevice, JConnection, JCorner, OverlapId } from "shared/json";
import type { Contour, ILine } from "shared/types/geometry";
import type { Region } from "./region";
import type { Pattern } from "./pattern";

export interface Ridge extends Line {
	$type?: CornerType;

	/** The {@link TreeNode.id}s of the the two flaps separated by the intersection ridge. */
	$division?: [number, number];
}

//=================================================================
/**
 * {@link Device} is the smallest movable unit in a {@link Pattern}.
 */
//=================================================================
export class Device implements ISerializable<JDevice> {

	public readonly $pattern: Pattern;
	public readonly $partition: Partition;
	public readonly $gadgets: readonly Gadget[];
	public readonly $addOns: readonly AddOn[];

	private readonly _regions: readonly Region[];

	/**
	 * For each {@link Gadget} in {@link $gadgets}, list all its anchor point locations.
	 * This is available only after the {@link Device} has been initialized,
	 * so we cannot use this during positioning.
	 */
	public $anchors!: readonly PerQuadrant<Point>[];

	public $location!: IPoint;

	private readonly _originalDisplacement!: Vector;
	private _delta!: Vector;
	private _ridgeCache: readonly Ridge[] | undefined;
	private _rawRidgeCache: readonly Ridge[] | undefined;

	constructor(pattern: Pattern, partition: Partition, data: JDevice) {
		this.$pattern = pattern;
		this.$partition = partition;
		this.$gadgets = data.gadgets.map(g => new Gadget(g));
		this.$addOns = data.addOns?.map(a => new AddOn(a)) ?? [];
		this.$offset = data.offset ?? 0;

		// Collect regions
		const regions: Region[] = [];
		for(const g of this.$gadgets) regions.push(...g.pieces);
		regions.push(...this.$addOns);
		this._regions = regions;
	}

	public $init(): void {
		(this as Record<string, unknown>)._originalDisplacement =
			this.$partition.$getDisplacement(this.$pattern);
		this.$updatePosition();
	}

	public get $initialized(): boolean {
		return Boolean(this._originalDisplacement);
	}

	public toJSON(): JDevice {
		return {
			gadgets: clone(this.$gadgets),
			offset: this.$offset,
			addOns: this.$addOns.length ? this.$addOns : undefined,
		};
	}

	/**
	 * The distance between the first out-going anchor point
	 * (see {@link Partition.$displacementReference})
	 * of this device to its connection target.
	 */
	public get $offset(): number {
		let dx = this.$partition.$getDisplacement(this.$pattern).x;
		dx -= this._originalDisplacement.x;
		return (this.$location.x - dx) * this.$pattern.$config.$repo.$f.x;
	}
	public set $offset(v: number) {
		const { x, y } = this.$pattern.$config.$repo.$f;
		this.$location = { x: v * x, y: v * y };
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Update parameters after the {@link Device} have moved. */
	public $updatePosition(): void {
		// Update delta
		const origin = this.$pattern.$config.$repo.$origin.$add(this._originalDisplacement);
		this._delta = origin.$add(new Vector(this.$location)).sub(Point.ZERO);

		// Update anchors
		const result: PerQuadrant<Point>[] = [];
		for(const g of this.$gadgets) {
			result.push(g.$anchorMap.map(m => this._transform(m[0])));
		}
		this.$anchors = result;

		// Clear cache of self and neighbors
		this._clearCache();
		this._neighbors.forEach(n => n._clearCache());

		// Fire event
		this.$partition.$configuration.$onDeviceMove();
	}

	/** All ridges that should be drawn. */
	public get $drawRidges(): readonly ILine[] {
		const ridges = this._ridges.filter(r => r.$type != CornerType.intersection);
		for(const map of this.$partition.$externalCornerMaps) {
			if(map.corner.type != CornerType.intersection) continue;
			const from = this.$resolveCornerMap(map);
			const to = this.$partition.$getExternalConnectionTarget(from, map);
			if(to) {
				const ridge = new Line(from, to) as Ridge;
				ridges.push(ridge);
			}
		}
		return ridges.map(l => l.$toILine());
	}

	/** All ridges used for tracing */
	public get $traceRidges(): readonly Ridge[] {
		// Side ridges are handled separately, so are not included.
		return this._ridges.filter(r => r.$type != CornerType.side);
	}

	/** All axis-parallel creases that should be drawn. */
	public get $axisParallels(): readonly ILine[] {
		const result: Line[] = [];
		for(const r of this._regions) {
			for(const l of r.$axisParallels) {
				result.push(this._transform(l));
			}
		}
		return result.map(l => l.$toILine());
	}

	/** Contours for the devices. Used for drawing selection shade. */
	public get $contour(): readonly Contour[] {
		return this._regions.map(r => ({
			outer: toPath(r.$shape.contour.map(p => this._transform(p))),
		}));
	}

	/** The lower and upper bounds of x-coordinate that can be dragged. */
	public $getDraggingRange(): readonly [number, number] {
		const fx = this.$pattern.$config.$repo.$f.x;
		const result = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY] as [number, number];
		for(const c of this.$partition.$constraints) {
			const isOut = c.corner.type != CornerType.socket;
			const q = isOut ? c.anchorIndex : opposite(c.corner.q!);
			const f = fx * (q == 0 ? -1 : 1);
			const target = this.$pattern.$getConnectionTarget(c.corner as JConnection);
			const slack = isOut ?
				this.$gadgets[c.overlapIndex].$slack[c.anchorIndex] :
				this.$pattern.$gadgets[convertIndex(c.corner.e)].$slack[c.corner.q!];
			const bound = target.x - this.$resolveCornerMap(c).x - slack * f;
			if(f > 0 && result[1] > bound) result[1] = bound;
			else if(f < 0 && result[0] < bound) result[0] = bound;
		}
		return result;
	}

	public $getConnectionRidges(internalOnly: boolean): Ridge[] {
		const result: Line[] = [];
		for(const [i, ov] of this.$partition.$overlaps.entries()) {
			for(const [q, c] of ov.c.entries()) {
				if(c.type == CornerType.flap && !internalOnly || c.type == CornerType.internal) {
					result.push(new Line(
						this.$anchors[i][q],
						this.$pattern.$getConnectionTarget(c as JConnection)
					));
				}
			}
		}
		return result;
	}

	public $resolveCornerMap(map: CornerMap): Point {
		return this.$anchors[map.overlapIndex][map.anchorIndex];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _transform<T extends Point | Line>(obj: T): T {
		const f = this.$pattern.$config.$repo.$f;
		return obj.$transform(f.x, f.y).$add(this._delta) as T;
	}

	/** All ridges after considering overlapping with neighbors. */
	private get _ridges(): readonly Ridge[] {
		if(this._ridgeCache) return this._ridgeCache;
		const neighborRidges = this._neighbors.flatMap(g => g._rawRidges);
		return this._ridgeCache = Line.$subtract(this._rawRidges, neighborRidges);
	}

	/**
	 * Ridges of the {@link Region}s before transformation.
	 * The result is constant, so it is cached.
	 */
	@cache private get _innerRidges(): readonly Ridge[] {
		const result: Line[] = [];
		for(const region of this._regions) {
			const parallelRegions = this._regions.filter(
				q => q != region && q.$direction.$parallel(region.$direction)
			);

			// Ridges that are perpendicular to the axis-parallel creases
			// should not be eliminated (this happens in meandering)
			const lines = parallelRegions.flatMap(
				q => q.$shape.ridges.filter(l => !l.$perpendicular(q.$direction))
			);

			result.push(...Line.$subtract(region.$shape.ridges, lines));
		}
		return Line.$distinct(result);
	}

	/**
	 * All neighboring {@link Device}s.
	 */
	@cache private get _neighbors(): readonly Device[] {
		const result = new Set<Device>();
		for(const o of this.$partition.$overlaps) {
			for(const corner of o.c) {
				if(corner.type == CornerType.socket || corner.type == CornerType.internal) {
					const [i] = this.$partition.$configuration.$overlapMap.get(corner.e as OverlapId)!;
					result.add(this.$pattern.$devices[i]);
				}
			}
		}
		return Array.from(result);
	}

	/** Self-owned ridges. */
	private get _rawRidges(): readonly Ridge[] {
		if(this._rawRidgeCache) return this._rawRidgeCache;
		const selfRidges = this._innerRidges.map(l => this._transform(l));
		const outerRidges = this._getOuterRidges();
		return this._rawRidgeCache = selfRidges.concat(outerRidges);
	}

	private _getOuterRidges(): readonly Ridge[] {
		const result = this.$getConnectionRidges(false);
		for(const map of this.$partition.$externalCornerMaps) {
			const from = this.$resolveCornerMap(map);
			const dir = this._resolveCornerDirection(map.corner);
			const to = this.$partition.$getExternalConnectionTarget(from, map, dir);
			if(to) {
				const ridge = new Line(from, to) as Ridge;
				ridge.$type = map.corner.type; // Mark the ridge type
				if(map.corner.type == CornerType.intersection) {
					ridge.$division = this.$partition.$resolveDivision(map);
				}
				result.push(ridge);
			}
		}
		return result;
	}

	private _resolveCornerDirection(corner: JCorner): QuadrantDirection | undefined {
		if(corner.type != CornerType.intersection) return undefined;
		const codes = this.$partition.$configuration.$repo.$quadrants.keys();
		for(const code of codes) {
			if(getNodeId(code) == corner.e) return getQuadrant(code);
		}
		return undefined;
	}

	private _clearCache(): void {
		this._ridgeCache = undefined;
		this._rawRidgeCache = undefined;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Static methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Generate a signature for a given list of {@link JDevice},
	 * disregarding positional information.
	 */
	public static $getSignature(devices: readonly JDevice[]): string {
		devices = clone(devices);
		for(const device of devices) {
			device.gadgets.forEach(g => Gadget.$simplify(g));
			delete device.offset;
		}
		return JSON.stringify(devices);
	}
}
