import { Component, Vue } from 'vue-property-decorator';

import * as bootstrap from 'bootstrap';
import CoreBase from './coreBase';

declare const core: CoreBase;

@Component
export default abstract class Dialog<T> extends Vue {
	private modal: bootstrap.Modal;
	private promise: Promise<T> = null;
	protected message: string

	mounted(): void {
		core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el, { backdrop: 'static' }));
	}

	public async show(message?: string): Promise<T> {
		await core.libReady;
		// eslint-disable-next-line no-await-in-loop
		while(this.promise) await this.promise;
		this.message = message;
		return await (this.promise = this.run());
	}

	private run(): Promise<T> {
		let handler = registerHotkeyCore(this.key.bind(this));
		let p = new Promise<T>(resolve => {
			this.resolve((v: T) => {
				this.promise = null;
				unregisterHotkeyCore(handler);
				resolve(v);
			});
		});
		this.modal.show();
		return p;
	}

	protected close(): void {
		this.modal.hide();
	}

	protected abstract key(e: KeyboardEvent): void;

	protected abstract resolve(resolve: (v: T) => void): void;
}
