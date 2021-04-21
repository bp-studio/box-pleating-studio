// 原則上只要引入這個檔案就可以取得 BP Studio 的全體類別
/// <reference path="../../../core/Index.ts" />

declare const bp: BPStudio;
declare type design = Design;
declare type settings = DisplaySetting;
declare type river = River;
declare type edge = Edge;
declare type flap = Flap;
declare type vertex = Vertex;

export {
	bp, design as Design,
	settings as DisplaySetting,
	river as River,
	edge as Edge,
	flap as Flap,
	vertex as Vertex
};
