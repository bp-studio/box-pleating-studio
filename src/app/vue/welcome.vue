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

	import Core from "app/core";
	import handles from "app/services/handleService";
	import { isFileApiEnabled } from "app/shared/constants";
	import Opener from "@/gadgets/file/opener.vue";
	import Studio from "app/services/studioService";
	import Workspace from "app/services/workspaceService";
	import Import from "app/services/importService";
	import { copyright } from "app/misc";

	const preparing = shallowRef(false);
	const install = shallowRef(0);

	/** 是否在 PWA 模式中執行 */
	const isPWA = matchMedia("(display-mode: standalone)").matches;

	const ios = computed(() => navigator.standalone === false);
	const origin = computed(() => location.origin);

	let bip: BeforeInstallPromptEvent;

	const APP_CHECK_INTERVAL = 2000;

	function detectInstallation(): void {
		if("getInstalledRelatedApps" in navigator) {
			navigator.getInstalledRelatedApps!().then(apps => {
				// 請注意這段程式碼只有在 Android 上面有效，
				// 桌機上面會傳回空陣列，所以無法以此法偵測 PWA 是否已安裝；
				// 不過這無所謂，因為開啟 PWA 的連結本來也就只有在 Android 中有效
				if(apps.length) install.value = 2;
			});
		}
	}

	// 如果啟動的瞬間沒有 SW 存在，就表示 SW 正在安裝
	// 此時顯示等候訊息以改善 UX，因為 beforeinstallprompt 事件必須等到 SW 裝完才會觸發
	if("onbeforeinstallprompt" in window && location.protocol == "https:" && !navigator.serviceWorker.controller) {
		preparing.value = true;
	}

	// 監聽事件
	window.addEventListener("beforeinstallprompt", (event: Event) => {
		event.preventDefault();
		bip = event as BeforeInstallPromptEvent;
	});
	window.addEventListener("appinstalled", () => {
		if(isPWA) return; // 桌機會進入這裡
		install.value = 1;
		const int = setInterval(() => {
			if(install.value != 2) detectInstallation();
			else clearInterval(int);
		}, APP_CHECK_INTERVAL);
	});

	// 立刻檢查安裝狀態
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

			>div {
				display: flex;
				flex-flow: column wrap;
				overflow: hidden;
				height: 100%;

				>* {
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
