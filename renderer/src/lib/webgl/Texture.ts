import { Renderer } from "./Renderer";

export enum TextureWrapping {
  Repeat = WebGL2RenderingContext.REPEAT,
  ClampToEdge = WebGL2RenderingContext.CLAMP_TO_EDGE,
  MirroredRepeat = WebGL2RenderingContext.MIRRORED_REPEAT,
}

export class Texture {
  private readonly gl: WebGL2RenderingContext;
  private readonly texture: WebGLTexture;
  public readonly target: number;
  public width: number = 1;
  public height: number = 1;

  constructor(wrapping: TextureWrapping = TextureWrapping.Repeat) {
    this.gl = Renderer.getInstance().gl;

    const texture = this.gl.createTexture();

    if (!texture) {
      throw new Error("Failed to create WebGL texture");
    }

    this.texture = texture;
    this.target = this.gl.TEXTURE_2D;

    this.bind();

    this.gl.texParameteri(
      this.target,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR,
    );

    this.gl.texParameteri(
      this.target,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR,
    );

    this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, wrapping);
    this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, wrapping);

    this.set1x1Pixel();
  }

  public bind(unit: number = 0): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.target, this.texture);
  }

  public unbind(unit: number = 0): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.target, null);
  }

  public set1x1Pixel(
    r: number = 255,
    g: number = 255,
    b: number = 255,
    a: number = 255,
  ): void {
    this.bind();
    this.width = 1;
    this.height = 1;

    const pixel = new Uint8Array([r, g, b, a]);

    this.gl.texImage2D(
      this.target,
      0,
      this.gl.RGBA,
      1,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      pixel,
    );
  }

  public setData(
    data: ArrayBufferView | null,
    width: number,
    height: number,
    format: number = this.gl.RGBA,
    type: number = this.gl.UNSIGNED_BYTE,
  ): void {
    this.bind();
    this.width = width;
    this.height = height;

    this.gl.texImage2D(
      this.target,
      0,
      format,
      width,
      height,
      0,
      format,
      type,
      data,
    );
  }

  public setImage(
    image: TexImageSource,
    generateMipmaps: boolean = true,
  ): void {
    const gl = this.gl;
    this.bind();

    const previousFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);

    try {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(this.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } finally {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlip);
    }

    if (generateMipmaps) {
      gl.generateMipmap(this.target);

      gl.texParameteri(
        this.target,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
    } else {
      gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  }

  public loadUrl(url: string, generateMipmaps: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        this.setImage(image, generateMipmaps);
        resolve();
      };
      image.onerror = () => {
        reject(new Error(`Failed to load texture image from: ${url}`));
      };
      image.src = url;
    });
  }

  public static async fromUrl(
    url: string,
    wrapping: TextureWrapping = TextureWrapping.Repeat,
    generateMipmaps: boolean = true,
  ): Promise<Texture> {
    const texture = new Texture(wrapping);
    await texture.loadUrl(url, generateMipmaps);
    return texture;
  }

  public dispose(): void {
    this.gl.deleteTexture(this.texture);
  }
}
