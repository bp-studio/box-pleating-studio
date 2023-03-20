
//=================================================================
/**
 * This file is for preparing the future support for ECMAScript
 * decorators, which is supported in TypeScript 5+,
 * but not yet supported by ESBuild
 * (see issue https://github.com/evanw/esbuild/issues/104).
 *
 * Once ESBuild begin to support this, this file will replace
 * `decorators.ts`.
 */
//=================================================================

import { shallowRef } from "vue";

type ClassFieldInitializer<This = object, T = unknown> = (this: This, initialValue: T) => T;

/** Make a field into {@link shallowRef} in Vue */
function shallowRefDecorator<This, V>(
	value: undefined, context: ClassFieldDecoratorContext<This, V>): ClassFieldInitializer<This, V> {
	return function(this: This, initialValue: V) {
		const ref = shallowRef<V>();
		Object.defineProperty(this, context.name, {
			configurable: false,
			set(v: V) { ref.value = v; },
			get() { return ref.value; },
		});
		return initialValue; // This will trigger the set method above
	};
}

export { shallowRefDecorator as shallowRef };
