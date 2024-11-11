<template>
	<div id="divWelcome" class="viewport" v-show="!Studio.project">
		<div class="d-flex flex-column h-100">
			<div class="p-3 p-md-4 p-lg-5 flex-grow-1">
				<div class="container-fluid d-flex flex-column">
					<div class="row justify-content-center flex-grow-0">
						<div class="col-12 col-lg-10 col-xl-8">
							<div class="h2 d-none d-sm-block" v-t="'welcome.title'"></div>
							<div class="h3 d-sm-none" v-t="'welcome.title'"></div>

							<p class="mt-4" v-t="'welcome.intro[0]'"></p>
							<Links />
						</div>
						<Instructions />
					</div>
					<FileList />
				</div>
			</div>
			<div class="p-3 text-end">{{ copyright }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { copyright } from "app/misc/helper";
	import { asyncComp } from "app/misc/phase";
	import Studio from "app/services/studioService";
	import Instructions from "./instructions.vue";
	import FileList from "./fileList.vue";

	defineOptions({ name: "Welcome" });

	// This part is especially time-consuming, so we separate it
	const Links = asyncComp(() => import("./links.vue"), true);

</script>
