import { same } from "shared/types/geometry";
/// #if DEBUG
import { pathToString, pointToString } from "core/math/geometry/path";
/// #endif

import type { ISegment } from "../segment/segment";
import type { Path } from "shared/types/geometry";
import type { StartEvent } from "../event";

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
export class Chainer<PathType extends Path = Path> {

	public $checkFunction = same;

	protected _chainHeads!: number[];
	protected _chainTails!: number[];
	protected _points!: IPoint[];
	protected _next!: number[];
	protected _length: number = 0;
	protected _chains: number = 0;

	public $chain(segments: ISegment[]): PathType[] {
		this._reset(segments.length + 1);

		const result: PathType[] = [];
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

		/// #if DEBUG
		/* istanbul ignore next: debug */
		if(this._chains > 0) this.debugChains();
		/// #endif

		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Reset the state of this {@link Chainer}.
	 * We will reuse the Chainer instance, so we need to reset the states.
	 */
	protected _reset(size: number): void {
		this._chainHeads = new Array(INITIAL_CHAIN_SIZE);
		this._chainTails = new Array(INITIAL_CHAIN_SIZE);
		this._points = new Array(size);
		this._next = new Array(size);
		this._chains = 0; // We don't need to reset this in theory, but just to be sure.
		this._length = 0;
	}

	/** Add the last segment to a chain and complete a path. */
	protected _chainToPath(id: number, segment: ISegment): PathType {
		const path: Path = [];
		let i = this._chainHeads[id];
		while(i) {
			path.push(this._points[i]);
			i = this._next[i];
		}
		return path as PathType;
	}

	/** Connect two chains with matching head and tail. */
	protected _connectChain(head: number, tail: number, segment: ISegment): void {
		this._next[this._chainTails[head]] = this._chainHeads[tail];
		this._chainTails[head] = this._chainTails[tail];
		this._removeChain(tail);
	}

	/** Remove a chain after it gets connected or gets collected. */
	protected _removeChain(id: number): void {
		if(id < this._chains) {
			this._chainHeads[id] = this._chainHeads[this._chains];
			this._chainTails[id] = this._chainTails[this._chains];
		}
		this._chains--;
	}

	/** Create a new chain consisting of a single segment. */
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

	/** Add a segment to the tail of a chain. */
	protected _append(segment: ISegment, id: number): void {
		const i = ++this._length;
		this._points[i] = segment.$end;
		this._next[this._chainTails[id]] = i;
		this._chainTails[id] = i;
		this._next[i] = 0;
	}

	/** Add a segment to the head of a chain. */
	protected _prepend(segment: ISegment, id: number): void {
		const i = ++this._length;
		this._points[i] = segment.$start;
		this._next[i] = this._chainHeads[id];
		this._chainHeads[id] = i;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _findChain(indices: number[], p: IPoint): number {
		/**
		 * We use linear search here to check all chains,
		 * which appears to be inefficient,
		 * but in practice there will only be at most two or three chains,
		 * so there is no need for optimizations.
		 */
		for(let i = 1; i <= this._chains; i++) {
			// Typically the instances of IPoints is not shared here,
			// so we need to check by coordinates.
			if(this.$checkFunction(this._points[indices[i]], p)) return i;
		}
		return 0;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/// #if DEBUG

	/**
	 * We shouldn't get here in theory. If we do,
	 * the general rule of thumb is that the line segments are not thoroughly subdivided,
	 * causing the {@link StartEvent.$wrapCount} to add up in the wrong way.
	 * In that case, look for the following possible causes:
	 *
	 * 1. The input may contain self-intersections within the same polygon,
	 *    while taking union in the mode without checking self-intersections.
	 * 2. Something might be wrong with the epsilon-comparison,
	 *    resulting in missing intersection detection.
	 */
	/* istanbul ignore next: debug */
	protected debugChains(): void {
		for(let i = 1; i <= this._chains; i++) {
			const path: Path = [];
			let cursor = this._chainHeads[i];
			while(cursor) {
				path.push(this._points[cursor]);
				cursor = this._next[cursor];
			}
			console.log(pathToString(path));
		}
		debugger;
	}

	/* istanbul ignore next: debug */
	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	protected debugSegments(segments: ISegment[]): void {
		for(const segment of segments) {
			console.log(pointToString(segment.$start), pointToString(segment.$end));
		}
	}

	/// #endif
}
