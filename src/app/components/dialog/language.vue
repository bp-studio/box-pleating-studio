<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
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
	import { Vue, Component, Watch } from 'vue-property-decorator';
	import * as bootstrap from 'bootstrap';

	declare const locale: any;

	@Component
	export default class Language extends Vue {

		protected languages: string[] = [];

		protected setLocale(l: string) { i18n.locale = l; }

		@Watch('i18n.locale') watchLocale() { this.onLocaleChanged(); }

		public init(build: number) {
			let loc = localStorage.getItem("locale");
			let languages = this.getLanguages(loc);
			let newLocale = languages.some(l => locale[l].since > build);

			if(languages.length > 1 && (!loc || newLocale)) {
				this.languages = languages;
				core.libReady.then(() => new bootstrap.Modal(this.$el).show());
			}

			loc = loc || languages[0] || "en";
			i18n.locale = this.format(loc);
			this.onLocaleChanged();
		}

		/** 取得當前的候選語言列表 */
		private getLanguages(loc: string | undefined): string[] {
			let locales = Object.keys(locale);
			if(!navigator.languages) return locales;
			let languages = navigator.languages
				.map(a => locales.find(l => this.format(a).startsWith(l)))
				.filter(l => !!l);
			if(loc) languages.unshift(loc);
			languages = Array.from(new Set(languages));
			return languages;
		}

		private format(l: string) {
			return l.replace(/_/g, "-").toLowerCase();
		}

		private onLocaleChanged() {
			if(i18n.locale in locale) {
				localStorage.setItem("locale", i18n.locale);
			} else Vue.nextTick(() => {
				let chain = (i18n as any)._localeChainCache[i18n.locale];
				for(let l of chain) if(l in locale) {
					i18n.locale = l;
					return;
				}
			});
		}
	}
</script>
