/* eslint-disable @typescript-eslint/no-magic-numbers */

type JStructure = readonly Readonly<JJunction>[];

enum Strategy {
	$halfIntegral = "HALFINTEGRAL",
	$universal = "UNIVERSAL",
	$baseJoin = "BASE_JOIN",
	$standardJoin = "STANDARD_JOIN",
	$perfect = "PERFECT",
}

//////////////////////////////////////////////////////////////////
/**
 * {@link Configurator} 負責針對一個 {@link Repository} 搜尋 {@link Configuration}。
 */
//////////////////////////////////////////////////////////////////

class Configurator {

	/** 目前所屬的 Repository */
	private readonly _repo: Repository;

	/** 從存檔來的種子 Configuration */
	private readonly _seed?: JConfiguration;

	/** 種子 Configuration 的簽章，用來作為快速檢查 */
	private _seedSignature?: string;

	/** 種子的 Pattern */
	private readonly _pattern?: JPattern;

	constructor(repo: Repository, option?: JStretch) {
		this._repo = repo;
		this._seed = option?.configuration;
		this._seedSignature = JSON.stringify(this._seed); // undefined 序列化的結果還是 undefined
		this._pattern = option?.pattern;
	}

	/** 搜尋的入口起點 */
	public *$generate(callback: Action): Generator<Configuration> {
		if(this._seed && this._pattern) {
			try {
				// 如果有存檔，直接先把存檔吐回去為快
				let c = new Configuration(this._repo, this._seed, this._pattern);
				if(!c.entry) throw new Error();
				yield c;
			} catch(e) {
				this._seedSignature = undefined;
				console.log("Incompatible old version.");
			}
		}

		// 過濾掉跟存檔一樣的 `Configuration`
		let filter = (config: Configuration) =>
			!this._seedSignature || this._seedSignature != JSON.stringify(config);
		yield* GeneratorUtil.$filter(this.$search(), filter);
		callback();
	}

	/** 搜尋的主程式 */
	private *$search(): Generator<Configuration> {
		const structure = this._repo.$structure;
		const filter = (config: Configuration) => config.entry != null;

		if(structure.length == 1) {
			let [j] = structure;
			yield* GeneratorUtil.$first([
				this._searchSingleGadget(j),
				this._searchDoubleRelay(j, 0),
				this._searchSingleGadget(j, Strategy.$halfIntegral),
				this._searchSingleGadget(j, Strategy.$universal),
			], filter);
		}

		// 兩個的情況一定是有一個 Flap 共用
		if(structure.length == 2) {
			let layout = structure as [JJunction, JJunction];
			yield* GeneratorUtil.$first([
				this._searchThreeFlapJoin(layout, Strategy.$perfect),
				this._searchThreeFlapRelay(layout),
				this._searchThreeFlapJoin(layout),
				this._searchThreeFlapRelayJoin(layout),
				this._searchThreeFlapJoin(layout, Strategy.$baseJoin),
				this._searchThreeFlapRelayJoin(layout, Strategy.$baseJoin),
				this._searchThreeFlapJoin(layout, Strategy.$standardJoin),
				this._searchThreeFlapRelayJoin(layout, Strategy.$standardJoin),
				this._searchThreeFlapRelay(layout, Strategy.$halfIntegral),
			], filter);
		}

		// TODO: 更一般的情況
	}

	/** 搜尋單一分割 */
	private *_searchSingleGadget(j: JJunction, strategy?: Strategy): Generator<Configuration> {
		yield new Configuration(this._repo, {
			partitions: [
				{ overlaps: [ConfigUtil.$toOverlap(j, 0)], strategy },
			],
		});
	}

	/** 搜尋雙切割接力 */
	private *_searchDoubleRelay(j: JJunction, index: number): Generator<Configuration> {
		if(j.ox * j.oy % 2) return; // 不考慮奇數面積
		if(j.ox < j.oy) {
			for(let y = 1; y <= j.oy / 2; y++) {
				let c = new Configuration(
					this._repo,
					{ partitions: ConfigUtil.$cut(j, index, -1, 0, y) }
				);
				if(c.entry) {
					yield c;
					yield new Configuration(
						this._repo,
						{ partitions: ConfigUtil.$cut(j, index, -1, 0, j.oy - y) }
					);
				}
			}
		} else {
			for(let x = 1; x <= j.ox / 2; x++) {
				let c = new Configuration(
					this._repo,
					{ partitions: ConfigUtil.$cut(j, index, -1, x, 0) }
				);
				if(c.entry) {
					yield c;
					yield new Configuration(
						this._repo,
						{ partitions: ConfigUtil.$cut(j, index, -1, j.ox - x, 0) }
					);
				}
			}
		}
	}

