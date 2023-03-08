import { reactive, readonly, watch } from "vue";

import type { BpsLocale } from "shared/frontend/locale";

// Create i18n instance. We also consider SSG here.
export const plugin = typeof VueI18n !== "undefined" ?
	VueI18n.createI18n<[BpsLocale], string>({
		locale: "en",
		fallbackLocale: "en",
		silentFallbackWarn: true,
		messages: locale,
	}) : null;

// In case of SSG, i18n instance will be injected separately.
if(plugin) i18n = plugin.global;

//=================================================================
/**
 * {@link LanguageService} determines locale on startup and manages related settings.
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

	/** Obtain the list of candidate languages. */
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

	// Automatically initializes
	init();
}

export default LanguageService;
