<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'about.title'"></div>
				</div>
				<div class="modal-body">
					<p>{{copyright}}</p>
					<p v-t="'about.license'"></p>
					<i18n path="about.visit" tag="p">
						<a target="_blank" rel="noopener" href="https://github.com/MuTsunTsai/box-pleating-studio" v-t="'about.homepage'"></a>
					</i18n>
					<i18n path="about.visitBlog" tag="p">
						<a target="_blank" rel="noopener" href="https://origami.abstreamace.com/" v-t="'about.blog'"></a>
					</i18n>
					<i18n path="about.donation" tag="p">
						<a target="_blank" href="donate.htm">PayPal</a>
					</i18n>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1">{{$t('keyword.version')}} {{version}}</div>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	import * as bootstrap from 'bootstrap';

	declare const app_config: Record<string, unknown>;

	@Component
	export default class About extends Vue {
		private modal: bootstrap.Modal;
		protected get copyright(): string { return core.copyright; }

		mounted(): void {
			libReady.then(() => this.modal = new bootstrap.Modal(this.$el));
		}

		public async show(): Promise<void> {
			await libReady;
			this.modal.show();
			let bt = this.$el.querySelector("[data-bs-dismiss]") as HTMLButtonElement;
			this.$el.addEventListener('shown.bs.modal', () => bt.focus(), { once: true });
			gtag('event', 'screen_view', { screen_name: 'About' });
		}

		public get version(): string {
			let meta = document.querySelector("meta[name=version]") as HTMLMetaElement;
			return meta.content + " build " + app_config.app_version;
		}
	}
</script>
