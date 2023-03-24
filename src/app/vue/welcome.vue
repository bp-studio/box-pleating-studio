<template>
	<div id="divWelcome" class="viewport p-3 p-md-4 p-lg-5" v-if="!Studio.project && Core.lcpReady">
		<div class="container-fluid d-flex flex-column" style="height: calc(100% - 50px);">
			<div class="row justify-content-center flex-grow-0">
				<div class="col-12 col-lg-10 col-xl-8">
					<h2 class="d-none d-sm-block" v-t="'welcome.title'"></h2>
					<h3 class="d-sm-none" v-t="'welcome.title'"></h3>

					<p class="mt-4" v-t="'welcome.intro[0]'"></p>
					<i18n-t keypath="welcome.intro[1]" tag="p">
						<a target="_blank" rel="noopener" href="https://bp-studio.github.io/" v-t="'welcome.website'"></a>
					</i18n-t>
					<p>
						💥
						<i18n-t keypath="welcome.discord" tag="span">
							<a target="_blank" rel="noopener" href="https://discord.gg/HkcdTDS4zZ" v-t="'keyword.here'"></a>
						</i18n-t>
					</p>
				</div>
				<div class="browser-only col-12 col-lg-10 col-xl-8">
					<div v-if="(preparing || bip || ios) && !install">
						<p v-t="'welcome.install.hint'"></p>
						<p v-if="ios" v-t="'welcome.install.ios'"></p>
						<button v-else-if="bip" class="btn btn-primary" @click="bip.prompt()" v-t="'welcome.install.bt'"></button>
						<button v-else class="btn btn-primary" disabled>
							{{ $t('welcome.install.prepare') }}&nbsp;
							<i class="bp-spinner fa-spin" />
						</button>
					</div>
					<div v-if="install == 1">
						{{ $t('welcome.install.ing') }}&nbsp;
						<i class="bp-spinner fa-spin" />
					</div>
					<div v-if="install == 2">
						<p v-t="'welcome.install.ed'"></p>
						<a class="btn btn-primary" rel="noopener" :href="origin" target="_blank" v-t="'welcome.install.open'"></a>
					</div>
				</div>
			</div>
			<div v-if="Studio.initialized && isFileApiEnabled" class="row mt-4 mt-sm-5 justify-content-center file-api">
				<div class="col-12 col-sm-6 col-lg-5 col-xl-4 mb-4">
					<h4 class="mb-3" v-t="'welcome.start'"></h4>
					<div @click="Workspace.create()" class="quick-item">
						<i class="far fa-file fa-fw me-2" />
						{{ $t('toolbar.file.new') }}
					</div>
					<Opener @open="Import.open($event, false)" class="quick-item">
						<i class="far fa-folder-open fa-fw me-2" />
						{{ $t('toolbar.file.open') }}
					</Opener>
				</div>
				<div class="col-12 col-sm-6 col-lg-5 col-xl-4 recent">
					<div v-if="handles.recent.length">
						<h4 class="mb-3" v-t="'welcome.recent'"></h4>
						<div v-for="(h, i) in handles.recent" :key="i" @click="Import.open([h], true)" class="quick-item">
							{{ h.name }}
						</div>
					</div>
				</div>
			</div>
		</div>
		<div style="position: absolute; bottom: 1rem; right: 1rem;">{{ copyright }}</div>
	</div>
</template>

<script lang="ts">
	declare global {
		interface Navigator {
			getInstalledRelatedApps?(): Promise<string[]>;
			standalone?: boolean;
		}

		interface BeforeInstallPromptEvent extends Event {
			prompt(): Promise<void>;
		}
	}
	export default { name: "Welcome" };
</script>

<script setup lang="ts">

	import { computed, shallowRef } from "vue";

	import { copyright } from "app/misc/copyright";
	import Core from "app/core";
	import handles from "app/services/handleService";
	import { isFileApiEnabled } from "app/shared/constants";
	import Opener from "@/gadgets/file/opener.vue";
	import Studio from "app/services/studioService";
	import Workspace from "app/services/workspaceService";
	import Import from "app/services/importService";

	const preparing = shallowRef(false);
	const install = shallowRef(0);

	/** If we are running in PWA mode */
	const isPWA = matchMedia("(display-mode: standalone)").matches;

	const ios = computed(() => navigator.standalone === false);
	const origin = computed(() => location.origin);

	let bip: BeforeInstallPromptEvent;

	const APP_CHECK_INTERVAL = 2000;

	async function detectInstallation(): Promise<void> {
		if("getInstalledRelatedApps" in navigator) {
			try {
				const apps = await navigator.getInstalledRelatedApps!();
				// The part only works on Android,
				// and it will return an empty array on Desktops,
				// so we cannot use it to detect if PWA is already installed.
				// But that's OK, since the PWA link works also only in Android anyway.
				if(apps.length) install.value = 2;
			} catch(e) {
				// Ignore any errors here.
			}
		}
	}

	// If service worker is not available on startup, that means it is still installing.
	// When that happens we show a message to improve UX,
	// as beforeinstallprompt event won't fire until service worker is installed.
	if("onbeforeinstallprompt" in window && location.protocol == "https:" && !navigator.serviceWorker.controller) {
		preparing.value = true;
	}

	// Event listening
	window.addEventListener("beforeinstallprompt", (event: Event) => {
		event.preventDefault();
		bip = event as BeforeInstallPromptEvent;
	});
	window.addEventListener("appinstalled", () => {
		if(isPWA) return; // Desktop goes here
		install.value = 1;
		const int = setInterval(() => {
			if(install.value != 2) detectInstallation();
			else clearInterval(int);
		}, APP_CHECK_INTERVAL);
	});

	// Check installation immediately
	detectInstallation();

</script>

<style lang="scss">
	@media (max-width: 575.98px) {
		.file-api {
			flex-grow: 1;
			flex-direction: column;
			justify-content: start !important;
		}

		.recent {
			flex-grow: 1;
			height: 0;

			> div {
				display: flex;
				flex-flow: column wrap;
				overflow: hidden;
				height: 100%;

				> * {
					width: 100%;
				}
			}
		}
	}

	.viewport .quick-item {
		cursor: pointer;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		max-width: 100%;
		line-height: 1.75;

		&:hover {
			background: #eee;
		}
	}
</style>
