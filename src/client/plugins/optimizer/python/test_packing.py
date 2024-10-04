import json
import random
import math
import time
import numpy as np
from scipy.optimize import minimize
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
from matplotlib.lines import Line2D

ALPHA = 100  # Smoothing factor for smooth_max. Higher is more accurate but less smooth
# TODO: perhaps alpha should be a function of the path lengths
B = 0.1  # how far away is it ok to not be a 45 degree path. >0.1
K = 2  # how quickly to be ok with not being a 45 degree path. Must be even int (is an exponent)
C_1 = 1
C_2 = 1
with open("abc_table.json", "r") as file:
    abc_table = json.load(file)
OCT_BASES = (
    (1, 0),
    (1 / 2**0.5, 1 / 2**0.5),
    (0, 1),
    (-1 / 2**0.5, 1 / 2**0.5),
    (-1, 0),
    (-1 / 2**0.5, -1 / 2**0.5),
    (0, -1),
    (1 / 2**0.5, -1 / 2**0.5),
)  # xyzw bases
HP_BASES = (
    (3**0.5 / 2,0.5), (0,1), (-3**0.5 / 2,0.5), (-3**0.5 / 2,-0.5), (0,-1), (3**0.5 / 2,-0.5)
)  # hp bases
BP_BASES = ((1, 0), (0, 1), (-1, 0), (0, -1))  # bp bases



# main function
def pack(tree,nodes, mode, x0=None):
    """Pack a set of flaps with given lengths using scipy's solver. For circle packing, mode="circle", hp mode="hp", bp mode="bp", and 22.5 mode="22.5"."""
    if x0 is None:
        x0 = []
        for _ in nodes:
            x0 += [random.random(), random.random()]
            # bounds += [(0, 1), (0, 1)]
        all_edges = sum([sum(node.edge_lengths) for node in tree.all_nodes])
        x0.append(2/all_edges)
    bounds = []
    for _ in nodes:
        bounds += [(0, 1), (0, 1)]
    bounds.append((None, None))
    cons = [{"type": "ineq", "fun": lambda x: x[-1]}]

    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            # uix = x[i*2]
            # uiy = x[i*2+1]
            # ujx = x[j*2]
            # ujy = x[j*2+1]
            # dx = x[i*2] - x[j*2]
            # dy = x[i*2+1] - x[j*2+1]
            # L = nodes[i].length+nodes[j].length#tree.find_distance(nodes[i], nodes[j])
            if mode in {"circle", "bp pythas"}:
                # Usual circle packing no-overlap constraint:
                cons.append(
                    {
                        "type": "ineq",
                        "fun": lambda x, i=i, j=j: distance(
                            x[i * 2], x[i * 2 + 1], x[j * 2], x[j * 2 + 1]
                        )
                        - x[-1] *tree.find_distance(nodes[i], nodes[j]),
                    }
                )
            if mode == "bp":
                # Polygon packing no-overlap constraint:
                cons.append(
                    {
                        "type": "ineq",
                        "fun": lambda x, i=i, j=j: smooth_max(
                            [
                                dot(
                                    x[i * 2] - x[j * 2],
                                    x[i * 2 + 1] - x[j * 2 + 1],
                                    basis[0],
                                    basis[1],
                                )
                                for basis in BP_BASES
                            ],
                            alpha=ALPHA,
                        )
                        - x[-1] * tree.find_distance(nodes[i], nodes[j]),
                    }
                )
            if mode == "hp":
                cons.append(
                    {
                        "type": "ineq",
                        "fun": lambda x, i=i, j=j: smooth_max(
                            [
                                dot(
                                    x[i * 2] - x[j * 2],
                                    x[i * 2 + 1] - x[j * 2 + 1],
                                    basis[0],
                                    basis[1],
                                )
                                for basis in HP_BASES
                            ],
                            alpha=ALPHA,
                        )
                        - x[-1] * tree.find_distance(nodes[i], nodes[j]),
                    }
                )
            if mode == "22.5":
                cons.append(
                    {
                        "type": "ineq",
                        "fun": lambda x, i=i, j=j: smooth_max(
                            [
                                dot(
                                    x[i * 2] - x[j * 2],
                                    x[i * 2 + 1] - x[j * 2 + 1],
                                    basis[0],
                                    basis[1],
                                )
                                for basis in OCT_BASES
                            ],
                            alpha=ALPHA,
                        )
                        - x[-1] * tree.find_distance(nodes[i], nodes[j]),
                    }
                )
                # Or, that + encourage active paths to be 45 degree creases:
                # cons.append({'type':'ineq', 'fun': lambda x, i=i, j=j:
                #     ((x[i*2]-x[j*2])**2+(x[i*2+1]-x[j*2+1])**2)**0.5 -
                #     x[-1]*(flap_lengths[i] + flap_lengths[j])*(B+1-B*math.cos(4*math.atan2(x[i*2+1]-x[j*2+1],x[i*2]-x[j*2]))**K)
                # })

    def objective(x):
        scale = x[-1]
        if mode in {"circle", "22.5"}:
            return -1 * scale
        if mode in {"bp", "bp pythas"}:
            return (
                -1
                * scale
                * (C_1 + np.cos(np.pi * 1 / scale) ** 2)
                * np.sum(np.cos(np.pi * x[:-1] / scale) ** 2 + C_2)
            )
        if mode == "hp":
            return (
                -1
                * scale
                * (C_1 + np.cos(np.pi * 2 / (scale*3**0.5)) ** 2)
                * np.sum(
                    [(np.cos(np.pi/scale*(x[i*2+1]+x[i*2]/(3**0.5)))*
                    np.cos(np.pi/scale*(x[i*2+1]-x[i*2]/(3**0.5))))**2 +C_2 
                    for i in range(len(nodes))]
                )
            ) 
    solution = minimize(objective, x0, bounds=bounds, constraints=cons)
    return solution.x

