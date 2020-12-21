@shrewd class DeviceView extends ControlView<Device> {

	private readonly _ridges: paper.CompoundPath;

	private readonly _axisParallels: paper.CompoundPath;

	// 雖然理論上一個 Device 的區域範圍一定是連通的，
	// 但是有時候 paper.js 的浮點運算會誤把區域範圍理解成好幾塊，
	// 因此實務上還是必須採用 CompoundPath 來顯示才能保證不出錯。
	private readonly _shade: paper.CompoundPath;

	constructor(device: Device) {
		super(device);

		this.$addItem(Layer.axisParallel, this._axisParallels = new paper.CompoundPath(Style.axisParallel));
		this.$addItem(Layer.ridge, this._ridges = new paper.CompoundPath(Style.ridge));
		this.$addItem(Layer.shade, this._shade = new paper.CompoundPath(Style.shade));
	}

	public contains(point: paper.Point) {
		return this._shade.contains(point);
	}

	protected render() {
		this._shade.removeChildren();

		let path: paper.PathItem | null = null;
		for(let r of this.control.regions) {
			let cPath = this.contourToPath(r.shape.contour);
			if(!path) path = cPath;
			else path = path.unite(cPath, { insert: false });
		}
		if(path!.children) this._shade.copyContent(path!);
		else this._shade.addChild(path!)

		this.setLines(this._ridges, this.control.ridges, this.control.outerRidges);
		this.setLines(this._axisParallels, this.control.axisParallels);
	}

	private setLines(path: paper.CompoundPath, ...lines: (readonly Line[])[]) {
		path.removeChildren();
		for(let set of lines) for(let l of set) {
			path.moveTo(l.p1.toPaper());
			path.lineTo(l.p2.toPaper());
		}
	}

	private contourToPath(contour: ReadonlyPath): paper.Path {
		let path = new paper.Path({ closed: true });
		let { fx, fy } = this.control.pattern.stretch;
		let delta = this.control.delta;
		contour.forEach(c => path.add(c.transform(fx, fy).add(delta).toPaper()));
		return path;
	}

	protected renderSelection(selected: boolean) {
		this._shade.visible = selected || this.control.pattern.configuration.repository.stretch.selected;
	}
}
