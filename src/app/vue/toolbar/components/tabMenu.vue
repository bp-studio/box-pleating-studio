<template>
	<ContextMenu ref="tabMenu">
		<DropdownItem @click="Workspace.clone(menuId)">
			<i class="far fa-clone" />
			{{ $t('toolbar.tab.clone') }}
		</DropdownItem>
		<Divider />
		<DropdownItem @click="Workspace.close(menuId)">
			<i class="far fa-window-close" />
			{{ $t('toolbar.tab.close') }}
		</DropdownItem>
		<DropdownItem @click="Workspace.closeOther(menuId)">
			<i class="far fa-window-close" />
			{{ $t('toolbar.tab.closeOther') }}
		</DropdownItem>
		<DropdownItem @click="Workspace.closeRight(menuId)">
			<i class="far fa-window-close" />
			{{ $t('toolbar.tab.closeRight') }}
		</DropdownItem>
		<DropdownItem @click="Workspace.closeAll()">
			<i class="far fa-window-close" />
			{{ $t('toolbar.tab.closeAll') }}
		</DropdownItem>
	</ContextMenu>
</template>

<script setup lang="ts">

	import { compRef } from "app/utils/compRef";
	import Workspace from "app/services/workspaceService";
	import { ContextMenu, DropdownItem, Divider } from "@/gadgets/menu";

	import type { ProjId } from "shared/json";

	defineOptions({ name: "TabMenu" });

	const tabMenu = compRef(ContextMenu);

	function show(event: MouseEvent, id: ProjId): void {
		menuId = id;
		tabMenu.value!.show(event);
	}

	let menuId: ProjId;

	defineExpose({ show });

</script>
