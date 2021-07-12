<template>
	<div style="display:contents">
		<div id="divTab" class="flex-grow-1" @wheel="tabWheel($event)" ref="tab" v-if="ready">
			<draggable v-bind="dragOption" v-model="core.designs">
				<div
					class="tab"
					:class="{active:design==getDesign(id)}"
					v-for="id in core.designs"
					:key="id"
					:id="`tab${id}`"
					@click="core.projects.select(id)"
				>
					<div class="tab-close" :title="getTooltip(id)" @contextmenu="tabMenu($event, id)">
						<div>
							<span v-if="isModified(id)">*</span>
							{{getTitle(id)}}
						</div>
						<div class="ps-2 pt-1" @click.stop="core.projects.close(id)" @pointerdown.stop @mousedown.stop>
							<div class="close">
								<i class="fas fa-times"></i>
							</div>
						</div>
					</div>
					<div class="tab-down" :title="getTooltip(id)">
						<div>
							<span v-if="isModified(id)">*</span>
							{{getTitle(id)}}
						</div>
						<div class="px-2" @click.stop="tabMenu($event, id)" @pointerdown.stop @touchstart.stop>
							<i class="fas fa-caret-down"></i>
						</div>
					</div>
				</div>
			</draggable>
		</div>
		<div id="divTab" class="flex-grow-1" v-else></div>

		<contextmenu ref="tabMenu">
			<div class="dropdown-item" @click="core.projects.clone(menuId)">
				<i class="far fa-clone"></i>
				{{$t('toolbar.tab.clone')}}
			</div>
			<divider></divider>
			<div class="dropdown-item" @click="core.projects.close(menuId)">
				<i class="far fa-window-close"></i>
				{{$t('toolbar.tab.close')}}
			</div>
			<div class="dropdown-item" @click="core.projects.closeOther(menuId)">
				<i class="far fa-window-close"></i>
				{{$t('toolbar.tab.closeOther')}}
			</div>
			<div class="dropdown-item" @click="core.projects.closeRight(menuId)">
				<i class="far fa-window-close"></i>
				{{$t('toolbar.tab.closeRight')}}
			</div>
			<div class="dropdown-item" @click="core.projects.closeAll()">
				<i class="far fa-window-close"></i>
				{{$t('toolbar.tab.closeAll')}}
			</div>
		</contextmenu>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import { Design } from '../import/BPStudio';

	import BaseComponent from '../mixins/baseComponent';
	import ContextMenu from '../gadget/menu/contextmenu.vue';

	@Component
	export default class Tabs extends BaseComponent {

		protected ready: boolean = false;

		mounted(): void {
			libReady.then(() => this.ready = true);
		}

		protected get dragOption(): object {
			return {
				delay: 500,
				delayOnTouchOnly: true,
				touchStartThreshold: 20,
				animation: 200,
				forceFallback: true,
				direction: "horizontal",
				scroll: true,
			};
		}
		protected get core(): typeof core { return core; }

		protected tabWheel(event: WheelEvent): void {
			const DELTA_UNIT = 5;
			if(event.deltaX == 0) {
				(this.$refs.tab as HTMLDivElement).scrollLeft -= event.deltaY / DELTA_UNIT;
			}
		}

		protected menuId: number;
		protected tabMenu(event: MouseEvent, id: number): void {
			this.menuId = id;
			(this.$refs.tabMenu as ContextMenu).show(event);
		}

		protected isModified(id: number): boolean {
			return this.bp.isModified(this.getDesign(id));
		}
		public getDesign(id: number): Design {
			return this.bp.getDesign(id)!;
		}
		public getTitle(id: number): string {
			let title = this.getDesign(id).title;
			return title ? title : this.$t('toolbar.tab.noTitle').toString();
		}
		public getTooltip(id: number): string {
			let result = this.getDesign(id).title;
			let handle = core.handles.get(id);
			if(handle) result += "\n" + handle.name;
			return result;
		}
	}
</script>

<style>
	#divTab::-webkit-scrollbar {
		display: none;
	}

	#divTab {
		overflow-x: scroll;
		overflow-y: visible;
		-ms-overflow-style: none;
		scrollbar-width: none;
		margin: -0.5rem 0.5rem;
		height: 3.75rem;
		white-space: nowrap;
	}

	#divTab,
	#divTab * {
		touch-action: pan-x;
	}

	#divTab > div {
		position: relative;
		height: 100%;
	}

	.tab {
		padding: 0.5rem;
		flex-shrink: 0;
		font-size: 1.25rem;
		line-height: 2.5rem;
		border-right: 1px solid gray;
		cursor: default;
		max-width: 150px;
		height: 100%;
		background-color: var(--bg-ui);
		display: inline-block;
	}

	.tab:first-child {
		border-left: 1px solid gray;
	}

	.tab :first-child {
		flex-grow: 1;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.tab :last-child {
		flex-shrink: 0;
	}

	.tab i {
		cursor: pointer;
		transition: opacity 0.1s linear;
		opacity: 0;
		width: 1rem;
		text-align: center;
	}

	.tab.active {
		background-color: #999;
		color: black;
	}

	.tab:hover i {
		opacity: 1;
	}

	.tab-down {
		display: none;
	}

	.tab-close {
		display: flex;
	}

	.tab-close .close {
		border-radius: 5px;
		display: inline-block;
		height: 1.75rem;
		width: 1.75rem;
		padding: 0.3rem;
		margin-top: 0.15rem;
		line-height: 1;
		text-align: center;
		transition: background-color 0.1s linear;
	}

	.tab-close .close:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}

	@media (hover: hover) {
		.tab:not(:hover):not(.active) {
			color: #444;
		}
	}

	@media (hover: none), (pointer: coarse) {
		.tab .tab-down i {
			opacity: 0;
		}
		.tab-down {
			display: flex;
		}
		.tab-close {
			display: none;
		}
	}

	@media (max-width: 650px) {
		#divTab {
			position: absolute;
			top: 3.75rem;
			left: 0;
			margin: 0;
			width: 100vw;
			height: 2.4rem;
			background: var(--bg-ui);
			border-top: 1px solid gray;
		}
		.tab {
			line-height: 2rem;
			font-size: 1rem;
			padding: 0.2rem 0.5rem;
		}
		.tab-close .close {
			height: 1.5rem;
			width: 1.5rem;
			padding: 0.25rem;
			margin-top: 0;
		}
		.tab:first-child {
			border-left: none;
		}
		#panelToggle {
			flex-grow: 1;
			text-align: right;
		}
	}
</style>
