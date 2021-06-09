
function PatternTest() {
	let file = require('./PatternTest.json');
	let design = studio.$load(file);
	Shrewd.commit();

	console.assert(design.$stretches.size == 1, "應該要找到一個伸展", design.$stretches.size);

	let stretch = design.$stretches.values().next().value as Stretch;

	console.assert(stretch.$signature == "0,6,7", "伸展模式的簽章正確", stretch.$signature);
	console.assert(stretch.$repository!.size == 1);

	let configuration = stretch.$repository!.$get(0)!;
	console.assert(configuration.size == 12, "依照現有的演算法應該要找到這麼多的 Pattern");

	configuration.move(-1);
	let pattern = configuration.entry!;

	console.assert(pattern.$devices.length == 1, "有一個 Device");

	let device = pattern.$devices[0];

	let ridges = '(0, 27),(1, 25);(0, 27),(24, 19);(1, 25),(10, 4);(1, 25),(27/4, 85/4);(1, 25),(8, 21);(10, 4),(15, 2);(15, 2),(27/4, 85/4);(24, 19),(26, 15);(26, 15),(8, 21);(27/4, 85/4),(8, 21)';
	let outerRidges = '(0, 27),(0, 27);(12, 16),(27/4, 85/4);(15, 2),(15, 2);(26, 15),(26, 15)';

	console.assert(LineUtil.signature(device.$ridges) == ridges, "檢查脊線");
	console.assert(LineUtil.signature(device.$outerRidges) == outerRidges, "檢查外連脊線");
}
