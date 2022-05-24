import { reactive, readonly, watch } from "vue";

import type { BpsLocale } from "shared/frontend/locale";

// 建立 i18n；這邊的寫法考慮到 SSG
export const plugin = typeof VueI18n !== "undefined" ?
	VueI18n.createI18n<[BpsLocale], string>({
		locale: "en",
		fallbackLocale: "en",
		silentFallbackWarn: true,
		messages: locale,
	}) : null;

// SSG 的情況中 i18n 會另外注入
if(plugin) i18n = plugin.global;

//=================================================================
/**
 * {@link LanguageService} 服務負責管理初始執行時的語系判別以及相關設定之讀寫
 */
//=================================================================
namespace LanguageService {
	const _options = reactive<string[]>([]);

	export const options = readonly(_options);

	function init(): void {
		_options.length = 0;
		const build = Number(localStorage.getItem("build") || 0);
		const localeSetting = localStorage.getItem("locale");
		const langs = getLanguages(localeSetting);
		const newLocale = langs.some(l => Number(locale[l].since) > build);

		if(langs.length > 1 && (!localeSetting || newLocale)) {
			_options.push(...langs);
		}
		i18n.locale = format(localeSetting || langs[0] || "en");
	}

	/** 取得當前的候選語言列表 */
	function getLanguages(loc: string | null): string[] {
		const locales = Object.keys(locale);
		if(!navigator.languages) return locales;
		let languages = navigator.languages
			.map(a => locales.find(l => format(a).startsWith(l)))
			.filter((l): l is string => Boolean(l));
		if(loc) languages.unshift(loc);
		languages = Array.from(new Set(languages));
		return languages;
	}

	watch(() => i18n.locale, loc => {
		if(loc in locale) {
			localStorage.setItem("locale", loc);
		} else {
			loc = findFallbackLocale(loc);
			Vue.nextTick(() => i18n.locale = loc);
		}
		document.documentElement.lang = loc;
	});

	function findFallbackLocale(loc: string): string {
		const tokens = loc.split("-");
		while(tokens.length) {
			tokens.pop();
			const l = tokens.join("-");
			if(l in locale) return l;
		}
		return "en";
	}

	function format(l: string): string {
		return l.replace(/_/g, "-").toLowerCase();
	}

	export let onReset: Action;

	export function reset(): void {
		localStorage.removeItem("locale");
		init();
		onReset?.();
	}

	// 自動執行初始化
	init();
}

export default LanguageService;
