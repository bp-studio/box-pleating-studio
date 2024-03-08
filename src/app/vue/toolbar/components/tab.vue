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

	function project(): Project {
		return Workspace.getProject(props.id)!;
	}

	defineEmits(["menu"]);

	const isModified = computed(() => project().history.isModified);
	const title = computed(() => {
		const designTitle = project().design.title;
		return designTitle ? designTitle : i18n.t("toolbar.tab.noTitle").toString();
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
		cursor: pointer;

		display: inline-block;
		flex-shrink: 0;

		max-width: 150px;
		height: 100%;
		padding: 0.5rem;

		font-size: 1.25rem;
		line-height: 2.5rem;

		background-color: var(--bg-ui);
		border-right: 1px solid var(--tab-border);

		&:first-child {
			border-left: 1px solid var(--tab-border);
		}

		&.active {
			color: black;
			background-color: var(--tab-active);
			background-image: var(--bs-gradient);
		}

		:first-child {
			overflow: hidden;
			flex-grow: 1;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		:last-child {
			flex-shrink: 0;
		}

		i {
			width: 1rem;
			text-align: center;
			opacity: 0;
			transition: opacity 0.1s linear;
		}

		&:hover i {
			opacity: 1;
		}
	}

	/* vue-slicksort places clone directly under <body> */
	body > .tab .bt {
		display: none;
	}

	.tab-down {
		display: none;
	}

	.tab-close {
		display: flex;

		.close {
			display: inline-block;

			width: 1.75rem;
			height: 1.75rem;
			margin-top: 0.15rem;
			padding: 0.3rem;

			line-height: 1;
			text-align: center;

			border-radius: 5px;

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

	@media (width <=650px) {
		.tab {
			padding: 0.2rem 0.5rem;
			font-size: 1rem;
			line-height: 2rem;
		}

		.tab-close .close {
			width: 1.5rem;
			height: 1.5rem;
			margin-top: 0;
			padding: 0.25rem;
		}

		.tab:first-child {
			border-left: none;
		}
	}
</style>
