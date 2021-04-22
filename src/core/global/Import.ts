if(typeof Shrewd != "object") throw new Error("BPStudio requires Shrewd.");

const { shrewd } = Shrewd;

/** 診斷模式 */
const diagnose = false;

/** 接受診斷模式 */
const debugEnabled = false;

/** 全域的 debug 用變數 */
let debug = false;

Shrewd.option.debug = diagnose;
Shrewd.option.autoCommit = false;
