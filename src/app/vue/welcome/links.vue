<template>
	<i18n-t keypath="welcome.intro[1]" tag="p" scope="global">
		<a target="_blank" rel="noopener" href="https://bp-studio.github.io/" v-t="'welcome.website'"></a>
	</i18n-t>
	<p>
		💥
		<i18n-t keypath="welcome.discord" tag="span" scope="global">
			<a target="_blank" rel="noopener" href="https://discord.gg/HkcdTDS4zZ" v-t="'keyword.discord'"></a>
		</i18n-t>
	</p>
	<div class="font-preload">
		<i class="fas fa-plus" />
		<i class="fab fa-discord" />
		<i class="far fa-clone" />
		🇺🇸
	</div>
</template>

<script setup lang="ts">

	defineOptions({ name: "Links" });

	import { onMounted } from "vue";

	import { lcp } from "app/misc/phase";

	// This is the deepest component of the initial async chain
	onMounted(() => lcp.resolve());

</script>
