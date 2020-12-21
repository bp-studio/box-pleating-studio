function DoubleMapBasic() {
	
	let m = new DoubleMap<string, number>();
	m.set("a", "b", 2);
	console.assert(m.has("a", "b") && m.has("b", "a"));
	console.assert(m.get("b", "a") == 2);

	m.set("a", "c", 3);
	console.assert(m.size == 2);
	console.assert(!m.has("b", "c"));

	// DoubleMap 的 key 可以一樣，此時不應該算成兩個資料
	m.set("c", "c", 5);
	console.assert(m.size == 3);

	// 測試 DoubleMap 作為 Iterable
	let n = 1;
	for(let [k1, k2, v] of m) n *= v;
	console.assert(n == 30);

	// 測試刪除
	m.delete("c", "a");
	console.assert(!m.has("a", "c"));
	console.assert(m.size == 2);
}