import { options } from "client/options";

const TIMEOUT = 750;

//=================================================================
/**
 * {@link LongPressController} 負責管理觸控長壓的行為。
 */
//=================================================================

export namespace LongPressController {

	let _timeout: number | undefined;

	/** 長壓設置 */
	export function $init(): void {
		if(options.onLongPress) _timeout = window.setTimeout(options.onLongPress, TIMEOUT);
	}

	/** 取消長壓；這個除了會在滑鼠或觸控放開時自動執行之外也可以手動呼叫 */
	export function $cancel(): void {
		if(_timeout !== undefined) window.clearTimeout(_timeout);
		_timeout = undefined;
	}
}
