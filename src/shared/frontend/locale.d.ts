import type { MessageFunction } from "vue-i18n";
import type bpsLocale from "locale/en.json";

type CompiledLocale<T extends object> = {
	[k in keyof T]:
	T[k] extends string[] ? MessageFunction[] :
	T[k] extends object ? CompiledLocale<T> :
	T[k] extends string ? MessageFunction :
	T[k]
};

export type BpsLocale = CompiledLocale<typeof bpsLocale>;

export type BpsMessageKey = undefined | keyof BpsLocale["message"];
