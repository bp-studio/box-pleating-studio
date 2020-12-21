/// <reference path="../../../core/BPStudio.ts" />
/// <reference path="../../../core/core/Design.ts" />
/// <reference path="../../../core/core/Display.ts" />

import * as Shrewd from '../../../core/global/shrewd';

declare const bp: BPStudio;
declare type design = Design;
declare type settings = DisplaySetting;

export { bp, Shrewd, design as Design, settings as DisplaySetting };
