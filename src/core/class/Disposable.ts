
interface IDisposable {
	$dispose(): void;
}

//////////////////////////////////////////////////////////////////
/**
 * {@link Disposable} 是所有具有「棄置」這種概念的基底類別。
 * 除了進行垃圾回收之外，具體來說棄置到底要做什麼事是由繼承類別來定義的。
 *
 * 可以藉由覆寫 {@link Disposable.$shouldDispose $shouldDispose} 計算屬性來設定棄置條件，
 * 以便條件滿足的時候自動棄置。
 */
//////////////////////////////////////////////////////////////////

@shrewd abstract class Disposable implements IDisposable {

	private static _pending: Set<Disposable> = new Set();

	/**
	 * 清理掉一切棄置物件的交互參照，以利 GC。這個動作必須在認可週期的最後才執行，
	 * 因為在棄置當下的週期之內仍然有可能繼續需要呼叫相關的參照（例如為了產生 memento）。
	 */
	public static $flush(): void {
		for(let item of Disposable._pending) item._destroy();
		Disposable._pending.clear();
	}

	/** 內部的棄置狀態 */
	@shrewd({
		renderer(this: Disposable, v: boolean) {
			return v || this.$shouldDispose;
		},
	})
	private _disposed: boolean = false;

	/** 建構子 */
	constructor(parent?: Disposable) {
		this._disposeWith = parent;
	}

	private _disposeWith?: Disposable;

	@shrewd protected $disposeEvent(): void {
		if(this._disposed) {
			Shrewd.terminate(this);
			this.$onDispose();
		}
	}

	/** 要自動棄置的條件。繼承類別覆寫的時候應記得參考 {@link Disposable.$shouldDispose super.$shouldDispose}。 */
	protected get $shouldDispose(): boolean {
		return this._disposeWith ? this._disposeWith._disposed : false;
	}

	/** 手動棄置，繼承類別可以攔截這個操作並決定是否可以棄置。 */
	public $dispose(): void {
		this._disposed = true;
	}

	/**
	 * 棄置事件，這個方法的具體內容必須在繼承類別中定義。
	 *
	 * 繼承類別覆寫此方法的時候一般來說應呼叫 {@link Disposable.$onDispose super.$onDispose()} 方法，請務必記得。
	 */
	protected $onDispose(): void {
		Disposable._pending.add(this);
	}

	/** 自動把一切的物件參照都消滅掉，以利 GC */
	private _destroy(): void {
		for(let key in this) {
			if(this[key] instanceof Disposable) {
				delete this[key];
			}
		}
	}

	/**
	 * 當前的物件是否真的已經被棄置（手動或自動）。
	 *
	 * 提供這個非反應的公開存取子是為了避免在 terminate 的瞬間凍結住結果的值。
	 */
	public get $disposed(): boolean {
		return this._disposed;
	}
}
