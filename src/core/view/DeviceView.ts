@shrewd class DeviceView extends ControlView<Device> {

	private readonly _ridges: paper.CompoundPath;

	private readonly _axisParallels: paper.CompoundPath;

	// 雖然理論上一個 Device 的區域範圍一定是連通的，
	// 但是有時候 paper.js 的浮點運算會誤把區域範圍理解成好幾塊，
	// 因此實務上還是必須採用 CompoundPath 來顯示才能保證不出錯。
	private readonly _shade: paper.CompoundPath;

	constructor(device: Device) {
		super(device);

		this.$addItem(Layer.$axisParallels,
			this._axisParallels = new paper.CompoundPath(Style.$axisParallels)
		);
		this.$addItem(Layer.$ridge, this._ridges = new paper.CompoundPath(Style.$ridge));
		this.$addItem(Layer.$shade, this._shade = new paper.CompoundPath(Style.$shade));
	}

	public $contains(point: paper.Point) {
		return this._shade.contains(point);
	}

	protected $render() {
		let path: paper.PathItem | null = null;
		for(let r of this._control.$regions) {
			let cPath = this._contourToPath(r.$shape.contour);
			if(path) path = path.unite(cPath, { insert: false });
			else path = cPath;
		}
		PaperUtil.$replaceContent(this._shade, path!, false);

		PaperUtil.$setLines(this._ridges, this._control.$ridges, this._control.$outerRidges);
		PaperUtil.$setLines(this._axisParallels, this._control.$axisParallels);
	}

	private _contourToPath(contour: ReadonlyPath): paper.Path {
		let path = new paper.Path({ closed: true });
		let { fx, fy } = this._control.$pattern.$stretch;
		let delta = this._control.$delta;
		contour.forEach(c => path.add(c.$transform(fx, fy).add(delta).$toPaper()));
		return path;
	}

	protected $renderSelection(selected: boolean) {
		this._shade.visible = selected ||
			this._control.$pattern.$configuration.$repository.$stretch.$selected;
	}
}
