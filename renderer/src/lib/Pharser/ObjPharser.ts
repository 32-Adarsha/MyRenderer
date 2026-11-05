import { Mesh, type MeshGeometry } from "$lib/Scene/Mesh";

export interface AssetsPharser {
  getMesh(): Mesh[];
}

export class WavefrontPharser implements AssetsPharser {
  private file_path: string;
  private meshes: Mesh[] = [];

  constructor(file_path: string = "") {
    this.file_path = file_path;
  }

  public getMesh(): Mesh[] {
    return this.meshes;
  }

  public async load(): Promise<Mesh[]> {
    if (!this.file_path) {
      throw new Error("No file path provided to WavefrontPharser");
    }
    const response = await fetch(this.file_path);
    if (!response.ok) {
      throw new Error(
        `Failed to load OBJ file from ${this.file_path}: ${response.statusText}`,
      );
    }
    const text = await response.text();
    return this.parse(text);
  }

  public pharse(text: string): Mesh[] {
    return this.parse(text);
  }

  public parse(text: string): Mesh[] {
    this.meshes = [];

    const rawV: number[] = [];
    const rawVN: number[] = [];
    const rawVT: number[] = [];

    let currentVertices: number[] = [];
    let currentIndices: number[] = [];
    let vertexCache = new Map<string, number>();
    let currentName = "Object";

    const saveCurrentMesh = () => {
      if (currentIndices.length === 0) return;

      const vertexCount = currentVertices.length / 8;

      const indices =
        vertexCount > 65535
          ? new Uint32Array(currentIndices)
          : new Uint16Array(currentIndices);

      const geometry: MeshGeometry = {
        vertices: new Float32Array(currentVertices),
        indices,
        hasUV: true,
      };

      const mesh = new Mesh(geometry);
      mesh.name = currentName;
      this.meshes.push(mesh);

      currentVertices = [];
      currentIndices = [];
      vertexCache.clear();
    };

    let offset = 0;
    while (offset < text.length) {
      let index = text.indexOf("\n", offset);

      if (index == -1) index = text.length;

      let lineSlice = text.slice(offset, index);

      let parts = lineSlice.trim().split(/\s+/);

      switch (parts[0]) {
        case "#":
          break;
        case "v":
          rawV.push(Number(parts[1]), Number(parts[2]), Number(parts[3]));
          break;
        case "vn":
          rawVN.push(Number(parts[1]), Number(parts[2]), Number(parts[3]));
          break;
        case "vt":
          rawVT.push(Number(parts[1]), Number(parts[2]));
          break;
        case "f":
          const faceIndices: number[] = [];
          for (let i = 1; i < parts.length; ++i) {
            const key = parts[i];
            let idx = vertexCache.get(key);

            if (idx === undefined) {
              const [vStr, vtStr, vnStr] = key.split("/");
              const vIdx = (parseInt(vStr, 10) - 1) * 3;
              const vtIdx = vtStr ? (parseInt(vtStr, 10) - 1) * 2 : -1;
              const vnIdx = vnStr ? (parseInt(vnStr, 10) - 1) * 3 : -1;

              idx = currentVertices.length / 8;

              currentVertices.push(
                rawV[vIdx] ?? 0,
                rawV[vIdx + 1] ?? 0,
                rawV[vIdx + 2] ?? 0,
                vnIdx >= 0 ? (rawVN[vnIdx] ?? 0) : 0,
                vnIdx >= 0 ? (rawVN[vnIdx + 1] ?? 1) : 1,
                vnIdx >= 0 ? (rawVN[vnIdx + 2] ?? 0) : 0,
                vtIdx >= 0 ? (rawVT[vtIdx] ?? 0) : 0,
                vtIdx >= 0 ? (rawVT[vtIdx + 1] ?? 0) : 0,
              );

              vertexCache.set(key, idx);
            }

            faceIndices.push(idx);
          }
          for (let j = 1; j < faceIndices.length - 1; j++) {
            currentIndices.push(
              faceIndices[0],
              faceIndices[j],
              faceIndices[j + 1],
            );
          }
          break;
        case "o":
        case "g":
          saveCurrentMesh();
          currentName = parts[1] || "Object";
          break;
      }
      offset = index + 1;
    }
    saveCurrentMesh();
    return this.meshes;
  }
}
