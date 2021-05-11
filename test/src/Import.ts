/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference path="../../src/core/global/vendor/shrewd.d.ts" />

const { shrewd } = Shrewd;

Shrewd.option.autoCommit = false;

// 底下這些是為了要 TypeScript 忽略掉一些 BPStudio 裡面的機制
type Design = any;
type IDesignObject = any;
type ITagObject = any;
type Action = () => void;

const action = shrewd;

const EditCommand = {
	$remove(obj: any) { /* */ },
	$add<T>(obj: T) { return obj; },
};
