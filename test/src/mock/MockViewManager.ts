
class MockViewManager implements IViewManager {
	$contains(target: Mountable, point: paper.Point): boolean {
		return false;
	}

	$createView(target: Mountable): void {
		// 不作任何動作
	}

	$get(target: Mountable): View | null {
		return null;
	}
}
