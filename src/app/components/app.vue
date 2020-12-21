<template>
	<div id="app" v-on:mousedown.stop v-on:touchstart.stop>
		<toolbar
			@panel="showPanel=!showPanel"
			@share="$refs.share.show()"
			@about="$refs.about.show()"
			@pref="$refs.pref.show()"
		></toolbar>
		<welcome v-if="!design"></welcome>
		<div id="divShade" :class="{'show':showPanel}" @mousedown="showPanel=false" @touchstart="showPanel=false"></div>
		<panel :show="showPanel"></panel>
		<share ref="share"></share>
		<about ref="about"></about>
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

		created() {
			bp.system.onLongPress = () => this.showPanel = true;
			bp.system.onDrag = () => this.showPanel = false;
		}
	}
</script>
