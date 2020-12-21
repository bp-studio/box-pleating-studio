
//////////////////////////////////////////////////////////////////
/**
 * `Mapping<K, V>` 類別是一對一用途的 `BaseMapping` 實作類別。
 * 
 * 它的 key 就等同於是 source，而 dtor 條件則是值被 disposed。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Mapping<K, V extends Disposible> extends BaseMapping<K, K, V> {

	constructor(source: IterableFactory<K>, constructor: Func<K, V>) {
		super(source, k => k, constructor, (k, v) => v.disposed);
	}
}