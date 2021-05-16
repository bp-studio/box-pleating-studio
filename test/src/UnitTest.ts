/// <reference path="Import.ts" />


/// <reference path="mock/MockStudio.ts" />

const studio = new MockStudio();

class UnitTest {

	public static consoleHack: boolean;

	public static warnings: unknown[];

	public static run(tests: Function[]) {
		let assert = console.assert;
		let warn = console.warn;
		let pass: boolean = true;
		console.assert = (a: boolean, ...obj: unknown[]) => {
			assert(a, ...obj);
			// eslint-disable-next-line no-throw-literal
			if(!a) throw true;
		};
		console.warn = (m: unknown) => {
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
	DoubleMapReact,
]);
