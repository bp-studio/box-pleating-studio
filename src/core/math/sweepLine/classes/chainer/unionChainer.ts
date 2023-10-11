import { Chainer } from "./chainer";
import { isClockwise } from "core/math/geometry/path";

import type { ISegment } from "../segment/segment";
import type { PathEx } from "shared/types/geometry";

//=================================================================
/**
 * {@link UnionChainer} is the {@link Chainer} for taking unions.
 * It tracks the relation between the generated polygon and
 * the original polygon from which it forms.
 */
//=================================================================

export class UnionChainer extends Chainer<PathEx> {

	/** The set of known source indices of each chain */
	private _sources: number[] = [];

	protected override _reset(size: number): void {
		super._reset(size);
		this._sources = [];
	}

	protected override _chainToPath(id: number, segment: ISegment): PathEx {
		const path = super._chainToPath(id, segment);
		path.from = this._sources[id];
		path.isHole = isClockwise(path);
		return path;
	}

	protected override _createChain(segment: ISegment): void {
		super._createChain(segment);
		const id = this._chains;
		this._sources[id] = segment.$polygon;
	}

	protected override _removeChain(id: number): void {
		if(id < this._chains) {
			this._sources[id] = this._sources[this._chains];
		}
		super._removeChain(id);
	}
}
