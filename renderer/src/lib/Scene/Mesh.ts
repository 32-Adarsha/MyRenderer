import { Object } from "./Object";
import { VertexBuffer } from "../webgl/VertexBuffer";
import { IndexBuffer } from "../webgl/IndexBuffer";
import { VertexArray } from "../webgl/VertexArray";
import { VertexLayout } from "../webgl/VertexLayout";
import { PrimitiveType } from "../webgl/PrimitiveType";
import type { Renderer } from "../webgl/Renderer";
import type { Shader } from "../webgl/Shader";

export interface MeshGeometry {
  vertices: Float32Array;
  indices: Uint16Array;
}

export class Mesh extends Object {
  public geometry: MeshGeometry;
  public color: Float32Array;

  private vertexArray: VertexArray | null = null;
  private vertexBuffer: VertexBuffer | null = null;
  private indexBuffer: IndexBuffer | null = null;

  constructor(
    geometry: MeshGeometry,
    x: number = 0,
    y: number = 0,
    z: number = 0,
    color: [number, number, number] = [0.2, 0.6, 1.0],
  ) {
    super(x, y, z);
    this.geometry = geometry;
    this.color = new Float32Array(color);
  }

  public setupBuffers(layout?: VertexLayout): VertexArray {
    const activeLayout =
      layout ?? new VertexLayout([{ location: 0, size: 3 }]);

    if (!this.vertexBuffer) {
      this.vertexBuffer = new VertexBuffer();
    }
    this.vertexBuffer.setData(this.geometry.vertices);

    if (!this.indexBuffer) {
      this.indexBuffer = new IndexBuffer();
    }
    this.indexBuffer.setData(this.geometry.indices);

    if (!this.vertexArray) {
      this.vertexArray = new VertexArray();
    }
    this.vertexArray.addBuffer(this.vertexBuffer, activeLayout);
    this.vertexArray.setIndexBuffer(this.indexBuffer);

    return this.vertexArray;
  }

  public getVertexArray(layout?: VertexLayout): VertexArray {
    if (!this.vertexArray) {
      this.setupBuffers(layout);
    }
    return this.vertexArray!;
  }

  public setGeometry(geometry: MeshGeometry): void {
    this.geometry = geometry;
    if (this.vertexBuffer && this.indexBuffer) {
      this.vertexBuffer.setData(geometry.vertices);
      this.indexBuffer.setData(geometry.indices);
      if (this.vertexArray) {
        this.vertexArray.setIndexBuffer(this.indexBuffer);
      }
    }
  }

  public setColor(r: number, g: number, b: number): void {
    this.color[0] = r;
    this.color[1] = g;
    this.color[2] = b;
  }

  public draw(
    renderer: Renderer,
    shader?: Shader,
    primitive: PrimitiveType = PrimitiveType.Triangles,
    layout?: VertexLayout,
  ): void {
    if (!this.visible) {
      return;
    }
    if (shader) {
      shader.setMat4("uModel", this.getWorldMatrix());
      shader.setVec3("uColor", this.color[0], this.color[1], this.color[2]);
    }
    const va = this.getVertexArray(layout);
    renderer.drawElements(va, primitive);
  }
}
