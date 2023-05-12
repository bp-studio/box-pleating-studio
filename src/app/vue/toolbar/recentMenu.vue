<template>
	<SubMenu icon="fas fa-history" :label="$t('toolbar.file.recent.title')">
		<DropdownItem v-if="Handles.recent.length == 0" disabled>
			<i />{{ $t('toolbar.file.recent.empty') }}
		</DropdownItem>
		<template v-else>
			<DropdownItem v-for="(h, i) in Handles.recent" :key="i" @click="open(h)">
				<i />{{ h.name }}
			</DropdownItem>
			<Divider />
			<DropdownItem @click="Handles.clearRecent()">
				<i class="fas fa-trash-alt" />{{ $t('toolbar.file.recent.clear') }}
			</DropdownItem>
		</template>
	</SubMenu>
</template>

<script setup lang="ts">

	import { Divider, DropdownItem } from "@/gadgets/menu";
	import SubMenu from "@/gadgets/menu/submenu.vue";
	import Handles from "app/services/handleService";
	import Import from "app/services/importService";

	defineOptions({ name: "RecentMenu" });

	function open(handle: FileSystemFileHandle): void {
		Import.open([handle], true);
	}

</script>