	/** 搜尋 3 Flap 接力 */
	private *_searchThreeFlapRelay(
		junctions: readonly [JJunction, JJunction], strategy?: Strategy
	): Generator<Configuration> {
		let [o1, o2] = junctions.map((j, i) => ConfigUtil.$toOverlap(j, i));
		let oriented = o1.c[2].e == o2.c[2].e; // 兩者共用左下角
		if(o1.ox > o2.ox) [o1, o2] = [o2, o1];

		// 進行兩種可能的切割
		let [o1p, o2p] = clone([o1, o2]);
		o2p.ox -= o1.ox; o1p.oy -= o2.oy;
		let [a, b, c, d] = oriented ? [0, 1, 2, 3] : [2, 3, 0, 1];
		o2p.c[c] = { type: CornerType.$internal, e: -1, q: d };
		o2p.c[b] = { type: CornerType.$intersection, e: o1.c[a].e };
		o1.c[d] = { type: CornerType.$socket, e: -2, q: c };
		o1p.c[c] = { type: CornerType.$internal, e: -2, q: b };
		o1p.c[d] = { type: CornerType.$intersection, e: o2.c[a].e };
		o2.c[b] = { type: CornerType.$socket, e: -1, q: c };

		if(!oriented) { // 記得偏移是相對於右上角而言
			o2p.shift = { x: o1.ox, y: 0 };
			o1p.shift = { x: 0, y: o2.oy };
		}

		yield new Configuration(this._repo, {
			partitions: [
				{ overlaps: [o1], strategy },
				{ overlaps: [o2p], strategy },
			],
		});
		yield new Configuration(this._repo, {
			partitions: [
				{ overlaps: [o1p], strategy },
				{ overlaps: [o2], strategy },
			],
		});
	}

	/** 搜尋 3-Flap Join */
	private *_searchThreeFlapJoin(
		junctions: readonly [JJunction, JJunction], strategy?: Strategy
	): Generator<Configuration> {
		// 製作一個具有兩個 Overlap 的 Partition
		let [o1, o2] = junctions.map((j, i) => ConfigUtil.$toOverlap(j, i));
		ConfigUtil.$joinOverlaps(o1, o2, -1, -2, o1.c[0].e == o2.c[0].e);

		yield new Configuration(this._repo, {
			partitions: [{
				overlaps: [o1, o2],
				strategy,
			}],
		});
	}

	/** 搜尋 3-Flap Relay Join */
	private *_searchThreeFlapRelayJoin(
		junctions: readonly [JJunction, JJunction],
		strategy?: Strategy
	): Generator<Configuration> {
		let [o1, o2] = junctions.map((j, i) => ConfigUtil.$toOverlap(j, i));
		let oriented = o1.c[0].e == o2.c[0].e;
		let o1x = o2.ox > o1.ox; // o1 寬度比較窄
		let x = (o1x ? o1 : o2).ox, y = (o1x ? o2 : o1).oy;

		for(let n = 1; n < x; n++) {
			let [o1p, o2p] = clone([o1, o2]);
			let o = ConfigUtil.$joinOverlaps(o1p, o2p, -1, -2, oriented, !o1x);
			o.ox -= n;
			if(oriented) o.shift = { x: n, y: 0 };
			yield new Configuration(this._repo, {
				partitions: [{
					overlaps: [o1p, o2p],
					strategy,
				}],
			});
		}

		for(let n = 1; n < y; n++) {
			let [o1p, o2p] = clone([o1, o2]);
			let o = ConfigUtil.$joinOverlaps(o1p, o2p, -1, -2, oriented, o1x);
			o.oy -= n;
			if(oriented) o.shift = { x: 0, y: n };
			yield new Configuration(this._repo, {
				partitions: [{
					overlaps: [o1p, o2p],
					strategy,
				}],
			});
		}
	}
}
