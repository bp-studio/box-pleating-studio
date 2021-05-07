
@shrewd class JunctionView extends View {

	private _junction: Junction;
	private _shade: paper.CompoundPath;

	constructor(junction: Junction) {
		super(junction);
		this._junction = junction;
		this.$addItem(Layer.$junction, this._shade = new paper.CompoundPath(Style.$junction));
	}

	protected $render() {
		this._shade.visible = this._junction.$status == JunctionStatus.tooClose;
		if(this._shade.visible) {
			let f1 = this._junction.f1, f2 = this._junction.f2;
			let v1 = f1.$view, v2 = f2.$view;
			let d = this._junction.$treeDistance - (f1.radius + f2.radius);
			let json = [v1.$circleJSON, v2.$circleJSON];
			if(d != 0) json.push(v1.$makeJSON(d), v2.$makeJSON(d));
			PaperWorker.$processJunction(this._shade, json);
		}
	}
}
