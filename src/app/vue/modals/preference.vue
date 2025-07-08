<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header d-flex">
					<div class="h4 modal-title">{{ $t("toolbar.setting.preference") }}</div>
					<div class="flex-grow-1 ps-5">
						<div class="d-none d-sm-block">
							<div class="nav nav-tabs position-relative" style="top: 1rem;">
								<button class="nav-link" :class="{ active: tab == 0 }" @click="tab = 0">{{
									$t("preference.general") }}</button>
								<button class="nav-link" :class="{ active: tab == 1 }" @click="tab = 1">{{
									$t("preference.color._") }}</button>
								<button class="nav-link" :class="{ active: tab == 2 }" @click="tab = 2">{{ $t("preference.hotkey")
								}}</button>
							</div>
						</div>
						<!--
							Tabs are too wide on mobile devices for some locales, so we used select box instead.
							It's possible to completely switch to select box if tabs keeps increasing in the future.
						-->
						<div class="d-block d-sm-none">
							<select class="form-select" v-model.number="tab">
								<option value="0">{{ $t("preference.general") }}</option>
								<option value="1">{{ $t("preference.color._") }}</option>
								<option value="2">{{ $t("preference.hotkey") }}</option>
							</select>
						</div>
					</div>
				</div>
				<div class="modal-body" style="height: 400px; max-height: 40vh;">
					<div v-show="tab == 0" class="p-2">
						<div class="row mb-2">
							<label class="col-form-label col-4">{{ $t("preference.language") }}</label>
							<div class="col-8">
								<!--
									Note that showing flags requires COLR/CPAL(v0) support, see https://caniuse.com/colr
									There is a feature-detection library at https://github.com/RoelN/ChromaCheck,
									but the detecting result appears inconsistent with the actual support
									(especially on Opera), so I decided to not include the detection for now.
									The worst that can happen is missing flags in the select box,
									and only in very old browsers.
								-->
								<select class="form-select flag" v-model="$i18n.locale" aria-label="Language">
									<option v-for="l in $i18n.availableLocales" :key="l" :value="l">
										{{ $t('emoji', {}, { locale: l }) }}&ensp;{{ $t('name', {}, { locale: l }) }}
									</option>
								</select>
							</div>
						</div>
						<div class="row mb-2">
							<label class="col-form-label col-4">{{ $t("preference.theme._") }}</label>
							<div class="col-8">
								<select class="form-select" v-model="Settings.theme">
									<option value="system">{{ $t("preference.theme.system") }}</option>
									<option value="light">{{ $t("preference.theme.light") }}</option>
									<option value="dark">{{ $t("preference.theme.dark") }}</option>
								</select>
							</div>
						</div>
						<Toggle v-model="Settings.autoSave">
							{{ $t('preference.autoSave') }}
						</Toggle>
						<template v-if="isFileApiEnabled">
							<Toggle v-model="Settings.useFileSystem">
								<template v-slot:append><Help :title="$t('help.useFileSystem')" /></template>
								{{ $t('preference.useFileSystem') }}
							</Toggle>
							<Toggle v-model="Settings.loadSessionOnQueue">
								{{ $t('preference.loadSessionOnQueue') }}
							</Toggle>
						</template>
						<Toggle v-model="Settings.tools.SVG.includeHiddenElement">
							{{ $t('preference.includeHidden') }}
						</Toggle>
					</div>
					<div v-if="phase >= 10" v-show="tab == 1" class="p-2 h-100">
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
							<Color :default="Studio.style.junction.color" v-model="Settings.colorScheme.junction"
								:label="$t('preference.color.overlap')" />
							<Color :default="Studio.style.dot.fill" v-model="Settings.colorScheme.dot"
								:label="$t('preference.color.tip')" />
							<Color :default="Studio.style.label.color" v-model="Settings.colorScheme.label"
								:label="$t('preference.color.label')" />
						</div>
					</div>
					<!-- Use v-if to reset its state every time -->
					<div v-if="tab == 2" class="p-2 h-100">
						<KeyTable />
					</div>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1">
						<button class="btn btn-secondary" @click="reset()">{{ $t("preference.reset") }}</button>
					</div>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal">{{ $t("keyword.ok") }}</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { onMounted, shallowRef, watch } from "vue";

	import { phase } from "app/misc/phase";
	import { isFileApiEnabled } from "app/shared/constants";
	import Studio from "app/services/studioService";
	import Settings, { reset } from "app/services/settingService";
	import Toggle from "@/gadgets/form/toggle.vue";
	import useModal from "./modal";
	import KeyTable from "./components/keyTable.vue";
	import Color from "./components/color.vue";
	import Help from "@/gadgets/help.vue";

	defineOptions({ name: "Preference" });

	const { el, on, show } = useModal("Preference");

	const tab = shallowRef(0);

	onMounted(() => {
		watch(on, v => {
			if(!v) tab.value = 0;
		});
	});

	defineExpose({ show });

</script>
