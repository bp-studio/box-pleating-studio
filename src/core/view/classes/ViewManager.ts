
interface IViewManager {
	$contains(object: object, point: paper.Point): boolean;
	$createView(object: object): void;
	$get(object: object): View | null;
}

class ViewManager implements IViewManager {

	private _viewMap: WeakMap<object, View> = new WeakMap();

	public $contains(object: object, point: paper.Point): boolean {
		let view = this._viewMap.get(object);
		if(!view) return false;
		view.$draw();
		return view.$contains(point);
	}

	public $createView(object: object) {
		let view: View | undefined;
		if(object instanceof Junction) view = new JunctionView(object);
		else if(object instanceof Flap) view = new FlapView(object);
		else if(object instanceof Edge) view = new EdgeView(object);
		else if(object instanceof Vertex) view = new VertexView(object);
		else if(object instanceof River) view = new RiverView(object);
		else if(object instanceof Device) view = new DeviceView(object);
		else if(object instanceof Sheet) view = new SheetView(object);

		if(view) this._viewMap.set(object, view);
	}

	public $get(object: object) {
		return this._viewMap.get(object) ?? null;
	}
}
