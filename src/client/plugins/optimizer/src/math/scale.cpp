
#include "scale.h"

/**
 * Solve quadratic equation to find the scale.
 * The equation is (s*dx-w)^2+(s*dy-h)^2 > dist^2.
 */
inline double solve_quadratic(const double &dx, const double &dy, const int &w, const int &h, const int &dist) {
	double a = dx * dx + dy * dy;
	double b = -2 * (w * dx + h * dy);
	double c = w * w + h * h - dist * dist;
	double d = b * b - 4 * a * c;
	return (-b + sqrt(d)) / 2 / a;
}

/**
 * Infer the minimal scale necessary for the distance constraint to be satisfied.
 */
inline double infer_scale(const vector<double> &x, const int &i, const int &j, const int &dist, const vector<Flap> &flaps) {
	double x1 = x[i * 2];
	double y1 = x[i * 2 + 1];
	double x2 = x[j * 2];
	double y2 = x[j * 2 + 1];
	int w = flaps[x2 > x1 ? i : j].width;
	int h = flaps[y2 > y1 ? i : j].height;
	double dx = abs(x2 - x1);
	double dy = abs(y2 - y1);
	double dh = dist + h;
	double dw = dist + w;

	// Degenerated cases
	if(dx == 0 && dy == 0) return MAX_INIT_SCALE;
	if(dx == 0 || dy * w > dh * dx) return dh / dy;
	if(dy == 0 || dx * h > dw * dy) return dw / dx;

	// Solve the quadratic equation
	return solve_quadratic(dx, dy, w, h, dist);
}

void setup_initial_scale(vector<double> &x0, const Hierarchy *hierarchy) {
	int grid = MIN_SHEET_SIZE;
	for(const auto &entry: hierarchy->dist_map) {
		auto [i, j, dist] = entry;
		double s = infer_scale(x0, i, j, dist, hierarchy->flaps);
		if(s >= MAX_INIT_SCALE) {
			grid = MAX_INIT_SCALE;
			break;
		}
		grid = max((int)ceil(s), grid);
	}
	x0[Shared::last] = 1.0 / grid;
}

const double GRID_ERROR = 1e-4;

int int_scale(double s) {
	return ceil(s - GRID_ERROR);
}
