/// <reference path="vendor/shrewd.d.ts" />

declare const Shrewd: typeof Shrewd;
declare const shrewd: typeof Shrewd.shrewd;
declare const terminate: typeof Shrewd.terminate;

/**
 * 接受診斷模式，這個常數的實際值會由 Terser 注入；
 * 目前的設定是 DEV 版為 false，PUB 版為 true。
 */
declare const DEBUG_ENABLED: boolean;
