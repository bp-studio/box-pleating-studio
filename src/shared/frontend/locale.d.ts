import type bpsLocale from "locale/en.json";

interface MessageContext {
	normalize: Action;
	interpolate: Action;
	list: Action;
}
interface MessageFunction {
	(ctx: MessageContext): void | string;
}
type CompiledLocale<T extends object> = {
	[k in keyof T]:
	T[k] extends string[] ? MessageFunction[] :
	T[k] extends object ? CompiledLocale<T[k]> :
	T[k] extends string ? MessageFunction :
	T[k]
};

export type BpsLocale = CompiledLocale<typeof bpsLocale>;

export type BpsMessageKey = undefined | keyof BpsLocale["message"];
