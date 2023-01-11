import { same } from "shared/types/geometry";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { RavlTree } from "shared/data/bst/ravlTree";

import type { IEventProvider, Intersector, IntersectorConstructor } from "./intersector";
import type { Chainer } from "./chainer/chainer";
import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";
import type { IHeap } from "shared/data/heap/heap";
import type { SweepEvent, EndEvent, StartEvent } from "./event";
import type { ISegment } from "./segment/segment";
import type { Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link PolyBool} 類別是多邊形布林運算的底層抽象形式。
 */
//=================================================================

export abstract class PolyBool {

	/** 事件產生邏輯 */
	protected readonly _provider: IEventProvider;

	/** 事件佇列 */
	protected readonly _eventQueue: IHeap<SweepEvent>;

	/** 當前掃描的狀態 */
	protected readonly _status: IBinarySearchTree<StartEvent>;

	/** 交點判斷邏輯 */
	protected readonly _intersector: Intersector;

	/** 最後組合邏輯 */
	protected readonly _chainer: Chainer;

	/** 收集到的線段 */
	protected readonly _collectedSegments: ISegment[] = [];

	constructor(
		provider: IEventProvider,
		Intersector: IntersectorConstructor,
		chainer: Chainer
	) {
		this._provider = provider;
		this._eventQueue = new BinaryHeap(provider.$eventComparator);
		this._status = new RavlTree(provider.$statusComparator);
		this._intersector = new Intersector(provider, this._eventQueue);
		this._chainer = chainer;
	}

	/** 產生聯集的多邊形 */
	public $get(): Polygon {
		while(!this._eventQueue.$isEmpty) {
			const event = this._eventQueue.$pop()!;
			if(!event.$isStart) this._processEnd(event);
			else if(event.$visited) this._processRevisit(event);
			else this._processStart(event);
		}
		return this._chainer.$chain(this._collectedSegments);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 處理一個終點事件 */
	protected abstract _processEnd(event: EndEvent): void;

	/**
	 * 在初始化過程中加入一條邊
	 * @param segment 線段本身
	 * @param isEntering 這條邊是否正在進入其對應的多邊形
	 */
	protected _addSegment(segment: ISegment, delta: -1 | 1): void {
		if(same(segment.$start, segment.$end)) return; // 退化邊不採用
		const [startPoint, endPoint] = delta === 1 ?
			[segment.$start, segment.$end] : [segment.$end, segment.$start];

		// 產生掃描事件
		const startEvent = this._provider.$createStart(startPoint, segment, delta);
		const endEvent = this._provider.$createEnd(endPoint, segment);
		endEvent.$other = startEvent;
		startEvent.$other = endEvent;

		// 加入事件
		this._eventQueue.$insert(startEvent);
		this._eventQueue.$insert(endEvent);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 處理一個起點事件 */
	private _processStart(event: StartEvent): void {
		const node = this._status.$insert(event, event);
		const prev = this._status.$getPrevNode(node).$value;
		const next = this._status.$getNextNode(node).$value;
		const inserted = this._intersector.$process(prev, event, next);

		// 只有當沒有事件被插入的時候才能處理內部旗標
		if(!inserted) {
			this._setInsideFlag(event, prev);
		} else {
			event.$visited = true;
			this._eventQueue.$insert(event);
		}
	}

	/** 再次處理曾經處理過的起點事件 */
	private _processRevisit(event: StartEvent): void {
		const node = this._status.$getNode(event);
		const prev = this._status.$getPrevNode(node).$value;
		this._setInsideFlag(event, prev);
	}

	private _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		// 如果前一條線剛剛才離開，那自己就應該要是外圍
		if(prev && prev.$wrapCount != 0) {
			event.$wrapCount += prev.$wrapCount;
			event.$isInside = event.$wrapCount != 0;
		}

		// console.log(
		// 	event.$isInside,
		// 	event.$wrapCount,
		// 	event.$point, event.$other.$point,
		// 	event.$segment.$type === 2 ? (event.$segment as ArcSegment).$radius : 0,
		// 	event.$segment.$type === 2 ? getSlope(event) : NaN,
		// 	prev?.$point, prev?.$other.$point,
		// 	prev?.$segment.$type === 2 ? getSlope(prev) : NaN,
		// 	prev?.$wrapCount);
	}
}
