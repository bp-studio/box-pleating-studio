import { VertexView } from "./VertexView";
import { SheetView } from "./SheetView";
import { FlapView } from "./FlapView";
import { JunctionView } from "./JunctionView";
import { RiverView } from "./RiverView";
import { EdgeView } from "./EdgeView";
import { DeviceView } from "./DeviceView";
import { Device, Edge, Flap, Junction, River, Sheet, Vertex } from "bp/design";
import { ViewService } from "bp/env/service";

ViewService.$register(Device, DeviceView);
ViewService.$register(Edge, EdgeView);
ViewService.$register(Flap, FlapView);
ViewService.$register(Junction, JunctionView);
ViewService.$register(River, RiverView);
ViewService.$register(Sheet, SheetView);
ViewService.$register(Vertex, VertexView);
