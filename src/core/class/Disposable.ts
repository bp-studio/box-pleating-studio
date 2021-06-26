
interface IDisposable {
	$dispose(): void;
}

//////////////////////////////////////////////////////////////////
/**
 * {@link Disposable} 是所有具有「棄置」這種概念的基底類別。
 * 除了進行垃圾回收之外，具體來說棄置到底要做什麼事是由繼承類別來定義的。
 *
 * 可以藉由覆寫 {@link Disposable.$shouldDispose} 計算屬性來設定棄置條件，
 * 以便條件滿足的時候自動棄置。
 */
//////////////////////////////////////////////////////////////////

@shrewd abstract class Disposable implements IDisposable {

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

	/** 要自動棄置的條件。繼承類別覆寫的時候應記得參考 `super.$shouldDispose`。 */
	protected get $shouldDispose(): boolean {
		return this._disposeWith ? this._disposeWith._disposed : false;
	}

	/** 手動棄置，繼承類別可以攔截這個操作並決定是否可以棄置。 */
	public $dispose() {
		this._disposed = true;
	}

	/**
	 * 棄置事件，這個方法的具體內容必須在繼承類別中定義。
	 *
	 * 繼承類別覆寫此方法的時候一般來說應呼叫 super 方法，請務必記得。
	 */
	protected $onDispose(): void {
		delete this._disposeWith;
	}

	/**
	 * 當前的物件是否真的已經被棄置（手動或自動）。
	 *
	 * 提供這個非反應的公開存取子是為了避免在 terminate 的瞬間凍結住結果的值。
	 */
	public get $disposed() {
		return this._disposed;
	}
}
