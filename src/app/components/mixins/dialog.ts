import { Vue, Component } from 'vue-property-decorator';
import * as bootstrap from 'bootstrap';
import { registerHotkeyCore, unregisterHotkeyCore } from '../import/types';

declare const core: any;

@Component
export default abstract class Dialog<T> extends Vue {
	private modal: Bootstrap.Modal;
	private promise: Promise<T> = null;
	protected message: string

	mounted() {
		core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el, { backdrop: 'static' }));
	}

	public async show(message?: string): Promise<T> {
		await core.libReady;
		while(this.promise) await this.promise;
		this.message = message;
		return await (this.promise = this.run());
	}

	private run(): Promise<T> {
		let handler = registerHotkeyCore(this.key.bind(this));
		let p = new Promise<T>(resolve =>
			this.resolve((v: T) => {
				this.promise = null;
				unregisterHotkeyCore(handler);
				resolve(v);
			})
		);
		this.modal.show();
		return p;
	}

	protected close() {
		this.modal.hide();
	}

	protected abstract key(e: KeyboardEvent): void;

	protected abstract resolve(resolve: (v: T) => void): void;
}
