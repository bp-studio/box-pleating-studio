
#include "parent.h"
#include "global/global.h"

Parent::Parent(const emscripten::val &data) {
	id = data["id"].as<int>();
	radius = data["radius"].as<double>();

	auto array = data["children"];
	int child_count = array["length"].as<int>();
	children.reserve(child_count);
	for(int i = 0; i < child_count; i++) {
		children.push_back(array[i].as<int>());
	}
}
