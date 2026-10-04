import { Chainer } from "./chainer";

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

	/**
	 * Called when a chain involves segments from two different sources.
	 * This happens when the generated polygon touches itself at a vertex
	 * (for example, two rectangles touching at their corners), in which case
	 * the sources should be considered connected, even if they don't overlap.
	 */
	public $onConnect?: (a: number, b: number) => void;

	/** The set of known source indices of each chain */
	private _sources: number[] = [];

	protected override _reset(size: number): void {
		super._reset(size);
		this._sources = [];
	}

	protected override _chainToPath(id: number, segment: ISegment): PathEx {
		const path = super._chainToPath(id, segment);
		path.from = this._sources[id];
		return path;
	}

	protected override _connectChain(
		head: number, tail: number, segment: ISegment
	): void {
		this._connect(this._sources[head], segment.$polygon);
		this._connect(this._sources[head], this._sources[tail]);
		super._connectChain(head, tail, segment);
	}

	protected override _append(segment: ISegment, id: number): void {
		this._connect(this._sources[id], segment.$polygon);
		super._append(segment, id);
	}

	protected override _prepend(segment: ISegment, id: number): void {
		this._connect(this._sources[id], segment.$polygon);
		super._prepend(segment, id);
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

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	private _connect(a: number, b: number): void {
		if(a !== b) this.$onConnect?.(a, b);
	}
}
