class Problem:
	def __init__(self, data):
		self.type = data.get("type")
		self.flaps = [Flap(f) for f in data.get("flaps")]
		self.dist_map = data.get("distMap")


class Flap:
	def __init__(self, dimensions):
		if "width" in dimensions and "height" in dimensions:
			self.width = dimensions["width"]
			self.height = dimensions["height"]
		else:
			raise ValueError("Invalid data")

	def has_dimension(self) -> bool:
		return self.height != 0 or self.width != 0
