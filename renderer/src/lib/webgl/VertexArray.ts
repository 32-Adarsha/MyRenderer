import { Renderer } from "./Renderer";
import { VertexBuffer } from "./VertexBuffer";
import type { VertexLayout } from "./VertexLayout";
import { IndexBuffer } from "./IndexBuffer";

export class VertexArray {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private indexCount: number = 0;
  private indexType: number = 0;

  constructor() {
    this.gl = Renderer.getInstance().gl;
    const vao = this.gl.createVertexArray();

    if (!vao) {
      throw new Error("Failed to create vertex array");
    }

    this.vao = vao;
  }

  public bind() {
    this.gl.bindVertexArray(this.vao);
  }

  public unbind() {
    this.gl.bindVertexArray(null);
  }

  public addBuffer(buffer: VertexBuffer, layout: VertexLayout): void {
    this.bind();
    buffer.bind();

    const stride = layout.getStride();

    for (let i = 0; i < layout.attributes.length; i++) {
      const attribute = layout.attributes[i];
      const offset = layout.getOffset(i);

      this.gl.enableVertexAttribArray(attribute.location);

      this.gl.vertexAttribPointer(
        attribute.location,
        attribute.size,
        this.gl.FLOAT,
        false,
        stride,
        offset,
      );
    }

    this.unbind();
  }

  public setIndexBuffer(indexBuffer: IndexBuffer) {
    this.bind();
    indexBuffer.bind();
    this.indexCount = indexBuffer.count;
    this.indexType = indexBuffer.type;
    this.unbind();
  }

  public getIndexCount(): number {
    return this.indexCount;
  }

  public getIndexType(): number {
    return this.indexType;
  }
}
