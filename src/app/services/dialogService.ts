import type { JProject } from "shared/json";

export function setup(d: Partial<typeof DialogService>): void {
	Object.assign(DialogService, d);
}

//=================================================================
/**
 * {@link DialogService} manages dialogs.
 */
//=================================================================
namespace DialogService {
	export let alert: (msg: string) => Promise<void>;
	export let error: (log?: JProject) => Promise<void>;
	export let confirm: (mgs: string) => Promise<boolean>;
	export let loader: {
		show: () => Promise<void>;
		hide: () => void;
	};
}

export default <Readonly<typeof DialogService>>DialogService;
