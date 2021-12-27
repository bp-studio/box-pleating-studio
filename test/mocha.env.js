const Shrewd = require('../lib/shrewd');

process.env.NODE_ENV = 'test';
process.env.TS_NODE_PROJECT = 'test/tsconfig.json';

Shrewd.option.autoCommit = false;
globalThis.Shrewd = Shrewd;
globalThis.shrewd = Shrewd.shrewd;
globalThis.terminate = Shrewd.terminate;
