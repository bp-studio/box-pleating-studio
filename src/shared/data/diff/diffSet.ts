//=================================================================
/**
 * {@link DiffSet} 可以求出某個集合在兩回合之間的差異。
 */
//=================================================================
export class DiffSet<T> {

	private _oldSet: Set<T> = new Set();
	private _newSet: Set<T> = new Set();

	/** 宣告指定的值在新的回合當中是存在的 */
	public $add(value: T): void {
		this._newSet.add(value);
		this._oldSet.delete(value);
	}

	/** 傳回自從上次呼叫以來，舊回合的值當中沒有出現在新一回合當中的那些 */
	public *$diff(): IterableIterator<T> {
		for(const value of this._oldSet) yield value;
		this._oldSet = this._newSet;
		this._newSet = new Set();
	}
}
