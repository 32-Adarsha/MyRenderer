<script lang="ts">
  import { onMount } from "svelte";
  import { base } from "$app/paths";

  import { Renderer } from "$lib/webgl/Renderer";
  import { Shader } from "$lib/webgl/Shader";
  import { Texture, TextureWrapping } from "$lib/webgl/Texture";
  import { Layer } from "$lib/Scene/Layer";
  import { Object } from "$lib/Scene/Object";
  import { Mesh } from "$lib/Scene/Mesh";
  import { Material } from "$lib/Lighting/Material";
  import { Mat4 } from "$lib/math/Mat4";
  import { Shape3d } from "$lib/Shapes/Shape3d";
  import { WavefrontPharser } from "$lib/Pharser/ObjPharser";

  let canvas: HTMLCanvasElement;

  let camX = $state(0.34);
  let camY = $state(2.63);
  let camZ = $state(13.97);

  let angleX = $state(0.187);
  let angleY = $state(-0.024);
  let angleZ = $state(1.570);

  let targetX = 0.0;
  let targetY = 0.0;
  let targetZ = 0.0;
  let rotY = 0.0;

  const planeTiling = 6.0;
  const planeNormalStrength = 2.5;
  const sunElevation = 0.55;
  const sunAzimuth = 0.85;

  const monkeyX = 2.4;
  const monkeyY = -0.99;
  const monkeyZ = 0.6;
  const monkeyScale = 0.85;
  const monkeyRotY = -30;
  const monkeyNormalStrength = 2.5;

  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  function syncFromAngles() {
    const dist = Math.hypot(camX - targetX, camY - targetY, camZ - targetZ) || 14.22;
    camX = -dist * Math.cos(angleX) * Math.sin(angleY) + targetX;
    camY = dist * Math.sin(angleX) + targetY;
    camZ = dist * Math.cos(angleX) * Math.cos(angleY) + targetZ;
  }

  function syncFromPosition() {
    const dx = camX - targetX;
    const dy = camY - targetY;
    const dz = camZ - targetZ;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 0.0001) {
      angleX = Math.asin(Math.max(-1, Math.min(1, dy / dist)));
      angleY = Math.atan2(-dx, dz);
    }
  }

  onMount(() => {
    const renderer = Renderer.getInstance(canvas);
    renderer.enableDepthTest();

    const vertexSource = `#version 300 es
    precision highp float;
    precision highp int;

    layout(location = 0) in vec3 aPosition;
    layout(location = 1) in vec3 aNormal;
    layout(location = 2) in vec2 aTexCoord;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    uniform int uIsPlane;
    uniform float uTime;

    out vec3 vWorldPos;
    out vec3 vWorldNormal;
    out vec2 vTexCoord;

    void main() {
        vec3 pos = aPosition;
        vec3 norm = aNormal;

        if (uIsPlane == 1) {
            float t = uTime * 2.0;
            float phase1 = pos.x * 1.2 + pos.z * 0.6 + t;
            float phase2 = pos.z * 1.1 - pos.x * 0.4 + t * 0.8;
            float amp1 = 0.15;
            float amp2 = 0.08;

            pos.y += sin(phase1) * amp1 + sin(phase2) * amp2;

            float c1 = cos(phase1) * amp1;
            float c2 = cos(phase2) * amp2;
            float dYdX = c1 * 1.2 - c2 * 0.4;
            float dYdZ = c1 * 0.6 + c2 * 1.1;
            norm = normalize(vec3(-dYdX, 1.0, -dYdZ));
        }

        vec4 worldPos = uModel * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = mat3(uModel) * norm;
        vTexCoord = aTexCoord;
        gl_Position = uProjection * uView * worldPos;
    }
    `;

    const fragmentSource = `#version 300 es
    precision highp float;
    precision highp int;

    in vec3 vWorldPos;
    in vec3 vWorldNormal;
    in vec2 vTexCoord;

    out vec4 fragColor;

    uniform vec3 uKd;
    uniform vec3 uKa;
    uniform vec3 uKs;
    uniform float uShininess;

    uniform sampler2D uTexture;
    uniform int uHasTexture;

    uniform int uIsPlane;
    uniform float uPlaneTiling;

    uniform sampler2D uNormalMap;
    uniform int uHasNormalMap;
    uniform float uNormalStrength;

    uniform sampler2D uRoughnessMap;
    uniform int uHasRoughnessMap;

    uniform sampler2D uAoMap;
    uniform int uHasAoMap;

    uniform vec3 uDirLightDir;
    uniform vec3 uDirLightColor;
    uniform float uDirLightIntensity;

    uniform vec3 uPointLightPos;
    uniform vec3 uPointLightColor;
    uniform float uPointLightIntensity;

    uniform vec3 uAmbientLight;
    uniform vec3 uViewPos;

    vec3 ACESFilm(vec3 x) {
        float a = 2.51;
        float b = 0.03;
        float c = 2.43;
        float d = 0.59;
        float e = 0.14;
        return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }

    void main() {
        vec3 viewVector = uViewPos - vWorldPos;
        vec3 viewDir = viewVector / max(length(viewVector), 0.00001);

        vec2 uv = (uIsPlane == 1) ? (vTexCoord * max(uPlaneTiling, 1.0)) : vTexCoord;

        vec3 normal = (length(vWorldNormal) > 0.0001) ? normalize(vWorldNormal) : vec3(0.0, 1.0, 0.0);

        if (uHasNormalMap == 1) {
            vec3 mapN = texture(uNormalMap, uv).xyz * 2.0 - 1.0;
            if (uIsPlane == 1) {
                normal = normalize(normal + vec3(mapN.x, 0.0, mapN.y) * uNormalStrength);
            } else {
                vec3 dp1 = dFdx(vWorldPos);
                vec3 dp2 = dFdy(vWorldPos);
                vec2 duv1 = dFdx(uv);
                vec2 duv2 = dFdy(uv);
                vec3 dp2perp = cross(dp2, normal);
                vec3 dp1perp = cross(normal, dp1);
                vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
                vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
                float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
                mat3 tbn = mat3(T * invmax, B * invmax, normal);
                normal = normalize(tbn * (mapN * vec3(uNormalStrength, uNormalStrength, 1.0)));
            }
        }

        vec3 baseDiffuse = uKd;
        vec3 baseAmbient = uKa;
        float shininess = uShininess;
        vec3 effectiveKs = uKs;
        float aoFactor = 1.0;

        if (uHasTexture == 1) {
            vec3 texColor = texture(uTexture, uv).rgb;
            baseDiffuse = texColor;
            baseAmbient = texColor * 0.35;
        }

        if (uHasRoughnessMap == 1) {
            float rough = texture(uRoughnessMap, uv).r;
            shininess = mix(180.0, 10.0, rough);
            effectiveKs = uKs * (1.0 - smoothstep(0.40, 0.85, rough));
        }

        if (uHasAoMap == 1) {
            aoFactor = texture(uAoMap, uv).r;
        }

        vec3 diffuseColor = baseDiffuse;
        vec3 specularColor = effectiveKs;
        vec3 ambient = baseAmbient * uAmbientLight * aoFactor;

        vec3 dirL = normalize(uDirLightDir);
        float diff1 = max(dot(normal, dirL), 0.0);
        vec3 halfVector1 = normalize(dirL + viewDir);
        float specFactor1 = pow(max(dot(normal, halfVector1), 0.0), max(shininess, 1.0));

        vec3 dirLight = uDirLightColor * uDirLightIntensity;
        vec3 diffuse1 = diffuseColor * dirLight * diff1 * mix(1.0, aoFactor, 0.70);
        vec3 specular1 = specularColor * dirLight * specFactor1;

        vec3 pointDiff = uPointLightPos - vWorldPos;
        float dist = length(pointDiff);
        vec3 pointL = pointDiff / max(dist, 0.00001);
        float attenuation = 1.0 / (1.0 + 0.1 * dist + 0.05 * dist * dist);
        float diff2 = max(dot(normal, pointL), 0.0);
        vec3 halfVector2 = normalize(pointL + viewDir);
        float specFactor2 = pow(max(dot(normal, halfVector2), 0.0), max(shininess, 1.0));

        vec3 pointLight = uPointLightColor * uPointLightIntensity * attenuation;
        vec3 diffuse2 = diffuseColor * pointLight * diff2;
        vec3 specular2 = specularColor * pointLight * specFactor2;

        vec3 finalColor = ambient + diffuse1 + specular1 + diffuse2 + specular2;
        vec3 mappedColor = pow(ACESFilm(finalColor), vec3(1.0 / 2.2));

        fragColor = vec4(mappedColor, 1.0);
    }
    `;

    const shader = new Shader(vertexSource, fragmentSource);
    const layer = new Layer();

    const stuccoTexture = new Texture(TextureWrapping.Repeat);
    const stuccoImg = new Image();
    stuccoImg.crossOrigin = "anonymous";
    stuccoImg.src = `${base}/textures/stucco_diff.jpg`;
    stuccoImg.onload = () => stuccoTexture.setImage(stuccoImg, true);

    const pavementAlbedoTexture = new Texture(TextureWrapping.Repeat);
    const pAlbedoImg = new Image();
    pAlbedoImg.crossOrigin = "anonymous";
    pAlbedoImg.src = `${base}/textures/pavement_albedo.png`;
    pAlbedoImg.onload = () => pavementAlbedoTexture.setImage(pAlbedoImg, true);

    const pavementNormalTexture = new Texture(TextureWrapping.Repeat);
    const pNormalImg = new Image();
    pNormalImg.crossOrigin = "anonymous";
    pNormalImg.src = `${base}/textures/pavement_normal.png`;
    pNormalImg.onload = () => pavementNormalTexture.setImage(pNormalImg, true);

    const pavementRoughTexture = new Texture(TextureWrapping.Repeat);
    const pRoughImg = new Image();
    pRoughImg.crossOrigin = "anonymous";
    pRoughImg.src = `${base}/textures/pavement_roughness.png`;
    pRoughImg.onload = () => pavementRoughTexture.setImage(pRoughImg, true);

    const pavementAOTexture = new Texture(TextureWrapping.Repeat);
    const pAOImg = new Image();
    pAOImg.crossOrigin = "anonymous";
    pAOImg.src = `${base}/textures/pavement_ao.png`;
    pAOImg.onload = () => pavementAOTexture.setImage(pAOImg, true);

    const monkeyNormalTexture = new Texture(TextureWrapping.Repeat);
    const mNormalImg = new Image();
    mNormalImg.crossOrigin = "anonymous";
    mNormalImg.src = `${base}/textures/monkey_normal.png`;
    mNormalImg.onload = () => monkeyNormalTexture.setImage(mNormalImg, true);

    const houseContainer = new Object(0, 0, 0);
    layer.addObject(houseContainer);

    const planeGeo = Shape3d.Plane(24.0, 24.0, 80, 80);
    const planeMesh = new Mesh({ vertices: planeGeo.vertices, indices: planeGeo.indices, hasUV: true });
    planeMesh.name = "GroundPlane";
    planeMesh.setPosition(0, -0.906, 0);
    planeMesh.material = new Material([0.88, 0.88, 0.88], [0.35, 0.35, 0.35], [0.65, 0.65, 0.65], 64.0);
    planeMesh.material.map = pavementAlbedoTexture;
    planeMesh.material.normalMap = pavementNormalTexture;
    planeMesh.material.roughnessMap = pavementRoughTexture;
    planeMesh.material.aoMap = pavementAOTexture;
    planeMesh.normalStrength = planeNormalStrength;
    houseContainer.addChild(planeMesh);

    const modelUrl = `${base}/NewMexico.obj`;
    const modelParser = new WavefrontPharser(modelUrl);
    modelParser
      .load()
      .then((loadedMeshes) => {
        for (const mesh of loadedMeshes) {
          const lower = mesh.name.toLowerCase();
          if (lower.includes("window") && !lower.includes("frame")) {
            mesh.material = new Material([0.14, 0.28, 0.38], [0.04, 0.08, 0.12], [0.98, 0.98, 1.0], 128.0);
          } else if (lower.includes("frame")) {
            mesh.material = new Material([0.09, 0.65, 0.72], [0.03, 0.18, 0.20], [0.35, 0.35, 0.35], 32.0);
          } else if (lower.includes("handel") || lower.includes("handle")) {
            mesh.material = new Material([0.18, 0.16, 0.15], [0.05, 0.05, 0.05], [0.55, 0.52, 0.48], 64.0);
          } else {
            mesh.material = new Material([0.80, 0.48, 0.32], [0.26, 0.16, 0.10], [0.06, 0.06, 0.06], 16.0);
            mesh.material.map = stuccoTexture;
          }

          mesh.setPosition(0, -0.873, -0.446);
          houseContainer.addChild(mesh);
        }
      })
      .catch((err) => {
        console.warn("House OBJ load notice:", err);
      });

    const monkeyUrl = `${base}/blenderMonkey.obj`;
    const monkeyParser = new WavefrontPharser(monkeyUrl);
    monkeyParser
      .load()
      .then((loadedMeshes) => {
        if (loadedMeshes.length > 0) {
          const monkeyMesh = loadedMeshes[0];
          monkeyMesh.name = "BlenderMonkey";
          monkeyMesh.material = new Material(
            [0.85, 0.72, 0.45],
            [0.25, 0.20, 0.12],
            [0.90, 0.85, 0.75],
            72.0
          );
          monkeyMesh.material.normalMap = monkeyNormalTexture;
          monkeyMesh.normalStrength = monkeyNormalStrength;
          monkeyMesh.setPosition(monkeyX, monkeyY, monkeyZ);
          monkeyMesh.setScale(monkeyScale, monkeyScale, monkeyScale);
          monkeyMesh.setRotation(0, degToRad(monkeyRotY), 0);
          houseContainer.addChild(monkeyMesh);
        }
      })
      .catch((err) => {
        console.warn("Blender Monkey OBJ load notice:", err);
      });

    let animationFrameId: number;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const render = () => {
      houseContainer.setRotation(0, degToRad(rotY), 0);
      houseContainer.setScale(1.0, 1.0, 1.0);

      renderer.clear(0.74, 0.82, 0.90, 1.0);

      const gl = renderer.gl;
      const aspect = canvas.width / canvas.height;
      const projection = Mat4.perspective(Math.PI / 4, aspect, 0.1, 100);

      const view = Mat4.lookAt(camX, camY, camZ, targetX, targetY, targetZ, 0, 1, 0);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);

      shader.use();
      shader.setMat4("uProjection", projection);
      shader.setMat4("uView", view);
      shader.setFloat("uTime", performance.now() * 0.001);
      shader.setFloat("uPlaneTiling", planeTiling);

      const sunDirX = Math.cos(sunElevation) * Math.sin(sunAzimuth);
      const sunDirY = Math.sin(sunElevation);
      const sunDirZ = Math.cos(sunElevation) * Math.cos(sunAzimuth);
      shader.setVec3("uDirLightDir", sunDirX, sunDirY, sunDirZ);
      shader.setVec3("uDirLightColor", 1.0, 0.98, 0.94);
      shader.setFloat("uDirLightIntensity", 1.15);

      shader.setVec3("uPointLightPos", 3.0, 4.0, -1.8);
      shader.setVec3("uPointLightColor", 0.25, 0.85, 1.0);
      shader.setFloat("uPointLightIntensity", 0.35);

      shader.setVec3("uAmbientLight", 0.38, 0.38, 0.38);
      shader.setVec3("uViewPos", camX, camY, camZ);

      layer.wireframe = false;
      layer.render(renderer, shader);

      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      renderer.setViewport(0, 0, canvas.width, canvas.height);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === "CANVAS") {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      angleY += dx * 0.008;
      angleX = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, angleX + dy * 0.008));
      syncFromAngles();
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const curDist = Math.hypot(camX - targetX, camY - targetY, camZ - targetZ) || 14.22;
      const newDist = Math.max(1.5, Math.min(30.0, curDist + e.deltaY * 0.005));
      const factor = newDist / curDist;
      camX = targetX + (camX - targetX) * factor;
      camY = targetY + (camY - targetY) * factor;
      camZ = targetZ + (camZ - targetZ) * factor;
      syncFromPosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    handleResize();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(animationFrameId);

      stuccoTexture.dispose();
      pavementAlbedoTexture.dispose();
      pavementNormalTexture.dispose();
      pavementRoughTexture.dispose();
      pavementAOTexture.dispose();
      monkeyNormalTexture.dispose();
    };
  });
</script>

<div class="viewport">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #bcd0e6;
  }

  .viewport {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }
</style>
