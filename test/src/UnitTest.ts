
/// <reference path="Import.ts" />

/// <reference path="../../src/core/class/disposable.ts" />
/// <reference path="../../src/core/model/Tree.ts" />
/// <reference path="../../src/core/model/TreeEdge.ts" />
/// <reference path="../../src/core/model/TreePath.ts" />
/// <reference path="../../src/core/model/TreeNode.ts" />
/// <reference path="../../src/core/global/Interface.ts" />
/// <reference path="../../src/core/mapping/BaseMapping.ts" />
/// <reference path="../../src/core/model/DoubleMap.ts" />
/// <reference path="../../src/core/mapping/DoubleMapping.ts" />

interface Console {
	// 這其實是合法的呼叫，但 lib.dom.d.ts 少了這個定義，所以在此補上
	assert(condition?: boolean, ...obj: any[]): void;
}

class UnitTest {

	public static consoleHack: boolean;

	public static warnings: string[];

	public static run(tests: Function[]) {
		let assert = console.assert;
		let warn = console.warn;
		let pass: boolean = true;
		console.assert = (a: boolean, ...obj: any[]) => { assert(a, ...obj); if(!a) throw true; }
		console.warn = (m: any) => {
			if(UnitTest.consoleHack) UnitTest.warnings.push(m);
			else warn(m);
		};
		for(let test of tests) {
			try {
				UnitTest.warnings = [];
				this.consoleHack = false;
				test();
			} catch(e) {
				if(e instanceof Error) console.error(e);
				console.log(`\x1b[31m${test.name} : failed\x1b[0m`);
				pass = false;
			}
		}
		if(pass) console.log("\x1b[32mAll tests succeeded.\x1b[0m");
		console.assert = assert;
		console.warn = warn;
	}
}

UnitTest.run([
	TreeBasic,
	DoubleMapBasic,
	DoubleMapReact
]);
