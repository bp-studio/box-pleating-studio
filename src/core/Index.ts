/**
 * 這個檔案、以及所有的 Index.ts 檔案，指定了整個 core 專案裡面的所有檔案的編譯順序。
 */

// Level 0
/// <reference path="util/Index.ts" />
/// <reference path="global/Index.ts" />
/// <reference path="class/Index.ts" />
/// <reference path="plugin/TreeMaker.ts" />
/// <reference path="BPStudio.ts" />

// Level 1
/// <reference path="design/Index.ts" />
/// <reference path="view/Index.ts" />
/// <reference path="env/Index.ts" />
