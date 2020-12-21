
//////////////////////////////////////////////////////////////////
/**
 * 這個靜態類別提供了一些 paper.js 相關的工具。
 */
//////////////////////////////////////////////////////////////////

namespace PaperUtil {

	/** 提換掉一個 `paper.CompoundPath` 的內容。 */
	export function replaceContent(target: paper.CompoundPath, source: paper.PathItem, clone: boolean) {
		target.removeChildren();
		if(source instanceof paper.CompoundPath) target.copyContent(source);
		else {
			if(clone) source = source.clone({ insert: false });
			target.addChild(source);
		}
	}

	export function setRectangleSize(rect: paper.Path.Rectangle, width: number, height: number) {
		rect.segments[1].point.set(width, 0);
		rect.segments[2].point.set(width, height);
		rect.segments[3].point.set(0, height);
	}

	export function addLine(path: paper.CompoundPath, p1: Point, p2: Point) {
		path.moveTo(p1.toPaper());
		path.lineTo(p2.toPaper());
	}

	export const Black = new paper.Color('black');
	export const Red = new paper.Color('red');
}