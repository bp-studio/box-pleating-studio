<template>
	<div class="flex-grow-1 tab-container" @wheel.passive="tabWheel($event)" role="tablist">
		<SlickList lockAxis="x" axis="x" v-model:list="Workspace.ids.value" :distance="10" id="divTab"
				   :class="{ 'hide': !Workspace.ids.value.length }" @sort-start="setCursor('ew-resize')"
				   @sort-end="setCursor('default')">
			<SlickItem v-for="(id, i) in Workspace.ids.value" :key="id" :index="i" class="tab"
					   :class="{ active: Studio.project?.id == id }">
				<Tab :id="id" @menu="contextMenu($event, id)" />
			</SlickItem>
		</SlickList>
	</div>
	<TabMenu ref="tabMenu" />
</template>

<script setup lang="ts">

	import { SlickList, SlickItem } from "vue-slicksort";

	import { compRef } from "app/utils/compRef";
	import Workspace from "app/services/workspaceService";
	import Studio from "app/services/studioService";
	import Tab from "./tab.vue";
	import TabMenu from "./tabMenu.vue";

	import type { ProjId } from "shared/json";

	defineOptions({ name: "TabBar" });

	const tabMenu = compRef(TabMenu);
	const DELTA_UNIT = 5;

	function tabWheel(event: WheelEvent): void {
		if(event.deltaX == 0) {
			document.getElementById("divTab")!.scrollLeft -= event.deltaY / DELTA_UNIT;
		}
	}

	function setCursor(cursor: string): void {
		document.getElementById("divTab")!.style.cursor = cursor;
	}

	function contextMenu(event: MouseEvent, id: ProjId): void {
		event.preventDefault();
		tabMenu.value!.show(event, id);
	}

</script>
