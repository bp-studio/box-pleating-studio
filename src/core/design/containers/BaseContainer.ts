
//////////////////////////////////////////////////////////////////
/**
 * 各種的 {@link BaseContainer} 類別均繼承自 {@link Mapping} 類別，
 * 其中又各自定義了額外的計算屬性或方法，
 * 以分攤 {@link Design} 物件的程式碼並達到關注點分離。
 */
//////////////////////////////////////////////////////////////////

class BaseContainer<K, V extends Disposable> extends Mapping<K, V> {

	protected readonly _design: Design;

	constructor(design: Design, source: IterableFactory<K>, constructor: Func<K, V>) {
		super(source, constructor);
		this._design = design;
	}

	public $dispose(): void {
		super.$dispose();
		// @ts-ignore
		delete this._design;
	}
}
