
//////////////////////////////////////////////////////////////////
/**
 * `Repository` 是針對 `Stretch` 的特定配置算出的若干套 `Configuration` 的組合。
 *
 * `Repository` 物件存在的動機是為了使得當 `Stretch` 的配置暫時發生改變、
 * 或是 `Stretch` 由於拖曳而暫時解除活躍時，可以記住原本的 `Pattern` 組合。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Repository extends Store<Configuration, Configuration> {

	public get tag() {
		return "rp" + this.stretch.signature;
	}

	public readonly stretch: Stretch;
	public readonly signature: string;
	public readonly structure: JStructure;

	protected generator: Generator<Configuration>;

	private readonly joinerCache: Map<string, Joiner> = new Map();

	protected builder(prototype: Configuration) {
		// Repository 沒辦法使用快速建構機制，
		// 因為它在生成的時候必須先確定 Configuration 裡面真的有 Pattern，
		// 所以它當場就必須把 Configuration 的實體建構完畢。
		return prototype;
	}

	constructor(stretch: Stretch, signature: string, option?: JStretch) {
		super(stretch.sheet);
		this.stretch = stretch;
		this.signature = signature;
		this.structure = JSON.parse(signature);
		this.generator = new Configurator(this, option).generate(
			() => this.joinerCache.clear() // 搜尋完成之後清除快取
		);
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.stretch.disposed;
	}

	@shrewd public get isActive(): boolean {
		return this.stretch.isActive && this.stretch.repository == this;
	}

	protected onMove(): void {
		this.stretch.selected = !(this.entry!.entry!.selected);
	}

	/** 根據 `JOverlap` 組合來產生（或沿用）一個 `Joiner` */
	public getJoiner(overlaps: readonly JOverlap[]): Joiner {
		let key = JSON.stringify(overlaps);
		let j = this.joinerCache.get(key);
		if(!j) this.joinerCache.set(key, j = new Joiner(overlaps, this));
		return j;
	}
}
