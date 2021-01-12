<template>
	<div id="divWelcome" class="welcome p-3">
		<template v-if="core.initialized">
			<div>
				<h2 class="d-none d-sm-block" v-t="'welcome.title'"></h2>
				<h3 class="d-sm-none" v-t="'welcome.title'"></h3>

				<p class="mt-4" v-t="'welcome.intro[0]'"></p>
				<i18n path="welcome.intro[1]" tag="p">
					<a target="_blank" rel="noopener" href="https://github.com/MuTsunTsai/box-pleating-studio">GitHub</a>
				</i18n>
			</div>
			<div class="browser-only">
				<div v-if="(bi||ios)&&!install">
					<p v-t="'welcome.install.hint'"></p>
					<p v-if="ios" v-t="'welcome.install.ios'"></p>
					<button v-else class="btn btn-primary" @click="bi.prompt()" v-t="'welcome.install.bt'"></button>
				</div>
				<div v-if="install==1" v-t="'welcome.install.ing'"></div>
				<div v-if="install==2">
					<p v-t="'welcome.install.ed'"></p>
					<a
						class="btn btn-primary"
						rel="noopener"
						href="https://bpstudio.abstreamace.com/"
						target="_blank"
						v-t="'welcome.install.open'"
					></a>
				</div>
			</div>
		</template>
		<div v-else class="h-100 d-flex text-center align-items-center">
			<div style="font-size:10rem; font-size:min(15vh,15vw); color:gray; flex-grow:1;">
				<i class="bp-spinner fa-spin d-inline-block"></i>
			</div>
		</div>
		<div style="position:absolute; bottom:1rem; right:1rem;">{{core.copyright}}</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';
	import { core } from './core.vue';

	declare global {
		interface Navigator {
			getInstalledRelatedApps?(): Promise<string[]>;
			standalone?: boolean;
		}
	}

	@Component
	export default class Welcome extends Vue {
		private bi: any;
		private install: number = 0;
		private ios: boolean = navigator.standalone === false;

		private get core() { return core; }

		created() {
			window.addEventListener("beforeinstallprompt", event => {
				event.preventDefault();
				this.bi = event;
			});
			window.addEventListener("appinstalled", () => {
				if(matchMedia("(display-mode: standalone)").matches) return; // 桌機會進入這裡
				this.install = 1;
				let i = setInterval(() => {
					if(this.install != 2) this.detectInstallation();
					else clearInterval(i);
				}, 2000);
			});
			this.detectInstallation();
		}

		private detectInstallation() {
			if('getInstalledRelatedApps' in navigator) {
				navigator.getInstalledRelatedApps().then(apps => {
					if(apps.length) this.install = 2;
				});
			}
		}
	}
</script>
