import { Chainer } from "./chainer";

import type { ISegment } from "../segment/segment";
import type { Path } from "shared/types/geometry";

//=================================================================
/**
 * {@link ExChainer} is the {@link Chainer} specialized for expansion.
 * It tracks the relation between the generated polygon and
 * the original polygon from which it forms.
 */
//=================================================================

export class ExChainer extends Chainer {

	/** The set of known source indices of each chain */
	private _sources: Set<number>[] = [];

	protected override _chainToPath(id: number, segment: ISegment): Path {
		const path = super._chainToPath(id, segment);
		path.from = [...this._sources[id]];
		return path;
	}

	protected override _connectChain(head: number, tail: number, segment: ISegment): void {
		for(const n of this._sources[tail]) this._sources[head].add(n);
		super._connectChain(head, tail, segment);
	}

	protected override _append(segment: ISegment, id: number): void {
		super._append(segment, id);
		this._sources[id].add(segment.$polygon);
	}

	protected override _prepend(segment: ISegment, id: number): void {
		super._prepend(segment, id);
		this._sources[id].add(segment.$polygon);
	}

	protected override _createChain(segment: ISegment): void {
		super._createChain(segment);
		this._sources[this._chains] = new Set();
		this._sources[this._chains].add(segment.$polygon);
	}

	protected override _removeChain(id: number): void {
		if(id < this._chains) {
			this._sources[id] = this._sources[this._chains];
		}
		super._removeChain(id);
	}
}
