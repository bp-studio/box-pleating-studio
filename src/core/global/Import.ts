if(typeof Shrewd != "object") throw new Error("BPStudio requires Shrewd.");

const { shrewd } = Shrewd;

/** 接受診斷模式，這個常數的實際宣告會由 gulp 建置程序注入 */
declare const debugEnabled: boolean;

/** 診斷模式 */
const diagnose = false;

/** 全域的 debug 用變數 */
let debug = false;

Shrewd.option.debug = diagnose;
Shrewd.option.autoCommit = false;
