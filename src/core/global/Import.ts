if(typeof Shrewd != "object") throw new Error("BPStudio requires Shrewd.");

const { shrewd } = Shrewd;
Shrewd.option.debug = true;

const diagnose = false;

function unorderedArray(msg?: string) {
	return shrewd({
		comparer: (ov: any[], nv: any[], member) => {
			let result = Shrewd.comparer.unorderedArray(ov, nv);
			if(diagnose && result && msg) {
				// if(msg=="qvj") {
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
		comparer: (ov: PolyBool.Segments, nv: PolyBool.Segments) => {
			if(!ov != !nv) return false;
			if(!ov) return true
			let result = PolyBool.compare(ov, nv);
			if(diagnose && result && msg) console.log(msg);
			return result;
		}
	});
}

// 目前的實驗結果是這樣：如果打開自動認可，
// 那麼當 chrome 開啟 debug 模式的時候會明顯感覺得到比較卡，
// 但如果不開啟 debug 模式，那即使打開自動認可，在桌機上跑也不會卡。
Shrewd.option.autoCommit = false;
setInterval(() => Shrewd.commit(), 50);

/** 全域的 debug 用變數 */
let debug = false;
