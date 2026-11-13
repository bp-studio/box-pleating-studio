import { watch, nextTick, reactive } from "vue";
import { createI18n } from "vue-i18n";
import { probablyChina } from "probably-china";

import locale, {
	DEFAULT_LOCALE, LOCALE_KEY, formatLocale, getLanguages, loadLocale, locales
} from "app/shared/locale";
import { useDebounce } from "app/utils/timerUtility";
import Analytics from "app/services/analyticsService";

import type { I18n } from "vue-i18n";
import type { BpsLocale } from "app/shared/locale";
import type Settings from "./settingService";

//=================================================================
/**
 * {@link LanguageService} determines locale on startup and manages related
 * settings.
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
		const plugin = createI18n<[BpsLocale], string, false>({
			legacy: false,
			locale: DEFAULT_LOCALE,
			fallbackLocale: DEFAULT_LOCALE,
			silentFallbackWarn: true,
			messages: { [DEFAULT_LOCALE]: locale[DEFAULT_LOCALE] },
		});

		// When using such method to define a global constant, it is important
		// NOT to declare a global var ahead of time, as it will make older
		// Safari (say v11) thinks the two are different symbols.
		Object.defineProperty(window, "i18n", {
			writable: false,
			value: plugin.global,
		});

		return plugin;
	}

	/** Loads a locale and adds it to the i18n instance (only once). */
	async function register(loc: string): Promise<BpsLocale> {
		const messages = await loadLocale(loc);
		if(!i18n.availableLocales.includes(loc) && locales.includes(loc)) {
			// Replace the flag to avoid unnecessary trouble.
			if(loc == "zh-tw" && probablyChina) messages.emoji = () => "🇭🇰";
			i18n.setLocaleMessage(loc, messages);
		}
		return messages;
	}

	export async function init(): Promise<void> {
		_options.length = 0;
		const build = Number(localStorage.getItem("build") || 0);
		const localeSetting = localStorage.getItem(LOCALE_KEY);
		const langs = getLanguages(localeSetting);
		const messages = await Promise.all(langs.map(register));
		const newLocale = messages.some(m => Number(m.since) > build);

		if(langs.length > 1 && (!localeSetting || newLocale)) {
			_options.push(...langs);
		}
		const loc = formatLocale(localeSetting || langs[0] || DEFAULT_LOCALE);
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

		// The other locales are needed in the preferences.
		for(const l of locales) register(l);

		watch(i18n.locale, loc => {
			if(locales.includes(loc)) {
				register(loc);
				if(!syncing) localStorage.setItem(LOCALE_KEY, loc);
				syncing = false;
				debounce(() => Analytics.event("lang_" + loc.replace("-", "_")));
			} else {
				loc = findFallbackLocale(loc);
				nextTick(() => i18n.locale.value = loc);
			}
			document.documentElement.lang = loc;
		}, { immediate: true });
	}

	function findFallbackLocale(loc: string): string {
		const tokens = loc.split("-");
		while(tokens.length) {
			tokens.pop();
			const l = tokens.join("-");
			if(locales.includes(l)) return l;
		}
		return DEFAULT_LOCALE;
	}

	// eslint-disable-next-line no-unassigned-vars
	export let onReset: Action | undefined;

	export async function reset(): Promise<void> {
		localStorage.removeItem(LOCALE_KEY);
		await init();
		if(onReset) onReset();
	}
}

export default LanguageService;
