import { AddOn } from "./AddOn";
import { Gadget } from "./Gadget";
import { onDemand, opposite } from "bp/global";
import { Line, Point, Vector } from "bp/math";
import { Draggable } from "bp/design/class";
import { CornerType } from "bp/content/json";
import { ViewService } from "bp/env/service";
import type { JConnection, JCorner, JDevice } from "bp/content/json";
import type { Region } from "./Region";
import type { Partition } from "..";
import type { IPoint } from "bp/math";
import type { Pattern } from "./Pattern";

export type GDevice = JDevice<Gadget>;

export type IntersectionMap = [Point, Point | null];

//=================================================================
/**
 * {@link Device} 是一個 {@link Pattern} 當中可以被獨立移動的最小元件，它對應於一個 {@link Partition}。
 */
//=================================================================

@shrewd export class Device extends Draggable implements ISerializable<JDevice> {

	public get $type(): string { return "Device"; }
	public get $tag(): string { return this.$pattern.$tag + "." + this.$pattern.$devices.indexOf(this); }

	public readonly $pattern: Pattern;
	public readonly $gadgets: readonly Gadget[];
	public readonly $addOns: readonly AddOn[];
	public readonly $partition: Partition;

	constructor(pattern: Pattern, partition: Partition, data: JDevice) {
		super(pattern.$sheet);
		this.$pattern = pattern;
		this.$partition = partition;
		let { fx, fy } = pattern.$stretch;

		this.$gadgets = data.gadgets.map(g => Gadget.$instantiate(g));
		this.$addOns = data.addOns?.map(a => AddOn.$instantiate(a)) ?? [];
		let offset = data.offset ?? 0;
		this.$location = { x: offset * fx, y: offset * fy };
		ViewService.$createView(this);
	}

	public toJSON(): JDevice {
		return {
			gadgets: this.$gadgets.map(g => g.toJSON()),
			offset: this.$getOffset(),
			addOns: this.$addOns.length ? this.$addOns : undefined,
		};
	}

	/** 參考原點跟所屬的 {@link Stretch} 原點之間的位移；參考原點需要透過這個來計算得到 */
	@onDemand private get _originalDisplacement(): Vector {
		return this.$partition.$getOriginalDisplacement(this.$pattern);
	}

	/** 參考原點；{@link location} 是相對於這個原點在表示的 */
	private get _origin(): Point {
		return this.$pattern.$stretch.origin.add(this._originalDisplacement);
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.$pattern.$disposed;
	}

	@shrewd public get _isActive(): boolean { return this.$pattern._isActive; }

	/**
	 * 傳回 Device 的連接點陣列，根據自身的 delta 反應式傳回絕對座標。
	 *
	 * 第一個索引值對應 Partition 的 Overlap，第二個對應 Gadget 的象限。
	 */
	@shrewd public get $anchors(): readonly Point[][] {
		let result: Point[][] = [];
		let { fx, fy } = this.$pattern.$stretch;
		for(let g of this.$gadgets) {
			result.push(g.$anchorMap.map(m => {
				if(!m[0]) debugger;
				return m[0].$transform(fx, fy).add(this.$delta);
			}));
		}
		return result;
	}

	/** 自身的絕對位移向量 */
	@shrewd public get $delta(): Vector {
		return this._origin.add(new Vector(this.$location)).sub(Point.ZERO);
	}

	@onDemand public get $regions(): Region[] {
		let result: Region[] = [];
		for(let g of this.$gadgets) result.push(...g.pieces);
		result.push(...this.$addOns);
		return result;
	}

	/** 整理 Piece 的脊線，會扣除掉同方向 Piece 之間重疊到的部份 */
	@onDemand private get _regionRidges(): ReadonlyMap<Region, Line[]> {
		let map: Map<Region, Line[]> = new Map();
		for(let r of this.$regions) {
			let parallelRegions = this.$regions.filter(
				q => q != r && q.$direction.$parallel(r.$direction)
			);

			// 垂直於軸平行摺痕的脊線即使重疊也不應該被扣除（meandering 時會產生）
			let lines = parallelRegions.flatMap(
				q => q.$shape.ridges.filter(l => !l.$perpendicular(q.$direction))
			);

			map.set(r, Line.$subtract(r.$shape.ridges, lines));
		}
		return map;
	}

	/** 這個 Device 本身所有具有的脊線 */
	@shrewd private get _rawRidges(): readonly Line[] {
		this.$disposeEvent();
		let { fx, fy } = this.$pattern.$stretch;
		let result: Line[] = [];
		let map = this._regionRidges;
		for(let r of this.$regions) {
			result.push(...map.get(r)!.map(l => l.$transform(fx, fy).$shift(this.$delta)));
		}
		return Line.$distinct(result);
	}

