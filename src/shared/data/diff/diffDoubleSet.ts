import { getKey, getPair } from "../doubleMap/intDoubleMap";

//=================================================================
/**
 * {@link DiffDoubleSet} 可以求出某個雙鍵集合在兩回合之間的差異。
 */
//=================================================================
export class DiffDoubleSet {

	private _oldSet: Set<number> = new Set();
	private _newSet: Set<number> = new Set();

	/** 宣告指定的鍵對在新的回合當中是存在的 */
	public $add(a: number, b: number): void {
		const key = getKey(a, b);
		this._newSet.add(key);
		this._oldSet.delete(key);
	}

	/** 傳回自從上次呼叫以來，舊回合的鍵對當中沒有出現在新一回合當中的那些 */
	public *$diff(): IterableIterator<[number, number]> {
		for(const key of this._oldSet) yield getPair(key);
		this._oldSet = this._newSet;
		this._newSet = new Set();
	}
}
