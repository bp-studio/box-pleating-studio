
function PatternTest() {
	let file = require('../samples/PatternTest.json');
	let design = studio.$load(file);
	Shrewd.commit();

	console.assert(design.$stretches.size == 1, "應該要找到一個伸展", design.$stretches.size);

	let stretch = design.$stretches.values().next().value as Stretch;

	console.assert(stretch.$signature == "0,6,7", "伸展模式的簽章正確", stretch.$signature);
	console.assert(stretch.$repository!.size == 1);

	let configuration = stretch.$repository!.$get(0)!;
	console.assert(configuration.size == 12, "依照現有的演算法應該要找到這麼多的 Pattern");

	// 必須確實移動 Configuration 的選定 Entry，如此一來 Pattern 才會是 active、才會傳回 linesForTracing
	configuration.move(-1);
	let pattern = configuration.entry!;

	let test = pattern.$linesForTracing[1].map(l => l.toString()).join(";");
	let expect = '(0, 27),(1, 25);(1, 25),(8, 21);(26, 15),(8, 21);(24, 19),(26, 15);(0, 27),(24, 19);(10, 4),(15, 2);(15, 2),(27/4, 85/4);(1, 25),(27/4, 85/4);(1, 25),(10, 4);(27/4, 85/4),(8, 21);(-3, 46),(24, 19);(-17, 31),(10, 4);(24, 4),(27/4, 85/4);(-27, 54),(0, 27);(26, 15),(26, 15);(15, 2),(15, 2)';

	console.assert(test == expect, "算出來的線條符合已知結果");
}
