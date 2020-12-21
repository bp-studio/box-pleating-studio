function DoubleMapReact() {

	class A {
		public map: DoubleMap<string, number> = new DoubleMap();

		constructor() {
			this.has();
		}

		@shrewd private has() {
			log.add("has");
			this.map.has("a");
		}
	}

	var log = new Set<string>();
	function getLog() {
		let result = [...log].sort().join(",");
		log.clear();
		return result;
	}

	var a = new A();
	getLog();

	a.map.set("a", "b", 12);
	Shrewd.commit();

	console.log(getLog());
}