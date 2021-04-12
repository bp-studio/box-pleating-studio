
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
	public static $getMaxIntersectionDistance(tree: Tree, r1: JRectangle, r2: JRectangle, oriented: boolean) {
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
			let j = this.$configuration.repository.$structure[o.parent];
			if(strategy == Strategy.$halfIntegral) {
				for(let g of this._halfKamiya(o, j.sx)) yield { gadgets: [g] };
			} if(strategy == Strategy.$universal) {
				for(let g of this._universalGPS(o, j.sx)) yield { gadgets: [g] };
			} else {
				for(let p of Piece.$gops(o, j.sx)) yield { gadgets: [{ pieces: [p] }] };
			}
		}
		if(this.$overlaps.length == 2) {
			let joiner = this.$configuration.repository.getJoiner(this.$overlaps);
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
	private *_universalGPS(o: JOverlap, sx: number): Generator<JGadget> {
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
				let sx = p1.oy + p1.u + p1.v, s = Math.ceil(sx) - sx;
				let g = new Gadget({ pieces: [p1, p2] });
				let gr = g.$reverseGPS();
				yield g.$addSlack(2, s);
				yield gr.$addSlack(0, s);
				found = true;
			}
			d += 2;
		}
	}

	/** 搜尋兩側都是以神谷模式構成的半整數 `Gadget` */
	private *_halfKamiya(o: JOverlap, sx: number): Generator<JGadget> {
		if(o.ox % 2 == 0 || o.oy % 2 == 0) return;
		let doubleO = clone(o);
		doubleO.ox <<= 1; doubleO.oy <<= 1;
		for(let p of Piece.$gops(doubleO, sx * 2)) {
			let p1 = Piece.$instantiate(p);
			if(p1.$rank > 3) continue; // 神谷模式的 Rank 為 3
			let v_even = p1.v % 2 == 0; // 此時原始的 u,v 一定恰有一個是偶數
			if(p1.ox == p1.oy && v_even) continue; // ox==oy 的情況只需要取一次

			let { ox, oy, u, v } = p1.$shrink(2);
			let diff = Math.abs(ox - oy) / 2;

			if(!Number.isInteger(diff)) debugger;

			let sm = Math.min(ox, oy);
			let p2: JPiece;

			if(v_even && ox >= oy) {
				p1.detours = [[{ x: diff, y: 3 * diff }, { x: oy + u + v, y: ox + u + v }]];
				p2 = {
					ox: sm, oy: sm, u: v, v: u - diff,
					detours: [[{ x: sm + u + v - diff, y: sm + u + v - diff }, { x: 0, y: 0 }]],
					shift: { x: diff, y: 3 * diff }
				};
			} else if(!v_even && oy >= ox) {
				p1.detours = [[{ x: oy + u + v, y: ox + u + v }, { x: diff * 3, y: diff }]];
				p2 = {
					ox: sm, oy: sm, u: v - diff, v: u,
					detours: [[{ x: 0, y: 0 }, { x: sm + u + v - diff, y: sm + u + v - diff }]],
					shift: { x: diff * 3, y: diff }
				};
			} else continue; // 不合條件者無法構成我們這邊考慮的 Pattern

			let g = new Gadget({ pieces: [p1, p2] });
			let gr = g.$reverseGPS();
			yield g.$addSlack(2, 0.5);
			yield gr.$addSlack(0, 0.5);
		}
	}
}
