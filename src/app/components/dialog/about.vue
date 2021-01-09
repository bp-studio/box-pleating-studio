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
						<a target="_blank" href="https://github.com/MuTsunTsai/box-pleating-studio" v-t="'about.homepage'"></a>
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
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import { bp } from '../import/BPStudio';
	import { core } from './../core.vue';
	import * as bootstrap from 'bootstrap';

	declare const gtag: any;
	declare const app_config: any;

	@Component
	export default class About extends Vue {
		private modal: Bootstrap.Modal;
		private get copyright() { return core.copyright; }
		mounted() {
			this.modal = new bootstrap.Modal(this.$el);
		}
		public show() {
			this.modal.show();
			gtag('event', 'screen_view', { screen_name: 'About' });
		}
		public get version() {
			let meta = document.querySelector("meta[name=version]") as HTMLMetaElement;
			return meta.content + " build " + app_config.app_version;
		}
	}
</script>
