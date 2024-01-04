
export type GeneratorFilter<T> = Func<T, boolean | undefined>;

//=================================================================
/**
 * Utility methods for {@link Generator}.
 */
//=================================================================

export namespace GeneratorUtil {

	/**
	 * Execute given {@link Generator}s in order,
	 * and once one of them yields something that passes the {@link GeneratorFilter},
	 * remaining generators will not be execute further.
	 *
	 * If the filter returns `undefined`, it will also signify stopping after the current generator.
	 */
	export function* $first<T>(generators: Generator<T>[], filter: GeneratorFilter<T>): Generator<T> {
		for(const generator of generators) {
			let found = false;
			for(const value of generator) {
				const check = filter(value);
				if(check) yield value;
				if(check !== false) found = true;
			}
			if(found) return;
		}
	}
}
