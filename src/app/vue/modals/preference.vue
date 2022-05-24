<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header d-flex">
					<div class="h4 modal-title" v-t="'toolbar.setting.preference'"></div>
					<div class="flex-grow-1 ps-5">
						<div class="nav nav-tabs position-relative" style="top: calc(1rem + 1px);">
							<button class="nav-link" :class="{ active: tab == 0 }" @click="tab = 0"
									v-t="'preference.general'"></button>
							<button class="nav-link" :class="{ active: tab == 1 }" @click="tab = 1"
									v-t="'preference.hotkey'"></button>
						</div>
					</div>
				</div>
				<div class="modal-body" style="height: min(40vh, 400px);">
					<div v-show="tab == 0" class="p-2">
						<div class="row mb-2">
							<label class="col-form-label col-4" v-t="'preference.language'"></label>
							<div class="col-8">
								<select class="form-select" v-model="I18n.locale">
									<option v-for="l in I18n.availableLocales" :key="l" :value="l"
											v-t="{ path: 'name', locale: l }">
									</option>
								</select>
							</div>
						</div>
						<div class="row mb-2">
							<label class="col-form-label col-4" v-t="'preference.theme._'"></label>
							<div class="col-8">
								<select class="form-select" v-model="Settings.theme">
									<option value="system" v-t="'preference.theme.system'"></option>
									<option value="light" v-t="'preference.theme.light'"></option>
									<option value="dark" v-t="'preference.theme.dark'"></option>
								</select>
							</div>
						</div>
						<Toggle v-model="Settings.autoSave">{{ $t('preference.autoSave') }}</Toggle>
						<Toggle v-if="isFileApiEnabled" v-model="Settings.loadSessionOnQueue">
							{{ $t('preference.loadSessionOnQueue') }}
						</Toggle>
						<Toggle v-model="Settings.includeHiddenElement">{{ $t('preference.includeHidden') }}</Toggle>
					</div>
					<!-- 利用 v-if 來每次都重置狀態 -->
					<div v-if="tab == 1" class="p-2 h-100">
						<KeyTable />
					</div>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1">
						<button class="btn btn-secondary" @click="reset()">{{ $t('preference.reset') }}</button>
					</div>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	export default { name: "Preference" };
</script>

<script setup lang="ts">

	import { shallowRef, watch } from "vue";

	import { isFileApiEnabled } from "app/shared/constants";
	import Settings, { reset } from "app/services/settingService";
	import Toggle from "@/gadgets/form/toggle.vue";
	import useModal from "./modal";
	import KeyTable from "./components/keyTable.vue";

	const { el, on, show } = useModal("Preference");

	const tab = shallowRef(0);
	const I18n = i18n;

	watch(on, v => {
		if(!v) tab.value = 0;
	});

	defineExpose({ show });

</script>
