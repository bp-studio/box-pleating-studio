
class MockViewManager implements IViewManager {
	$contains(object: object, point: paper.Point): boolean {
		return false;
	}
	$createView(object: object): void { /* */ }

	$get(object: object): View | null {
		return null;
	}
}
