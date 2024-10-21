from typing import cast


class Problem:
	def __init__(self, data: dict):
		self.type = cast(str, data.get("type"))
		self.hierarchies = [Hierarchy(h) for h in cast(list[dict], data.get("hierarchies"))]
		self.hierarchies[-1].flaps = [Flap(f) for f in cast(list[dict], data.get("flaps"))]


class Hierarchy:
	def __init__(self, data: dict):
		id_map: dict[int, int] = {}
		id_lookup: dict[int, int] = {}
		self.flaps: list[Flap] = []
		for l_id in cast(list[int], data.get("leaves")):
			next_id = len(id_map)
			id_map[l_id] = next_id
			id_lookup[next_id] = l_id
			self.flaps.append(Flap({"id": l_id, "width": 0, "height": 0}))

		dist_map = cast(list[list[int]], data.get("distMap"))
		for d_map in dist_map:
			d_map[0] = id_map[d_map[0]]
			d_map[1] = id_map[d_map[1]]

		self.dist_map = dist_map
		self.lookup = id_lookup
		self.parents = [Parent(p) for p in cast(list[dict], data.get("parents"))]

		parent_map: dict[int, Parent] = {}
		for parent in self.parents:
			for l_id in parent.children:
				parent_map[l_id] = parent
		self.parent_map = parent_map

	def restore(self, x: list[int]) -> list[dict]:
		flap_count = len(self.lookup)
		return [{"id": self.lookup[i], "x": x[i * 2], "y": x[i * 2 + 1]} for i in range(flap_count)]


class Parent:
	def __init__(self, data: dict):
		self.id = cast(int, data.get("id"))
		self.radius = cast(float, data.get("radius"))
		self.children = cast(list[int], data.get("children"))


class Flap:
	def __init__(self, data: dict):
		self.id = cast(int, data["id"])
		self.width = cast(int, data["width"])
		self.height = cast(int, data["height"])

	def has_dimension(self) -> bool:
		return self.height != 0 or self.width != 0


class Circle:
	def __init__(self, x: float, y: float, radius: float):
		self.x = x
		self.y = y
		self.radius = radius
