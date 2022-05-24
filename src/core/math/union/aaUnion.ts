import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { RedBlackTree } from "shared/data/bst/redBlackTree";
import { RavlTree } from "shared/data/bst/ravlTree";
import { same, xyComparator, toString } from "../../../shared/types/geometry";
import { eventComparator, statusComparator, EndEvent, StartEvent } from "./sweepEvent";

import type { AvlTree } from "shared/data/bst/avlTree";
import type { Polygon } from "../../../shared/types/geometry";

export interface IAABB {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

//=================================================================
/**
 * {@link AAUnion} 類別負責計算一些 {@link Polygon} 的聯集，
 * 其前提是邊全都是 axis-aligned，沒有自我相交，且其 subpath 都有正確定向。
 *
 * 基於效能考量，這個類別並不會針對這些條件進行檢查，
 * 所以如果輸入條件不符合要求將會產生無法預期的結果。
 */
//=================================================================

export class AAUnion {

	/**
	 * 事件佇列。
	 *
	 * 因為我們只在乎逐一取出其中最優先的事件、
	 * 除此之外並不在乎事件的相對順序，用堆積資料結構是最有效率的。
	 * 實驗顯示，這邊用二元或三元堆疊幾乎沒有效能上的差異，所以用哪一個都可以。
	 */
	private readonly _eventQueue = new BinaryHeap(eventComparator);

	/**
	 * 當前掃描的狀態。
	 *
	 * 這邊我比較過 {@link AvlTree}、{@link RedBlackTree} 和 {@link RavlTree} 三種實作，
	 * 最後是 {@link RavlTree} 的效能最為勝出（尤其是利用了位元進行快速排序之後）。
	 */
	private readonly _status = new RavlTree(statusComparator);

	/** 收集到的外圍邊 */
	protected readonly _unionEdges: [IPoint, IPoint, number][] = [];

	/** 當前處理起點當中的邊 */
	private _currentStart!: StartEvent;

	/** 有新的事件被插入到事件佇列的前面 */
	private _eventInserted: boolean = false;

	/** 事件的下一個可用 id */
	private _nextId: number = 0;

	private readonly _checkSelfIntersection: boolean;

	constructor(checkSelfIntersection: boolean = false) {
		this._checkSelfIntersection = checkSelfIntersection;
	}

	/** 產生聯集的多邊形 */
	public $get(...components: Polygon[]): Polygon {
		this._initialize(components);
		while(!this._eventQueue.$isEmpty) {
			const event = this._eventQueue.$pop()!;
			if(event.isStart) {
				if(event.visited) this._processRevisit(event);
				else this._processStart(event);
				//if(!this._eventInserted)
				// console.log("start " + JSON.stringify([event.point, event.other.point]) + " " + event.key);
			} else {
				this._processEnd(event);
				// console.log("end   " + JSON.stringify([event.other.point, event.point]) + " " + event.other.key);
			}
		}
		return this._chain();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 初始化；重設一些變數並且載入所有初始的事件 */
	private _initialize(components: Polygon[]): void {
		this._unionEdges.length = 0;
		this._nextId = 0;
		for(let i = 0; i < components.length; i++) {
			const c = components[i];
			for(const path of c) {
				for(let j = 0; j < path.length; j++) {
					const p1 = path[j], p2 = path[(j + 1) % path.length];
					const entering = xyComparator(p1, p2) < 0;
					if(entering) this._addEdge(p1, p2, i, entering);
					else this._addEdge(p2, p1, i, entering);
				}
			}
		}
	}

	/** 處理一個起點事件 */
	private _processStart(event: StartEvent): void {
		this._currentStart = event;
		this._eventInserted = false;
		const node = this._status.$insert(event, event);
		const prev = this._status.$getPrevNode(node).$value;
		const next = this._status.$getNextNode(node).$value;
		this._possibleIntersection(prev, event);
		this._possibleIntersection(event, next);

		// 只有當沒有事件被插入的時候才能處理內部旗標
		if(!this._eventInserted) {
			this._setInsideFlag(event, prev);
		} else {
			event.visited = true;
			this._eventQueue.$insert(event);
		}
	}

	/** 再次處理曾經處理過的起點事件 */
	private _processRevisit(event: StartEvent): void {
		const node = this._status.$getNode(event);
		const prev = this._status.$getPrevNode(node).$value;
		this._setInsideFlag(event, prev);
	}

	/** 處理一個終點事件 */
	private _processEnd(event: EndEvent): void {
		const start = event.other;
		if(!start.isInside) {
			// 這邊我們以正確的定向來加入邊，如此一來串接的結果就會自動是對的
			// （外側為逆時鐘繞行，內側為順時鐘繞行）
			if(start.wrapDelta === 1) {
				this._unionEdges.push([start.point, event.point, start.polygon]);
			} else {
				this._unionEdges.push([event.point, start.point, start.polygon]);
			}
		}
		this._status.$delete(start);

		// 在原本的 MRF 演算法當中，此處會檢查 status 的前後項是否出現了新的交點，
		// 但是對於 AABB 的聯集來說所有的交點一定會在起點事件的時候就被匡列，所以這邊不用做這個檢查。
	}

	/** 將收集到的邊串接成最終結果 */
	protected _chain(): Polygon {
		const chains: Polygon = [];
		const result: Polygon = [];
		while(this._unionEdges.length) {
			const edge = this._unionEdges.pop()!;

			/**
			 * 這邊採用線性搜尋的方式檢查所有的 chain，這乍看非常沒效率，
			 * 但實務上 chains 的大小頂多兩三個而已，所以不需要更進一步改進。
			 */
			const tailIndex = chains.findIndex(p => same(p[0], edge[1]));
			const headIndex = chains.findIndex(p => same(p[p.length - 1], edge[0]));
			const tail = chains[tailIndex], head = chains[headIndex];

			if(head && tail) {
				if(head === tail) {
					// 一個 chain 頭尾銜接起來了，加入到輸出結果當中
					result.push(head);
					chains.splice(headIndex, 1);
				} else {
					// 串接兩個本來獨立的 chain
					head.push(...tail);
					chains.splice(tailIndex, 1);
				}
			} else if(head) {
				head.push(edge[1]);
			} else if(tail) {
				tail.unshift(edge[0]);
			} else {
				chains.push([edge[0], edge[1]]);
			}
		}
		return result;
	}

	private _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		// 如果前一條線剛剛才離開，那自己就應該要是外圍
		if(prev && prev.wrapCount != 0) {
			event.wrapCount += prev.wrapCount;
			event.isInside = event.wrapCount != 0;
		}

		// if(same(event.point, { x: 2, y: 4 }))
		// console.log(JSON.stringify([event.point, event.other.point, event.isInside, event.wrapCount, prev?.point, prev?.other.point, prev?.wrapCount]));
	}

