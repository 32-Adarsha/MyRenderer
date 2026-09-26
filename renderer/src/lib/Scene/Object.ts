export abstract class SceneObject {
  protected position: Float32Array;
  protected scale: Float32Array;
  protected rotation: Float32Array;

  public visible: boolean = true;
  public alpha: number = 1.0;
  public zIndex: number = 0;

  public parent: SceneObject | null = null;
  public children: SceneObject[] = [];

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

  public setScale(x: number, y: number, z: number = 1): void {
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;
  }

  public setRotation(x: number, y: number, z: number): void {
    this.rotation[0] = x;
    this.rotation[1] = y;
    this.rotation[2] = z;
  }
}
