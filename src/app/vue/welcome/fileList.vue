<template>
	<div v-if="Studio.initialized && isFileApiEnabled" class="row mt-4 mt-sm-5 justify-content-center file-api">
		<div class="col-12 col-sm-6 col-lg-5 col-xl-4 mb-4">
			<div class="h4 mb-3">{{ $t("welcome.start") }}</div>
			<div @click="Workspace.create()" class="quick-item">
				<i class="bp-file fa-fw me-2" />
				<span>{{ $t("toolbar.file.new") }}</span>
			</div>
			<Opener @open="Import.open($event, false)" multiple class="quick-item">
				<i class="bp-folder-open fa-fw me-2" />
				<span>{{ $t('toolbar.file.open') }}</span>
			</Opener>
		</div>
		<div class="col-12 col-sm-6 col-lg-5 col-xl-4 recent">
			<div v-if="handles.recent.length">
				<div class="h4 mb-3">{{ $t("welcome.recent") }}</div>
				<div v-for="(h, i) in handles.recent" :key="i" @click="Import.open([h], true)" class="quick-item">
					{{ h.name }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import handles from "app/services/handleService";
	import { isFileApiEnabled } from "app/shared/constants";
	import Opener from "@/gadgets/file/opener.vue";
	import Studio from "app/services/studioService";
	import Workspace from "app/services/workspaceService";
	import Import from "app/services/importService";

	defineOptions({ name: "FileList" });

</script>
