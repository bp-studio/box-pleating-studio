<template>
	<div :id="`tab${id}`" role="tab" @mousedown="Workspace.select(id)" @touchstart.passive="Workspace.select(id)">
		<div class="tab-close" :title="toolTip" @contextmenu="$emit('menu', $event)">
			<div>
				<span v-if="isModified">*</span>
				{{ title }}
			</div>
			<div class="ps-2 pt-1 bt" @click.stop="Workspace.close(id)" @pointerdown.stop @mousedown.stop>
				<div class="close">
					<i class="fas fa-times" />
				</div>
			</div>
		</div>
		<div class="tab-down" :title="toolTip">
			<div>
				<span v-if="isModified">*</span>
				{{ title }}
			</div>
			<div class="px-2 bt" @click.stop="$emit('menu', $event)" @pointerdown.stop @touchstart.stop.passive>
				<i class="fas fa-caret-down" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { computed } from "vue";

	import Workspace from "app/services/workspaceService";
	import Handle from "app/services/handleService";

	import type { Project } from "client/project/project";
	import type { ProjId } from "shared/json";

	defineOptions({ name: "Tab" });

	const props = defineProps<{ id: ProjId }>();

	function project(): Project | undefined {
		// It is possible during context loss that the result is undefined.
		return Workspace.getProject(props.id);
	}

	defineEmits(["menu"]);

	function getTitle(): string {
		return project()?.design.title ?? "";
	}

	const isModified = computed(() => project()?.history.isModified ?? false);
	const title = computed(() => {
		const designTitle = getTitle();
		return designTitle ? designTitle : i18n.t("toolbar.tab.noTitle").toString();
	});
	const toolTip = computed(() => {
		let result = getTitle();
		const handle = Handle.get(props.id);
		if(handle) result += "\n" + handle.name;
		return result;
	});

</script>
