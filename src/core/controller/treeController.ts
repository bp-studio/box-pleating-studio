import { Design } from "core/design/design";

//=================================================================
/**
 * {@link TreeController} 模組是管理樹狀結構的操作。
 */
//=================================================================
namespace TreeController {

	/** 根據給定的資料初始化專案 */
	export function addLeaf(at: number, length: number): void {
		Design.$instance.$tree.$addLeaf(at, length);
	}

	export function removeLeaf(id: number): void {
		Design.$instance.$tree.$removeLeaf(id);
	}
}

export default TreeController;
