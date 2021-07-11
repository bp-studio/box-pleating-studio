<template>
	<div id="divWelcome" class="welcome p-3 p-md-4 p-lg-5" v-if="!core.design&&core.initialized">
		<div class="container-fluid">
			<div class="row justify-content-center">
				<div class="col-12 col-lg-10 col-xl-8">
					<h2 class="d-none d-sm-block" v-t="'welcome.title'"></h2>
					<h3 class="d-sm-none" v-t="'welcome.title'"></h3>

					<p class="mt-4" v-t="'welcome.intro[0]'"></p>
					<i18n path="welcome.intro[1]" tag="p">
						<a target="_blank" rel="noopener" href="https://github.com/MuTsunTsai/box-pleating-studio">GitHub</a>
					</i18n>
					<i18n path="about.visitBlog" tag="p">
						<a target="_blank" rel="noopener" href="https://origami.abstreamace.com/" v-t="'about.blog'"></a>
					</i18n>
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
			<div v-if="isFileApi" class="row mt-5 justify-content-center">
				<div class="col-6 col-lg-5 col-xl-4">
					<h4 class="mb-3" v-t="'welcome.start'"></h4>
					<div class="link-primary" @click="core.projects.create()">
						<i class="far fa-file"></i>
						{{$t('toolbar.file.new')}}
					</div>
					<opener class="link-primary" @open="core.files.open($event)">
						<i class="far fa-folder-open"></i>
						{{$t('toolbar.file.open')}}
					</opener>
				</div>
				<div class="col-6 col-lg-5 col-xl-4">
					<template v-if="recent.length">
						<h4 class="mb-3" v-t="'welcome.recent'"></h4>
						<div class="link-primary" v-for="(h,i) in recent" :key="i" @click="open(h)">{{h.name}}</div>
						<div class="link-primary mt-3" @click="clearRecent">
							<i class="fas fa-trash-alt"></i>
							{{$t('toolbar.file.recent.clear')}}
						</div>
					</template>
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

		protected get recent(): readonly FileSystemFileHandle[] {
			return core.handles.recent;
		}

		protected open(handle: FileSystemFileHandle): void {
			core.files.open([handle], true);
		}

		protected clearRecent(): void {
			core.handles.clearRecent();
		}
	}
</script>

<style>
	.welcome .link-primary {
		cursor: pointer;
		margin-top: 0.2rem;
	}

	.welcome .link-primary i {
		display: inline-block;
		width: 1.5rem;
		margin-right: 0.5rem;
		text-align: center;
	}
</style>
