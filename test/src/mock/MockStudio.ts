/// <reference path="MockDisplay.ts" />
/// <reference path="MockViewManager.ts" />

@shrewd class MockStudio extends StudioBase {

	public onDeprecate(title?: string) { /* */ }

	public readonly $display: IDisplay = new MockDisplay();

	public readonly $viewManager: IViewManager = new MockViewManager();
}
