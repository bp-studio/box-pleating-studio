import math

from ..problem import Flap


def infer_scale(x: list[float], i: int, j: int, dist: int, flaps: list[Flap]) -> float:
	"""Infer the minimal scale necessary for the distance constraint to be satisfied."""
	x1, y1 = x[i * 2 : i * 2 + 2]
	x2, y2 = x[j * 2 : j * 2 + 2]
	w = flaps[i if x2 > x1 else j].width
	h = flaps[i if y2 > y1 else j].height
	dx = abs(x2 - x1)
	dy = abs(y2 - y1)

	# Degenerated cases
	if dx == 0 and dy == 0:
		return float("inf")
	if dx == 0 or dy * w > (dist + h) * dx:
		return (dist + h) / dy
	if dy == 0 or dx * h > (dist + w) * dy:
		return (dist + w) / dx

	return _solve_quadratic(dx, dy, w, h, dist)


def _solve_quadratic(dx, dy, w, h, dist):
	"""
	Solve quadratic equation to find the scale.
	The equation is (s*dx-w)^2+(s*dy-h)^2 > dist^2.
	"""
	a = dx * dx + dy * dy
	b = -2 * (w * dx + h * dy)
	c = w * w + h * h - dist * dist
	d = b * b - 4 * a * c
	return (-b + math.sqrt(d)) / 2 / a