#============ Tree structure

class Node:
    def __init__(self, x=0.5, y=0.5):
        self.parent = None
        self.length = None
        self.children = []
        self.edge_lengths = []
        self.x = x
        self.y = y
    def add_child(self, child_node, edge_length):
        child_node.parent = self
        child_node.length = edge_length
        self.children.append(child_node)
        self.edge_lengths.append(edge_length)
        return child_node

class Tree:
    def __init__(self):
        self.root = Node()
        self.scale = 0.1  # flap's cp length = scale*flap length

    def get_nodes(self):
        print(self)
        all_nodes = []
        leaf_nodes = []

        def traverse(node):
            all_nodes.append(node)
            if len(node.children) == 0:
                leaf_nodes.append(node)
                return
            for child in node.children:
                traverse(child)

        traverse(self.root)
        self.all_nodes = all_nodes
        self.leaf_nodes = leaf_nodes
        return leaf_nodes

    # Helper method to find the path from root to a given node
    def find_path(self, root, target_node, path=None):
        if path is None:
            path = []
        if root is None:
            return False
        path.append(root)
        if root == target_node:
            return True
        for child in root.children:
            if self.find_path(child, target_node, path):
                return True
        path.pop()
        return False

    # Helper method to find the Lowest Common Ancestor (LCA) of two nodes
    def find_lca(self, root, node1, node2):
        path1 = []
        path2 = []
        if not self.find_path(root, node1, path1) or not self.find_path(root, node2, path2):
            return None
        i = 0
        while i < len(path1) and i < len(path2):
            if path1[i] != path2[i]:
                break
            i += 1
        return path1[i - 1]

    # Method to calculate the distance between two nodes
    def find_distance(self, node1, node2):
        lca = self.find_lca(self.root, node1, node2)
        if not lca:
            return -1

        def distance_to_lca(node, lca):
            distance = 0
            while node != lca:
                if node.parent is None:
                    break
                parent_index = node.parent.children.index(node)
                distance += node.parent.edge_lengths[parent_index]
                node = node.parent
            return distance

        return distance_to_lca(node1, lca) + distance_to_lca(node2, lca)

def tree_distance(node1, node2):
    distance = 0
    current_node = node1
    while current_node != node2:
        min_distance = float('inf')
        min_index = -1
        for i, child in enumerate(current_node.children):
            child_distance = tree_distance(child, node2)
            if child_distance < min_distance:
                min_distance = child_distance
                min_index = i
        distance += current_node.edge_lengths[min_index]
        current_node = current_node.children[min_index]
    return distance

# ============math helper functions
def smooth_max(x, alpha=ALPHA):
    """Smooth approximation of the maximum of a list of values."""
    return np.log(np.sum(np.exp(alpha * np.array(x)))) / alpha


def distance(x1, y1, x2, y2):
    """Euclidean distance between two points"""
    return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5


def dot(x1, y1, x2, y2):
    """Dot product of two vectors."""
    return x1 * x2 + y1 * y2


def dec2abc(target, abc_table=abc_table):
    """
    For 22.5 refs: convert points from their decimal locations to their nearest locations in the form (a+b*sqrt(2))/c
    """
    keys = list(map(float, abc_table.keys()))
    keys.sort()  # Ensure keys are sorted

    # Binary search, using initial estimate of the index assuming an even distribution of keys
    left = max(0, 0)
    right = min(len(keys) - 1, len(keys) - 1)

    while left < right:
        mid = (left + right) // 2
        if keys[mid] == target:
            if keys[mid] == 0:
                return [0, 0, 1]
            if keys[mid] == 1:
                return [1, 0, 1]
            return abc_table[keys[mid]]
        if keys[mid] < target:
            left = mid + 1
        else:
            right = mid

    # After the loop, left should be the closest index
    if left == 0 or (
        left < len(keys) and abs(keys[left] - target) < abs(keys[left - 1] - target)
    ):
        closest_key = keys[left]
    else:
        closest_key = keys[left - 1]

    if closest_key == 0:
        output = [0, 0, 1]
    elif closest_key == 1:
        output = [1, 0, 1]
    else:
        output = abc_table[str(closest_key)]

    return output


