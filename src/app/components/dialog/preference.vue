<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4" v-if="initialized">
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
	import { Component } from 'vue-property-decorator';
	import Modal from '../mixins/modal';

	import { DisplaySetting, bp } from '../import/BPStudio';

	@Component
	export default class Preference extends Modal {
		protected getScreenName(): string { return 'Preference'; }

		protected get i18n(): typeof i18n { return i18n; }
		protected get core(): typeof core { return core; }
		protected get display(): null | DisplaySetting {
			return core.initialized ? bp.settings : null;
		}

		protected onLocaleChanged(): void {
			localStorage.setItem("locale", i18n.locale);
			document.documentElement.lang = i18n.locale;
		}
	}
</script>
