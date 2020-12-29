<template>
	<div id="app" v-on:mousedown.stop v-on:touchstart.stop>
		<toolbar
			@panel="showPanel=!showPanel"
			@share="show('share')"
			@about="show('about')"
			@news="show('ver')"
			@pref="show('pref')"
		></toolbar>
		<welcome v-if="!design"></welcome>
		<div id="divShade" :class="{'show':showPanel}" @mousedown="showPanel=false" @touchstart="showPanel=false"></div>
		<panel :show="showPanel"></panel>
		<share ref="share"></share>
		<about ref="about"></about>
		<version ref="ver"></version>>
		<preference ref="pref"></preference>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import { bp } from './import/BPStudio';
	import BaseComponent from './mixins/baseComponent';

	@Component
	export default class App extends BaseComponent {
		private showPanel = false;

		private show(el: string) {
			(this.$refs[el] as any).show();
		}

		created() {
			bp.system.onLongPress = () => this.showPanel = true;
			bp.system.onDrag = () => this.showPanel = false;
		}
	}
</script>
