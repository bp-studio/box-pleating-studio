import { Design } from "core/design/design";
import { ResponseCode } from "core/routes/enum";
import Processor from "core/service/processor";

import type { JDesign } from "shared/json";

//=================================================================
/**
 * {@link DesignController} 模組是管理專案的生成的控制器。
 * 專案的棄置無須煩惱，因為是整個 worker 一起直接棄置。
 */
//=================================================================
namespace DesignController {

	/** 根據給定的資料初始化專案 */
	export function init(data: JDesign): ResponseCode {
		// 同一個 Core 裡面只能有一個 Design 的實例
		if(Design.$instance) return ResponseCode.operationRejected;
		Processor.registerTask(() => {
			Design.$create(data);
		});
		return ResponseCode.success;
	}

	export function json(): RecursivePartial<JDesign> {
		return Design.$instance.toJSON();
	}
}

export default DesignController;
