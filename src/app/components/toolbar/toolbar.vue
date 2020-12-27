<template>
	<div id="divToolbar" class="btn-toolbar p-2">
		<div class="btn-group mr-2">
			<filemenu @share="$emit('share')"></filemenu>
			<settingmenu @pref="$emit('pref')"></settingmenu>
			<dropdown icon="fas fa-layer-group" :title="$t('toolbar.project.title')">
				<template v-if="core.designs.length">
					<div class="dropdown-item" @click="core.clone()">
						<i class="far fa-clone"></i>
						{{$t('toolbar.project.clone')}}
					</div>
					<divider></divider>
					<div class="dropdown-item" v-for="id in core.designs" :key="id" @click="core.select(id)">
						<i v-if="design==getDesign(id)" class="fas fa-check"></i>
						<i v-else></i>
						{{getTitle(id)}}
					</div>
					<divider></divider>
					<div class="dropdown-item" @click="core.close()">
						<i class="far fa-window-close"></i>
						{{$t('toolbar.project.close')}}
					</div>
					<div class="dropdown-item" @click="core.closeAll()">
						<i class="far fa-window-close"></i>
						{{$t('toolbar.project.closeAll')}}
					</div>
				</template>
				<dropdownitem v-else disabled v-t="'toolbar.project.empty'"></dropdownitem>
			</dropdown>
			<dropdown icon="far fa-question-circle" :title="$t('toolbar.help.title')">
				<div class="dropdown-item" @click="$emit('about')">
					<i class="bp-info"></i>
					{{$t('toolbar.help.about')}}
				</div>
				<divider></divider>
				<a class="dropdown-item" href="donate.htm" target="_blank">
					<i class="fas fa-hand-holding-usd"></i>
					{{$t('toolbar.help.donation')}}
				</a>
			</dropdown>
		</div>

		<div class="btn-group mr-2">
			<button
				type="button"
				class="btn btn-primary"
				:class="{active:design&&design.mode=='tree'}"
				@click="toTree"
				:title="$t('toolbar.view.tree')"
				:disabled="!design"
			>
				<i class="bp-tree"></i>
			</button>
			<button
				type="button"
				class="btn btn-primary"
				:class="{active:design&&design.mode=='layout'}"
				@click="toLayout"
				:title="$t('toolbar.view.layout')"
				:disabled="!design"
			>
				<i class="bp-layout"></i>
			</button>
		</div>

		<div id="divTab" class="flex-grow-1" @wheel="tabWheel($event)" ref="tab">
			<draggable v-bind="dragOption" v-model="core.designs">
				<div
					class="tab"
					:class="{active:design==getDesign(id)}"
					v-for="id in core.designs"
					:key="id"
					:id="`tab${id}`"
					@click="core.select(id)"
				>
					<div class="d-none d-sm-flex" :title="getDesign(id).title" @contextmenu="tabMenu($event, id)">
						<div>{{getTitle(id)}}</div>
						<div class="px-2" @click.stop="core.close(id)">
							<i class="fas fa-times"></i>
						</div>
					</div>
					<div class="d-flex d-sm-none" :title="getDesign(id).title">
						<div>{{getTitle(id)}}</div>
						<div class="px-2" @click.stop="tabMenu($event, id)">
							<i class="fas fa-caret-down"></i>
						</div>
					</div>
				</div>
			</draggable>
		</div>
		<contextmenu ref="tabMenu">
			<div class="dropdown-item" @click="core.clone(menuId)">
				<i class="far fa-clone"></i>
				{{$t('toolbar.tab.clone')}}
			</div>
			<divider></divider>
			<div class="dropdown-item" @click="core.close(menuId)">
				<i class="far fa-window-close"></i>
				{{$t('toolbar.tab.close')}}
			</div>
			<div class="dropdown-item" @click="core.closeOther(menuId)">
				<i class="far fa-window-close"></i>
				{{$t('toolbar.tab.closeOther')}}
			</div>
			<div class="dropdown-item" @click="core.closeRight(menuId)">
				<i class="far fa-window-close"></i>
				{{$t('toolbar.tab.closeRight')}}
			</div>
			<div class="dropdown-item" @click="core.closeAll()">
				<i class="far fa-window-close"></i>
				{{$t('toolbar.tab.closeAll')}}
			</div>
		</contextmenu>

		<div class="btn-group" id="panelToggle">
			<button
				type="button"
				class="btn btn-primary"
				@click="$emit('panel')"
				:title="$t('toolbar.panel')"
				:disabled="!design"
			>
				<i class="fas fa-sliders-h"></i>
			</button>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import { bp, Design } from '../import/BPStudio';
	import { core } from '../core.vue';
	import $ from 'jquery/index';

	import BaseComponent from '../mixins/baseComponent';
	import ContextMenu from '../gadget/contextmenu.vue';

	@Component
	export default class Toolbar extends BaseComponent {
		private get dragOption() {
			return {
				delay: 500,
				delayOnTouchOnly: true,
				touchStartThreshold: 20,
				animation: 200,
				forceFallback: true,
				dirction: "horizontal",
				scroll: true
			};
		}
		private get core() { return core; }

		public toLayout() { this.design.mode = "layout"; }
		public toTree() { this.design.mode = "tree"; }

		private tabWheel(event: WheelEvent) {
			if(event.deltaX == 0) {
				(this.$refs.tab as HTMLDivElement).scrollLeft -= event.deltaY / 5;
			}
		}

		private menuId: number;
		private tabMenu(event: MouseEvent, id: number) {
			this.menuId = id;
			(this.$refs.tabMenu as ContextMenu).show(event);
		}

		public getDesign(id: number): Design {
			return bp.designMap.get(id)!;
		}
		public getTitle(id: number): string {
			let title = this.getDesign(id).title;
			return title ? title : this.$t('toolbar.project.noTitle');
		}
	}
</script>
