
# Test

This section contains the unit tests and integration tests for BP Studio.

We use [Mocha](https://mochajs.org/) for testing the core algorithms.
The preferred way to run them is by using the
[Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter) extension of VS Code.
Alternatively, run `pnpm test` in the console to run all tests.

## Fuzzing the Core

`test/utils/fuzz.ts` is a deterministic fuzzer for the Core tree/layout
pipeline. It drives the same Client-facing controllers a real user would
(dragging, adding/removing leaves, joining nodes) with random-but-reproducible
operation sessions. Every session is fully determined by its integer seed, so
any crashing session can be replayed from the seed alone, and its recorded
operation log can be delta-debugged (`minimizeOps`) into a minimal reproduction.

This is how a rare rebalancing crash (a stale rough contour left on the root,
originally seen in a build-1898 crash report) was found reproducible. See the
usage example in the header of `test/utils/fuzz.ts` for how to hunt for new
crashing sequences: `runFuzzSession` searches by seed, and `minimizeOps`
delta-debugs a hit into a minimal op list ready to paste into a regression
test (replayed via `replayOps`). The guarding spec for that particular bug is
`"Holds no rough contour on the root, ..."` in `test/specs/tree.spec.ts`.
