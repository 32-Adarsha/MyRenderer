export interface Shape2dData {
  vertices: Float32Array;
  indices: Uint16Array;
}

export class Shape2d {
  private constructor() {}

  private static RegularPolygon(radius: number, segment: number): Shape2dData {
    if (segment < 3) {
      throw new Error("Polygon requires at least 3 segments");
    }

    const vertices: number[] = [];
    const indices: number[] = [];

    vertices.push(0, 0, 0);

    for (let i = 0; i < segment; i++) {
      const angle = (i / segment) * Math.PI * 2;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      vertices.push(x, y, 0);
    }

    for (let i = 0; i < segment; i++) {
      const center = 0;
      const current = i + 1;
      const next = ((i + 1) % segment) + 1;

      indices.push(center, current, next);
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
    };
  }

  private static CreateRectangle(width: number, height: number): Shape2dData {
    if (width <= 0 || height <= 0) {
      throw new Error("Width and height must be greater than 0");
    }

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const vertices = new Float32Array([
      -halfWidth,
      -halfHeight,
      0,
      halfWidth,
      -halfHeight,
      0,
      halfWidth,
      halfHeight,
      0,
      -halfWidth,
      halfHeight,
      0,
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    return {
      vertices,
      indices,
    };
  }

  public static Circle(radius: number, segment: number): Shape2dData {
    return this.RegularPolygon(radius, segment);
  }

  public static Rectangle(width: number, height: number): Shape2dData {
    return this.CreateRectangle(width, height);
  }

  public static Square(size: number): Shape2dData {
    return this.CreateRectangle(size, size);
  }

  public static Triangle(width: number): Shape2dData {
    const radius = width / Math.sqrt(3);
    return this.RegularPolygon(radius, 3);
  }
}
