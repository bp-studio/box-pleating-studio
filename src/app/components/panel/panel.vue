<template>
	<div
		id="divPanel"
		class="scroll-shadow"
		:class="{'show':show}"
		ref="panel"
		v-on:contextmenu.stop="onContextMenu($event)"
	>
		<template v-if="design">
			<design v-if="selections.length==0" :key="bp.guid(design.sheet)"></design>
			<div v-else-if="selections.length==1" :key="bp.guid(selection)">
				<repository v-if="repository" :repository="repository"></repository>
				<component v-else :is="type.toLowerCase()"></component>
			</div>
			<div v-else>
				<flaps v-if="type=='Flap'"></flaps>
				<vertices v-if="type=='Vertex'"></vertices>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Watch } from 'vue-property-decorator';

	import BP from '../import/BPStudio';
	import BaseComponent from '../mixins/baseComponent';


	@Component
	export default class Panel extends BaseComponent {
		@Prop(Boolean) public show: boolean;

		public get repository(): BP.Repository {
			return core.initialized && this.bp.getRepository(this.selection);
		}

		public get type(): string | undefined {
			return core.initialized && this.bp.getType(this.selection);
		}


		@Watch("repository") repo(): void {
			// 確保 GC，不用採取動作
		}

		@Watch("design.mode") onModeChange(): void {
			let el = document.activeElement as HTMLElement;
			if(el && (this.$refs.panel as HTMLDivElement).contains(el)) el.blur();
		}

		protected onContextMenu(event: Event): void {
			if(!(event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement)) {
				event.preventDefault();
			}
		}
	}
</script>

<style>
	.panel-title {
		line-height: 1.5;
		white-space: nowrap;
	}

	.panel-grid {
		display: grid;
		grid-template-columns: minmax(4rem, max-content) 1fr;
		grid-gap: 0.5rem 1rem;
	}
</style>
