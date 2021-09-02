<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4" v-if="initialized">
				<div class="modal-header d-flex">
					<div class="h4 modal-title" v-t="'toolbar.setting.preference'"></div>
					<div class="flex-grow-1 ps-5">
						<div class="nav nav-tabs position-relative" style="top:calc(1rem + 1px)">
							<button class="nav-link" :class="{active:tab==0}" @click="tab=0" v-t="'preference.general'"></button>
							<button class="nav-link" :class="{active:tab==1}" @click="tab=1" v-t="'preference.hotkey'"></button>
						</div>
					</div>
				</div>
				<div class="modal-body" style="height:min(40vh, 400px);">
					<div v-show="tab==0" class="p-2">
						<div class="row mb-2">
							<label class="col-form-label col-4">{{$t('preference.language')}}</label>
							<div class="col-8">
								<select class="form-select" v-model="i18n.locale" @change="onLocaleChanged">
									<option v-for="l in i18n.availableLocales" :key="l" :value="l" v-t="{path:'name',locale:l}"></option>
								</select>
							</div>
						</div>
						<checkbox :label="$t('preference.autoSave')" v-model="core.settings.autoSave" @input="core.settings.save()"></checkbox>
						<checkbox
							v-if="display"
							:label="$t('preference.includeHidden')"
							v-model="display.includeHiddenElement"
							@input="core.settings.save()"
						></checkbox>
					</div>
					<!-- 利用 v-if 來每次都重置狀態 -->
					<div v-if="tab==1" class="p-2 h-100">
						<keytable></keytable>
					</div>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1">
						<button class="btn btn-secondary" @click="core.settings.reset()">{{$t('preference.reset')}}</button>
					</div>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Watch } from 'vue-property-decorator';
	import Modal from '../mixins/modal';

	import { DisplaySetting, bp } from '../import/BPStudio';

	@Component
	export default class Preference extends Modal {
		protected getScreenName(): string { return 'Preference'; }

		protected tab: number = 0;

		@Watch('on') onShown(v: boolean): void {
			if(!v) this.tab = 0;
		}

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
