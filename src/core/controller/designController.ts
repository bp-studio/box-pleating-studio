import { heightTask } from "core/design/tasks/height";
import { Design } from "core/design/design";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";

import type { JDesign } from "shared/json";

//=================================================================
/**
 * {@link DesignController} 模組是管理專案的生成的控制器。
 * 專案的棄置無須煩惱，因為是整個 worker 一起直接棄置。
 */
//=================================================================
namespace DesignController {

	/** 根據給定的資料初始化專案 */
	export function init(data: JDesign): void {
		if(DEBUG_ENABLED) console.time("Design initializing");
		Design.$create(data);
		for(const s of data.layout.stretches) {
			State.$stretchPrototypes.set(s.id, s);
		}
		Processor.$run(heightTask);
		if(DEBUG_ENABLED) console.timeEnd("Design initializing");
	}
}

export default DesignController;
