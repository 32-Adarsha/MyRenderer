import type { Texture } from "../webgl/Texture";

export class Material {
  public kd: Float32Array;
  public ka: Float32Array;
  public ks: Float32Array;
  public shininess: number;
  public map: Texture | null;
  public normalMap: Texture | null;
  public roughnessMap: Texture | null;
  public metallicMap: Texture | null;
  public bumpMap: Texture | null;
  public aoMap: Texture | null;

  constructor(
    kd: [number, number, number] | Float32Array = [0.8, 0.8, 0.8],
    ka: [number, number, number] | Float32Array = [0.1, 0.1, 0.1],
    ks: [number, number, number] | Float32Array = [0.5, 0.5, 0.5],
    shininess: number = 32.0,
    map: Texture | null = null,
    normalMap: Texture | null = null,
    roughnessMap: Texture | null = null,
    bumpMap: Texture | null = null,
    aoMap: Texture | null = null,
    metallicMap: Texture | null = null,
  ) {
    this.kd = kd instanceof Float32Array ? kd : new Float32Array(kd);
    this.ka = ka instanceof Float32Array ? ka : new Float32Array(ka);
    this.ks = ks instanceof Float32Array ? ks : new Float32Array(ks);
    this.shininess = shininess;
    this.map = map;
    this.normalMap = normalMap;
    this.roughnessMap = roughnessMap;
    this.bumpMap = bumpMap;
    this.aoMap = aoMap;
    this.metallicMap = metallicMap;
  }
}