# =============Display functions
def create_polygon(center, radius, n):
    """Create the vertices of an octagon centered at `center` with the given `radius` (inscribed circle radius)."""
    vertex_radius = radius / np.cos(
        np.pi / n
    )  # Adjust radius to be from center to vertex
    angles = (
        np.linspace(0, 2 * np.pi, n + 1)[:-1] + np.pi / n + np.pi/2
    )  # 8 angles for the octagon, rotated by 22.5 degrees
    vertices = [
        (
            center[0] + vertex_radius * np.cos(angle),
            center[1] + vertex_radius * np.sin(angle),
        )
        for angle in angles
    ]
    return vertices


def display_multiple(x_list,nodes_list, ngon=8):
    """Display multiple solutions in a grid of plots."""
    num_plots = len(x_list)
    num_cols = math.ceil(math.sqrt(num_plots))
    num_rows = math.ceil(num_plots / num_cols)

    _, axs = plt.subplots(num_rows, num_cols, figsize=(5 * num_cols, 5 * num_rows))
    axs = axs.flatten()  # Flatten the array of axes for easy iteration

    for idx, (x, nodes) in enumerate(zip(x_list, nodes_list)):
        scale = x[-1]
        if ngon==6:
            grid = 2/(scale*3**0.5)
        else:
            grid = 1/scale
        ax = axs[idx]
        if ngon==4:
            # Draw the grid
            for i in range(1, int(grid)+1):
                ax.axhline(y=i*scale, color="grey", linestyle="-",linewidth=0.5)
                ax.axvline(x=i * scale, color="grey", linestyle="-",linewidth=0.5)
        if ngon==6:
            # Draw the hex grid
            for i in range(1, int(grid)+1):
                # ax.axhline(y=i*scale*3**0.5, color="grey", linestyle="-",linewidth=0.5)
                ax.axvline(x=i/grid, color="grey", linestyle="-",linewidth=0.25)
            for i in range(int(-grid*3**0.5),int(grid*(1+3**0.5)),2):
                ax.add_line(Line2D(
                    [i/grid,i/grid+3**0.5],
                    [0,1],
                    color="grey", linestyle="-",linewidth=0.25
                ))
                ax.add_line(Line2D(
                    [i/grid,i/grid-3**0.5],
                    [0,1],
                    color="grey", linestyle="-",linewidth=0.25
                ))
        for j,node in enumerate(nodes):
            center = (x[j * 2], x[j * 2 + 1])
            parent_index = node.parent.children.index(node)
            radius = node.parent.edge_lengths[parent_index]*scale
            #TODO: this may not work if the root node is a leaf node
            if ngon:
                polygon_points = create_polygon(center, radius, ngon)
                polygon = Polygon(
                    polygon_points, fill=False, edgecolor="blue"
                )
                ax.add_artist(polygon)
                # lines = []
                for i in range(ngon // 2):
                    start_point = polygon_points[i]
                    end_point = polygon_points[i + ngon // 2]
                    line = Line2D([start_point[0], end_point[0]], [start_point[1], end_point[1]], color="red")
                    ax.add_artist(line)
                    # lines.append(line)

            point = plt.Circle(center, 0.01, color="black")
            circle = plt.Circle(center, radius, fill=False, edgecolor="grey")
            ax.add_artist(point)
            ax.add_artist(circle)
        ax.set_aspect("equal")
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.set_title(f"Scale: {x[-1]:.3f},grid:{grid:.3f}")

    plt.show()


# ============== Example usage ==============
N = 5
n = 6
tree = Tree()
tree.root.add_child(Node(), 3)
tree.root.add_child(Node(), 3)
tree.root.add_child(Node(), 6)
tree.root.add_child(Node(), 6)
node2 = Node()
tree.root.add_child(node2, 9)
node2.add_child(Node(), 9)
node2.add_child(Node(), 9)
node2.add_child(Node(), 6)
node2.add_child(Node(), 3)
node2.add_child(Node(), 9)
node2.add_child(Node(), 9)
node2.add_child(Node(), 6)
node2.add_child(Node(), 3)
nodes = tree.get_nodes()

t0 = time.time()
x_list = [pack(tree,nodes, mode="circle") for _ in range(N)]
top_n_solutions = sorted(x_list, key=lambda x: x[-1], reverse=True)[:n]

# oct_list = [pack(tree,nodes, mode="hp", x0=top_solution) for nodes, top_solution in zip([nodes]*N, top_n_solutions)]
print(f"Time taken: {time.time() - t0:.2f}s")
display_multiple(top_n_solutions, [nodes]*n, ngon=None)
