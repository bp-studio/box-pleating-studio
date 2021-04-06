<template>
	<dropdown icon="bp-tasks" :title="$t('toolbar.setting.title')">
		<fullscreen></fullscreen>
		<div class="dropdown-item" @click="toggle('showGrid')">
			<i v-if="!settings.showGrid"></i>
			<i class="fas fa-grip-lines text-secondary" v-else></i>
			{{$t('toolbar.setting.grid')}}
		</div>
		<div class="dropdown-item" @click="toggle('showHinge')">
			<i v-if="!settings.showHinge"></i>
			<i class="fas fa-grip-lines text-primary" v-else></i>
			{{$t('toolbar.setting.hinge')}}
		</div>
		<div class="dropdown-item" @click="toggle('showRidge')">
			<i v-if="!settings.showRidge"></i>
			<i class="fas fa-grip-lines text-danger" v-else></i>
			{{$t('toolbar.setting.ridge')}}
		</div>
		<div class="dropdown-item" @click="toggle('showAxialParallel')">
			<i v-if="!settings.showAxialParallel"></i>
			<i class="fas fa-grip-lines text-success" v-else></i>
			{{$t('toolbar.setting.axial')}}
		</div>
		<div class="dropdown-item" @click="toggle('showLabel')">
			<i v-if="!settings.showLabel"></i>
			<i class="fas fa-font" v-else></i>
			{{$t('toolbar.setting.label')}}
		</div>
		<div class="dropdown-item" @click="toggle('showDot')">
			<i v-if="!settings.showDot"></i>
			<i class="fas fa-genderless" v-else></i>
			{{$t('toolbar.setting.tip')}}
		</div>
		<div class="touch-only">
			<divider></divider>
			<div class="dropdown-item" @click="toggle('showDPad', core)">
				<i v-if="!core.showDPad"></i>
				<i class="fas fa-arrows-alt" v-else></i>
				{{$t('toolbar.setting.dPad')}}
			</div>
		</div>
		<divider></divider>
		<div class="dropdown-item" @click="$emit('pref')">
			<i class="fas fa-cog"></i>
			{{$t('toolbar.setting.preference')}}
		</div>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import { bp } from '../import/BPStudio';
	import { core } from '../core.vue';
	import BaseComponent from '../mixins/baseComponent';

	declare const gtag: any;

	@Component
	export default class SettingMenu extends BaseComponent {
		private get settings(): any {
			return core.initialized ? bp.display.settings : {};
		}

		protected get core() { return core; }

		protected toggle(key: string, target: any) {
			if(!target) target = this.settings;
			target[key] = !target[key];
			core.saveSettings();

			if(key == "showDPad") gtag('event', 'dpad_' + (target[key] ? "on" : "off"));
		}
	}
</script>
