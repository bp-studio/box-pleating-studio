<template>
	<div id="divPanel" :class="{'show':show}" ref="panel" v-on:contextmenu.stop="onContextMenu($event)">
		<template v-if="design">
			<design v-if="selections.length==0" :key="design.sheet.guid"></design>
			<div v-else-if="selections.length==1" :key="selection.guid">
				<repository v-if="repository" :repository="repository"></repository>
				<component v-else :is="selection.type.toLowerCase()"></component>
			</div>
			<div v-else>
				<flaps v-if="selection.type=='Flap'"></flaps>
				<vertices v-if="selection.type=='Vertex'"></vertices>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
	import { Component, Watch, Prop } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Panel extends BaseComponent {
		@Prop(Boolean) public show: boolean;

		public get repository() {
			let s = this.selection;
			if(!s) return null;
			if(s.type == "Device") return s.pattern.configuration.repository;
			if(s.type == "Stretch") return s.repository;
			return null;
		}

		@Watch("design.mode") onModeChange() {
			let el = document.activeElement as HTMLElement;
			if(el && (this.$refs.panel as HTMLDivElement).contains(el)) el.blur();
		}

		private onContextMenu(event: Event) {
			if(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) { }
			else event.preventDefault();
		}
	}
</script>
