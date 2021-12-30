<template>
	<dropdown icon="bp-tasks" :title="$t('toolbar.setting.title')">
		<template v-slot>
			<fullscreen></fullscreen>
			<div class="dropdown-item" @click="toggle('showGrid')">
				<hotkey :icon="settings.showGrid?'fas fa-grip-lines text-secondary':''" ctrl hk="1">{{$t('toolbar.setting.grid')}}</hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showHinge')">
				<hotkey :icon="settings.showHinge?'fas fa-grip-lines text-primary':''" ctrl hk="2">{{$t('toolbar.setting.hinge')}}</hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showRidge')">
				<hotkey :icon="settings.showRidge?'fas fa-grip-lines text-danger':''" ctrl hk="3">{{$t('toolbar.setting.ridge')}}</hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showAxialParallel')">
				<hotkey
					:icon="settings.showAxialParallel?'fas fa-grip-lines text-success':''"
					ctrl
					hk="4"
				>{{$t('toolbar.setting.axial')}}</hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showLabel')">
				<hotkey :icon="settings.showLabel?'fas fa-font':''" ctrl hk="5">{{$t('toolbar.setting.label')}}</hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showDot')">
				<hotkey :icon="settings.showDot?'fas fa-genderless':''" ctrl hk="6">{{$t('toolbar.setting.tip')}}</hotkey>
			</div>
			<div class="touch-only">
				<divider></divider>
				<div class="dropdown-item" @click="toggle('showDPad', core.settings)">
					<i v-if="!core.settings.showDPad"></i>
					<i class="fas fa-arrows-alt" v-else></i>
					{{$t('toolbar.setting.dPad')}}
				</div>
			</div>
			<divider></divider>
			<div class="dropdown-item" @click="$emit('pref')">
				<i class="fas fa-cog"></i>
				{{$t('toolbar.setting.preference')}}
			</div>
		</template>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BaseComponent from '../mixins/baseComponent';
	import { DisplaySetting } from '../import/BPStudio';
	import Settings from '../core/settings.vue';

	@Component
	export default class SettingMenu extends BaseComponent {
		private get settings(): Partial<DisplaySetting> {
			return core.initialized ? this.bp.settings : {};
		}

		protected get core(): typeof core { return core; }

		mounted(): void {
			registerHotkey(() => this.toggle('showGrid'), "1");
			registerHotkey(() => this.toggle('showHinge'), "2");
			registerHotkey(() => this.toggle('showRidge'), "3");
			registerHotkey(() => this.toggle('showAxialParallel'), "4");
			registerHotkey(() => this.toggle('showLabel'), "5");
			registerHotkey(() => this.toggle('showDot'), "6");
		}

		protected toggle(key: string, target?: DisplaySetting | ISettings): void {
			if(!target) target = this.settings as DisplaySetting;
			target[key] = !target[key];
			core.settings.save();

			if(key == "showDPad") gtag('event', 'dpad_' + (target[key] ? "on" : "off"));
		}
	}
</script>
