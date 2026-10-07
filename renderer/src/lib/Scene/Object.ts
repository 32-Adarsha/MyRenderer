import { Mat4 } from "../math/Mat4";

export class Object {
  protected position: Float32Array;
  protected scale: Float32Array;
  protected rotation: Float32Array;

  public visible: boolean = true;
  public alpha: number = 1.0;
  public zIndex: number = 0;

  public parent: Object | null = null;
  public children: Object[] = [];

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.position = new Float32Array([x, y, z]);
    this.scale = new Float32Array([1, 1, 1]);
    this.rotation = new Float32Array([0, 0, 0]);
  }

  public setPosition(x: number, y: number, z: number = 0): void {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
  }

  public getPosition(): Float32Array {
    return this.position;
  }

  public setScale(x: number, y: number, z: number = 1): void {
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;
  }

  public getScale(): Float32Array {
    return this.scale;
  }

  public setRotation(x: number, y: number, z: number): void {
    this.rotation[0] = x;
    this.rotation[1] = y;
    this.rotation[2] = z;
  }

  public getRotation(): Float32Array {
    return this.rotation;
  }

  public getModelMatrix(): Float32Array {
    return Mat4.fromRotationTranslationScale(
      this.rotation[0],
      this.rotation[1],
      this.rotation[2],
      this.position[0],
      this.position[1],
      this.position[2],
      this.scale[0],
      this.scale[1],
      this.scale[2],
    );
  }

  public getWorldMatrix(): Float32Array {
    const local = this.getModelMatrix();
    if (this.parent) {
      return Mat4.multiply(this.parent.getWorldMatrix(), local);
    }
    return local;
  }

  public addChild(child: Object): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
  }

  public removeChild(child: Object): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
  }
}

export { Object as Group };
