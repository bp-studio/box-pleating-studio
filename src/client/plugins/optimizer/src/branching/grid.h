
#pragma once

/**
 * Shared utilities for the integer grid stages (fitting and tidying).
 * Everything here is in exact integer arithmetic.
 */

#include "class/hierarchy.h"

#include <bit>
#include <cstdint>
#include <vector>

using namespace std;

/** A domain is represented as a bit mask over the candidate list of a variable. */
using Mask = uint64_t;

constexpr int MAX_DOMAIN_SIZE = 64;

/** The mask with only the given bit set. */
inline Mask bit(const int a) {
	return static_cast<Mask>(1) << a;
}

/** The mask with the lowest `count` bits set. */
inline Mask full_mask(const int count) {
	return count == MAX_DOMAIN_SIZE ? ~static_cast<Mask>(0) : bit(count) - 1;
}

/** The lowest set bit of a (non-zero) mask. */
inline Mask lowest_bit(const Mask m) {
	return m & (~m + 1);
}

/** An integral grid location. */
struct Candidate {
	int x;
	int y;
};

/** An integral layout: grid coordinates (2 entries per flap) and the sheet size. */
struct GridLayout {
	vector<int> grid;
	int size = 0;

	Candidate at(const int i) const {
		return {.x = grid[i * 2], .y = grid[i * 2 + 1]};
	}
};

inline int64_t square(const int64_t v) {
	return v * v;
}

/** Signed distance between two intervals (see RoundedConstraint). Integer version. */
inline int interval_distance(const int l1, const int w1, const int l2, const int w2) {
	return max(l1 - l2 - w2, 0) + min(l1 + w1 - l2, 0);
}

/** Signed distance between two intervals (see RoundedConstraint). Real version. */
inline double interval_distance(const double l1, const double w1, const double l2, const double w2) {
	return max(l1 - l2 - w2, 0.0) + min(l1 + w1 - l2, 0.0);
}

/** Whether the distance constraint between two flaps is satisfied at the given locations. */
inline bool compatible(const Flap &fi, const Candidate &a, const Flap &fj, const Candidate &b, const int dist) {
	const int64_t dx = interval_distance(a.x, fi.width, b.x, fj.width);
	const int64_t dy = interval_distance(a.y, fi.height, b.y, fj.height);
	return dx * dx + dy * dy >= square(dist);
}

/**
 * The area of the junction between two flaps at the given locations,
 * or 0 if there is no (valid) junction between them.
 * See `createJunction` in the Core for the definition.
 */
inline int64_t junction_area(const Flap &fi, const Candidate &a, const Flap &fj, const Candidate &b, const int dist) {
	const int sx = abs(interval_distance(a.x, fi.width, b.x, fj.width));
	const int sy = abs(interval_distance(a.y, fi.height, b.y, fj.height));
	if(sx == 0 || sy == 0 || sx >= dist || sy >= dist) return 0;
	return static_cast<int64_t>(dist - sx) * (dist - sy);
}

/** Verify a layout against all constraints. */
inline bool verify_layout(const GridLayout &layout, const Hierarchy *hierarchy) {
	const auto &flaps = hierarchy->flaps;
	for(int i = 0; i < Shared::flap_count; i++) {
		const auto c = layout.at(i);
		if(!hierarchy->sheet->int_contains(c.x, c.y, flaps[i], layout.size)) return false;
	}
	for(const auto &[i, j, dist]: hierarchy->dist_map) {
		if(!compatible(flaps[i], layout.at(i), flaps[j], layout.at(j), dist)) return false;
	}
	return true;
}