	/** 這個 Device 實際上要繪製出來的脊線（扣除掉跟相鄰 Device 重疊部份之後） */
	@shrewd public get $ridges(): readonly Line[] {
		let raw = this._rawRidges;
		let neighborLines = this._neighbors.flatMap(g => g._rawRidges);
		return Line.$subtract(raw, neighborLines);
	}

	@shrewd public get $axisParallels(): readonly Line[] {
		this.$disposeEvent();
		let { fx, fy } = this.$pattern.$stretch;
		let result: Line[] = [];
		for(let r of this.$regions) {
			for(let ap of r.$axisParallels) {
				result.push(ap.$transform(fx, fy).$shift(this.$delta));
			}
		}
		return result;
	}

	@shrewd public get $outerRidges(): readonly Line[] {
		if(!this._isActive) return [];
		let result = this.$getConnectionRidges();
		for(let [from, to] of this._intersectionMap) if(to) result.push(new Line(from, to));
		return Line.$distinct(result);
	}

	/**
	 * 這個 {@link Device} 的{@link CornerType.$side 側角}或{@link CornerType.$intersection 交角}對應的連結目標之映射。
	 *
	 * 這邊只有當側角或交角是位於 {@link Flap} 內部的時候才能夠算出連接目標，
	 * 如果是位於 {@link River} 內部就沒有辦法直接求出目標，
	 * 此時這樣的角落會被列入 {@link Device.$openAnchors $openAnchors} 中以便稍後另外處理。
	 */
	@shrewd private get _intersectionMap(): IntersectionMap[] {
		let result: IntersectionMap[] = [];
		if(!this._isActive) return result;
		for(let [c, o, q] of this.$partition.$intersectionCorners) {
			let from = this.$anchors[o][q];
			let to = this.$partition.$getSideConnectionTarget(from, c);
			result.push([from, to]);
		}
		return result;
	}

	/**
	 * {@link Device._intersectionMap _intersectionMap} 裡面尚未被連接的錨點，在繪製 {@link River} 的脊線時會用到。
	 */
	@shrewd public get $openAnchors(): Point[] {
		return this._intersectionMap
			.filter(m => !m[1] || m[0].eq(m[1]))
			.map(m => m[0]);
	}

	public $getConnectionRidges(internalOnly = false): Line[] {
		let result: Line[] = [];
		for(let [i, ov] of this.$partition.$overlaps.entries()) {
			for(let [q, c] of ov.c.entries()) {
				if(c.type == CornerType.$flap && !internalOnly || c.type == CornerType.$internal) {
					result.push(new Line(
						this.$anchors[i][q],
						this.$pattern.$getConnectionTarget(c as JConnection)
					));
				}
			}
		}
		return result;
	}

	protected $constraint(v: Vector, location: Readonly<IPoint>): Vector {
		let { fx, fy } = this.$pattern.$stretch, f = fx * fy;
		let x = Math.round((v.x + f * v.y) / 2);
		for(let [c, o, q] of this.$partition.$constraints) {
			x = this._fix(x, c, o, q);
		}
		return new Vector(x, f * x);
	}

	/** 自身的所有相鄰 Device（連出或連入） */
	@shrewd private get _neighbors(): readonly Device[] {
		let result = new Set<Device>();
		for(let o of this.$partition.$overlaps) {
			for(let c of o.c) {
				if(c.type == CornerType.$socket || c.type == CornerType.$internal) {
					let [i] = this.$partition.$configuration.$overlapMap.get(c.e!)!;
					result.add(this.$pattern.$devices[i]);
				}
			}
		}
		return Array.from(result);
	}

	private _fix(dx: number, c: JCorner, o: number, q: number): number {
		let out = c.type != CornerType.$socket;
		let f = this.$pattern.$stretch.fx * ((out ? q : opposite(c.q!)) == 0 ? -1 : 1);
		let target = this.$pattern.$getConnectionTarget(c as JConnection);
		let slack = out ?
			this.$gadgets[o].$slacks[q] :
			this.$pattern.$gadgets[-c.e! - 1].$slacks[c.q!];
		let bound = target.x - this.$anchors[o][q].x - slack * f;
		if(dx * f > bound * f) dx = bound;
		return dx;
	}

	// 做成反應方法以確保有持續更新
	@shrewd public $getOffset(): number {
		// 利用這個相依性來確保當解構的時候這個方法不會再被執行一次
		this.$disposeEvent();

		// 即將要在拖曳過程中被解構的時候不能繼續更新數值，持續傳回最後知道的值。
		if(this.$design.$dragging) return this._offsetCache;

		let dx = this.$partition.$getOriginalDisplacement(this.$pattern).x;
		dx -= this._originalDisplacement.x;
		return this._offsetCache = (this.$location.x - dx) * this.$pattern.$stretch.fx;
	}
	private _offsetCache: number;
}
