export class Mat4 {
  public static identity(): Float32Array {
    const out = new Float32Array(16);
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }

  public static perspective(
    fovy: number,
    aspect: number,
    near: number,
    far: number,
  ): Float32Array {
    const f = 1.0 / Math.tan(fovy / 2);
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[5] = f;
    out[11] = -1;

    if (far != null && far !== Infinity) {
      const nf = 1 / (near - far);
      out[10] = (far + near) * nf;
      out[14] = 2 * far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -2 * near;
    }
    return out;
  }

  public static multiply(a: Float32Array, b: Float32Array): Float32Array {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      const ai0 = a[i];
      const ai1 = a[i + 4];
      const ai2 = a[i + 8];
      const ai3 = a[i + 12];
      out[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
      out[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
      out[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
      out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
    }
    return out;
  }

  public static fromRotationTranslationScale(
    rotX: number,
    rotY: number,
    rotZ: number,
    tx: number,
    ty: number,
    tz: number,
    sx: number,
    sy: number,
    sz: number,
  ): Float32Array {
    const out = new Float32Array(16);

    const cx = Math.cos(rotX);
    const sx_ = Math.sin(rotX);
    const cy = Math.cos(rotY);
    const sy_ = Math.sin(rotY);
    const cz = Math.cos(rotZ);
    const sz_ = Math.sin(rotZ);

    out[0] = (cy * cz) * sx;
    out[1] = (cy * sz_) * sx;
    out[2] = (-sy_) * sx;
    out[3] = 0;

    out[4] = (sx_ * sy_ * cz - cx * sz_) * sy;
    out[5] = (sx_ * sy_ * sz_ + cx * cz) * sy;
    out[6] = (sx_ * cy) * sy;
    out[7] = 0;

    out[8] = (cx * sy_ * cz + sx_ * sz_) * sz;
    out[9] = (cx * sy_ * sz_ - sx_ * cz) * sz;
    out[10] = (cx * cy) * sz;
    out[11] = 0;

    out[12] = tx;
    out[13] = ty;
    out[14] = tz;
    out[15] = 1;

    return out;
  }

  public static lookAt(
    eyeX: number,
    eyeY: number,
    eyeZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    upX: number = 0,
    upY: number = 1,
    upZ: number = 0,
  ): Float32Array {
    const out = new Float32Array(16);

    let z0 = eyeX - targetX;
    let z1 = eyeY - targetY;
    let z2 = eyeZ - targetZ;
    let len = Math.hypot(z0, z1, z2);
    if (len <= 0.00001) {
      z2 = 1;
      len = 1;
    }
    z0 /= len;
    z1 /= len;
    z2 /= len;

    let x0 = upY * z2 - upZ * z1;
    let x1 = upZ * z0 - upX * z2;
    let x2 = upX * z1 - upY * z0;
    len = Math.hypot(x0, x1, x2);
    if (len <= 0.00001) {
      x0 = 1;
      len = 1;
    }
    x0 /= len;
    x1 /= len;
    x2 /= len;

    const y0 = z1 * x2 - z2 * x1;
    const y1 = z2 * x0 - z0 * x2;
    const y2 = z0 * x1 - z1 * x0;

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;

    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;

    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;

    out[12] = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ);
    out[13] = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ);
    out[14] = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ);
    out[15] = 1;

    return out;
  }
}
