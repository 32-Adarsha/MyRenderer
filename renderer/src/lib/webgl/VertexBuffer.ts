import { Renderer } from "./Renderer";

export class VertexBuffer {
  private gl: WebGL2RenderingContext;
  private buffer: WebGLBuffer;

  constructor() {
    this.gl = Renderer.getInstance().gl;
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create vertex buffer");
    }

    this.buffer = buffer;
  }

  public bind() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
  }

  public setData(data: Float32Array): void {
    this.bind();
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
  }
}
