
# Contributing Guidelines

BP Studio is developed using [VS Code](https://code.visualstudio.com/),
and the project folder is already configured for it.

## Contributing new languages

Please refer to the readme of the [Locale](src/locale/README.md) section.

## Environment and build instructions

To build BP Studio, first you need the following:

1. Install [Node.js](https://nodejs.org/).
1. BP Studio had migrated from NPM to PNPM for package managing, so install [PNPM](https://pnpm.io/) by the command `npm install -g pnpm`.
1. Install [TypeScript](https://www.typescriptlang.org/) globally by the command `pnpm add -g typescript`.
1. Install [Gulp](https://www.npmjs.com/package/gulp) globally by the command `pnpm add -g gulp-cli`.
1. Use the command `pnpm install` under the project root folder to install all dependencies.

And then you can simply press `F5` in VS Code to build and launch the app automatically.
This is the preferred way to launch as it adds additional parameters for launching Chrome to ensure all functionalities work properly in local environment.

Alternatively, run `gulp` (or `gulp default`) to build the entire project manually,
and use any browser to open `debug/index.htm` (or `dist/index.htm` if debug is not needed) to run it.
Some of the features may not work with this approach though.

Typically the default task is sufficient for developing purpose,
and you won't need to execute individual subtask,
as all subtasks will skip themselves if the source files are not changed.
If something goes wrong, you can run `gulp clean` to cleanup built files and then rebuild everything.

## Browser compatibility

BP Studio have tried to support as much browser versions as possible,
but there are some essential barriers that cannot be compromised.
First of all, IE is obviously not supported as there're way too many modern
features that cannot be used. And then:

- Firefox < 78 and Safari < 11 does not support the `s` flag of regular expressions.
See [caniuse](https://caniuse.com/mdn-javascript_builtins_regexp_dotall).
- Chrome < 66 and Opera < 53 does not support `Array.prototype.values`.
See [caniuse](https://caniuse.com/mdn-api_headers_values).

Both these features are used in Vue 3, which is a critical dependency of BP Studio.
The second issue could be polyfilled,
but I see less point in doing so as those versions are old enough already,
while the first issue is impossible to polyfill.

There's currently no plans for officially supporting any browsers other than the major 5
(Chrome, Edge, Safari, Firefox and Opera).

## Unit testing

BP Studio specs and tests use [Mocha](https://mochajs.org/).
The preferred way to run them is by using the
[Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter) extension of VS Code.
Alternatively, run `pnpm test` in the console to run all tests.

## About the source code organization

BP Studio consists mainly of three parts:
the [App](src/app/README.md),
the [Client](src/client/README.md),
and the [Core](src/core/README.md).
Their relations can be roughly depicted as follows:

```mermaid
graph LR
	a("App\n(user interface)")
	b("Client\n(workspace)")
	c("Core\n(worker thread)")
	a -->|controls| b
	b -->|data| a
	b -->|manipulates| c
	c -->|graphics| b
```

Refer to each of them for more details.

**All comments are now in English!**
Feel free to contact me in any part of the code is unclear to you.
