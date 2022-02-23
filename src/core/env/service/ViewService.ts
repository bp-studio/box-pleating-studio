import type { Mountable } from "bp/class";
import type { View } from "bp/view/class/View";

//=================================================================
/**
 * {@link ViewService} 服務定義了 {@link Mountable} 和 {@link View} 物件之間的抽象轉換關係。
 */
//=================================================================

export namespace ViewService {

	const resolve: [constructor<Mountable>, constructor<View>][] = [];
	const map: WeakMap<Mountable, View> = new WeakMap();
	let init: boolean = false;

	export function $initialize(): void {
		init = true;
	}

	/** 註冊對應關係 */
	export function $register(ctor: constructor<Mountable>, V: constructor<View>): void {
		resolve.push([ctor, V]);
	}

	export function $contains(target: Mountable, point: paper.Point): boolean {
		if(!init) return false;
		let view = map.get(target);
		if(!view) return false;
		view.$draw();
		return view.$contains(point);
	}

	/** 對於給定的 {@link Mountable} 創造出對應的 {@link View} */
	export function $createView(target: Mountable): void {
		if(!init) return;
		let view: View | undefined;
		for(let [ctor, V] of resolve) {
			if(target instanceof ctor) {
				view = new V(target);
				break;
			}
		}
		if(view) map.set(target, view);
	}

	export function $get(target: Mountable): View | null {
		if(!init) return null;
		return map.get(target) ?? null;
	}
}
