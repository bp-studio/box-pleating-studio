if(typeof Shrewd != "object") throw new Error("BPStudio requires Shrewd.");

const { shrewd } = Shrewd;

const diagnose = false;

function unorderedArray(msg?: string) {
	return shrewd({
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
	});
}
function segment(msg?: string) {
	return shrewd({
		comparer: (ov: PolyBool.Segments, nv: PolyBool.Segments, member) => {
			if(ov === nv) return true;
			if(!ov != !nv) return false;
			if(!ov) return true
			let result = PolyBool.compare(ov, nv);
			if(diagnose && result && msg) {
				// if(msg == "contour") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return result;
		}
	});
}

function path(msg?: string) {
	return shrewd({
		comparer: (ov: Path, nv: Path, member) => {
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
	});
}

Shrewd.option.debug = diagnose;
Shrewd.option.autoCommit = false;

/** 全域的 debug 用變數 */
let debug = false;
