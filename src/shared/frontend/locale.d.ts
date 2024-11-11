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
