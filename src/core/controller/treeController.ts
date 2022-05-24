import { Design } from "core/design/design";
import { ResponseCode } from "core/routes/enum";
import Processor from "core/service/processor";

//=================================================================
/**
 * {@link TreeController} 模組是管理樹狀結構的操作。
 */
//=================================================================
namespace TreeController {

	/** 根據給定的資料初始化專案 */
	export function addLeaf(at: number, length: number): ResponseCode {
		if(length < 1 || !Number.isInteger(length)) return ResponseCode.operationRejected;
		Processor.registerTask(() => {
			Design.$instance.$tree.$addLeaf(at, length);
		});
		return ResponseCode.success;
	}

	export function removeLeaf(id: number): ResponseCode {
		const tree = Design.$instance.$tree;
		if(!tree.$nodes.has(id)) return ResponseCode.operationRejected;
		Processor.registerTask(() => {
			Design.$instance.$tree.$removeLeaf(id);
		});
		return ResponseCode.success;
	}
}

export default TreeController;
