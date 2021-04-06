
class BaseContainer<K, V extends Disposable> extends Mapping<K, V> {

	protected readonly _design: Design;

	constructor(design: Design, source: IterableFactory<K>, constructor: Func<K, V>) {
		super(source, constructor);
		this._design = design;
	}

	public dispose() {
		super.dispose();
		// @ts-ignore
		delete this._design;
	}
}
