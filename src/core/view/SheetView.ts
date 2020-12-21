
@shrewd class SheetView extends View {

	private _border: paper.Path;
	private _grid: paper.CompoundPath;
	private _sheet: Sheet;

	constructor(sheet: Sheet) {
		super(sheet);
		this._sheet = sheet;

		this._border = new paper.Path.Rectangle({
			point: [0, 0],
			size: [0, 0],
			strokeWidth: 3,
		});
		this.$addItem(Layer.sheet, this._border);

		this._grid = new paper.CompoundPath(Style.sheet);
		this.$addItem(Layer.sheet, this._grid);
	}

	public contains(point: paper.Point) {
		return this._border.contains(point);
	}

	protected render() {
		if(!this.$studio) return;

		let width = this._sheet.width;
		let height = this._sheet.height;

		this._border.segments[0].point.set(0, height);
		this._border.segments[2].point.set(width, 0);
		this._border.segments[3].point.set(width, height);

		this._grid.visible = this.$studio?.$display.settings.showGrid;
		this._grid.removeChildren();

		for(let i = 1; i < height; i++) {
			this._grid.moveTo(new paper.Point(0, i));
			this._grid.lineTo(new paper.Point(width, i));
		}
		for(let i = 1; i < width; i++) {
			this._grid.moveTo(new paper.Point(i, 0));
			this._grid.lineTo(new paper.Point(i, height));
		}
	}
}
