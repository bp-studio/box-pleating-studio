import { Component, Vue } from 'vue-property-decorator';

import * as bootstrap from 'bootstrap';
import CoreBase from './coreBase';

declare const core: CoreBase;

// @ts-ignore
@Component
export default abstract class Dialog<T> extends Vue {
	private modal: bootstrap.Modal;
	private last: Promise<unknown> = Promise.resolve();
	protected message: string;

	mounted(): void {
		core.libReady.then(() =>
			this.modal = new bootstrap.Modal(this.$el, { backdrop: 'static' })
		);
	}

	public async show(message?: string): Promise<T> {
		await core.libReady;
		let current = new Promise<T>(resolve => {
			this.last.then(() => {
				this.message = message || "";
				let handler = registerHotkeyCore(this.key.bind(this));
				this.resolve((v: T) => {
					unregisterHotkeyCore(handler);
					resolve(v);
				});
				this.modal.show();
			});
		});
		this.last = current;
		return await current;
	}

	protected close(): void {
		this.modal.hide();
	}

	protected abstract key(e: KeyboardEvent): void;

	protected abstract resolve(resolve: (v: T) => void): void;
}
