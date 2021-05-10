
/**
 * 第 0 欄位是 `JCorner` 本身，
 * 第 1 位表示它在當前 `Partition` 中的第幾個 `Overlap`，
 * 第 2 位表示在該 `Overlap` 中的哪一個 `Anchor`
 */
type CornerMap = [JCorner, number, number];

interface JPartition {
	/** 這個 Partition 裡面所有的 Overlap */
	overlaps: readonly JOverlap[];

	/** 這個 Partition 採用的生成策略 */
	strategy?: Strategy;
}

//////////////////////////////////////////////////////////////////
/**
 * `Partition` 是 `Configuration` 底下的單一切割。
 *
 * `Partition` 只會對應於單一的 `Device`，它負責計算對應切割的相關數值。
 * 尋找 `Device` 部份的程式碼在於其基底類別 `Partitioner` 之中。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Partition extends Partitioner implements ISerializable<JPartition> {

	/** 這個 Partition 所有的角落，檢索得到所屬的 Overlap 以及相位索引 */
	public readonly $cornerMap: CornerMap[] = [];

	constructor(config: Configuration, data: JPartition) {
		super(config, data);

		// 整理所有的角落
		for(let [i, o] of data.overlaps.entries()) {
			for(let [j, c] of o.c.entries()) {
				this.$cornerMap.push([c, i, j]);
			}
		}
	}

	/** 所有的側角或交角 */
	@onDemand public get $intersectionCorners(): readonly CornerMap[] {
		return this.$cornerMap.filter(m => {
			let type = m[0].type;
			return type == CornerType.$side ||
				type == CornerType.$intersection;
		});
	}

	/** 所有向外連出的角落 */
	@onDemand public get $outCorners(): readonly CornerMap[] {
		return this.$intersectionCorners.concat(
			this.$cornerMap.filter(m => m[0].type == CornerType.$flap)
		);
	}

	/** 所有相關於 Gadget 移動約束條件的角落 */
	@onDemand public get $constraints(): readonly CornerMap[] {
		return this.$cornerMap.filter(m => {
			let type = m[0].type;
			return type == CornerType.$socket ||
				type == CornerType.$internal ||
				type == CornerType.$flap;
		});
	}

	public $getOriginalDisplacement(pattern: Pattern): Vector {
		// 這邊我隨便挑整個 Partition 裡面一個對外的連接點；是哪一個差別不大
		let overlap = this.$overlaps.find(o => o.c[0].type != CornerType.$coincide)!;

		return pattern.$getConnectionTarget(overlap.c[0] as JConnection)
			.sub(this.$configuration.$repository.$stretch.origin);
	}

	@shrewd private get _sideConnectionTarget(): ReadonlyMap<JCorner, [Point, Point]> {
		this.$disposeEvent();
		let result = new Map<JCorner, [Point, Point]>();
		let flaps = this.$configuration.$sheet.$design.$flaps.$byId;
		for(let [c, o, q1] of this.$intersectionCorners) {
			let ov = this.$overlaps[o];

			// 找出原始對應的 flap
			let parent = this._getParent(ov);

			if(!ov || !parent) debugger;

			let [c1, c2] = [parent.c[0], parent.c[2]];
			let [f1, f2] = [flaps.get(c1.e!)!, flaps.get(c2.e!)!];

			if(!f1 || !f2) debugger;

			let quad1 = f1.$quadrants[c1.q!], d1 = 0;
			let quad2 = f2.$quadrants[c2.q!], d2 = 0;

			// 對於交點來說，實際上要取出的 overlap 會因為每個 flap 周圍可能都有河而更加複雜；
			// 這邊必須透過一連串額外的計算決定究竟 overlap 要設定在什麼距離之上
			if(c.type == CornerType.$intersection) {
				let oriented = ov.c[0].e! < 0;
				let tree = this.$configuration.$sheet.$design.$tree;
				let n3 = tree.$node.get(c.e!)!; // 自從 rc0 版開始，規定此時 c.e 必須填上 f3 的 id
				let t = tree.$distTriple(f1.node, f2.node, n3);
				if(oriented) d2 = t.d2 - f2.radius;
				else d1 = t.d1 - f1.radius;

				if(isNaN(d1) || isNaN(d2)) debugger;
			}

			ov = this._getExposedOverlap(ov);
			let p1 = quad1.$getOverlapCorner(ov, parent, q1, d1);
			let p2 = quad2.$getOverlapCorner(ov, parent, opposite(q1), d2);

			result.set(c, [p1, p2]);
		}
		return result;
	}

	/** 求出在一個具有 join 的 `Partition` 中，指定的 `JOverlap` 在扣掉其它所有 `JOverlap 之後還剩下什麼區域 */
	private _getExposedOverlap(ov: JOverlap): JOverlap {
		if(this.$overlaps.length == 1) return ov;
		let result = clone(ov), parent = this._getParent(ov);
		result.shift = result.shift ?? { x: 0, y: 0 };
		for(let o of this.$overlaps) {
			if(o != ov) {
				let p = this._getParent(o);
				let w = result.ox + result.shift.x;
				let h = result.oy + result.shift.y;
				if(p.c[0].e == parent.c[0].e) {
					if(p.ox < parent.ox) {
						result.ox = w - (result.shift.x = Math.max(result.shift.x, p.ox));
					}
					if(p.oy < parent.oy) {
						result.oy = h - (result.shift.y = Math.max(result.shift.y, p.oy));
					}
				}
				if(p.c[2].e == parent.c[2].e) {
					if(p.ox < parent.ox) {
						result.ox = parent.ox - Math.max(p.ox, parent.ox - w) - result.shift.x;
					}
					if(p.oy < parent.oy) {
						result.oy = parent.oy - Math.max(p.oy, parent.oy - h) - result.shift.y;
					}
				}
			}
		}
		return result;
	}

	/** 取得一個 `JOverlap` 原本對應的 `JJunction` */
	private _getParent(ov: JOverlap): Readonly<JJunction> {
		return this.$configuration.$repository.$structure[ov.parent];
	}

	/**
	 * 取得側點連接的目標。
	 * @param point 自身連接點的目前位置
	 * @param c 對應的角落資訊
	 * @param q 如果有指定，會強制傳回側點兩個連接目標中落在指定方向上的那一個。
	 */
	public $getSideConnectionTarget(point: Point, c: JCorner, q?: QuadrantDirection): Point | null {
		let [p1, p2] = this._sideConnectionTarget.get(c)!;
		if(p1._x.gt(p2._x)) [p1, p2] = [p2, p1];
		if(q === undefined) {
			if(point._x.le(p1._x)) return p1;
			if(point._x.ge(p2._x)) return p2;
			return null;
		} else {
			return q == Direction.UR || q == Direction.LR ? p1 : p2;
		}
	}

	public toJSON(): JPartition {
		let result: JPartition = {
			overlaps: this.$overlaps,
			strategy: this._strategy,
		};

		// 如果啟用 jid（亦即此時為存檔中）則進行修改
		let tree = this.$configuration.$design.$tree;
		if(tree.$jid) {
			result.overlaps = clone(result.overlaps);
			for(let o of result.overlaps) {
				for(let c of o.c) {
					if(c.e !== undefined && c.e >= 0) {
						c.e = tree.$node.get(c.e)!.id;
					}
				}
			}
		}

		return result;
	}
}
