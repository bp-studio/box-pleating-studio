/**
 * 這個檔案指定了整個 core 專案裡面的所有檔案的編譯順序。
 *
 * 因為這裡面有一些順序其實是自訂出來的，這個檔案基本上難以用程式自動產生，
 * 所以暫時不考慮開發那樣的自動化工具。
 */

// Level 0
/// <reference path="global/import.ts" />
/// <reference path="global/Decorators.ts" />
/// <reference path="design/layout/models/Region.ts" />
/// <reference path="class/Disposable.ts" />
/// <reference path="util/PolyBool.ts" />
/// <reference path="design/command/Command.ts" />
/// <reference path="env/screen/Viewport.ts" />
/// <reference path="env/Studio.ts" />
/// <reference path="BPStudio.ts" />

// Level 1
/// <reference path="design/layout/models/Piece.ts" />
/// <reference path="design/layout/models/AddOn.ts" />
/// <reference path="class/mapping/DoubleMap.ts" />
/// <reference path="class/mapping/BaseMapping.ts" />
/// <reference path="class/mapping/DoubleMapping.ts" />
/// <reference path="class/math/Fraction.ts" />
/// <reference path="design/layout/calculation/Partitioner.ts" />
/// <reference path="design/layout/helper/RiverHelperBase.ts" />
/// <reference path="design/layout/helper/QuadrantHelper.ts" />
/// <reference path="design/command/FieldCommand.ts" />
/// <reference path="design/command/MoveCommand.ts" />
/// <reference path="design/command/EditCommand.ts" />
/// <reference path="env/screen/SheetImage.ts" />

// Level 2
/// <reference path="class/mapping/Mapping.ts" />
/// <reference path="class/mapping/GroupMapping.ts" />
/// <reference path="class/Mountable.ts" />
/// <reference path="design/schema/Tree.ts" />
/// <reference path="class/math/Couple.ts" />
/// <reference path="design/layout/calculation/Partition.ts" />
/// <reference path="design/layout/helper/RiverHelper.ts" />
/// <reference path="design/containers/JunctionContainer.ts" />
/// <reference path="env/screen/Workspace.ts" />

// Level 3
/// <reference path="design/Design.ts" />
/// <reference path="class/SheetObject.ts" />
/// <reference path="design/components/Sheet.ts" />
/// <reference path="view/classes/View.ts" />
/// <reference path="design/schema/TreeNode.ts" />
/// <reference path="design/schema/TreeEdge.ts" />
/// <reference path="class/math/Point.ts" />
/// <reference path="class/math/Vector.ts" />
/// <reference path="design/containers/BaseContainer.ts" />
/// <reference path="env/screen/Display.ts" />

// Level 4
/// <reference path="class/Control.ts" />
/// <reference path="design/components/Quadrant.ts" />
/// <reference path="design/layout/Stretch.ts" />
/// <reference path="design/layout/models/Pattern.ts" />
/// <reference path="design/layout/containers/Store.ts" />
/// <reference path="view/classes/ControlView.ts" />
/// <reference path="view/DragSelectView.ts" />
/// <reference path="view/SheetView.ts" />
/// <reference path="design/containers/StretchContainer.ts" />
/// <reference path="design/containers/EdgeContainer.ts" />
/// <reference path="design/containers/FlapContainer.ts" />
/// <reference path="design/containers/VertexContainer.ts" />
/// <reference path="env/controllers/CursorController.ts" />

// Level 5
/// <reference path="class/ViewedControl.ts" />
/// <reference path="design/layout/containers/Configuration.ts" />
/// <reference path="view/classes/LabeledView.ts" />
/// <reference path="view/JunctionView.ts" />
/// <reference path="view/RiverView.ts" />

// Level 6
/// <reference path="class/Draggable.ts" />
/// <reference path="view/FlapView.ts" />
/// <reference path="view/EdgeView.ts" />
/// <reference path="view/VertexView.ts" />
/// <reference path="design/components/River.ts" />
/// <reference path="design/components/Edge.ts" />

// Level 7
/// <reference path="class/IndependentDraggable.ts" />
/// <reference path="design/layout/models/Device.ts" />

// Level 8
/// <reference path="design/components/Flap.ts" />
/// <reference path="design/components/Vertex.ts" />
