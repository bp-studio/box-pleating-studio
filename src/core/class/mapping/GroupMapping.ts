import { BaseMapping } from "./BaseMapping";
import type { Disposable } from "..";

//=================================================================
/**
 * {@link GroupMapping GroupMapping<K, V>} 類別是多對一用途的 {@link BaseMapping} 實作類別。
 *
 * 它的 source 必須是 `K[]` 型態，
 * 而 keyGen 必須根據此陣列產生可鑑別這些來源陣列的簽章，
 * dtor 條件則是值被 disposed。
 */
//=================================================================

@shrewd export class GroupMapping<K, V extends Disposable> extends BaseMapping<string, K[], V> {

	constructor(source: IterableFactory<K[]>, keyGen: Func<K[], string>, ctor: Func<K[], V>) {
		super(source, keyGen, ctor, (_, v) => v.$disposed);
	}
}
