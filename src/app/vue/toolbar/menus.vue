<template>
	<div class="btn-group me-2" role="menubar">
		<FileMenu />
		<EditMenu />
		<SettingMenu />
		<ToolMenu />
		<HelpMenu />
	</div>
</template>

<script setup lang="ts">

	import FileMenu from "./fileMenu.vue";
	import EditMenu from "./editMenu.vue";
	import SettingMenu from "./settingMenu.vue";
	import ToolMenu from "./toolMenu.vue";
	import HelpMenu from "./helpMenu.vue";

	defineOptions({ name: "Menus" });

</script>
