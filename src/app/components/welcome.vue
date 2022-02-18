<template>
	<div id="divWelcome" class="welcome p-3 p-md-4 p-lg-5" v-if="!core.design&&core.lcpReady">
		<div class="container-fluid d-flex flex-column" style="height:calc(100% - 50px);">
			<div class="row justify-content-center flex-grow-0">
				<div class="col-12 col-lg-10 col-xl-8">
					<h2 class="d-none d-sm-block" v-t="'welcome.title'"></h2>
					<h3 class="d-sm-none" v-t="'welcome.title'"></h3>

					<p class="mt-4" v-t="'welcome.intro[0]'"></p>
					<i18n path="welcome.intro[1]" tag="p">
						<a target="_blank" rel="noopener" href="https://bp-studio.github.io/" v-t="'welcome.website'"></a>
					</i18n>
					<p>
						💥
						<i18n path="welcome.discord" tag="span">
							<a target="_balnk" rel="noopener" href="https://discord.gg/HkcdTDS4zZ" v-t="'keyword.here'"></a>
						</i18n>
					</p>
				</div>
				<div class="browser-only col-12 col-lg-10 col-xl-8">
					<div v-if="(preparing||bi||ios)&&!install">
						<p v-t="'welcome.install.hint'"></p>
						<p v-if="ios" v-t="'welcome.install.ios'"></p>
						<button v-else-if="bi" class="btn btn-primary" @click="bi.prompt()" v-t="'welcome.install.bt'"></button>
						<button v-else class="btn btn-primary" disabled>
							{{$t('welcome.install.prepare')}}&nbsp;
							<i class="bp-spinner fa-spin"></i>
						</button>
					</div>
					<div v-if="install==1">
						{{$t('welcome.install.ing')}}&nbsp;
						<i class="bp-spinner fa-spin"></i>
					</div>
					<div v-if="install==2">
						<p v-t="'welcome.install.ed'"></p>
						<a class="btn btn-primary" rel="noopener" :href="origin" target="_blank" v-t="'welcome.install.open'"></a>
					</div>
				</div>
			</div>
			<div v-if="isFileApi" class="row mt-4 mt-sm-5 justify-content-center file-api">
				<div class="col-12 col-sm-6 col-lg-5 col-xl-4 mb-4">
					<h4 class="mb-3" v-t="'welcome.start'"></h4>
					<div @click="core.projects.create()" class="link-primary">
						<i class="far fa-file fa-fw me-2"></i>
						{{$t('toolbar.file.new')}}
					</div>
					<opener @open="open($event, false)" class="link-primary">
						<i class="far fa-folder-open fa-fw me-2"></i>
						{{$t('toolbar.file.open')}}
					</opener>
				</div>
				<div class="col-12 col-sm-6 col-lg-5 col-xl-4 recent">
					<div v-if="recent.length">
						<h4 class="mb-3" v-t="'welcome.recent'"></h4>
						<div v-for="(h,i) in recent" :key="i" @click="open(h, true)" class="link-primary">{{h.name}}</div>
					</div>
				</div>
			</div>
		</div>
		<div style="position:absolute; bottom:1rem; right:1rem;">{{core.copyright}}</div>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	declare global {
		interface Navigator {
			getInstalledRelatedApps?(): Promise<string[]>;
			standalone?: boolean;
		}

		interface BeforeInstallPromptEvent extends Event {
			prompt(): Promise<void>;
		}
	}

	@Component
	export default class Welcome extends Vue {
		protected preparing: boolean = false;
		protected bi: BeforeInstallPromptEvent;
		protected install: number = 0;
		protected ios: boolean = navigator.standalone === false;
		protected isFileApi: boolean = isFileApiEnabled;

		protected get core(): typeof core { return core; }

		created(): void {
			const APP_CHECK_INTERVAL = 2000;

			// 如果啟動的瞬間沒有 SW 存在，就表示 SW 正在安裝
			// 此時顯示等候訊息以改善 UX，因為 beforeinstallprompt 事件必須等到 SW 裝完才會觸發
			if('onbeforeinstallprompt' in window && location.protocol == "https:" && !navigator.serviceWorker.controller) {
				this.preparing = true;
			}

			// 監聽事件
			window.addEventListener("beforeinstallprompt", (event: BeforeInstallPromptEvent) => {
				event.preventDefault();
				this.bi = event;
			});
			window.addEventListener("appinstalled", () => {
				if(isPWA) return; // 桌機會進入這裡
				this.install = 1;
				let i = setInterval(() => {
					if(this.install != 2) this.detectInstallation();
					else clearInterval(i);
				}, APP_CHECK_INTERVAL);
			});

			// 立刻檢查安裝狀態
			this.detectInstallation();
		}

		private detectInstallation(): void {
			if('getInstalledRelatedApps' in navigator) {
				navigator.getInstalledRelatedApps!().then(apps => {
					// 請注意這段程式碼只有在 Android 上面有效，
					// 桌機上面會傳回空陣列，所以無法以此法偵測 PWA 是否已安裝；
					// 不過這無所謂，因為開啟 PWA 的連結本來也就只有在 Android 中有效
					if(apps.length) this.install = 2;
				});
			}
		}

		protected get origin(): string {
			return location.origin;
		}

		protected get recent(): FileHandleList {
			return core.handles.recent;
		}

		protected open(handle: FileSystemFileHandle, request: boolean): void {
			Files.open([handle], request);
		}
	}
</script>

<style>
	@media (max-width: 575.98px) {
		.file-api {
			flex-grow: 1;
			flex-direction: column;
			justify-content: start !important;
		}

		.recent {
			flex-grow: 1;
			height: 0;
		}

		.recent > div {
			display: flex;
			flex-direction: column;
			flex-wrap: wrap;
			overflow: hidden;
			height: 100%;
		}

		.recent > div > * {
			width: 100%;
		}
	}

	.welcome .link-primary {
		cursor: pointer;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		max-width: 100%;
		line-height: 1.75;
	}

	.welcome .link-primary:hover {
		background: #eee;
	}
</style>
