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
							<select class="form-control" v-model="i18n.locale">
								<option v-for="l in i18n.availableLocales" :key="l" :value="l" v-t="{path:'name',locale:l}"></option>
							</select>
						</div>
					</div>
					<field :label="$t('preference.autoSave')" type="checkbox" v-model="core.autoSave" @input="core.saveSettings()"></field>
					<field
						:label="$t('preference.includeHidden')"
						type="checkbox"
						v-model="display.includeHiddenElement"
						@input="core.saveSettings()"
					></field>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Watch } from 'vue-property-decorator';
	import { bp, Design } from '../import/BPStudio';
	import { core } from '../core.vue';
	import * as bootstrap from 'bootstrap';

	declare const i18n: any;
	declare const gtag: any;

	@Component
	export default class Preference extends Vue {
		private modal: Bootstrap.Modal;
		private get i18n() { return i18n; }
		private get core() { return core; }
		private get display() { return bp.$display.settings; }

		mounted() {
			this.modal = new bootstrap.Modal(this.$el);
		}

		public show() {
			this.modal.show();
			gtag('event', 'screen_view', { screen_name: 'Preference' });
		}
	}
</script>
