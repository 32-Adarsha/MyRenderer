import { IndexBuffer } from "./IndexBuffer";
import { PrimitiveType } from "./PrimitiveType";
import { VertexArray } from "./VertexArray";

// Singleton
export class Renderer {
  public static instance: Renderer;
  public gl: WebGL2RenderingContext;

  private constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("Webgl2 Not Supported");
    }

    this.gl = gl;
  }

  public static getInstance(canvas?: HTMLCanvasElement): Renderer {
    if (!Renderer.instance) {
      if (!canvas) {
        throw new Error(
          "Canvas is required when creating the renderer for the first time",
        );
      }

      Renderer.instance = new Renderer(canvas);
    }

    return Renderer.instance;
  }
  public drawArrays(vertexArray: VertexArray, vertexCount: number): void {
    vertexArray.bind();

    this.gl.drawArrays(this.gl.TRIANGLES, 0, vertexCount);
  }

  public clear(
    r: number = 0,
    g: number = 0,
    b: number = 0,
    a: number = 1,
  ): void {
    this.gl.clearColor(r, g, b, a);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  public enableDepthTest(): void {
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  public setViewport(
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.gl.viewport(x, y, width, height);
  }

  private getPrimitivesType(type: PrimitiveType): number {
    switch (type) {
      case PrimitiveType.Triangles:
        return this.gl.TRIANGLES;
      case PrimitiveType.Lines:
        return this.gl.LINES;
      case PrimitiveType.LineStritp:
        return this.gl.LINE_STRIP;
      case PrimitiveType.Points:
        return this.gl.POINTS;
      default:
        throw new Error("Unsuppoprted Primitive Type");
    }
  }

  public drawElements(
    vertexArray: VertexArray,
    primitive: PrimitiveType = PrimitiveType.Triangles,
  ): void {
    vertexArray.bind();
    this.gl.drawElements(
      this.getPrimitivesType(primitive),
      vertexArray.getIndexCount(),
      vertexArray.getIndexType(),
      0,
    );
  }
}
