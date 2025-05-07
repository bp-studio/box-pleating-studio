
#include "problem.h"
#include "sheet/diag.h"
#include "sheet/rect.h"

Problem::Problem(const emscripten::val &data) {
	int type = data["type"].as<int>();
	const Sheet *sheet = type == 1 ? Rect::getInstance() : Diag::getInstance();

	auto array = data["hierarchies"];
	int hierarchy_count = array["length"].as<int>();
	for(int i = 0; i < hierarchy_count; i++) {
		hierarchies.emplace_back(array[i], sheet);
	}

	array = data["flaps"];
	Hierarchy &last_hierarchy = hierarchies.back();
	int flap_count = array["length"].as<int>();
	Shared::setup(flap_count);

	last_hierarchy.flaps.clear();
	last_hierarchy.flaps.reserve(flap_count);
	for(int i = 0; i < flap_count; i++) {
		auto flap = array[i];
		int id = flap["id"].as<int>();
		int width = flap["width"].as<int>();
		int height = flap["height"].as<int>();
		last_hierarchy.flaps.emplace_back(id, width, height);
	}
}
