
//////////////////////////////////////////////////////////////////
/**
 * {@link View} 是對應於元件的視圖，負責管理元件的繪製。
 * 它是一個擁有許多 {@link paper.Item} 物件
 * （透過 {@link View.$addItem $addItem()} 方法在建構式裡面加入）的 {@link Mountable} 物件。
 *
 * 它的抽象方法 {@link View.$render $render()} 內會進行繪製動作。
 */
//////////////////////////////////////////////////////////////////

abstract class View extends Mountable {

	public static readonly _MIN_SCALE = 10;

	private _paths: [Layer, paper.Item, number][] = [];

	public get $studio(): Studio | null {
		let studio = super.$studio;
		if(studio instanceof Studio) return studio;
		return null;
	}

	/**
	 * 視圖的自動繪製反應方法；會呼叫子類別實作的 `render()` 方法完成繪製。
	 *
	 * 可以透過相依於這個方法來達到確保繪製順序正確的目的。
	 */
	@shrewd public $draw(): void {
		this.$mountEvents();
		if(this.$studio) this.$render();
	}

	/**
	 * 加入一個指定的項目到指定的圖層之中。
	 *
	 * 請注意，基於效能考量，這個方法只應該在繼承類別的建構式裡面使用；
	 * 若在別的地方使用將會發生不可預期的結果。
	 */
	public $addItem(layer: Layer, item: paper.Item): void {
		this._paths.push([layer, item, item.strokeWidth]);
	}

	protected $onMount(studio: Studio): void {
		// 掛載時將所有的項目加入圖層之中
		for(let [l, p] of this._paths) studio.$display.$addToLayer(p, l);
	}

	protected $onDismount(studio: Studio): void {
		// 卸載時移除所有的項目
		for(let [l, p] of this._paths) p.remove();
	}

	/**
	 * 當前的視圖是否「包含」指定的點，用於偵測點擊。
	 *
	 * 包含的具體邏輯由繼承類別實作，預設行為是一律傳回否（即視圖不可點擊）。
	 */
	public $contains(point: paper.Point): boolean {
		return false;
	}

	/**
	 * 視圖必須實作抽象的 {@link View.$render $render()} 方法以定義繪製的具體行為。
	 */
	protected abstract $render(): void;

	/** 當尺度太小的時候調整線條粗細 */
	@shrewd protected get _drawScale(): number {
		this.$mountEvents();
		if(!this.$studio) return this._scaleCache;
		let s = this.$studio.$display.$scale;
		return this._scaleCache = s < View._MIN_SCALE ? s / View._MIN_SCALE : 1;
	}
	private _scaleCache = 1;

	@shrewd private _renderScale(): void {
		for(let [l, p, w] of this._paths) p.strokeWidth = w * this._drawScale;
	}
}
