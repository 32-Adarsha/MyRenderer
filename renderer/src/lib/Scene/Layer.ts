import { Object } from "./Object";
import { Mesh } from "./Mesh";
import { PrimitiveType } from "../webgl/PrimitiveType";
import type { Renderer } from "../webgl/Renderer";
import type { Shader } from "../webgl/Shader";

export enum Projection {
  Orthographic,
  Perspective,
}

export class Layer {
  public objects: Object[];
  public wireframe: boolean;
  public projection: Projection;

  constructor() {
    this.objects = [];
    this.wireframe = false;
    this.projection = Projection.Perspective;
  }

  public addObject(obj: Object): void {
    this.objects.push(obj);
  }

  public removeObject(obj: Object): void {
    const index = this.objects.indexOf(obj);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
  }

  private renderObject(
    obj: Object,
    renderer: Renderer,
    shader?: Shader,
    primitive: PrimitiveType = PrimitiveType.Triangles,
  ): void {
    if (!obj.visible) {
      return;
    }
    if (obj instanceof Mesh) {
      obj.draw(renderer, shader, primitive);
    }
    for (const child of obj.children) {
      this.renderObject(child, renderer, shader, primitive);
    }
  }

  public render(
    renderer: Renderer,
    shader?: Shader,
    primitive: PrimitiveType = PrimitiveType.Triangles,
  ): void {
    const prim = this.wireframe ? PrimitiveType.Lines : primitive;
    for (const obj of this.objects) {
      this.renderObject(obj, renderer, shader, prim);
    }
  }
}

export { Layer as Scene };
