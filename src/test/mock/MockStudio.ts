/// <reference path="MockDisplay.ts" />
/// <reference path="MockViewManager.ts" />

@shrewd class MockStudio extends StudioBase {

	public readonly $display: IDisplay = new MockDisplay();

	public readonly $viewManager: IViewManager = new MockViewManager();

	public $historyManagerFactory(design: Design, data: JDesign) {
		return null;
	}
}
