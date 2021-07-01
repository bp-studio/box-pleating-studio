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
							<select class="form-select" v-model="i18n.locale" @change="onLocaleChanged">
								<option v-for="l in i18n.availableLocales" :key="l" :value="l" v-t="{path:'name',locale:l}"></option>
							</select>
						</div>
					</div>
					<checkbox :label="$t('preference.autoSave')" v-model="core.autoSave" @input="core.saveSettings()"></checkbox>
					<checkbox
						v-if="display"
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
	import { Component, Vue } from 'vue-property-decorator';

	import * as bootstrap from 'bootstrap';
	import { DisplaySetting, bp } from '../import/BPStudio';

	@Component
	export default class Preference extends Vue {
		private modal: bootstrap.Modal;
		protected get i18n(): typeof i18n { return i18n; }
		protected get core(): typeof core { return core; }
		protected get display(): null | DisplaySetting {
			return core.initialized ? bp.settings : null;
		}

		mounted(): void {
			core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el));
		}

		public async show(): Promise<void> {
			await core.libReady;
			this.modal.show();
			let bt = this.$el.querySelector("[data-bs-dismiss]") as HTMLButtonElement;
			this.$el.addEventListener('shown.bs.modal', () => bt.focus(), { once: true });
			gtag('event', 'screen_view', { screen_name: 'Preference' });
		}

		protected onLocaleChanged(): void {
			localStorage.setItem("locale", i18n.locale);
		}
	}
</script>
