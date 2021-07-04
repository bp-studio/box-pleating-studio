
type constructor<T extends object> = new (...args: unknown[]) => T;

function isTypedArray<T extends object>(
	array: unknown[], constructor: constructor<T>
): array is T[] {
	return array.every(item => item instanceof constructor);
}

function sum(array: readonly number[]): number {
	return array.reduce((n, x) => n + x, 0);
}

/* eslint-disable no-extend-native */
/* eslint-disable @typescript-eslint/no-explicit-any */

if(typeof Array.prototype.flatMap == "undefined") {
	Array.prototype.flatMap = function(callback: any, thisArg?: any): any {
		thisArg ??= this;
		let aggregate = (
			agg: unknown[], next: unknown, index: number, arr: readonly unknown[]
		): unknown[] => {
			agg.push(...callback(next, index, arr));
			return agg;
		};
		return thisArg.reduce(aggregate, []);
	};
}
