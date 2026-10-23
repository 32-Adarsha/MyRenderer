export { Object, Group } from "./Scene/Object";
export { Mesh } from "./Scene/Mesh";
export type { MeshGeometry } from "./Scene/Mesh";
export { Layer, Scene, Projection } from "./Scene/Layer";

export { Shape2d } from "./Shapes/Shape2d";
export type { Shape2dData } from "./Shapes/Shape2d";
export { Shape3d } from "./Shapes/Shape3d";
export type { Shape3dData } from "./Shapes/Shape3d";

export { Material } from "./Lighting/Material";
export {
  LightType,
  BaseLight,
  AmbientLight,
  DirectionalLight,
  PointLight,
  SpotLight,
} from "./Lighting/Light";

export { Renderer } from "./webgl/Renderer";
export { Shader } from "./webgl/Shader";
export { VertexBuffer } from "./webgl/VertexBuffer";
export { IndexBuffer } from "./webgl/IndexBuffer";
export { VertexArray } from "./webgl/VertexArray";
export { VertexLayout } from "./webgl/VertexLayout";
export type { VertexAttribute } from "./webgl/VertexLayout";
export { PrimitiveType } from "./webgl/PrimitiveType";
