/* eslint-disable no-await-in-loop */

/// <reference path="Import.ts" />
/// <reference path="mock/MockStudio.ts" />

const studio = new MockStudio();

// To enable this feature, use `"console": "integratedTerminal"` in launch.json.
let isTTY = process.stdout.isTTY;

function log(s: string): void {
	if(isTTY) {
		process.stdout.clearLine(-1);
		process.stdout.cursorTo(0);
		process.stdout.write(s);
	} else {
		console.log(s); // Fallback log for non-TTY console
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => { setTimeout(resolve, ms); });
}

const Color = require('ansi-colors');

class TestUtil {

	public static consoleHack: boolean;

	public static warnings: unknown[];

	public static async run(tests: Function[]): Promise<void> {
		let assert = console.assert;
		let warn = console.warn;
		let pass: boolean = true;

		console.assert = (a: boolean, ...obj: unknown[]) => {
			assert(a, ...obj);
			if(!a) {
				debugger;
				// eslint-disable-next-line no-throw-literal
				throw true;
			}
		};

		console.warn = (m: unknown) => {
			if(TestUtil.consoleHack) TestUtil.warnings.push(m);
			else warn(m);
		};

		for(let test of tests) {
			try {
				log(Color.cyan(`Testing: ${test.name} `));
				TestUtil.warnings = [];
				this.consoleHack = false;
				await test();
				if(isTTY) await sleep(25); // To provide better feedback that the tests are really running.
			} catch(e) {
				if(e instanceof Error) console.error(e);
				log(Color.bold.red(`${test.name} : failed `));
				pass = false;
				break;
			}
		}
		if(pass) log(Color.bold.green("All tests succeeded.\n\n"));

		console.assert = assert;
		console.warn = warn;
	}
}

TestUtil.run([
	TreeBasic,
	DoubleMapBasic,
	DoubleMapReact,
	PatternTest,
]);
