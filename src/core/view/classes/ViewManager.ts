
interface IViewManager {
	$contains(target: Mountable, point: paper.Point): boolean;
	$createView(target: Mountable): void;
	$get(target: Mountable): View | null;
}

class ViewManager implements IViewManager {

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
