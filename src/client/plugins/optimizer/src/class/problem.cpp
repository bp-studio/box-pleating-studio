
#include "problem.h"
#include "sheet/diag.h"
#include "sheet/rect.h"

Problem::Problem(double *&ptr) {
	int type = read(ptr);
	const Sheet *sheet = type == 1 ? Rect::getInstance() : Diag::getInstance();

	int hierarchy_count = read(ptr);
	for(int i = 0; i < hierarchy_count; i++) {
		hierarchies.emplace_back(ptr, sheet);
	}

	Hierarchy &last_hierarchy = hierarchies.back();
	int flap_count = read(ptr);
	Shared::setup(flap_count);

	last_hierarchy.flaps.clear();
	last_hierarchy.flaps.reserve(flap_count);
	for(int i = 0; i < flap_count; i++) {
		int id = read(ptr);
		int width = read(ptr);
		int height = read(ptr);
		last_hierarchy.flaps.emplace_back(id, width, height);
	}
}
