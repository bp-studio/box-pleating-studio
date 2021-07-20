<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content" v-if="initialized">
				<div class="modal-body">
					<div class="row">
						<div v-for="l in languages" :key="l" class="col text-center">
							<button @click="setLocale(l)" class="w-100 btn btn-light" data-bs-dismiss="modal">
								<img :src="'assets/flags/'+$t('flag', l)+'.png'" :alt="$t('flag', l)" width="64" height="64" />
								<br />
								{{$t('name', l)}}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	import * as bootstrap from 'bootstrap';

	declare const locale: Record<string, unknown>[];

	@Component
	export default class Language extends Vue {

		protected initialized: boolean = false;
		protected languages: string[] = [];

		protected setLocale(l: string): void {
			i18n.locale = l;
			this.onLocaleChanged();
		}

		public init(build: number): void {
			let loc = localStorage.getItem("locale");
			let languages = this.getLanguages(loc);
			let newLocale = languages.some(l => locale[l].since > build);

			if(languages.length > 1 && (!loc || newLocale)) {
				this.languages = languages;
				this.initialized = true;
				libReady.then(() => new bootstrap.Modal(this.$el).show());
			}

			loc = loc || languages[0] || "en";
			i18n.locale = this.format(loc);
			this.onLocaleChanged();
		}

		/** 取得當前的候選語言列表 */
		private getLanguages(loc: string | null): string[] {
			let locales = Object.keys(locale);
			if(!navigator.languages) return locales;
			let languages = navigator.languages
				.map(a => locales.find(l => this.format(a).startsWith(l)))
				.filter((l): l is string => Boolean(l));
			if(loc) languages.unshift(loc);
			languages = Array.from(new Set(languages));
			return languages;
		}

		private format(l: string): string {
			return l.replace(/_/g, "-").toLowerCase();
		}

		private onLocaleChanged(): void {
			if(i18n.locale in locale) {
				localStorage.setItem("locale", i18n.locale);
			} else {
				Vue.nextTick(() => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let chain = (i18n as any)._localeChainCache[i18n.locale];
					for(let l of chain) {
						if(l in locale) {
							i18n.locale = l;
							return;
						}
					}
				});
			}
			document.documentElement.lang = i18n.locale;
		}
	}
</script>
