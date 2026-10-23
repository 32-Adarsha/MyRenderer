import { Object } from "./Object";
import { VertexBuffer } from "../webgl/VertexBuffer";
import { IndexBuffer } from "../webgl/IndexBuffer";
import { VertexArray } from "../webgl/VertexArray";
import { VertexLayout } from "../webgl/VertexLayout";
import { PrimitiveType } from "../webgl/PrimitiveType";
import { Material } from "../Lighting/Material";
import type { Renderer } from "../webgl/Renderer";
import type { Shader } from "../webgl/Shader";

export interface MeshGeometry {
  vertices: Float32Array;
  indices: Uint16Array;
}

export class Mesh extends Object {
  public geometry: MeshGeometry;
  public material: Material;

  private vertexArray: VertexArray | null = null;
  private vertexBuffer: VertexBuffer | null = null;
  private indexBuffer: IndexBuffer | null = null;

  constructor(
    geometry: MeshGeometry,
    x: number = 0,
    y: number = 0,
    z: number = 0,
    material?: Material | [number, number, number],
  ) {
    super(x, y, z);
    this.geometry = geometry;
    if (material instanceof Material) {
      this.material = material;
    } else if (Array.isArray(material)) {
      this.material = new Material(material);
    } else {
      this.material = new Material([0.2, 0.6, 1.0]);
    }
  }

  public get color(): Float32Array {
    return this.material.kd;
  }

  public setupBuffers(layout?: VertexLayout): VertexArray {
    const activeLayout =
      layout ??
      new VertexLayout([
        { location: 0, size: 3 },
        { location: 1, size: 3 },
      ]);

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
    this.material.kd[0] = r;
    this.material.kd[1] = g;
    this.material.kd[2] = b;
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
      shader.setVec3("uKd", this.material.kd[0], this.material.kd[1], this.material.kd[2]);
      shader.setVec3("uKa", this.material.ka[0], this.material.ka[1], this.material.ka[2]);
      shader.setVec3("uKs", this.material.ks[0], this.material.ks[1], this.material.ks[2]);
      shader.setFloat("uShininess", this.material.shininess);
    }
    const va = this.getVertexArray(layout);
    renderer.drawElements(va, primitive);
  }
}
