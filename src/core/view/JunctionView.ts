
//////////////////////////////////////////////////////////////////
/**
 * {@link JunctionView} 是對應於 {@link Junction} 的 {@link View}。
 *
 * 它只有當 {@link Junction} 的狀態為 {@link JunctionStatus.tooClose} 的時候會繪製出紅色陰影。
 */
//////////////////////////////////////////////////////////////////

@shrewd class JunctionView extends View {

	private _junction: Junction;
	private _shade: paper.CompoundPath;

	constructor(junction: Junction) {
		super(junction);
		this._junction = junction;
		this.$addItem(Layer.$junction, this._shade = new paper.CompoundPath(Style.$junction));
	}

	protected $render(): void {
		this._shade.visible = this._junction.$status == JunctionStatus.tooClose;
		if(this._shade.visible) {
			let vm = this._junction.$design.$viewManager;
			let f1 = this._junction.f1, f2 = this._junction.f2;
			let v1 = vm.$get(f1) as FlapView, v2 = vm.$get(f2) as FlapView;
			let d = this._junction.$treeDistance - (f1.radius + f2.radius);
			let json = [v1.$circleJSON, v2.$circleJSON];
			if(d != 0) json.push(v1.$makeJSON(d), v2.$makeJSON(d));
			PaperWorker.$processJunction(this._shade, json);
		}
	}
}
