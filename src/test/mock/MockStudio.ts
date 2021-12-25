import { MockViewManager } from "./MockViewManager";
import { JDesign } from "bp/content/json";
import { Design } from "bp/design";
import { StudioBase } from "bp/env";
import { IViewManager } from "bp/view";

@shrewd export class MockStudio extends StudioBase {

	public readonly $viewManager: IViewManager = new MockViewManager();

	public $historyManagerFactory(design: Design, data: JDesign): null {
		return null;
	}
}
