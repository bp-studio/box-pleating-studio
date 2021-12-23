
export namespace Diagnose {

	let data: Map<string, number> = new Map();

	export function init(): void {
		data.clear();
	}

	export function count(tag: string): void {
		data.set(tag, (data.get(tag) ?? 0) + 1);
	}

	export function max(tag: string, value: number): void {
		let old = data.get(tag) ?? Number.NEGATIVE_INFINITY;
		if(old < value) data.set(tag, value);
	}

	export function flush(): void {
		if(data.size === 0) return;
		for(let [tag, value] of data.entries()) console.log(tag, value);
		console.log("=================");
	}
}
