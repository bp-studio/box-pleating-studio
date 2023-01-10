import { same } from "shared/types/geometry";

import type { ISegment } from "../segment/segment";
import type { Path, Polygon } from "shared/types/geometry";

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

	protected chainHeads!: number[];
	protected chainTails!: number[];
	protected points!: IPoint[];
	protected next!: number[];
	protected length: number = 0;
	protected chains: number = 0;

	public $chain(segments: ISegment[]): Polygon {
		const size = segments.length + 1;
		this.chainHeads = Array.from({ length: INITIAL_CHAIN_SIZE });
		this.chainTails = Array.from({ length: INITIAL_CHAIN_SIZE });
		this.points = Array.from({ length: size });
		this.next = Array.from({ length: size });

		const result: Polygon = [];
		for(const segment of segments) {
			const tail = this._findChain(this.chainHeads, segment.$end);
			const head = this._findChain(this.chainTails, segment.$start);

			if(head && tail) {
				if(head === tail) {
					// 一個 chain 頭尾銜接起來了，加入到輸出結果當中
					result.push(this._chainToPath(head));
					this._removeChain(head);
				} else {
					// 串接兩個本來獨立的 chain
					this._connectChain(head, tail);
				}
			} else if(head) {
				this._append(segment, head);
			} else if(tail) {
				this._prepend(segment, tail);
			} else {
				this._createChain(segment);
			}
		}
		return result;
	}

	protected _chainToPath(id: number): Path {
		const path: Path = [];
		let i = this.chainHeads[id];
		while(i) {
			path.push(this.points[i]);
			i = this.next[i];
		}
		return path;
	}

	protected _connectChain(head: number, tail: number): void {
		this.next[this.chainTails[head]] = this.chainHeads[tail];
		this.chainTails[head] = this.chainTails[tail];
		this._removeChain(tail);
	}

	protected _removeChain(id: number): void {
		if(id < this.chains) {
			this.chainHeads[id] = this.chainHeads[this.chains];
			this.chainTails[id] = this.chainTails[this.chains];
		}
		this.chains--;
	}

	protected _createChain(segment: ISegment): void {
		const i = ++this.length;
		this.points[i] = segment.$start;
		this.points[i + 1] = segment.$end;
		this.chainHeads[++this.chains] = i;
		this.chainTails[this.chains] = i + 1;
		this.next[i] = i + 1;
		this.next[i + 1] = 0;
		++this.length;
	}

	protected _append(segment: ISegment, id: number): void {
		const i = ++this.length;
		this.points[i] = segment.$end;
		this.next[this.chainTails[id]] = i;
		this.chainTails[id] = i;
		this.next[i] = 0;
	}

	protected _prepend(segment: ISegment, id: number): void {
		const i = ++this.length;
		this.points[i] = segment.$start;
		this.next[i] = this.chainHeads[id];
		this.chainHeads[id] = i;
	}

	protected _findChain(indices: number[], p: IPoint): number {
		/**
		 * 這邊採用線性搜尋的方式檢查所有的 chain，這乍看非常沒效率，
		 * 但實務上 chains 的大小頂多兩三個而已，所以不需要更進一步改進。
		 */
		for(let i = 1; i <= this.chains; i++) {
			// 這邊通常並不會共用 IPoint 的實體，所以要用座標檢查；
			// 所幸的是這邊並不會需要使用 epsilon 檢查。
			if(same(this.points[indices[i]], p)) return i;
		}
		return 0;
	}
}
