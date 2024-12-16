
#pragma once

struct Flap {
	int id;
	int width;
	int height;

	bool has_dimension() const {
		return height != 0 && width != 0;
	}
};
