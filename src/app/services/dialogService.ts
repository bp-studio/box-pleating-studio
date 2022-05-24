
import { readonly } from "vue";

export function setup(d: typeof DialogService): void {
	Object.assign(DialogService, d);
}

//=================================================================
/**
 * {@link DialogService} 服務負責管理各種對話方塊
 */
//=================================================================
namespace DialogService {
	export let alert: (msg: string) => Promise<void>;
	export let confirm: (mgs: string) => Promise<boolean>;
	export let loader: {
		show: () => Promise<void>;
		hide: () => void;
	};
}

export default readonly(DialogService);
