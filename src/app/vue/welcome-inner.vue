<template>
	<i18n-t keypath="welcome.intro[1]" tag="p" scope="global">
		<a target="_blank" rel="noopener" href="https://bp-studio.github.io/" v-t="'welcome.website'"></a>
	</i18n-t>
	<p>
		💥
		<i18n-t keypath="welcome.discord" tag="span" scope="global">
			<a target="_blank" rel="noopener" href="https://discord.gg/HkcdTDS4zZ" v-t="'keyword.discord'"></a>
		</i18n-t>

		<i class="fas fa-plus" style="opacity: 0; /* We use this to force loading Font-Awesome */" />
	</p>
</template>

<script setup lang="ts">

	defineOptions({ name: "Welcome-Inner" });

	import { onMounted } from "vue";

	import { lcp } from "app/misc/phase";

	// This is the deepest component of the initial async chain
	onMounted(() => lcp.resolve());

</script>
