import { same } from "shared/types/geometry";

import type { ISegment } from "../segment/segment";
import type { Path, Polygon, IPointEx } from "shared/types/geometry";

/**
 * In practice there wonk't be too many chains,
 * so an initial array size of 10 is highly sufficient.
 */
const INITIAL_CHAIN_SIZE = 10;

//=================================================================
/**
 * The {@link Chainer} class is responsible for connecting the collected
 * edges into the final output polygon. If there are some shared
 * vertices in the final path, the output path may or may not be
 * split at that point, and this behavior cannot be predicted
 * effectively, so care should be taken when writing tests.
 *
 * Here, we use some pointer tricks to eliminate the cost of
 * creating new arrays in JavaScript.
 */
//=================================================================
export class Chainer {

	protected _chainHeads!: number[];
	protected _chainTails!: number[];
	protected _points!: IPointEx[];
	protected _next!: number[];
	protected _length: number = 0;
	protected _chains: number = 0;

	public $chain(segments: ISegment[]): Polygon {
		// We will reuse the Chainer instance, so we need to reset the states.
		const size = segments.length + 1;
		this._chainHeads = new Array(INITIAL_CHAIN_SIZE);
		this._chainTails = new Array(INITIAL_CHAIN_SIZE);
		this._points = new Array(size);
		this._next = new Array(size);
		this._chains = 0; // We don't need to reset this in theory, but just to be sure.
		this._length = 0;

		const result: Polygon = [];
		for(const segment of segments) {
			const tail = this._findChain(this._chainHeads, segment.$end);
			const head = this._findChain(this._chainTails, segment.$start);

			if(head && tail) {
				if(head === tail) {
					// A chain is connected on the two ends. Add it to the result.
					result.push(this._chainToPath(head, segment));
					this._removeChain(head);
				} else {
					// Connect two independent chains
					this._connectChain(head, tail, segment);
				}
			} else if(head) {
				this._append(segment, head);
			} else if(tail) {
				this._prepend(segment, tail);
			} else {
				this._createChain(segment);
			}
		}

		if(DEBUG_ENABLED && this._chains > 0) debugger; // Shouldn't happen in theory
		return result;
	}

	protected _chainToPath(id: number, segment: ISegment): Path {
		const path: Path = [];
		let i = this._chainHeads[id];
		while(i) {
			path.push(this._points[i]);
			i = this._next[i];
		}
		return path;
	}

	protected _connectChain(head: number, tail: number, segment: ISegment): void {
		this._next[this._chainTails[head]] = this._chainHeads[tail];
		this._chainTails[head] = this._chainTails[tail];
		this._removeChain(tail);
	}

	protected _removeChain(id: number): void {
		if(id < this._chains) {
			this._chainHeads[id] = this._chainHeads[this._chains];
			this._chainTails[id] = this._chainTails[this._chains];
		}
		this._chains--;
	}

	protected _createChain(segment: ISegment): void {
		const i = ++this._length;
		this._points[i] = segment.$start;
		this._points[i + 1] = segment.$end;
		this._chainHeads[++this._chains] = i;
		this._chainTails[this._chains] = i + 1;
		this._next[i] = i + 1;
		this._next[i + 1] = 0;
		++this._length;
	}

	protected _append(segment: ISegment, id: number): void {
		const i = ++this._length;
		this._points[i] = segment.$end;
		this._next[this._chainTails[id]] = i;
		this._chainTails[id] = i;
		this._next[i] = 0;
	}

	protected _prepend(segment: ISegment, id: number): void {
		const i = ++this._length;
		this._points[i] = segment.$start;
		this._next[i] = this._chainHeads[id];
		this._chainHeads[id] = i;
	}

	protected _findChain(indices: number[], p: IPoint): number {
		/**
		 * We use linear search here to check all chains,
		 * which appears to be inefficient,
		 * but in practice there will only be at most two or three chains,
		 * so there is no need for optimizations.
		 */
		for(let i = 1; i <= this._chains; i++) {
			// Typically the instances of IPoints is not shared here,
			// so we need to check by coordinates. Fortunately,
			// we don't need to perform epsilon checks here.
			if(same(this._points[indices[i]], p)) return i;
		}
		return 0;
	}
}
