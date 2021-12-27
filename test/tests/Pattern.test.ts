import * as file from "../samples/Pattern.test.json";
import { expect } from "chai";
import { Stretch } from "bp/design/layout/Stretch";
import { LineUtil } from "utils/LineUtil";
import { StudioBase } from "bp/env";

it("Pattern Test", () => {
	let studio = new StudioBase();
	let design = studio.$load(file);
	Shrewd.commit();

	expect(design.$stretches.size, "應該要找到一個伸展").to.equal(1);

	let stretch = design.$stretches.values().next().value as Stretch;

	expect(stretch.$signature, "伸展模式的簽章正確").to.equal("0,6,7");
	expect(stretch.$repository!.size).to.equal(1);

	let configuration = stretch.$repository!.$get(0)!;
	expect(configuration.size, "依照現有的演算法應該要找到這麼多的 Pattern").to.equal(12);

	configuration.move(-1);
	let pattern = configuration.entry!;

	expect(pattern.$devices.length, "有一個 Device").to.equal(1);

	let device = pattern.$devices[0];

	let ridges = '(0, 27),(1, 25);(0, 27),(24, 19);(1, 25),(10, 4);(1, 25),(27/4, 85/4);(1, 25),(8, 21);(10, 4),(15, 2);(15, 2),(27/4, 85/4);(24, 19),(26, 15);(26, 15),(8, 21);(27/4, 85/4),(8, 21)';
	let outerRidges = '(0, 27),(0, 27);(12, 16),(27/4, 85/4);(15, 2),(15, 2);(26, 15),(26, 15)';

	expect(LineUtil.signature(device.$ridges), "檢查脊線").to.equal(ridges);
	expect(LineUtil.signature(device.$outerRidges), "檢查外連脊線").to.equal(outerRidges);
});
