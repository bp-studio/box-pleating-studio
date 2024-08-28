
import type { ComponentPublicInstance } from "vue";

export interface IShow extends ComponentPublicInstance {
	show(): void;
}

export const modals: Record<string, IShow> = {};

export async function show(key: string): Promise<void> {
	(await getModal(key)).show();
}

/** Just in case the modal is called too early. */
function getModal(key: string): Promise<IShow> {
	return new Promise(resolve => {
		if(modals[key]) resolve(modals[key]);
		const int = setInterval(() => {
			if(modals[key]) {
				clearInterval(int);
				resolve(modals[key]);
			}
		}, 1);
	});
}
