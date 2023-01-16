import { same } from "shared/types/geometry";

import type { ISegment } from "../segment/segment";
import type { Path, Polygon, IPointEx } from "shared/types/geometry";

/** 實務上 chain 的數目不會太多，初始陣列大小給 10 已經非常足夠 */
const INITIAL_CHAIN_SIZE = 10;

//=================================================================
/**
 * {@link Chainer} 類別負責把收集到的邊串連成最終輸出的多邊形。
 * 如果最終路徑有一些共用的頂點，則輸出的路徑可能會在該處拆開、也可能不會，
 * 這部份的行為是沒有辦法有效預測的，在撰寫測試的時候需要注意。
 *
 * 這邊我們運用了一些指標的技巧來省去 JavaScript 建立新陣列等等的成本。
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
		// Chainer 的實體會被重複使用，所以要進行歸零
		const size = segments.length + 1;
		this._chainHeads = Array.from({ length: INITIAL_CHAIN_SIZE });
		this._chainTails = Array.from({ length: INITIAL_CHAIN_SIZE });
		this._points = Array.from({ length: size });
		this._next = Array.from({ length: size });
		this._chains = 0; // 理論上這個不用歸零，但安全起見還是照做
		this._length = 0;

		const result: Polygon = [];
		for(const segment of segments) {
			const tail = this._findChain(this._chainHeads, segment.$end);
			const head = this._findChain(this._chainTails, segment.$start);

			if(head && tail) {
				if(head === tail) {
					// 一個 chain 頭尾銜接起來了，加入到輸出結果當中
					result.push(this._chainToPath(head, segment));
					this._removeChain(head);
				} else {
					// 串接兩個本來獨立的 chain
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

		if(DEBUG_ENABLED && this._chains > 0) debugger; // 理論上不應該發生
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
		 * 這邊採用線性搜尋的方式檢查所有的 chain，這乍看非常沒效率，
		 * 但實務上 chains 的大小頂多兩三個而已，所以不需要更進一步改進。
		 */
		for(let i = 1; i <= this._chains; i++) {
			// 這邊通常並不會共用 IPoint 的實體，所以要用座標檢查；
			// 所幸的是這邊並不會需要使用 epsilon 檢查。
			if(same(this._points[indices[i]], p)) return i;
		}
		return 0;
	}
}
