import { Diagnose } from "../Diagnose";
import * as Settings from "../Settings";
import { PolyBool } from "bp/math";
import type { Path } from "bp/math";

/** 特別用來標注某一項計算屬性經過實驗顯示不用進行比較檢查 */
export const noCompare = shrewd;

/** 比較有分順序的陣列 */
export function orderedArray(msg?: string): PropertyDecorator;
export function orderedArray(target: object, prop: string | symbol): void;
export function orderedArray(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<unknown> = {
		comparer: (ov: unknown[], nv: unknown[], member) => {
			if(ov === nv) return true;
			let result = Shrewd.comparer.array(ov, nv);
			if(Settings.diagnose && result && msg) {
				// if(msg=="sheet.independents") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				Diagnose.count(msg);
			}
			return result;
		},
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

/** 比較不分順序的陣列 */
export function unorderedArray(msg?: string): PropertyDecorator;
export function unorderedArray(target: object, prop: string | symbol): void;
export function unorderedArray(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<unknown> = {
		comparer: (ov: unknown[], nv: unknown[], member) => {
			if(ov === nv) return true;
			let result = Shrewd.comparer.unorderedArray(ov, nv);
			if(Settings.diagnose && result && msg) {
				// if(msg=="sheet.independents") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				Diagnose.count(msg);
			}
			return result;
		},
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

/** 比較 {@link PolyBool} shape 一致 */
export function shape(msg?: string): PropertyDecorator;
export function shape(target: object, prop: string | symbol): void;
export function shape(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<PolyBool.Shape> = {
		comparer: (ov: PolyBool.Shape, nv: PolyBool.Shape, member) => {
			if(ov === nv) return true;
			if(!ov != !nv) return false;
			if(!ov) return true;
			let result = PolyBool.compare(ov, nv);
			if(Settings.diagnose && result && msg) {
				// if(msg == "staticClosure") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				Diagnose.count(msg);
			}
			return result;
		},
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

/** 比較路徑一致 */
export function path(msg?: string): PropertyDecorator;
export function path(target: object, prop: string | symbol): void;
export function path(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<Path> = {
		comparer: (ov: Path, nv: Path, member) => {
			member.ov = ov;
			if(ov === nv) return true;
			if(!ov != !nv) return false;
			if(!ov) return true;
			if(ov.length != nv.length) return false;
			for(let i = 0; i < ov.length; i++) {
				if(!ov[i].eq(nv[i])) return false;
			}
			if(Settings.diagnose && msg) {
				// if(msg == "qc") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				Diagnose.count(msg);
			}
			return true;
		},
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}
