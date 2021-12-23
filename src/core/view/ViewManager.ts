import { JunctionView } from "./JunctionView";
import { FlapView } from "./FlapView";
import { EdgeView } from "./EdgeView";
import { VertexView } from "./VertexView";
import { RiverView } from "./RiverView";
import { DeviceView } from "./DeviceView";
import { SheetView } from "./SheetView";
import { Device, Edge, Flap, Junction, River, Sheet, Vertex } from "bp/design";
import type { Mountable } from "bp/class";
import type { View } from "./classes/View";

//////////////////////////////////////////////////////////////////
/**
 * {@link IViewManager} 介面定義了 {@link Mountable} 和 {@link View} 物件之間的抽象轉換關係。
 */
//////////////////////////////////////////////////////////////////

export interface IViewManager {
	$contains(target: Mountable, point: paper.Point): boolean;
	$createView(target: Mountable): void;
	$get(target: Mountable): View | null;
}

//////////////////////////////////////////////////////////////////
/**
 * {@link ViewManager} 類別是 {@link IViewManager} 介面的預設實作。
 *
 * 目前的實作採用了 paper.js 套件來進行繪製，
 * 這也意味著暫時這個類別跟 {@link Display} 類別的內部實作是高度耦合的，
 * 這個問題未來有機會的話可以再改善。
 */
//////////////////////////////////////////////////////////////////

export class ViewManager implements IViewManager {

	private _viewMap: WeakMap<Mountable, View> = new WeakMap();

	public $contains(target: Mountable, point: paper.Point): boolean {
		let view = this._viewMap.get(target);
		if(!view) return false;
		view.$draw();
		return view.$contains(point);
	}

	public $createView(target: Mountable): void {
		let view: View | undefined;
		if(target instanceof Junction) view = new JunctionView(target);
		else if(target instanceof Flap) view = new FlapView(target);
		else if(target instanceof Edge) view = new EdgeView(target);
		else if(target instanceof Vertex) view = new VertexView(target);
		else if(target instanceof River) view = new RiverView(target);
		else if(target instanceof Device) view = new DeviceView(target);
		else if(target instanceof Sheet) view = new SheetView(target);

		if(view) this._viewMap.set(target, view);
	}

	public $get(target: Mountable): View | null {
		return this._viewMap.get(target) ?? null;
	}
}
