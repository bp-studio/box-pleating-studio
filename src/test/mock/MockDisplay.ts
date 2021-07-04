
class MockDisplay implements IDisplay {

	public $zoom(v: number): void {
		// 不作任何動作
	}

	public readonly $scale: number = 1;

	public readonly $settings: DisplaySetting = {
		showGrid: true,
		showHinge: true,
		showRidge: true,
		showAxialParallel: true,
		showLabel: true,
		showDot: true,
		includeHiddenElement: false,
	};
}
