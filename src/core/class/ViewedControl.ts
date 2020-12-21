
//////////////////////////////////////////////////////////////////
/**
 * `ViewedControl` 是一個具有 `View` 的 `Control`。
 * 
 * 不一定每一個 `Control` 都有自己專屬的 View；`Stretch` 是一個例外。
 */
//////////////////////////////////////////////////////////////////

abstract class ViewedControl extends Control {

	public abstract readonly view: View;

	public contains(point: paper.Point) {
		this.view.draw();
		return this.view.contains(point);
	}
}