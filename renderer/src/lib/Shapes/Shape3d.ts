export interface Shape3dData {
  vertices: Float32Array;
  indices: Uint16Array;
}

export class Shape3d {
  public static Sphere(
    radius: number,
    segmentX: number,
    segmentY: number,
  ): Shape3dData {
    if (segmentX < 3) {
      throw new Error("Sphere requires at least 3 horizontal segments");
    }

    if (segmentY < 2) {
      throw new Error("Sphere requires at least 2 vertical segments");
    }

    const vertices: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y <= segmentY; y++) {
      const v = y / segmentY;
      const phi = v * Math.PI;

      for (let x = 0; x <= segmentX; x++) {
        const u = x / segmentX;
        const theta = u * Math.PI * 2;

        const nx = Math.sin(phi) * Math.cos(theta);
        const ny = Math.cos(phi);
        const nz = Math.sin(phi) * Math.sin(theta);

        const px = radius * nx;
        const py = radius * ny;
        const pz = radius * nz;

        vertices.push(px, py, pz, nx, ny, nz);
      }
    }

    for (let y = 0; y < segmentY; y++) {
      for (let x = 0; x < segmentX; x++) {
        const a = y * (segmentX + 1) + x;
        const b = a + segmentX + 1;
        const c = b + 1;
        const d = a + 1;

        indices.push(a, b, d, b, c, d);
      }
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
    };
  }

  public static Cube(
    width: number,
    height: number = width,
    depth: number = width,
  ): Shape3dData {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertices = new Float32Array([
      -w, -h,  d,   0,  0,  1,
       w, -h,  d,   0,  0,  1,
       w,  h,  d,   0,  0,  1,
      -w,  h,  d,   0,  0,  1,

      -w, -h, -d,   0,  0, -1,
       w, -h, -d,   0,  0, -1,
       w,  h, -d,   0,  0, -1,
      -w,  h, -d,   0,  0, -1,

      -w, -h, -d,  -1,  0,  0,
      -w, -h,  d,  -1,  0,  0,
      -w,  h,  d,  -1,  0,  0,
      -w,  h, -d,  -1,  0,  0,

       w, -h,  d,   1,  0,  0,
       w, -h, -d,   1,  0,  0,
       w,  h, -d,   1,  0,  0,
       w,  h,  d,   1,  0,  0,

      -w,  h,  d,   0,  1,  0,
       w,  h,  d,   0,  1,  0,
       w,  h, -d,   0,  1,  0,
      -w,  h, -d,   0,  1,  0,

      -w, -h, -d,   0, -1,  0,
       w, -h, -d,   0, -1,  0,
       w, -h,  d,   0, -1,  0,
      -w, -h,  d,   0, -1,  0,
    ]);

    const indices = new Uint16Array([
       0,  1,  2,   0,  2,  3,
       4,  6,  5,   4,  7,  6,
       8,  9, 10,   8, 10, 11,
      12, 13, 14,  12, 14, 15,
      16, 17, 18,  16, 18, 19,
      20, 21, 22,  20, 22, 23,
    ]);

    return {
      vertices,
      indices,
    };
  }

  public static Cylinder(
    radius: number,
    height: number,
    segments: number,
  ): Shape3dData {
    if (segments < 3) {
      throw new Error("Cylinder requires at least 3 segments");
    }

    const vertices: number[] = [];
    const indices: number[] = [];

    const halfHeight = height / 2;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const x = cosA * radius;
      const z = sinA * radius;

      vertices.push(x, -halfHeight, z, cosA, 0, sinA);
      vertices.push(x, halfHeight, z, cosA, 0, sinA);
    }

    for (let i = 0; i < segments; i++) {
      const bottomLeft = i * 2;
      const topLeft = bottomLeft + 1;
      const bottomRight = bottomLeft + 2;
      const topRight = bottomLeft + 3;

      indices.push(
        bottomLeft,
        bottomRight,
        topLeft,
        topLeft,
        bottomRight,
        topRight,
      );
    }

    const bottomCenter = vertices.length / 6;
    vertices.push(0, -halfHeight, 0, 0, -1, 0);

    const bottomStart = vertices.length / 6;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(
        Math.cos(angle) * radius,
        -halfHeight,
        Math.sin(angle) * radius,
        0,
        -1,
        0,
      );
    }

    for (let i = 0; i < segments; i++) {
      const current = bottomStart + i;
      const next = bottomStart + ((i + 1) % segments);
      indices.push(bottomCenter, next, current);
    }

    const topCenter = vertices.length / 6;
    vertices.push(0, halfHeight, 0, 0, 1, 0);

    const topStart = vertices.length / 6;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(
        Math.cos(angle) * radius,
        halfHeight,
        Math.sin(angle) * radius,
        0,
        1,
        0,
      );
    }

    for (let i = 0; i < segments; i++) {
      const current = topStart + i;
      const next = topStart + ((i + 1) % segments);
      indices.push(topCenter, current, next);
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
    };
  }

  public static Cone(
    radius: number,
    height: number,
    segments: number,
  ): Shape3dData {
    if (segments < 3) {
      throw new Error("Cone requires at least 3 segments");
    }

    const vertices: number[] = [];
    const indices: number[] = [];

    const halfHeight = height / 2;
    const slope = radius / height;

    const tip = 0;
    vertices.push(0, halfHeight, 0, 0, 1, 0);

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const x = cosA * radius;
      const z = sinA * radius;

      const nLen = Math.hypot(cosA, slope, sinA);
      vertices.push(x, -halfHeight, z, cosA / nLen, slope / nLen, sinA / nLen);
    }

    for (let i = 0; i < segments; i++) {
      const current = i + 1;
      const next = ((i + 1) % segments) + 1;
      indices.push(tip, current, next);
    }

    const center = vertices.length / 6;
    vertices.push(0, -halfHeight, 0, 0, -1, 0);

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(
        Math.cos(angle) * radius,
        -halfHeight,
        Math.sin(angle) * radius,
        0,
        -1,
        0,
      );
    }

    const baseStart = center + 1;
    for (let i = 0; i < segments; i++) {
      const current = baseStart + i;
      const next = baseStart + ((i + 1) % segments);
      indices.push(center, next, current);
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
    };
  }

  public static Torus(
    radius: number,
    tubeRadius: number,
    segmentX: number,
    segmentY: number,
  ): Shape3dData {
    if (segmentX < 3 || segmentY < 3) {
      throw new Error("Torus requires at least 3 segments in both directions");
    }

    const vertices: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y <= segmentY; y++) {
      const v = (y / segmentY) * Math.PI * 2;
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);

      for (let x = 0; x <= segmentX; x++) {
        const u = (x / segmentX) * Math.PI * 2;
        const cosU = Math.cos(u);
        const sinU = Math.sin(u);

        const px = (radius + tubeRadius * cosV) * cosU;
        const py = tubeRadius * sinV;
        const pz = (radius + tubeRadius * cosV) * sinU;

        const nx = cosV * cosU;
        const ny = sinV;
        const nz = cosV * sinU;

        vertices.push(px, py, pz, nx, ny, nz);
      }
    }

    for (let y = 0; y < segmentY; y++) {
      for (let x = 0; x < segmentX; x++) {
        const a = y * (segmentX + 1) + x;
        const b = a + segmentX + 1;
        const c = b + 1;
        const d = a + 1;

        indices.push(a, b, d, b, c, d);
      }
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
    };
  }
}
