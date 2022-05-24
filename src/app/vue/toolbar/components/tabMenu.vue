<template>
	<ContextMenu ref="tabMenu">
		<DropdownItem delay @click="Workspace.clone(menuId)">
			<i class="far fa-clone" />
			{{ $t('toolbar.tab.clone') }}
		</DropdownItem>
		<Divider />
		<DropdownItem delay @click="Workspace.close(menuId)">
			<i class="far fa-window-close" />
			{{ $t('toolbar.tab.close') }}
		</DropdownItem>
		<DropdownItem delay @click="Workspace.closeOther(menuId)">
			<i class="far fa-window-close" />
			{{ $t('toolbar.tab.closeOther') }}
		</DropdownItem>
		<DropdownItem delay @click="Workspace.closeRight(menuId)">
			<i class="far fa-window-close" />
			{{ $t('toolbar.tab.closeRight') }}
		</DropdownItem>
		<DropdownItem delay @click="Workspace.closeAll()">
			<i class="far fa-window-close" />
			{{ $t('toolbar.tab.closeAll') }}
		</DropdownItem>
	</ContextMenu>
</template>

<script lang="ts">
	export default { name: "TabMenu" };
</script>

<script setup lang="ts">

	import { compRef } from "app/inject";
	import Workspace from "app/services/workspaceService";
	import { ContextMenu, DropdownItem, Divider } from "@/gadgets/menu";

	const tabMenu = compRef(ContextMenu);

	function show(event: MouseEvent, id: number): void {
		menuId = id;
		tabMenu.value!.show(event);
	}

	let menuId: number;

	defineExpose({ show });

</script>
