class Problem:
	def __init__(self, data):
		self.type = data.get("type")
		self.hierarchies = [Hierarchy(h) for h in data.get("hierarchies")]
		self.hierarchies[-1].flaps = [Flap(f) for f in data.get("flaps")]


class Hierarchy:
	def __init__(self, data):
		id_map = dict()
		id_lookup = dict()
		self.flaps = []
		for id in data.get("leaves"):
			next_id = len(id_map)
			id_map[id] = next_id
			id_lookup[next_id] = id
			self.flaps.append(Flap({"id": id, "width": 0, "height": 0}))

		dist_map = data.get("distMap")
		for map in dist_map:
			map[0] = id_map[map[0]]
			map[1] = id_map[map[1]]

		self.dist_map = dist_map
		self.lookup = id_lookup
		self.parents = [Parent(p) for p in data.get("parents")]

		map = dict()
		for parent in self.parents:
			for id in parent.children:
				map[id] = parent
		self.parent_map = map

	def restore(self, x):
		flap_count = len(self.lookup)
		return [{"id": self.lookup[i], "x": x[i * 2], "y": x[i * 2 + 1]} for i in range(flap_count)]


class Parent:
	def __init__(self, data):
		self.id = data.get("id")
		self.radius = data.get("radius")
		self.children = data.get("children")


class Flap:
	def __init__(self, data):
		self.id = data["id"]
		if "width" in data and "height" in data:
			self.width = data["width"]
			self.height = data["height"]
		else:
			raise ValueError("Invalid data")

	def has_dimension(self) -> bool:
		return self.height != 0 or self.width != 0


class Circle:
	def __init__(self, x, y, radius):
		self.x = x
		self.y = y
		self.radius = radius
