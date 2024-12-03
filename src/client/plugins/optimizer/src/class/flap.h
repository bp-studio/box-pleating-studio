
#pragma once

struct Flap {
	const int id;
	const int width;
	const int height;

	bool has_dimension() const {
		return height != 0 && width != 0;
	}
};
