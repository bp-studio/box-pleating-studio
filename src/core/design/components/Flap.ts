import { Quadrant } from "./Quadrant";
import { action } from "../history/action";
import { Draggable, IndependentDraggable } from "bp/class";
import { Point } from "bp/math";
import { makePerQuadrant, noCompare, shrewdStatic, unorderedArray } from "bp/global";
import type { Junction } from "./Junction";
import type { Sheet } from "./Sheet";
import type { TreeNode } from "..";
import type { Memento, JFlap } from "bp/content/json";
import type { Control } from "bp/class";
import type { IPoint, Vector } from "bp/math";
import type { ISerializable, PerQuadrant } from "bp/global";

//////////////////////////////////////////////////////////////////
/**
 * {@link Flap} 是摺痕圖中的角片元件，是決定整個摺痕圖配置的關鍵。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class Flap extends IndependentDraggable implements ISerializable<JFlap> {

	public get $type(): string { return "Flap"; }
	public get $tag(): string { return "f" + this.node.id; }

	/** @exports */
	public get width(): number { return this.mWidth; }
	public set width(v: number) {
		if(v >= 0 && v <= this.$sheet.width) {
			let d = this.$location.x + v - this.$sheet.width;
			if(d > 0) Draggable.$move(this, { x: -d, y: 0 });
			this.mWidth = v;
		}
	}
	@action private mWidth: number = 0;

	/** @exports */
	public get height(): number { return this.mHeight; }
	public set height(v: number) {
		if(v >= 0 && v <= this.$sheet.height) {
			let d = this.$location.y + v - this.$sheet.height;
			if(d > 0) Draggable.$move(this, { x: 0, y: -d });
			this.mHeight = v;
		}
	}
	@action private mHeight: number = 0;

	/** @exports */
	public readonly node: TreeNode;

	public readonly $quadrants: PerQuadrant<Quadrant>;

	public $selectableWith(c: Control): boolean { return c instanceof Flap; }

	@shrewdStatic public get $center(): IPoint {
		return { x: this.$location.x + this.width / 2, y: this.$location.y + this.height / 2 };
	}

	public get $dragSelectAnchor(): IPoint { return this.$center; }

	/** 這個 {@link Flap} 的各象限上的頂點 */
	@shrewdStatic public get $points(): readonly Point[] {
		let x = this.$location.x, y = this.$location.y;
		let w = this.width, h = this.height;
		return [
			new Point(x + w, y + h),
			new Point(x, y + h),
			new Point(x, y),
			new Point(x + w, y),
		];
	}

	/** @exports */
	public get name(): string { return this.node.name; }
	public set name(n: string) { this.node.name = n; }

	/** @exports */
	public get radius(): number { return this.node.$radius; }
	public set radius(r: number) {
		let e = this.node.$leafEdge;
		if(e) e.length = r;
	}

	constructor(sheet: Sheet, node: TreeNode) {
		super(sheet);
		this.node = node;

		let design = sheet.$design;
		let option = design.$options.get(this);
		if(option) {
			// 找得到設定就用設定值
			this.$location.x = option.x;
			this.$location.y = option.y;
			this.width = option.width;
			this.height = option.height;
			this.$isNew = false;
		} else {
			// 否則根據對應的頂點的位置來粗略估計初始化
			Draggable.$relocate(design.$vertices.get(this.node)!, this, true);
		}

		this.$quadrants = makePerQuadrant(i => new Quadrant(sheet, this, i));
		this.$design.$viewManager.$createView(this);

		design.$history?.$construct(this.$toMemento());
	}

	protected $onDragged(): void {
		if(this.$isNew) Draggable.$relocate(this, this.$design.$vertices.get(this.node)!);
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.node.$disposed || this.node.$degree != 1;
	}

	protected $onDispose(): void {
		this.$design?.$history?.$destruct(this.$toMemento());
		super.$onDispose();
	}

	public $toMemento(): Memento {
		return [this.$tag, this.toJSON()];
	}

	public toJSON(): JFlap {
		return {
			id: this.node.id,
			width: this.width,
			height: this.height,
			x: this.$location.x,
			y: this.$location.y,
		};
	}

	protected $constraint(v: Vector, location: Readonly<IPoint>): Vector {
		this.$sheet.$constraint(v, location);
		this.$sheet.$constraint(v, {
			x: location.x + this.width,
			y: location.y + this.height,
		});
		return v;
	}

	////////////////////////////////////////////////////////////
	/**
	 * 底下這一部份的程式碼負責整理一個 {@link Flap} 具有哪些 {@link Junction}。
	 * 因為 {@link Junction} 的總數非常多，採用純粹的反應式框架來篩選反而速度慢，
	 * 因此特別這一部份改用一個主動式架構來通知 {@link Flap.$junctions} 的更新。
	 */
	////////////////////////////////////////////////////////////

	public readonly _junctions: Junction[] = [];

	@unorderedArray public get $junctions(): readonly Junction[] {
		/** {@link DoubleMapping} 本身不是一個反應屬性，它的 size 才是 */
		this.$design.$junctions.size;
		// 利用 concat 傳回一個複製的陣列去跟上次已知的值來進行 unorderedArray 比較
		return this._junctions.concat();
	}

	@noCompare get $validJunctions(): readonly Junction[] {
		return this.$junctions.filter(j => j.$isValid);
	}
}
