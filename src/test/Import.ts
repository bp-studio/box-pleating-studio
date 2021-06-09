/// <reference path="../core/index.ts" />

Shrewd.option.autoCommit = false;

interface Console {
	// 這其實是合法的呼叫，但 lib.dom.d.ts 少了這個定義，所以在此補上
	assert(condition?: boolean, ...obj: unknown[]): void;
}
