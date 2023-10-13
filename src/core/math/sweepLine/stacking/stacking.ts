import { SweepLine } from "../sweepLine";
import { generalInitializer } from "../polyBool/generalUnion/generalUnion";
import { getOrSetEmptyArray } from "shared/utils/map";
import { GeneralEventProvider } from "../polyBool/generalUnion/generalEventProvider";

import type { Contour, Path, Polygon } from "shared/types/geometry";
import type { ISegment } from "../classes/segment/segment";
import type { EndEvent, StartEvent } from "../classes/event";

//=================================================================
/**
 * {@link Stacking} determines the stacking relations among a set of {@link Polygon}s.
 * It is assumed that none of those polygons intersects,
 * so there is no need for intersection detection here.
 */
//=================================================================
export class Stacking extends SweepLine {

	private readonly _parent: (number | null)[] = [];

	constructor() {
		super(new GeneralEventProvider(true));
	}

	public $get(...paths: Path[]): Contour[] {
		this._reset();
		generalInitializer.$init(
			paths.map(p => [p]),
			(segment, delta) => this._addSegment(segment, delta)
		);
		this._sweep();

		const stacking = new Map<Path, Path[]>();
		for(let i = 0; i < paths.length; i++) {
			const parent = this._parent[i];
			if(parent === -1) {
				stacking.set(paths[i], []);
			} else if(parent !== null) {
				getOrSetEmptyArray(stacking, paths[parent]).push(paths[i]);
			}
		}
		return [...stacking].map(([outer, inner]) => ({ outer, inner }));
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _reset(): void {
		super._reset();
		this._parent.length = 0;
	}

	protected override _isOriented(segment: ISegment, delta: Sign): boolean {
		return delta === 1;
	}

	protected override _processStart(event: StartEvent): void {
		this._status.$insert(event, event);
		const prev = this._status.$getPrev(event);
		if(prev) event.$wrapCount += prev.$wrapCount;

		const index = event.$segment.$polygon;
		if(this._parent[index] === undefined) {
			if(event.$wrapDelta === 1) {
				this._parent[index] = null;
			} else if(prev) {
				const prevIndex = prev.$segment.$polygon;
				const prevParent = this._parent[prevIndex];
				this._parent[index] = prevParent === null ? prevIndex : prevParent;
			} else {
				this._parent[index] = -1;
			}
		}
	}

	protected _processEnd(event: EndEvent): void {
		this._status.$delete(event.$other);
	}
}
