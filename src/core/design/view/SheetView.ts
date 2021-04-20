
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
		this.$addItem(Layer.$sheet, this._border);

		this._grid = new paper.CompoundPath(Style.$sheet);
		this.$addItem(Layer.$sheet, this._grid);
	}

	public $contains(point: paper.Point) {
		return this._border.contains(point);
	}

	protected $render() {
		let width = this._sheet.width;
		let height = this._sheet.height;

		PaperUtil.$setRectangleSize(this._border, width, height);

		this._grid.visible = this.$studio!.$display.$settings.showGrid;
		this._grid.removeChildren();
		for(let i = 1; i < height; i++) {
			PaperUtil.$addLine(this._grid, new paper.Point(0, i), new paper.Point(width, i));
		}
		for(let i = 1; i < width; i++) {
			PaperUtil.$addLine(this._grid, new paper.Point(i, 0), new paper.Point(i, height));
		}
	}
}
