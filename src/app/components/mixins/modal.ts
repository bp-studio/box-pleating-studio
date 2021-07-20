import { Component, Vue } from 'vue-property-decorator';

import * as bootstrap from 'bootstrap';

// @ts-ignore
@Component
export default abstract class Modal extends Vue {
	protected modal: bootstrap.Modal;
	protected initialized: boolean = false;

	mounted(): void {
		libReady.then(() => this.modal = new bootstrap.Modal(this.getModelElement()));
	}

	public async show(): Promise<void> {
		await libReady;
		this.initialized = true;
		if(!await this.onBeforeShow()) return;
		this.$el.addEventListener('shown.bs.modal', () => {
			let bt = this.getFocusButton();
			if(bt) bt.focus();
		}, { once: true });
		this.modal.show();
		gtag('event', 'screen_view', { screen_name: this.getScreenName() });
	}

	protected onBeforeShow(): boolean | Promise<boolean> {
		return true;
	}

	protected getModelElement(): Element {
		return this.$el;
	}

	protected getFocusButton(): HTMLButtonElement {
		return this.$el.querySelector("[data-bs-dismiss]") as HTMLButtonElement;
	}

	protected abstract getScreenName(): string;
}
