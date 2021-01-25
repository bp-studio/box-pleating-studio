
abstract class LabeledView<T extends Control> extends ControlView<T> {

	protected abstract readonly _label: paper.PointText;

	@shrewd public get overflow() {
		if(this.disposed || !this.$studio) return 0;
		this.render();
		let result = 0, b = this._label.bounds;
		let w = this.$studio.$display.scale * this.control.sheet.width;
		let left = b.x, right = b.x + b.width;
		if(left < 0) result = -left;
		if(right > w) result = Math.max(result, right - w);
		return Math.ceil(result);
	}
}
