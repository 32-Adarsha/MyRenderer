export enum LightType {
  Ambient = 0,
  Directional = 1,
  Point = 2,
  Spot = 3,
}

export abstract class BaseLight {
  abstract readonly lightType: LightType;

  constructor(
    public color: Float32Array = new Float32Array([1, 1, 1]),
    public intensity: number = 1.0,
  ) {}
}

export class AmbientLight extends BaseLight {
  readonly lightType = LightType.Ambient;
}

export class DirectionalLight extends BaseLight {
  readonly lightType = LightType.Directional;
  constructor(
    public direction: Float32Array,
    color?: Float32Array,
    intensity?: number,
  ) {
    super(color, intensity);
  }
}

export class PointLight extends BaseLight {
  readonly lightType: LightType = LightType.Point;
  constructor(
    public position: Float32Array,
    color?: Float32Array,
    intensity?: number,
    public attenuation: Float32Array = new Float32Array([1.0, 0.09, 0.032]),
  ) {
    super(color, intensity);
  }
}

export class SpotLight extends PointLight {
  override readonly lightType: LightType = LightType.Spot;
  constructor(
    position: Float32Array,
    public direction: Float32Array,
    color?: Float32Array,
    intensity?: number,
    public innerConeCos: number = Math.cos((12.5 * Math.PI) / 180),
    public outerConeCos: number = Math.cos((17.5 * Math.PI) / 180),
  ) {
    super(position, color, intensity);
  }
}