	/**
	 * 找出邊可能的交點，並且在必要的時候對既有的邊進行細分、加入新的事件。
	 * @param ev1 第一條邊（根據在 {@link _status} 中的順序）
	 * @param ev2 第二條邊（根據在 {@link _status} 中的順序）
	 */
	// eslint-disable-next-line complexity
	private _possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void {
		if(!ev1 || !ev2) return;
		if(!this._checkSelfIntersection && ev1.polygon === ev2.polygon) return; // 我們假定輸入不會有自我相交

		if(ev1.isHorizontal != ev2.isHorizontal) {
			// 十字交叉
			const h = ev1.isHorizontal ? ev1 : ev2;
			const v = ev1.isHorizontal ? ev2 : ev1;
			const x = v.point.x, y = h.point.y;
			const hx1 = h.point.x, hx2 = h.other.point.x;
			const vy1 = v.point.y, vy2 = v.other.point.y;
			if(hx1 < x && x < hx2 && vy1 <= y && y <= vy2) this._subdivide(h, { x, y });
			if(vy1 < y && y < vy2 && hx1 <= x && x <= hx2) this._subdivide(v, { x, y });
		} else {
			// 我們已知 ev1 和 ev2 已經照順序排好了
			const { x: x1, y: y1 } = ev1.point;
			const p2 = ev1.other.point, { x: x2, y: y2 } = p2;
			const p3 = ev2.point, { x: x3, y: y3 } = p3;
			const p4 = ev2.other.point, { x: x4, y: y4 } = p4;

			if(ev1.isHorizontal && y1 === y3) {
				// 水平重疊
				if(x1 < x3 && x3 < x2) ev1 = this._subdivide(ev1, p3);
				if(x1 < x4 && x4 < x2) this._subdivide(ev1, p4);
				else if(x3 < x2 && x2 < x4) this._subdivide(ev2, p2);
			} else if(!ev1.isHorizontal && x1 === x3) {
				// 垂直重疊
				if(y1 < y3 && y3 < y2) ev1 = this._subdivide(ev1, p3);
				if(y1 < y4 && y4 < y2) this._subdivide(ev1, p4);
				else if(y3 < y2 && y2 < y4) this._subdivide(ev2, p2);
			}
		}
	}

	/** 在指定的位置上細分一條邊 */
	private _subdivide(event: StartEvent, point: IPoint): StartEvent {
		// console.log(`subdivide ${toString(event.point)}-${toString(event.other.point)} at ${toString(point)}`);

		const end = event.other;
		const newStart = new StartEvent(point, event.polygon, event.isHorizontal, event.wrapDelta, this._nextId++);
		newStart.other = end;
		end.other = newStart;
		this._eventQueue.$insert(newStart);

		const newEnd = new EndEvent(point, event.isHorizontal, this._nextId++);
		newEnd.other = event;
		event.other = newEnd;
		this._eventQueue.$insert(newEnd);

		// 如果被細分的邊不是當前處理起點中的邊……
		if(event != this._currentStart && !this._eventInserted) {
			// 檢查看看是否有新的事件被插入到事件佇列的前面
			this._eventInserted ||=
				eventComparator(this._currentStart, newStart) > 0 ||
				eventComparator(this._currentStart, newEnd) > 0;
		}

		return newStart;
	}

	/**
	 * 在初始化過程中加入一條邊
	 * @param p1 邊的起點
	 * @param p2 邊的終點
	 * @param isEntering 這條邊是否正在進入其對應的 AABB
	 */
	private _addEdge(p1: IPoint, p2: IPoint, polygon: number, isEntering: boolean): void {
		if(same(p1, p2)) return; // 退化邊不採用

		// 產生掃描事件
		const delta = isEntering ? 1 : -1;
		const hor = p1.y === p2.y ? 1 : 0;
		const startEvent = new StartEvent(p1, polygon, hor, delta, this._nextId++);
		const endEvent = new EndEvent(p2, hor, this._nextId++);
		endEvent.other = startEvent;
		startEvent.other = endEvent;

		// 加入事件
		this._eventQueue.$insert(startEvent);
		this._eventQueue.$insert(endEvent);
	}
}

export function aabbToPolygon(c: IAABB): Polygon {
	return [[
		{ x: c.right, y: c.top },
		{ x: c.left, y: c.top },
		{ x: c.left, y: c.bottom },
		{ x: c.right, y: c.bottom },
	]];
}
