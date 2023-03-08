<template>
	<div class="tab" :class="{ active: isActive() }" :id="`tab${id}`" @mousedown="Workspace.select(id)"
		 @touchstart.passive="Workspace.select(id)">
		<div class="tab-close" :title="toolTip" @contextmenu="$emit('menu', $event)">
			<div>
				<span v-if="isModified">*</span>
				{{ title }}
			</div>
			<div class="ps-2 pt-1" @click.stop="Workspace.close(id)" @pointerdown.stop @mousedown.stop>
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
			<div class="px-2" @click.stop="$emit('menu', $event)" @pointerdown.stop @touchstart.stop.passive>
				<i class="fas fa-caret-down" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	export default { name: "Tab" };
</script>

<script setup lang="ts">

	import { computed } from "vue";

	import Workspace from "app/services/workspaceService";
	import Studio from "app/services/studioService";
	import Handle from "app/services/handleService";

	import type { Project } from "client/project/project";

	const props = defineProps<{ id: number }>();

	function project(): Project {
		return Workspace.getProject(props.id)!;
	}

	defineEmits(["menu"]);

	function isActive(): boolean {
		return Studio.project?.id == props.id;
	}

	const isModified = computed(() => project().history.isModified);
	const title = computed(() => {
		const title = project().design.title;
		return title ? title : i18n.t("toolbar.tab.noTitle").toString();
	});
	const toolTip = computed(() => {
		let result = project().design.title;
		const handle = Handle.get(props.id);
		if(handle) result += "\n" + handle.name;
		return result;
	});

</script>

<style lang="scss">
	.tab {
		padding: 0.5rem;
		flex-shrink: 0;
		font-size: 1.25rem;
		line-height: 2.5rem;
		border-right: 1px solid var(--tab-border);
		cursor: default;
		max-width: 150px;
		height: 100%;
		background-color: var(--bg-ui);
		display: inline-block;

		&:first-child {
			border-left: 1px solid var(--tab-border);
		}

		&.active {
			background-color: var(--tab-active);
			background-image: var(--bs-gradient);
			color: black;
		}

		:first-child {
			flex-grow: 1;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		:last-child {
			flex-shrink: 0;
		}

		i {
			cursor: pointer;
			transition: opacity 0.1s linear;
			opacity: 0;
			width: 1rem;
			text-align: center;
		}

		&:hover i {
			opacity: 1;
		}
	}

	.tab-down {
		display: none;
	}

	.tab-close {
		display: flex;

		.close {
			border-radius: 5px;
			display: inline-block;
			height: 1.75rem;
			width: 1.75rem;
			padding: 0.3rem;
			margin-top: 0.15rem;
			line-height: 1;
			text-align: center;
			transition: background-color 0.1s linear;

			&:hover {
				background-color: rgba(255 255 255 / 20%);
				background-image: var(--bs-gradient);
			}
		}
	}

	@media (hover: hover) {
		.tab:not(:hover, .active) {
			color: #444;
		}
	}

	@media (hover: none),
	(pointer: coarse) {
		.tab .tab-down i {
			opacity: 1 !important;
		}

		.tab-down {
			display: flex;
		}

		.tab-close {
			display: none;
		}
	}

	@media (max-width: 650px) {
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
	}
</style>
