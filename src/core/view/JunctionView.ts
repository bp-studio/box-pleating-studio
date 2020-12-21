
@shrewd class JunctionView extends View {

	private _junction: Junction;
	private _shade: paper.CompoundPath;

	constructor(junction: Junction) {
		super(junction);
		this._junction = junction;
		this.$addItem(Layer.junction, this._shade = new paper.CompoundPath(Style.junction));
	}

	protected render() {
		if(this._shade.visible = this._junction.status == JunctionStatus.tooClose) {
			let f1 = this._junction.f1, f2 = this._junction.f2;
			this._shade.removeChildren();
			let d = this._junction.$treeDistance - (f1.radius + f2.radius);
			if(d == 0) {
				this._shade.addChild(f1.view.circle.intersect(f2.view.circle));
				this._shade.strokeWidth = JunctionView.widthForArea(this._shade.area);
			} else {
				let c1 = f1.view.makeRectangle(d), c2 = f2.view.makeRectangle(d);
				this._shade.addChild(f1.view.circle.intersect(c2));
				this._shade.addChild(f2.view.circle.intersect(c1));
				this._shade.strokeWidth = JunctionView.widthForArea(this._shade.area);
			}
		}
	}

	private static widthForArea(a:number):number {
		return a < 0.25 ? 4 : a < 0.5 ? 3 : a < 1 ? 2 : 1;
	}
}