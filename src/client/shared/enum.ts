export type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };

type Value<T> = T[keyof T];

export namespace Enum {
	export function values<E extends Enum<E>>(e: E): Value<E>[] {
		return Object
			.values<number>(e as Record<string, number>)
			.filter(a => !isNaN(Number(a))) as Value<E>[];
	}
}
