
//////////////////////////////////////////////////////////////////
/**
 * DragSelectView 是繪製「拖曳選取框」的 View。
 */
//////////////////////////////////////////////////////////////////

@shrewd class DragSelectView extends View {

	private _rectangle: paper.Path;

	@shrewd public $visible: boolean = false;

	@shrewd public $down: paper.Point;

	@shrewd public $now: paper.Point;

	constructor(studio:BPStudio) {
		super(studio);
		this.$addItem(Layer.$drag, this._rectangle = new paper.Path.Rectangle(Style.$selection));
	}

	public $contains(point: paper.Point) {
		return this._rectangle.contains(point);
	}

	protected $render() {
		if(this._rectangle.visible = this.$visible) {
			let r = new paper.Path.Rectangle({
				from: this.$down,
				to: this.$now
			});
			this._rectangle.set({ segments: r.segments });
		}
	}
}
