
//=================================================================
/**
 * 提供生成器相關的工具方法。
 */
//=================================================================

export namespace GeneratorUtil {

	/**
	 * 逐一執行傳入的生成器，一旦其中一個生成器有傳回符合過濾器的東西，
	 * 就會在該生成器生成完畢之後停止使用後面的其它生成器。
	 */
	export function* $first<T>(generators: Generator<T>[], filter: Predicate<T>): Generator<T> {
		for(const generator of generators) {
			let found = false;
			for(const value of generator) {
				if(filter(value)) {
					yield value;
					found = true;
				}
			}
			if(found) return;
		}
	}

	/** 依照給予的 predicate 過濾生成器的輸出 */
	export function* $filter<T>(generator: Generator<T>, predicate: Predicate<T>): Generator<T> {
		for(const value of generator) if(predicate(value)) yield value;
	}
}
