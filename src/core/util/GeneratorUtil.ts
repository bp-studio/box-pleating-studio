
//////////////////////////////////////////////////////////////////
/**
 * 提供生成器相關的工具方法。
 */
//////////////////////////////////////////////////////////////////

export namespace GeneratorUtil {

	/** 逐一執行傳入的生成器，一旦其中一個有傳回東西就會停止使用後面的 */
	export function* $first<T>(
		generators: Generator<T>[], filter: (value: T) => boolean): Generator<T> {
		for(let generator of generators) {
			let found = false;
			for(let value of generator) {
				if(filter(value)) {
					yield value;
					found = true;
				}
			}
			if(found) return;
		}
	}

	/** 依照給予的 predicate 過濾生成器的輸出 */
	export function* $filter<T>(
		generator: Generator<T>, predicate: (value: T) => boolean): Generator<T> {
		for(let value of generator) if(predicate(value)) yield value;
	}
}
