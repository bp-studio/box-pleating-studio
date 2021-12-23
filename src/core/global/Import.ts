
if(typeof window.Shrewd != "object") throw new Error("BPStudio requires Shrewd.");

/** 診斷模式 */
export const diagnose = false;

/** 全域的 debug 用變數 */
export let debug = false;

window.Shrewd.option.debug = diagnose;
window.Shrewd.option.autoCommit = false;
