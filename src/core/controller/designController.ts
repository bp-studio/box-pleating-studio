import { Design } from "core/design/design";

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
		Design.$create(data);
	}

	export function json(): RecursivePartial<JDesign> {
		return Design.$instance.toJSON();
	}
}

export default DesignController;
