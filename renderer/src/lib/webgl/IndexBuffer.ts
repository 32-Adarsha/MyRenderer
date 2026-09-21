import { Renderer } from "./Renderer";

type IndexData = Uint16Array | Uint32Array;

export class IndexBuffer {
  private gl: WebGL2RenderingContext;
  private buffer: WebGLBuffer;

  public count: number = 0;
  public type: number;

  constructor() {
    this.gl = Renderer.getInstance().gl;
    const buffer = this.gl.createBuffer();

    if (!buffer) {
      throw new Error("Failed to create index buffer");
    }

    this.buffer = buffer;
    this.type = this.gl.UNSIGNED_SHORT;
  }

  public bind(): void {
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffer);
  }

  public setData(data: IndexData) {
    this.bind();
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    this.count = data.length;

    if (data instanceof Uint32Array) {
      this.type = this.gl.UNSIGNED_INT;
    } else {
      this.type = this.gl.UNSIGNED_SHORT;
    }
  }
}
