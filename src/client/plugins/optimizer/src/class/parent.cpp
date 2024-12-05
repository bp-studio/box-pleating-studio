
#include "parent.h"
#include "global/global.h"

Parent::Parent(double *&ptr) {
	id = read(ptr);
	radius = read(ptr);

	int child_count = read(ptr);
	children.reserve(child_count);
	for (int i = 0; i < child_count; i++) {
		children.push_back(read(ptr));
	}
}
