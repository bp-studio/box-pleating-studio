<template>
	<div class="browser-only col-12 col-lg-10 col-xl-8">
		<div v-if="(installAvailable || prompt || ios) && welcomeScreenReady && state == installState.uninstalled">
			<p>{{ $t("welcome.install.hint") }}</p>
			<p v-if="ios">{{ $t("welcome.install.ios") }}</p>
			<button v-else-if="!nativeMode" class="btn btn-primary" @click="install">{{ $t("welcome.install.bt") }}</button>
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
			<p>{{ $t("welcome.install.ed") }}</p>
			<a class="btn btn-primary" rel="noopener" :href="origin" target="_blank">{{ $t("welcome.install.open") }}</a>
		</div>
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

	import { welcomeScreenReady } from "app/misc/phase";
	import { hasServiceWorker } from "app/shared/constants";

	defineOptions({ name: "Instructions" });

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
