
interface JConfiguration {
	/** 這個 Configuration 裡面所有的 Partition */
	partitions: readonly JPartition[];
	patterns?: JPattern[];
	index?: number;
}

//////////////////////////////////////////////////////////////////
/**
 * 一種 `Configuration` 是一套把 `Junction`
 * 群組構成的重疊區域切割成 `Partition` 的配置。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Configuration extends Store<JPattern, Pattern> implements ISerializable<JConfiguration> {

	public get $tag() {
		return this.$repository.$tag + "." + this.$repository.$indexOf(this);
	}

	public readonly $repository: Repository;

	/** 依照 Overlap 的 id（負數）來檢索，得出它對應於第幾個 Partition 的第幾個 Overlap */
	public readonly $overlapMap: ReadonlyMap<number, [number, number]>;

	public readonly $partitions: readonly Partition[];

	protected $generator: Generator<JPattern>;

	private _seed?: JPattern;
	private _seedSignature?: string;

	/** 所有的 JOverlap 陣列 */
	public readonly $overlaps: readonly JOverlap[];

	constructor(set: Repository, config: JConfiguration, seed?: JPattern) {
		super(set.$sheet);
		this.$repository = set;
		this._seed = seed;
		if(seed) this._seedSignature = Pattern.$getSignature(seed);

		let overlaps: JOverlap[] = [];
		let overlapMap: Map<number, [number, number]> = new Map();
		let k = -1;
		for(let [i, p] of config.partitions.entries()) {
			for(let [j, o] of p.overlaps.entries()) {
				overlaps.push(o);
				overlapMap.set(k--, [i, j]);
			}
		}
		this.$overlaps = overlaps;
		this.$overlapMap = overlapMap;

		this.$partitions = config.partitions.map(p => new Partition(this, p));

		if(config.patterns) {
			this.$restore(config.patterns, config.index!);
		} else {
			this.$generator = this._generate();
		}
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.$repository.$disposed;
	}

	@shrewd public get $isActive() {
		return this.$repository.$isActive && this.$repository.entry == this;
	}

	protected $builder(prototype: JPattern) {
		return new Pattern(this, prototype);
	}

	/** 在當前的 `Configuration` 中尋找 `Pattern` */
	private *_generate(): Generator<JPattern> {
		if(this._seed) yield this._seed;

		// 過濾掉跟存檔一樣的 Pattern
		let filter = (pattern: JPattern) => !this._seedSignature || this._seedSignature != Pattern.$getSignature(pattern);
		yield* GeneratorUtil.$filter(this._search([]), filter);
	}

	private *_search(devices: JDevice[], depth = 0): Generator<GPattern> {
		if(depth == this.$partitions.length) {
			// 把整套資料複製一份，以免 positioning 的操作互相干擾
			let p = this._makePattern(clone(devices));
			if(p) yield p;
		} else {
			for(let d of this.$partitions[depth].$generate()) {
				devices.push(d);
				yield* this._search(devices, depth + 1);
				devices.pop();
			}
		}
	}

	/** 安排位置並產生 `Pattern`；如果結果太大，則傳回 null 表示失敗 */
	private _makePattern(prototypes: JDevice[]): GPattern | null {
		prototypes.forEach(d => d.gadgets = d.gadgets.map(g => Gadget.$instantiate(g)));
		let devices = prototypes as GDevice[];
		let junctions = this.$repository.$structure;

		// 單一普通 Device
		if(junctions.length == 1) {
			return this._makeSingleRegularDevicePattern(junctions[0], devices);
		}

		// 單一 Join Device
		if(junctions.length == 2 && this.$partitions.length == 1) {
			return this._makeSingeJoinDevicePattern(devices);
		}

		// 兩個 Device Relay
		if(junctions.length == 2 && this.$partitions.length == 2) {
			return this._makeTwoDeviceRelayPattern(devices);
		}

		return null;
	}

	private _makeSingleRegularDevicePattern(junction: JJunction, devices: GDevice[]): GPattern | null {
		let sx = junction.sx;

		if(devices.length == 1) {
			// 只有一個 GOPS 的話，初始位置置中
			devices[0].offset = Math.floor((sx - devices[0].gadgets[0].sx) / 2);
			return { devices };
		}

		if(devices.length == 2) {
			let [g1, g2] = devices.map(d => d.gadgets[0]);
			let c1 = this.$overlaps[0].c[2];
			let c2 = this.$overlaps[1].c[0];
			let tx1 = g1.sx + g2.rx(c1.q!, 2);
			let tx2 = g2.sx + g1.rx(c2.q!, 0);
			if(tx1 > sx || tx2 > sx) return null;
			// 兩個的話，預設位置把兩者拉得越開越好
			devices[1].offset = sx - tx2;
			return { devices };
		}

		return null;
	}

	private _makeSingeJoinDevicePattern(devices: GDevice[]): GPattern | null {
		let [o1, o2] = this.$overlaps;
		let [j1, j2] = [o1, o2].map(o => this.$repository.$structure[o.parent]);
		let oriented = j1.c[0].e == j2.c[0].e;
		let gadgets = devices[0].gadgets;
		if(gadgets[0].sx > j1.sx || gadgets[1].sx > j2.sx) return null;
		if(!oriented) devices[0].offset = j1.sx - gadgets[0].sx;
		return { devices };
	}

	private _makeTwoDeviceRelayPattern(devices: GDevice[]): GPattern | null {
		// TODO: 目前這一段幾乎是暴力解，更一般的作法還有待思考
		let [g1, g2] = devices.map(d => d.gadgets[0]);
		let [o1, o2] = this.$overlaps;

		// 選出有切割過的那一個 Overlap（下作 o1），因為另一個不會出錯
		let reversed = o1.c[0].e! >= 0 && o1.c[2].e! >= 0;
		if(reversed) {
			[g1, g2] = [g2, g1];
			[o1, o2] = [o2, o1];
		}
		let [j1, j2] = [o1, o2].map(o => this.$repository.$structure[o.parent]);
		let oriented = o1.c[0].e! < 0; // 共用左下角
		let q = oriented ? 0 : 2, tq = o1.c[q].q!;

		let sx = j1.sx, tx = g1.sx;
		let s = g1.$setupConnectionSlack(g2, q, tq);
		sx -= Math.ceil(g2.rx(tq, q)) + s;
		let offsets = oriented ? [s ?? 0, 0] : [sx - tx, j2.sx - g2.sx]; // 盡可能把兩者往共用的角落靠
		if(reversed) offsets.reverse();

		if(tx > sx) return null;

		// 已經靠攏之後如果 delta 比 g2（被接力者）還要更近那當然不行
		let delta = this._getRelativeDelta(j1, j2, g2);
		if(g2.$intersects(delta, oriented ? Quadrant.QV[0] : Quadrant.QV[2])) return null;

		devices.forEach((d, i) => d.offset = offsets[i]);
		return { devices };
	}

	/** 取得 delta 點相對於特定 Gadget 的座標 */
	private _getRelativeDelta(j1: JJunction, j2: JJunction, g: Gadget) {
		let oriented = j1.c[0].e == j2.c[0].e;
		let r = Partitioner.$getMaxIntersectionDistance(this.$design.$tree, j1, j2, oriented);
		if(j2.ox > j1.ox) [j1, j2] = [j2, j1];
		let p: IPoint = { x: r - j2.ox, y: r - j1.oy };
		if(!oriented) {
			p.x = g.sx - p.x;
			p.y = g.sy - p.y;
		}
		return new Point(p);
	}

	protected $onMove(): void {
		this.$repository.$stretch.$selected = !this.entry!.$selected;
	}

	/** 是否為第一次產生 Memento */
	private _initMemento = true;

	public $getMemento() {
		// 第一次產生（即建構）的時候直接使用 this._prototypes 的資料即可，因為還沒有任何移動；
		// 之後才是真的根據 this.memento 的資料來生。
		let result = this._initMemento ? this._prototypes :
			this.$memento.map(p => p instanceof Pattern ? p.toJSON() : p);
		this._initMemento = false;
		return result;
	}

	public toJSON(session: boolean = false): JConfiguration {
		let result: JConfiguration = { partitions: this.$partitions.map(p => p.toJSON()) };
		if(session) {
			result.patterns = this.$getMemento();
			result.index = this.index;
		}
		return result;
	}
}
