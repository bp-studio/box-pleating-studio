import { watch, nextTick, reactive } from "vue";
import { createI18n } from "vue-i18n";
import probablyChina from "probably-china";

import locale from "app/gen/locale";
import { useDebounce } from "app/utils/timerUtility";

import type { I18n } from "vue-i18n";
import type { BpsLocale } from "shared/frontend/locale";
import type Settings from "./settingService";

const LOCALE_KEY = "locale";
const DEFAULT_LOCALE = "en";

//=================================================================
/**
 * {@link LanguageService} determines locale on startup and manages related settings.
 *
 * For historical reasons, language setting is store separately,
 * and is not part of the {@link Settings}.
 */
//=================================================================
namespace LanguageService {
	const _options: string[] = reactive([]);

	export const options = _options as readonly string[];

	/** Create i18n instance. */
	export function createPlugin(): I18n {
		// Replace the flag to avoid unnecessary trouble.
		if(probablyChina) locale["zh-tw"].emoji = () => "🇭🇰";

		const plugin = createI18n<[BpsLocale], string>({
			legacy: false,
			locale: DEFAULT_LOCALE,
			fallbackLocale: DEFAULT_LOCALE,
			silentFallbackWarn: true,
			messages: locale,
		});

		// When using such method to define a global constant,
		// it is important NOT to declare a global var ahead of time,
		// as it will make older Safari (say v11) thinks the two are different symbols.
		Object.defineProperty(window, "i18n", {
			writable: false,
			value: plugin.global,
		});

		return plugin;
	}

	export function init(): void {
		_options.length = 0;
		const build = Number(localStorage.getItem("build") || 0);
		const localeSetting = localStorage.getItem(LOCALE_KEY);
		const langs = getLanguages(localeSetting);
		const newLocale = langs.some(l => Number(locale[l].since) > build);

		if(langs.length > 1 && (!localeSetting || newLocale)) {
			_options.push(...langs);
		}
		const loc = format(localeSetting || langs[0] || DEFAULT_LOCALE);
		i18n.locale.value = loc;
		localStorage.setItem(LOCALE_KEY, loc);
	}

	// We log the event only when the locale is fully settled.
	const TWO_MINUTES = 120000;
	const debounce = useDebounce(TWO_MINUTES);

	export function setup(): void {
		// Sync locale
		let syncing: boolean = false;
		window.addEventListener("storage", e => {
			if(e.key == LOCALE_KEY) {
				syncing = true;
				i18n.locale.value = e.newValue!;
			}
		});

		watch(i18n.locale, loc => {
			if(loc in locale) {
				if(!syncing) localStorage.setItem(LOCALE_KEY, loc);
				syncing = false;
				debounce(() => gtag("event", "lang_" + loc.replace("-", "_")));
			} else {
				loc = findFallbackLocale(loc);
				nextTick(() => i18n.locale.value = loc);
			}
			document.documentElement.lang = loc;
		}, { immediate: true });
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

	function findFallbackLocale(loc: string): string {
		const tokens = loc.split("-");
		while(tokens.length) {
			tokens.pop();
			const l = tokens.join("-");
			if(l in locale) return l;
		}
		return DEFAULT_LOCALE;
	}

	/**
	 * Normalize the language codes returned by browsers.
	 *
	 * See https://datatracker.ietf.org/doc/html/rfc5646 for docs.
	 */
	function format(l: string): string {
		return l.replace(/_/g, "-")
			.toLowerCase()
			// Firefox Android returns "zh-Hant-TW" instead of "zh-TW"
			.replace(/^zh(-\w+)?-hant.*$/, "zh-tw")
			.replace(/^zh(-\w+)?-hans.*$/, "zh-cn");
	}

	export let onReset: Action | undefined;

	export function reset(): void {
		localStorage.removeItem(LOCALE_KEY);
		init();
		if(onReset) onReset();
	}
}

export default LanguageService;
