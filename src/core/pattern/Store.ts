
//////////////////////////////////////////////////////////////////
/**
 * 抽象類別 `Store` 能根據指定的生成器和建造器產生物件陣列，
 * 並且提供方法來在陣列之中瀏覽不同的物件。
 *
 * 基於效能，它的運作模式如下：
 * 1. 在拖曳期間只會產出生成器傳回的第一個原型資料建造出來的物件實體。
 * 2. 拖曳結束之後，生成全部的原型資料。
 * 3. 之後只有在索引值發生切換的時候才視需要根據原型資料建構出對應的物件實體。
 *
 * @typedef P 原型資料類別
 * @typedef T 實體物件類別
 */
//////////////////////////////////////////////////////////////////

abstract class Store<P, T extends SheetObject> extends SheetObject {

	/** 原型資料生成器 */
	protected abstract generator: Generator<P>;

	/** 從原型資料產生實體物件的建造器 */
	protected abstract builder(prototype: P): T;

	/** 目前選取的 entry 索引 */
	@action public index: number = 0;

	/** 目前的 `Collection` 所有可用的 prototype */
	@shrewd private get _prototypes(): P[] {
		if(!this.generator) return this._prototypeCache;
		if(this.design.dragging) {
			this.buildFirst();
			return this._prototypeCache.concat();
		} else {
			if(this._cache.length == 0) this.buildFirst();
			for(let entry of this.generator) this._prototypeCache.push(entry);
			delete (this as any).generator;
			return this._prototypeCache;
		}
	}

	private buildFirst(): void {
		let entry = this.generator.next();
		if(!entry.done) {
			try {
				// 產生第一個原型的同時也順便直接建構第一個實體，
				// 以便檢查存檔的版本是否相容
				this._cache[0] = this.builder(entry.value);
				this._prototypeCache.push(entry.value);
			} catch(e) {
				console.log("Incompatible old version.");
			}
		}
	}

	/** prototype 快取 */
	private _prototypeCache: P[] = [];

	/** entry 快取 */
	private _cache: T[] = [];

	/**
	 * 當前選用的 entry。
	 *
	 * 只要當前的 `Store` 非空就會有一個被選中，所以傳回 null 也表示 `Store` 為空。
	 */
	@shrewd public get entry(): T | null {
		let e = this._prototypes, i = this.index;
		if(e.length == 0) return null;
		return this._cache[i] = this._cache[i] || this.builder(e[i]);
	}

	/** 切換至某個 entry */
	public move(by: number = 1): void {
		let from = this.index, l = this._prototypes.length;
		this.index = (this.index + by + l) % l; // 加上 l 是為了避免 JavaScript 在負數的部份餘數取成負的
		this.onMove(this.index, from);
		Shrewd.commit();
	}

	/** 當前 `Store` 的大小 */
	public get size(): number {
		return this._prototypes.length;
	}

	/** 給 `Store` 的實作類別註冊 entry 切換之後要發生的事情 */
	protected abstract onMove(to: number, from: number): void;
}
