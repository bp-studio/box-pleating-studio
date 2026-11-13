
// These are transformed to complied locale through the locale loader
import en from "locale/en.json";

import type bpsLocale from "locale/en.json";

interface MessageContext {
	normalize: Action;
	interpolate: Action;
	list: Action;
}
interface MessageFunction {
	(ctx: MessageContext): void | string;
}
type PartialCompiledLocale<T extends object> = {
	[k in keyof T]?:
	T[k] extends string[] ? MessageFunction[] :
	T[k] extends object ? PartialCompiledLocale<T[k]> :
	T[k] extends string ? MessageFunction :
	T[k]
};

export type BpsLocale = PartialCompiledLocale<typeof bpsLocale>;

export const DEFAULT_LOCALE = "en";

/** The localStorage key of the locale setting. */
export const LOCALE_KEY = "locale";

type Loader = () => Promise<{ default: unknown }>;

/** Loaders of the supported locales other than the default one. */
const loaders: Record<string, Loader> = {
	"es": () => import(/* webpackChunkName: "locale-es" */ "locale/es.json"),
	"ja": () => import(/* webpackChunkName: "locale-ja" */ "locale/ja.json"),
	"ko": () => import(/* webpackChunkName: "locale-ko" */ "locale/ko.json"),
	"vi": () => import(/* webpackChunkName: "locale-vi" */ "locale/vi.json"),
	"zh-cn": () => import(/* webpackChunkName: "locale-zh-cn" */ "locale/zh-CN.json"),
	"zh-tw": () => import(/* webpackChunkName: "locale-zh-tw" */ "locale/zh-TW.json"),
};

/** All the supported locales. */
export const locales = [DEFAULT_LOCALE, ...Object.keys(loaders)];

/**
 * The loaded locales.
 *
 * Only the default locale is bundled, as it is the one used for the static
 * HTML and the hydration. The others are loaded on demand (each in a separate
 * chunk), so that they don't compete for bandwidth before LCP.
 */
const locale: Record<string, BpsLocale> = {
	[DEFAULT_LOCALE]: en as unknown as BpsLocale,
};

export default locale;

const loading = new Map<string, Promise<BpsLocale>>();

/**
 * Loads a supported locale (only once).
 * The default locale is returned for unsupported ones.
 */
export function loadLocale(loc: string): Promise<BpsLocale> {
	if(loc in locale) return Promise.resolve(locale[loc]);
	if(!(loc in loaders)) return Promise.resolve(locale[DEFAULT_LOCALE]);
	let promise = loading.get(loc);
	if(!promise) {
		promise = loaders[loc]()
			.then(m => locale[loc] = m.default as BpsLocale);
		loading.set(loc, promise);
	}
	return promise;
}

/**
 * Starts loading the locales that will possibly be used, so that they're ready
 * when the locale is settled after LCP.
 */
export function preloadLocales(): void {
	for(const l of getLanguages(localStorage.getItem(LOCALE_KEY))) {
		loadLocale(l).catch(() => { /* handled when actually used */ });
	}
}

/** Obtain the list of candidate languages. */
export function getLanguages(loc: string | null): string[] {
	if(!navigator.languages) return locales.concat();
	let languages = navigator.languages
		.map(a => locales.find(l => formatLocale(a).startsWith(l)))
		.filter((l): l is string => Boolean(l));
	if(loc) languages.unshift(loc);
	languages = Array.from(new Set(languages));
	return languages;
}

/**
 * Normalize the language codes returned by browsers.
 * @see https://datatracker.ietf.org/doc/html/rfc5646
 */
export function formatLocale(l: string): string {
	return l.replace(/_/g, "-")
		.toLowerCase()
		// Firefox Android returns "zh-Hant-TW" instead of "zh-TW"
		.replace(/^zh(-\w+)?-hant.*$/, "zh-tw")
		.replace(/^zh(-\w+)?-hans.*$/, "zh-cn");
}
