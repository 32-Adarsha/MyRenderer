export type GLSLType =
  | "float"
  | "int"
  | "bool"
  | "vec2"
  | "vec3"
  | "vec4"
  | "mat3"
  | "mat4"
  | "sampler2D";

export interface InputSocket {
  type: GLSLType;
  defaultValue: string;
  connectedNode?: ShaderNode;
  connectedSocket?: string;
}

export abstract class ShaderNode {
  public id: string;
  public inputs: Record<string, InputSocket> = {};
  public outputs: Record<string, GLSLType> = {};

  constructor(id: string) {
    this.id = id;
  }

  public addInput(name: string, type: GLSLType, defaultValue: string) {
    this.inputs[name] = { type, defaultValue };
  }

  public addOutput(name: string, type: GLSLType) {
    this.outputs[name] = type;
  }

  public connect(
    MyOutSocket: string,
    TargetNode: ShaderNode,
    ToInputSocket: string,
  ) {
    const targetSocket = TargetNode.inputs[ToInputSocket];

    if (!targetSocket) {
      throw new Error(`Socket Input doesn't exists`);
    }

    if (TargetNode === this) {
      throw new Error(`Attempt to Connect Input to Output of Same Node`);
    }

    targetSocket.connectedNode = this;
    targetSocket.connectedSocket = MyOutSocket;
  }

  public getInputGLSL(InputSocketName: string) {
    const input = this.inputs[InputSocketName];
    if (input.connectedNode && input.connectedSocket) {
      const output_socket = input.connectedNode.outputs[input.connectedSocket];
    }
  }
}
