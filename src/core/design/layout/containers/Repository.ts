import { Configuration } from "./Configuration";
import { Store } from "./Store";
import { Configurator, Joiner } from "../calculation";
import type { JConfiguration, JOverlap, JStretch, JStructure, Memento } from "bp/content/json";
import type { Stretch } from "..";

interface JRepository {
	configurations: JConfiguration[];
	index: number;
}

//=================================================================
/**
 * {@link Repository} 是針對 {@link Stretch} 的特定配置算出的若干套 {@link Configuration} 的組合。
 *
 * {@link Repository} 物件存在的動機是為了使得當 {@link Stretch} 的配置暫時發生改變、
 * 或是 {@link Stretch} 由於拖曳而暫時解除活躍時，可以記住原本的 {@link Pattern} 組合。
 */
//=================================================================

@shrewd export class Repository extends Store<Configuration, Configuration>
	implements ISerializable<JRepository> {

	public get $tag(): string {
		return "r" + this.$stretch.$signature;
	}

	public readonly $stretch: Stretch;
	public readonly $signature: string;
	public readonly $structure: JStructure;

	protected $generator: Generator<Configuration>;

	private readonly joinerCache: Map<string, Joiner> = new Map();

	protected $builder(prototype: Configuration): Configuration {
		// Repository 沒辦法使用快速建構機制，
		// 因為它在生成的時候必須先確定 Configuration 裡面真的有 Pattern，
		// 所以它當場就必須把 Configuration 的實體建構完畢。
		return prototype;
	}

	constructor(stretch: Stretch, signature: string, option?: JStretch) {
		super(stretch.$sheet);
		this.$stretch = stretch;
		this.$signature = signature;
		this.$structure = JSON.parse(signature);

		let json = stretch.$design.$options.get(this);
		if(json) {
			this.$restore(json.configurations.map(c => new Configuration(this, c)), json.index);
		} else {
			this.$generator = new Configurator(this, option).$generate(
				() => this.joinerCache.clear() // 搜尋完成之後清除快取
			);
		}
	}

	private _everActive: boolean = false;

	/** 一旦安定下來了之後就記錄自己的建構 */
	@shrewd private _onSettle(): void {
		if(!this._everActive && this._isActive && !this.$design.$dragging) {
			this._everActive = true;

			// 乍看之下不需要特別記錄 Repository 的建構 Memento（因為重新移動到位的時候必然會計算出一樣的東西），
			// 但是一方面記錄下來確實在歷史移動的時候會加速、
			// 另一方面也是考慮到可能未來會隨著版本改變而算出不同的東西，
			// 此時如果沒有 100% 留下正確的 Memento，歷史移動方面就可能會有瑕疵。
			this.$design.$history?.$construct(this.$toMemento());
		}
	}

	protected get $shouldDispose(): boolean {
		// 建立靜態參照；預設情況下 Terser 不會讓這邊的 side-effect 消失
		let active = this._isActive, dragging = this.$design.$dragging;
		return super.$shouldDispose || this.$stretch.$disposed || !active && !dragging;
	}

	protected $onDispose(): void {
		if(this._everActive) this.$design?.$history?.$destruct(this.$toMemento());
		super.$onDispose();
	}

	@shrewd public get _isActive(): boolean {
		return this.$stretch._isActive && this.$stretch.$repository == this;
	}

	protected $onMove(): void {
		this.$stretch.$selected = !this.entry!.entry!.$selected;
	}

	/** 根據 {@link JOverlap} 組合來產生（或沿用）一個 {@link Joiner} */
	public getJoiner(overlaps: readonly JOverlap[]): Joiner {
		let key = JSON.stringify(overlaps);
		let j = this.joinerCache.get(key);
		if(!j) this.joinerCache.set(key, j = new Joiner(overlaps, this));
		return j;
	}

	public toJSON(): JRepository {
		return {
			configurations: this.$memento.map(c => c.toJSON(true)),
			index: this.index,
		};
	}

	public $toMemento(): Memento {
		return [this.$tag, this.toJSON()];
	}
}
