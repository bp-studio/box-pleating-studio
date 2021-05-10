
//////////////////////////////////////////////////////////////////
/**
 * `Partitioner` 是 `Partition` 的基底類別，
 * 裡面定義了跟搜尋 `Device` 有關的方法。
 */
//////////////////////////////////////////////////////////////////

class Partitioner extends Disposable {

	public readonly $configuration: Configuration;
	public readonly $overlaps: readonly JOverlap[];
	protected readonly _strategy?: Strategy;

	constructor(config: Configuration, data: JPartition) {
		super(config);
		this.$configuration = config;
		this.$overlaps = data.overlaps;
		this._strategy = data.strategy;
	}

	/**
	 * 在一個 3-flap 的配置裡面，計算 intersection anchor 離共用角最大可允許的距離
	 * @param oriented 共用左下角
	 */
	public static $getMaxIntersectionDistance(
		tree: Tree, r1: JRectangle, r2: JRectangle, oriented: boolean) {
		let q = oriented ? 2 : 0;
		let n1 = tree.$node.get(r1.c[q].e!)!;
		let n2 = tree.$node.get(r2.c[q].e!)!;
		let n3 = tree.$node.get(r1.c[2 - q].e!)!;
		return tree.$distTriple(n1, n2, n3).d3;
	}

	// 搜尋的入口
	public *$generate(): Generator<JDevice> {
		let { _strategy: strategy } = this;
		if(this.$overlaps.length == 1) {
			let o = this.$overlaps[0];
			let j = this.$configuration.$repository.$structure[o.parent];
			if(strategy == Strategy.$halfIntegral) {
				for(let g of Kamiya._halfKamiya(o, j.sx)) yield { gadgets: [g] };
			} if(strategy == Strategy.$universal) {
				for(let g of Partitioner._universalGPS(o, j.sx)) yield { gadgets: [g] };
			} else {
				for(let p of Piece.$gops(o, j.sx)) yield { gadgets: [{ pieces: [p] }] };
			}
		}
		if(this.$overlaps.length == 2) {
			let joiner = this.$configuration.$repository.getJoiner(this.$overlaps);
			if(strategy == Strategy.$baseJoin) {
				yield* joiner.$baseJoin();
			} else if(strategy == Strategy.$standardJoin) {
				yield* joiner.$standardJoin();
			} else {
				yield* joiner.$simpleJoin(strategy);
			}
		}
	}

	/** 通用型 GPS 策略；保證能在單 Overlap 的情況中找到 Pattern */
	private static *_universalGPS(o: JOverlap, sx: number): Generator<JGadget> {
		let d = 2, found = false;
		while(!found) {
			let bigO = clone(o);
			bigO.ox *= d; bigO.oy *= d;
			for(let p of Piece.$gops(bigO, sx * d)) {
				let p1 = Piece.$instantiate(p).$shrink(d);
				if(!Number.isInteger(p1.v)) continue;
				let { ox, oy, u, v } = p1;
				let p2: JPiece = { ox, oy, u: v, v: u };
				let pt1 = { x: 0, y: 0 }, pt2 = { x: oy + u + v, y: ox + u + v };
				p1.detours = [[pt1, pt2]];
				p2.detours = [[pt2, pt1]];
				let x = p1.oy + p1.u + p1.v, s = Math.ceil(x) - x;
				let g = new Gadget({ pieces: [p1, p2] });
				let gr = g.$reverseGPS();
				yield g.$addSlack(2, s);
				yield gr.$addSlack(0, s);
				found = true;
			}
			d += 2;
		}
	}
}
