export interface VertexAttribute {
  location: number;
  size: number;
}

export class VertexLayout {
  public attributes: VertexAttribute[];

  constructor(attributes: VertexAttribute[]) {
    this.attributes = attributes;
  }

  public getStride(): number {
    let totalComponents = 0;

    for (const attribute of this.attributes) {
      totalComponents += attribute.size;
    }

    return totalComponents * Float32Array.BYTES_PER_ELEMENT;
  }

  public getOffset(index: number): number {
    let offset = 0;

    for (let i = 0; i < index; i++) {
      offset += this.attributes[i].size * Float32Array.BYTES_PER_ELEMENT;
    }

    return offset;
  }
}
