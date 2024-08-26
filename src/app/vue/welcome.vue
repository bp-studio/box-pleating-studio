<template>
	<div id="divWelcome" class="viewport p-3 p-md-4 p-lg-5" v-show="!Studio.project">
		<div class="container-fluid d-flex flex-column" style="height: calc(100% - 50px);">
			<div class="row justify-content-center flex-grow-0">
				<div class="col-12 col-lg-10 col-xl-8">
					<div class="h2 d-none d-sm-block" v-t="'welcome.title'"></div>
					<div class="h3 d-sm-none" v-t="'welcome.title'"></div>

					<p class="mt-4" v-t="'welcome.intro[0]'"></p>
					<i18n-t keypath="welcome.intro[1]" tag="p" scope="global">
						<a target="_blank" rel="noopener" href="https://bp-studio.github.io/" v-t="'welcome.website'"></a>
					</i18n-t>
					<p>
						💥
						<i18n-t keypath="welcome.discord" tag="span" scope="global">
							<a target="_blank" rel="noopener" href="https://discord.gg/HkcdTDS4zZ" v-t="'keyword.discord'"></a>
						</i18n-t>
					</p>
				</div>
				<div class="browser-only col-12 col-lg-10 col-xl-8">
					<div v-if="(installAvailable || prompt || ios) && lcpReady && state == installState.uninstalled">
						<p v-t="'welcome.install.hint'"></p>
						<p v-if="ios" v-t="'welcome.install.ios'"></p>
						<button v-else-if="!nativeMode" class="btn btn-primary" @click="install" v-t="'welcome.install.bt'"></button>
						<button v-else class="btn btn-primary" disabled>
							{{ $t('welcome.install.prepare') }}&nbsp;
							<i class="bp-spinner fa-spin" />
						</button>
					</div>
					<div v-if="state == installState.installing">
						{{ $t('welcome.install.ing') }}&nbsp;
						<i class="bp-spinner fa-spin" />
					</div>
					<div v-if="state == installState.installed">
						<p v-t="'welcome.install.ed'"></p>
						<a class="btn btn-primary" rel="noopener" :href="origin" target="_blank" v-t="'welcome.install.open'"></a>
					</div>
				</div>
			</div>
			<div v-if="Studio.initialized && isFileApiEnabled" class="row mt-4 mt-sm-5 justify-content-center file-api">
				<div class="col-12 col-sm-6 col-lg-5 col-xl-4 mb-4">
					<div class="h4 mb-3" v-t="'welcome.start'"></div>
					<div @click="Workspace.create()" class="quick-item">
						<i class="bp-file fa-fw me-2" />
						<span v-t="'toolbar.file.new'" />
					</div>
					<Opener @open="Import.open($event, false)" multiple class="quick-item">
						<i class="bp-folder-open fa-fw me-2" />
						<!-- v-t directive doesn't work here for some reason -->
						<span>{{ $t('toolbar.file.open') }}</span>
					</Opener>
				</div>
				<div class="col-12 col-sm-6 col-lg-5 col-xl-4 recent">
					<div v-if="handles.recent.length">
						<div class="h4 mb-3" v-t="'welcome.recent'"></div>
						<div v-for="(h, i) in handles.recent" :key="i" @click="Import.open([h], true)" class="quick-item">
							{{ h.name }}
						</div>
					</div>
				</div>
			</div>
		</div>
		<div style="position: absolute; right: 1rem; bottom: 1rem;">{{ copyright }}</div>
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
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import { copyright } from "app/misc/copyright";
	import { lcpReady } from "app/misc/lcpReady";
	import handles from "app/services/handleService";
	import { hasServiceWorker, isFileApiEnabled } from "app/shared/constants";
	import Opener from "@/gadgets/file/opener.vue";
	import Studio from "app/services/studioService";
	import Workspace from "app/services/workspaceService";
	import Import from "app/services/importService";

	defineOptions({ name: "Welcome" });

	// See https://caniuse.com/web-app-manifest
	// for browser support for standalone installation.

	enum installState {
		uninstalled = 0,
		installing = 1,
		installed = 2,
	}

	// If service worker is not available on startup, that means it is still installing.
	// When that happens we show a message to improve UX,
	// as beforeinstallprompt event won't fire until service worker is installed.
	// Notice that the value will be `false` after the service worker is available,
	// but that's OK since in that case we will have the prompt available immediately.
	const installAvailable =
		"onbeforeinstallprompt" in window &&
		hasServiceWorker &&
		!navigator.serviceWorker.controller;

	const state = shallowRef<installState>(installState.uninstalled);

	/** If we are running in PWA mode */
	const isPWA = matchMedia("(display-mode: standalone)").matches;

	/** If we are in iOS Safari and that we're not running in PWA mode. */
	const ios = navigator.standalone === false;

	const origin = location.origin;

	const prompt = shallowRef<BeforeInstallPromptEvent | undefined>(undefined);
	const nativeMode = shallowRef(false);

	const APP_CHECK_INTERVAL = 2000;

	async function detectInstallation(): Promise<void> {
		if("getInstalledRelatedApps" in navigator) {
			try {
				const apps = await navigator.getInstalledRelatedApps!();
				// The part only works on Android,
				// and it will return an empty array on Desktops,
				// so we cannot use it to detect if PWA is already installed.
				// But that's OK, since the PWA link works also only in Android anyway.
				if(apps.length) state.value = installState.installed;
			} catch {
				// Ignore any errors here.
			}
		}
	}

	function install(): void {
		if(prompt.value) prompt.value.prompt();

		// For better user experience, if prompt is not ready yet upon clicking,
		// we show the spinner and let the native prompt to show.
		else nativeMode.value = true;
	}

	onMounted(() => {
		// Event listening
		window.addEventListener("beforeinstallprompt", (event: Event) => {
			if(!nativeMode.value) event.preventDefault();
			prompt.value = event as BeforeInstallPromptEvent;
			nativeMode.value = false;
		});
		window.addEventListener("appinstalled", () => {
			if(isPWA) return; // Desktop goes here
			state.value = installState.installing;
			const int = setInterval(() => {
				if(state.value != installState.installed) detectInstallation();
				else clearInterval(int);
			}, APP_CHECK_INTERVAL);
		});

		// Check installation immediately
		detectInstallation();
	});

</script>

<style lang="scss">
	@media (width < 576px) {
		.file-api {
			flex-direction: column;
			flex-grow: 1;
			justify-content: start !important;
		}

		.recent {
			flex-grow: 1;
			height: 0;

			> div {
				overflow: hidden;
				display: flex;
				flex-flow: column wrap;
				height: 100%;

				> * {
					width: 100%;
				}
			}
		}
	}

	.quick-item {
		cursor: pointer;

		overflow: hidden;

		max-width: 100%;
		padding-left: 0.33rem;

		line-height: 1.75;
		text-overflow: ellipsis;
		white-space: nowrap;

		&:hover {
			background: #eee;
		}
	}
</style>
