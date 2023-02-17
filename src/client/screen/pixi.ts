/**
 * We mimic the main package of Pixi.js to export a simplified global PIXI object,
 * in order to work with the Pixi inspector.
 */

import "@pixi/mixin-get-child-by-name";

export * from "@pixi/app";
export * from "@pixi/core";
export * from "@pixi/display";
export * from "@pixi/events";
export * from "@pixi/graphics";
export * from "@pixi/text";
