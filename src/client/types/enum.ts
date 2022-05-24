export type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };

export namespace Enum {
	export function values<E extends Enum<E>>(e: E): (E[keyof E])[] {
		return Object
			.values<number>(e as Record<string, number>)
			.filter(a => !isNaN(Number(a))) as (E[keyof E])[];
	}
}

export enum Direction { UR, UL, LL, LR, R, T, L, B, none }

