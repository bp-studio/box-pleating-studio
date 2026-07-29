
export type GeneratorFilter<T> = Func<T, boolean | undefined>;

//=================================================================
/**
 * Utility methods for {@link Generator}.
 */
//=================================================================

export namespace GeneratorUtil {

	/**
	 * Execute given {@link Generator}s in order.
	 *
	 * Each generator is always run to completion (every value it yields is
	 * tested against the {@link GeneratorFilter}, and every value that passes
	 * is yielded onwards) -- this is intentional, as a single generator can
	 * legitimately produce more than one acceptable result that the caller
	 * needs in full. Once a generator has yielded at least one value that
	 * passes (or that the filter marks with `undefined`, see below), no
	 * further generators in the list will be executed.
	 *
	 * If the filter returns `undefined`, it will also signify stopping after the current generator,
	 * only that the generated value will not be yielded.
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
