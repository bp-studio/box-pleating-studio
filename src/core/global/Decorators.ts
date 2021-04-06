
/**
 * 特別用來標注某一個成員最後會被輸出到 Vue UI 上使用。
 *
 * 這樣的成員在重構的時候必須特別注意 UI 的串接要作對應的修改。
 */
function exported(target: object, prop: string | symbol) { }

/** 特別用來標注某一項計算屬性經過實驗顯示不用進行比較檢查 */
const noCompare = shrewd;

function orderedArray(msg?: string): PropertyDecorator;
function orderedArray(target: object, prop: string | symbol): void;
function orderedArray(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<any> = {
		comparer: (ov: any[], nv: any[], member) => {
			if(ov === nv) return true;
			let result = Shrewd.comparer.array(ov, nv);
			if(diagnose && result && msg) {
				// if(msg=="sheet.independents") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return result;
		}
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}


function unorderedArray(msg?: string): PropertyDecorator;
function unorderedArray(target: object, prop: string | symbol): void;
function unorderedArray(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<any> = {
		comparer: (ov: any[], nv: any[], member) => {
			if(ov === nv) return true;
			let result = Shrewd.comparer.unorderedArray(ov, nv);
			if(diagnose && result && msg) {
				// if(msg=="sheet.independents") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return result;
		}
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

function segment(msg?: string): PropertyDecorator;
function segment(target: object, prop: string | symbol): void;
function segment(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<any> = {
		comparer: (ov: PolyBool.Segments, nv: PolyBool.Segments, member) => {
			if(ov === nv) return true;
			if(!ov != !nv) return false;
			if(!ov) return true
			let result = PolyBool.compare(ov, nv);
			if(diagnose && result && msg) {
				// if(msg == "staticClosure") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return result;
		}
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

function path(msg?: string): PropertyDecorator;
function path(target: object, prop: string | symbol): void;
function path(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<Path> = {
		comparer: (ov: Path, nv: Path, member) => {
			(member as any).ov = ov;
			if(ov === nv) return true;
			if(!ov != !nv) return false;
			if(!ov) return true
			if(ov.length != nv.length) return false;
			for(let i = 0; i < ov.length; i++) {
				if(!ov[i].eq(nv[i])) return false;
			}
			if(diagnose && msg) {
				// if(msg == "qc") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return true;
		}
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}
