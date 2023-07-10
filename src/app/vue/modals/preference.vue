<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header d-flex">
					<div class="h4 modal-title" v-t="'toolbar.setting.preference'"></div>
					<div class="flex-grow-1 ps-5">
						<div class="d-none d-sm-block">
							<div class="nav nav-tabs position-relative" style="top: 1rem;">
								<button class="nav-link" :class="{ active: tab == 0 }" @click="tab = 0"
										v-t="'preference.general'"></button>
								<button class="nav-link" :class="{ active: tab == 1 }" @click="tab = 1"
										v-t="'preference.color._'"></button>
								<button class="nav-link" :class="{ active: tab == 2 }" @click="tab = 2"
										v-t="'preference.hotkey'"></button>
							</div>
						</div>
						<!--Tabs are too wide on mobile devices for some locales, so we used select box instead.
							It's possible to completely switch to select box if tabs keeps increasing in the future.-->
						<div class="d-block d-sm-none">
							<select class="form-select" v-model.number="tab">
								<option value="0" v-t="'preference.general'"></option>
								<option value="1" v-t="'preference.color._'"></option>
								<option value="2" v-t="'preference.hotkey'"></option>
							</select>
						</div>
					</div>
				</div>
				<div class="modal-body">
					<div v-show="tab == 0" class="p-2">
						<div class="row mb-2">
							<label class="col-form-label col-4" v-t="'preference.language'"></label>
							<div class="col-8">
								<select class="form-select flag" v-model="I18n.locale">
									<option v-for="l in I18n.availableLocales" :key="l" :value="l">
										{{ $t('emoji', l) }}&ensp;{{ $t('name', l) }}
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
						<Toggle v-model="Settings.autoSave">
							{{ $t('preference.autoSave') }}
						</Toggle>
						<Toggle v-if="isFileApiEnabled" v-model="Settings.loadSessionOnQueue">
							{{ $t('preference.loadSessionOnQueue') }}
						</Toggle>
						<Toggle v-model="Settings.includeHiddenElement">
							{{ $t('preference.includeHidden') }}
						</Toggle>
					</div>
					<div v-show="tab == 1" class="p-2 h-100">
						<div class="color-grid">
							<Color :default="Studio.style.border.color" v-model="Settings.colorScheme.border"
								   :label="$t('preference.color.border')" />
							<Color :default="Studio.style.grid.color" v-model="Settings.colorScheme.grid"
								   :label="$t('preference.color.grid')" />
							<Color :default="Studio.style.hinge.color" v-model="Settings.colorScheme.hinge"
								   :label="$t('preference.color.hinge')" />
							<Color :default="Studio.style.ridge.color" v-model="Settings.colorScheme.ridge"
								   :label="$t('preference.color.ridge')" />
							<Color :default="Studio.style.axisParallel.color" v-model="Settings.colorScheme.axialParallel"
								   :label="$t('preference.color.axisParallel')" />
						</div>
					</div>
					<!-- Use v-if to reset its state every time -->
					<div v-if="tab == 2" class="p-2 h-100">
						<KeyTable />
					</div>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1">
						<button class="btn btn-secondary" @click="reset()"><span v-t="'preference.reset'" /></button>
					</div>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { onMounted, shallowRef, watch } from "vue";

	import { isFileApiEnabled } from "app/shared/constants";
	import Studio from "app/services/studioService";
	import Settings, { reset } from "app/services/settingService";
	import Toggle from "@/gadgets/form/toggle.vue";
	import useModal from "./modal";
	import KeyTable from "./components/keyTable.vue";
	import Color from "./components/color.vue";

	defineOptions({ name: "Preference" });

	const { el, on, show } = useModal("Preference");

	const tab = shallowRef(0);
	const I18n = i18n;

	onMounted(() => {
		watch(on, v => {
			if(!v) tab.value = 0;
		});
	});

	defineExpose({ show });

</script>

<style scoped>
	.color-grid {
		display: grid;
		grid-template-columns: auto auto auto;
		gap: 0.5rem 1rem;
	}

	.modal-body {
		height: 400px;
		max-height: 40vh;
	}
</style>
