<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'toolbar.setting.preference'"></div>
				</div>
				<div class="modal-body">
					<div class="row mb-2">
						<label class="col-form-label col-4">{{$t('preference.language')}}</label>
						<div class="col-8">
							<select class="form-select" v-model="i18n.locale">
								<option v-for="l in i18n.availableLocales" :key="l" :value="l" v-t="{path:'name',locale:l}"></option>
							</select>
						</div>
					</div>
					<checkbox :label="$t('preference.autoSave')" v-model="core.autoSave" @input="core.saveSettings()"></checkbox>
					<checkbox
						v-if="core.initialized"
						:label="$t('preference.includeHidden')"
						v-model="display.includeHiddenElement"
						@input="core.saveSettings()"
					></checkbox>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';
	import { bp } from '../import/BPStudio';
	import { core } from '../core.vue';
	import * as bootstrap from 'bootstrap';

	declare const i18n: any;
	declare const gtag: any;

	@Component
	export default class Preference extends Vue {
		private modal: bootstrap.Modal;
		protected get i18n() { return i18n; }
		protected get core() { return core; }
		protected get display(): any { return core.initialized ? bp.settings : {}; }

		mounted() {
			core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el));
		}

		public async show() {
			await core.libReady;
			this.modal.show();
			var bt = this.$el.querySelector("[data-bs-dismiss]") as HTMLButtonElement;
			this.$el.addEventListener('shown.bs.modal', () => bt.focus(), { once: true });
			gtag('event', 'screen_view', { screen_name: 'Preference' });
		}
	}
</script>
