if(typeof Shrewd != "object") throw new Error("BPStudio requires Shrewd.");

const { shrewd } = Shrewd;

/**
 * 接受診斷模式，這個常數的實際值會由 Terser 注入；
 * 目前的設定是 DEV 版為 false，PUB 版為 true。
 */
declare const DEBUG_ENABLED: boolean;

/** 診斷模式 */
const diagnose = false;

/** 全域的 debug 用變數 */
let debug = false;

Shrewd.option.debug = diagnose;
Shrewd.option.autoCommit = false;
