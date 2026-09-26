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

        const px = radius * Math.sin(phi) * Math.cos(theta);

        const py = radius * Math.cos(phi);

        const pz = radius * Math.sin(phi) * Math.sin(theta);

        vertices.push(px, py, pz);
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

  // CUBE
  public static Cube(
    width: number,
    height: number = width,
    depth: number = width,
  ): Shape3dData {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertices = new Float32Array([
      // front
      -w,
      -h,
      d, // 0
      w,
      -h,
      d, // 1
      w,
      h,
      d, // 2
      -w,
      h,
      d, // 3

      // back
      -w,
      -h,
      -d, // 4
      w,
      -h,
      -d, // 5
      w,
      h,
      -d, // 6
      -w,
      h,
      -d, // 7
    ]);

    const indices = new Uint16Array([
      // front
      0, 1, 2, 0, 2, 3,

      // back
      5, 4, 7, 5, 7, 6,

      // left
      4, 0, 3, 4, 3, 7,

      // right
      1, 5, 6, 1, 6, 2,

      // top
      3, 2, 6, 3, 6, 7,

      // bottom
      4, 5, 1, 4, 1, 0,
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

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      vertices.push(x, -halfHeight, z);

      vertices.push(x, halfHeight, z);
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

    const bottomCenter = vertices.length / 3;

    vertices.push(0, -halfHeight, 0);

    const bottomStart = vertices.length / 3;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      vertices.push(
        Math.cos(angle) * radius,
        -halfHeight,
        Math.sin(angle) * radius,
      );
    }

    for (let i = 0; i < segments; i++) {
      const current = bottomStart + i;

      const next = bottomStart + ((i + 1) % segments);

      indices.push(bottomCenter, next, current);
    }

    const topCenter = vertices.length / 3;

    vertices.push(0, halfHeight, 0);

    const topStart = vertices.length / 3;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      vertices.push(
        Math.cos(angle) * radius,
        halfHeight,
        Math.sin(angle) * radius,
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

    vertices.push(0, halfHeight, 0);

    const tip = 0;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      const x = Math.cos(angle) * radius;

      const z = Math.sin(angle) * radius;

      vertices.push(x, -halfHeight, z);
    }

    for (let i = 0; i < segments; i++) {
      const current = i + 1;

      const next = ((i + 1) % segments) + 1;

      indices.push(tip, current, next);
    }

    const center = vertices.length / 3;

    vertices.push(0, -halfHeight, 0);

    for (let i = 0; i < segments; i++) {
      const current = i + 1;

      const next = ((i + 1) % segments) + 1;

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

    // -----------------------------------------
    // Generate vertices
    // -----------------------------------------

    for (let y = 0; y <= segmentY; y++) {
      const v = (y / segmentY) * Math.PI * 2;

      for (let x = 0; x <= segmentX; x++) {
        const u = (x / segmentX) * Math.PI * 2;

        const px = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);

        const py = tubeRadius * Math.sin(v);

        const pz = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);

        vertices.push(px, py, pz);
      }
    }

    // Generate triangles

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
