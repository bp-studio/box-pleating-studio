
// These are transformed to complied locale through the locale loader
import en from "locale/en.json";
import es from "locale/es.json";
import ja from "locale/ja.json";
import ko from "locale/ko.json";
import vi from "locale/vi.json";
import cn from "locale/zh-CN.json";
import tw from "locale/zh-TW.json";

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

export type BpsMessageKey = undefined | keyof BpsLocale["message"];

const locale = {
	en, es, ja, ko, vi,
	"zh-cn": cn,
	"zh-tw": tw,
} as unknown as Record<string, BpsLocale>;

export default locale;
