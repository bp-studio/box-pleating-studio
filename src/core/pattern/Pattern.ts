
interface JPattern<T extends JGadget = JGadget> {
	devices: readonly JDevice<T>[];
}

type GPattern = JPattern<Gadget>;

//////////////////////////////////////////////////////////////////
/**
 * `Pattern` 是一整套針對特定 `Configuration` 產生的完整摺式。
 * 一個 `Configuration` 可以導致多套可用的 `Pattern` 可以交換選用。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Pattern extends SheetObject implements ISerializable<JPattern>, IQueryable {

	public get tag() {
		return this.configuration.tag + "." + this.configuration.indexOf(this);
	}

	public query(tag: string): ITagObject | undefined {
		if(!tag) return this;
		else return this.devices[Number(tag)];
	}

	public static getSignature(pattern: JPattern) {
		let d = pattern.devices;
		pattern.devices = pattern.devices.map(d => {
			d = clone(d);
			d.gadgets.forEach(g => Gadget.simplify(g));
			d.offset = undefined;
			return d;
		});
		let result = JSON.stringify(pattern);
		pattern.devices = d;
		return result;
	}

	public readonly configuration: Configuration;

	public readonly gadgets: readonly Gadget[];

	public readonly devices: readonly Device[];

	public readonly signature: string;

	constructor(configuration: Configuration, pattern: JPattern) {
		super(configuration.sheet);
		this.configuration = configuration;
		this.devices = pattern.devices.map((d, i) => new Device(this, configuration.partitions[i], d));
		this.gadgets = this.devices.reduce((arr, d) => arr.concat(d.gadgets), [] as Gadget[]);
		this.signature = JSON.stringify(pattern);

		// 如果有發生 glitch 的話，把底下這些打開可以偵錯
		// // @ts-ignore
		// if(!bp.running) {
		// 	console.log("manual")
		// }
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.configuration.disposed;
	}

	@shrewd public get isActive() {
		return this.configuration.isActive && this.configuration.entry == this;
	}

	/**
	 * 針對每一個象限的、用於計算軌跡的線條清單。
	 *
	 * 這跟一個 Pattern 實際上會繪製出來的 ridge 並不全然一樣。
	 */
	@shrewd public get linesForTracing(): PerQuadrant<readonly Line[]> {
		if(!this.isActive) return this._lineCache;

		let dir = this.configuration.repository.stretch.junctions[0].direction;
		let { fx, fy } = this.stretch;
		let size = new Fraction(this.design.LayoutSheet.size);
		return this._lineCache = MakePerQuadrant(q => {
			let lines: Line[] = [];
			if(dir % 2 != q % 2) return lines;
			for(let d of this.devices) {
				let qv = Quadrant.QV[q];
				let vector = qv.scale(size);
				lines.push(...d.ridges);
				lines.push(...d.getConnectionRidges(true));

				for(let [c, o, cq] of d.partition.outCorners) {
					let anchor = d.anchors[o][cq];
					if(
						c.type == CornerType.side || // 側角 ridge 會朝著對應象限的方向無限（精確來說是至紙張大小）延伸
						c.type == CornerType.flap && q != Quadrant.transform(cq, fx, fy) || // 順向的也是
						c.type == CornerType.internal && q != Quadrant.transform(c.q!, fx, fy)
					) {
						lines.push(new Line(anchor, anchor.add(vector)));
					} else {
						// 其餘情況則只連接到原本的頂點
						if(c.type == CornerType.intersection) {
							let sq = d.partition.overlaps[o].c.find(m => m.type == CornerType.flap)!.q;
							if(sq != q) lines.push(new Line(anchor, anchor.add(vector)));
							else {
								let to = d.partition.getSideConnectionTarget(anchor, c, sq);
								if(to && !to.eq(anchor)) lines.push(new Line(anchor, to));
							}
						} else {
							lines.push(new Line(anchor, this.getConnectionTarget(c as JConnection)));
						}
					}
				}
			}
			return Line.distinct(lines);
		});
	}
	private _lineCache: PerQuadrant<readonly Line[]> = MakePerQuadrant(i => []);

	public toJSON(): JPattern {
		return { devices: this.devices.map(d => d.toJSON()) };
	}

	public get selected(): boolean {
		return this.devices.some(d => d.selected);
	}

	/** 提供快速查找 `Stretch` */
	public get stretch(): Stretch {
		return this.configuration.repository.stretch;
	}

	/** 根據指定的 JConnection 資料求出連接目標點的實體 */
	public getConnectionTarget(c: JConnection): Point {
		if(c.e >= 0) return this.design.flaps.byId.get(c.e)!.points[c.q];
		else {
			let [i, j] = this.configuration.overlapMap.get(c.e)!
			return this.devices[i].anchors[j][c.q];
		}
	}
}
