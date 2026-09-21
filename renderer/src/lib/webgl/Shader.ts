import { Renderer } from "./Renderer";

export class Shader {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private uniformLocation: Map<string, WebGLUniformLocation>;

  constructor(vertexSource: string, fragmentSource: string) {
    this.uniformLocation = new Map();
    this.gl = Renderer.getInstance().gl;
    const program = this.gl.createProgram();

    if (!program) {
      throw new Error("Failed to create webgl shader program");
    }

    const vertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      vertexSource,
    );
    const fragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      fragmentSource,
    );

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);

    this.gl.linkProgram(program);

    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (!success) {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Program Linking Failed : ${info}`);
    }
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    this.program = program;
  }

  private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error("Failed to create shader");
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);

    if (!success) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`shader compilation failed : ${info}`);
    }

    return shader;
  }

  public use() {
    this.gl.useProgram(this.program);
  }

  public setFloat(name: string, value: number): void {
    const location = this.gl.getUniformLocation(this.program, name);

    if (location === null) {
      throw new Error(`Uniform ${name} not found`);
    }

    this.gl.uniform1f(location, value);
  }

  private getUniformLocation(name: string): WebGLUniformLocation {
    const cached = this.uniformLocation.get(name);

    if (cached) {
      return cached;
    }

    const location = this.gl.getUniformLocation(this.program, name);
    if (location === null) {
      throw new Error(`Uniform ${name} not found`);
    }

    this.uniformLocation.set(name, location);
    return location;
  }

  public setVec2(name: string, x: number, y: number): void {
    const location = this.getUniformLocation(name);
    this.gl.uniform2f(location, x, y);
  }

  public setVec3(name: string, x: number, y: number, z: number): void {
    const location = this.getUniformLocation(name);
    this.gl.uniform3f(location, x, y, z);
  }

  public setVec4(
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
  ): void {
    const location = this.getUniformLocation(name);
    this.gl.uniform4f(location, x, y, z, w);
  }

  public setMat4(name: string, value: Float32Array): void {
    const location = this.getUniformLocation(name);
    this.gl.uniformMatrix4fv(location, false, value);
  }
}
