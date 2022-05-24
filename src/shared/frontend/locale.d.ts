
import type bpsLocale from "locale/en.json";

export type BpsLocale = typeof bpsLocale;

export type BpsMessageKey = undefined | keyof BpsLocale["message"];
