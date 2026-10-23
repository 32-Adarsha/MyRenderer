<script lang="ts">
  import { onMount } from "svelte";

  import { Renderer } from "$lib/webgl/Renderer";
  import { Shader } from "$lib/webgl/Shader";
  import { Shape3d } from "$lib/Shapes/Shape3d";
  import { Layer } from "$lib/Scene/Layer";
  import { Object } from "$lib/Scene/Object";
  import { Mesh } from "$lib/Scene/Mesh";
  import { Material } from "$lib/Lighting/Material";
  import { Mat4 } from "$lib/math/Mat4";

  let canvas: HTMLCanvasElement;

  let baseAngle = $state(0);
  let shoulderAngle = $state(-25);
  let elbowAngle = $state(50);
  let wristAngle = $state(-25);
  let clawPinch = $state(15);
  let isAutoAnimating = $state(false);

  let isSmoothShading = $state(true);

  let dirLightIntensity = $state(1.0);
  let pointLightIntensity = $state(1.2);
  let pointLightX = $state(1.5);
  let pointLightY = $state(0.5);
  let pointLightZ = $state(-3.0);

  let jointShininess = $state(96.0);
  let armShininess = $state(32.0);

  let shoulderBallMesh: Mesh;
  let elbowBallMesh: Mesh;
  let lowerArmMesh: Mesh;
  let upperArmMesh: Mesh;

  function resetPose() {
    baseAngle = 0;
    shoulderAngle = -25;
    elbowAngle = 50;
    wristAngle = -25;
    clawPinch = 15;
    dirLightIntensity = 1.0;
    pointLightIntensity = 1.2;
    pointLightX = 1.5;
    pointLightY = 0.5;
    pointLightZ = -3.0;
    jointShininess = 96.0;
    armShininess = 32.0;
  }

  function toggleAutoAnimate() {
    isAutoAnimating = !isAutoAnimating;
  }

  function toggleShadingMode() {
    isSmoothShading = !isSmoothShading;
  }

  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  onMount(() => {
    const renderer = Renderer.getInstance(canvas);
    renderer.enableDepthTest();

    const vertexSource = `#version 300 es
    layout(location = 0) in vec3 aPosition;
    layout(location = 1) in vec3 aNormal;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;

    out vec3 vWorldPos;
    out vec3 vWorldNormal;

    void main() {
        vec4 worldPos = uModel * vec4(aPosition, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = mat3(uModel) * aNormal;
        gl_Position = uProjection * uView * worldPos;
    }
    `;

    const fragmentSource = `#version 300 es
    precision highp float;

    in vec3 vWorldPos;
    in vec3 vWorldNormal;
    out vec4 fragColor;

    uniform vec3 uKd;
    uniform vec3 uKa;
    uniform vec3 uKs;
    uniform float uShininess;

    uniform vec3 uDirLightDir;
    uniform vec3 uDirLightColor;
    uniform float uDirLightIntensity;

    uniform vec3 uPointLightPos;
    uniform vec3 uPointLightColor;
    uniform float uPointLightIntensity;

    uniform vec3 uAmbientLight;
    uniform vec3 uViewPos;
    uniform int uUseSmoothShading;

    void main() {
        vec3 normal;
        if (uUseSmoothShading == 1 && length(vWorldNormal) > 0.001) {
            normal = normalize(vWorldNormal);
        } else {
            normal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
        }

        vec3 viewDir = normalize(uViewPos - vWorldPos);
        if (dot(normal, viewDir) < 0.0) {
            normal = -normal;
        }

        vec3 ambient = uKa * uAmbientLight;

        vec3 dirL = normalize(uDirLightDir);
        float diff1 = max(dot(normal, dirL), 0.0);
        vec3 diffuse1 = uKd * (uDirLightColor * uDirLightIntensity) * diff1;

        vec3 halfDir1 = normalize(dirL + viewDir);
        float spec1 = pow(max(dot(normal, halfDir1), 0.0), uShininess);
        vec3 specular1 = uKs * (uDirLightColor * uDirLightIntensity) * spec1;

        vec3 pointDiff = uPointLightPos - vWorldPos;
        float dist = length(pointDiff);
        vec3 pointL = normalize(pointDiff);
        float attenuation = 1.0 / (1.0 + 0.14 * dist + 0.07 * dist * dist);

        float diff2 = max(dot(normal, pointL), 0.0);
        vec3 diffuse2 = uKd * (uPointLightColor * uPointLightIntensity * attenuation) * diff2;

        vec3 halfDir2 = normalize(pointL + viewDir);
        float spec2 = pow(max(dot(normal, halfDir2), 0.0), uShininess);
        vec3 specular2 = uKs * (uPointLightColor * uPointLightIntensity * attenuation) * spec2;

        vec3 finalColor = ambient + diffuse1 + specular1 + diffuse2 + specular2;
        fragColor = vec4(finalColor, 1.0);
    }
    `;

    const shader = new Shader(vertexSource, fragmentSource);

    const layer = new Layer();

    const baseJoint = new Object(0, -1.3, -4.8);

    const baseMaterial = new Material(
      [0.25, 0.28, 0.35],
      [0.15, 0.17, 0.22],
      [0.1, 0.1, 0.1],
      16.0,
    );
    const basePedestal = new Mesh(
      Shape3d.Cylinder(0.65, 0.35, 16),
      0,
      0.175,
      0,
      baseMaterial,
    );
    baseJoint.addChild(basePedestal);

    const shoulderJoint = new Object(0, 0.35, 0);
    baseJoint.addChild(shoulderJoint);

    const jointMaterial1 = new Material(
      [0.95, 0.72, 0.18],
      [0.25, 0.18, 0.05],
      [0.9, 0.9, 0.9],
      96.0,
    );
    shoulderBallMesh = new Mesh(
      Shape3d.Sphere(0.24, 16, 12),
      0,
      0,
      0,
      jointMaterial1,
    );
    shoulderJoint.addChild(shoulderBallMesh);

    const lowerArmMaterial = new Material(
      [0.85, 0.38, 0.12],
      [0.22, 0.1, 0.03],
      [0.45, 0.45, 0.45],
      32.0,
    );
    lowerArmMesh = new Mesh(
      Shape3d.Cylinder(0.18, 1.1, 14),
      0,
      0.55,
      0,
      lowerArmMaterial,
    );
    shoulderJoint.addChild(lowerArmMesh);

    const elbowJoint = new Object(0, 1.1, 0);
    shoulderJoint.addChild(elbowJoint);

    const jointMaterial2 = new Material(
      [0.95, 0.72, 0.18],
      [0.25, 0.18, 0.05],
      [0.9, 0.9, 0.9],
      96.0,
    );
    elbowBallMesh = new Mesh(
      Shape3d.Sphere(0.21, 16, 12),
      0,
      0,
      0,
      jointMaterial2,
    );
    elbowJoint.addChild(elbowBallMesh);

    const upperArmMaterial = new Material(
      [0.2, 0.55, 0.88],
      [0.05, 0.14, 0.22],
      [0.55, 0.55, 0.6],
      40.0,
    );
    upperArmMesh = new Mesh(
      Shape3d.Cylinder(0.14, 0.95, 14),
      0,
      0.475,
      0,
      upperArmMaterial,
    );
    elbowJoint.addChild(upperArmMesh);

    const wristJoint = new Object(0, 0.95, 0);
    elbowJoint.addChild(wristJoint);

    const wristMaterial = new Material(
      [0.32, 0.35, 0.42],
      [0.1, 0.11, 0.14],
      [0.7, 0.7, 0.75],
      64.0,
    );
    const wristBall = new Mesh(
      Shape3d.Sphere(0.17, 14, 10),
      0,
      0,
      0,
      wristMaterial,
    );
    wristJoint.addChild(wristBall);

    const handPalmMaterial = new Material(
      [0.16, 0.72, 0.72],
      [0.04, 0.18, 0.18],
      [0.2, 0.2, 0.2],
      24.0,
    );
    const handPalm = new Mesh(
      Shape3d.Cube(0.32, 0.12, 0.18),
      0,
      0.14,
      0,
      handPalmMaterial,
    );
    wristJoint.addChild(handPalm);

    const clawMaterial = new Material(
      [0.78, 0.8, 0.84],
      [0.2, 0.21, 0.23],
      [0.85, 0.85, 0.9],
      128.0,
    );

    const leftClawJoint = new Object(-0.11, 0.2, 0);
    wristJoint.addChild(leftClawJoint);

    const leftClawMesh = new Mesh(
      Shape3d.Cube(0.06, 0.24, 0.08),
      0,
      0.12,
      0,
      clawMaterial,
    );
    leftClawJoint.addChild(leftClawMesh);

    const rightClawJoint = new Object(0.11, 0.2, 0);
    wristJoint.addChild(rightClawJoint);

    const rightClawMesh = new Mesh(
      Shape3d.Cube(0.06, 0.24, 0.08),
      0,
      0.12,
      0,
      clawMaterial,
    );
    rightClawJoint.addChild(rightClawMesh);

    layer.addObject(baseJoint);

    let animationFrameId: number;
    let animTime = 0;

    let camRotX = 0.2;
    let camRotY = 0.0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isAutoAnimating) {
        animTime += dt;
        baseAngle = Math.sin(animTime * 0.8) * 60;
        shoulderAngle = -20 + Math.sin(animTime * 1.2) * 35;
        elbowAngle = 40 + Math.cos(animTime * 1.5) * 45;
        wristAngle = -20 + Math.sin(animTime * 2.0) * 35;
        clawPinch = 15 + Math.sin(animTime * 2.5) * 15;
      }

      if (shoulderBallMesh) shoulderBallMesh.material.shininess = jointShininess;
      if (elbowBallMesh) elbowBallMesh.material.shininess = jointShininess;
      if (lowerArmMesh) lowerArmMesh.material.shininess = armShininess;
      if (upperArmMesh) upperArmMesh.material.shininess = armShininess;

      baseJoint.setRotation(0, degToRad(baseAngle), 0);
      shoulderJoint.setRotation(0, 0, degToRad(shoulderAngle));
      elbowJoint.setRotation(0, 0, degToRad(elbowAngle));
      wristJoint.setRotation(0, 0, degToRad(wristAngle));
      leftClawJoint.setRotation(0, 0, -degToRad(clawPinch));
      rightClawJoint.setRotation(0, 0, degToRad(clawPinch));

      renderer.clear(240 / 255, 242 / 255, 245 / 255, 1.0);

      shader.use();

      const aspect = canvas.width / canvas.height;
      const projection = Mat4.perspective(Math.PI / 4, aspect, 0.1, 100);
      const view = Mat4.fromRotationTranslationScale(
        camRotX,
        camRotY,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
      );

      shader.setMat4("uProjection", projection);
      shader.setMat4("uView", view);

      shader.setVec3("uDirLightDir", 0.6, 1.0, 0.8);
      shader.setVec3("uDirLightColor", 1.0, 0.98, 0.95);
      shader.setFloat("uDirLightIntensity", dirLightIntensity);

      shader.setVec3("uPointLightPos", pointLightX, pointLightY, pointLightZ);
      shader.setVec3("uPointLightColor", 0.2, 0.85, 1.0);
      shader.setFloat("uPointLightIntensity", pointLightIntensity);

      shader.setVec3("uAmbientLight", 0.35, 0.35, 0.35);
      shader.setVec3("uViewPos", 0.0, 0.0, 0.0);
      shader.setInt("uUseSmoothShading", isSmoothShading ? 1 : 0);

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
      camRotY += dx * 0.008;
      camRotX += dy * 0.008;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousedown", handleMouseDown);

    handleResize();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousedown", handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  });
</script>

<div class="container">
  <canvas bind:this={canvas}></canvas>

  <div class="controls">
    <h3>Robotic Arm Controls</h3>

    <div class="section-title">Joint Movements</div>
    <div class="row">
      <label for="base">Base (Yaw):</label>
      <input
        id="base"
        type="range"
        min="-180"
        max="180"
        bind:value={baseAngle}
      />
      <input type="number" min="-180" max="180" bind:value={baseAngle} />
    </div>

    <div class="row">
      <label for="shoulder">Shoulder:</label>
      <input
        id="shoulder"
        type="range"
        min="-80"
        max="80"
        bind:value={shoulderAngle}
      />
      <input type="number" min="-80" max="80" bind:value={shoulderAngle} />
    </div>

    <div class="row">
      <label for="elbow">Elbow:</label>
      <input
        id="elbow"
        type="range"
        min="-100"
        max="100"
        bind:value={elbowAngle}
      />
      <input type="number" min="-100" max="100" bind:value={elbowAngle} />
    </div>

    <div class="row">
      <label for="wrist">Wrist:</label>
      <input
        id="wrist"
        type="range"
        min="-90"
        max="90"
        bind:value={wristAngle}
      />
      <input type="number" min="-90" max="90" bind:value={wristAngle} />
    </div>

    <div class="row">
      <label for="pinch">Gripper:</label>
      <input
        id="pinch"
        type="range"
        min="0"
        max="35"
        bind:value={clawPinch}
      />
      <input type="number" min="0" max="35" bind:value={clawPinch} />
    </div>

    <div class="section-title">Lighting Controls</div>
    <div class="row">
      <label for="dir-light">Sun Light:</label>
      <input
        id="dir-light"
        type="range"
        min="0"
        max="2.5"
        step="0.05"
        bind:value={dirLightIntensity}
      />
      <input type="number" min="0" max="2.5" step="0.1" bind:value={dirLightIntensity} />
    </div>

    <div class="row">
      <label for="point-light">Cyan Point:</label>
      <input
        id="point-light"
        type="range"
        min="0"
        max="3.0"
        step="0.05"
        bind:value={pointLightIntensity}
      />
      <input type="number" min="0" max="3.0" step="0.1" bind:value={pointLightIntensity} />
    </div>

    <div class="row">
      <label for="point-x">Point Light X:</label>
      <input
        id="point-x"
        type="range"
        min="-4.0"
        max="4.0"
        step="0.1"
        bind:value={pointLightX}
      />
      <input type="number" min="-4.0" max="4.0" step="0.1" bind:value={pointLightX} />
    </div>

    <div class="section-title">Material Controls</div>
    <div class="row">
      <label for="joint-shine">Joint Shine:</label>
      <input
        id="joint-shine"
        type="range"
        min="4"
        max="128"
        step="2"
        bind:value={jointShininess}
      />
      <input type="number" min="4" max="128" step="1" bind:value={jointShininess} />
    </div>

    <div class="row">
      <label for="arm-shine">Arm Shine:</label>
      <input
        id="arm-shine"
        type="range"
        min="4"
        max="128"
        step="2"
        bind:value={armShininess}
      />
      <input type="number" min="4" max="128" step="1" bind:value={armShininess} />
    </div>

    <div class="buttons">
      <button onclick={toggleAutoAnimate}>
        {isAutoAnimating ? "Stop Animation" : "Auto Animate"}
      </button>
      <button onclick={toggleShadingMode}>
        {isSmoothShading ? "Shading: Smooth" : "Shading: Flat"}
      </button>
      <button onclick={resetPose}>Reset</button>
    </div>
  </div>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: Arial, sans-serif;
  }

  .container {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: default;
  }

  .controls {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid #999;
    padding: 10px 14px;
    font-size: 13px;
    color: #222;
    max-height: 95vh;
    overflow-y: auto;
  }

  .controls h3 {
    margin: 0 0 8px 0;
    font-size: 14px;
  }

  .section-title {
    font-weight: bold;
    font-size: 11px;
    text-transform: uppercase;
    color: #555;
    margin: 8px 0 4px 0;
    border-bottom: 1px solid #ddd;
    padding-bottom: 2px;
  }

  .row {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
    gap: 8px;
  }

  .row label {
    width: 82px;
  }

  .row input[type="range"] {
    width: 110px;
  }

  .row input[type="number"] {
    width: 48px;
  }

  .buttons {
    margin-top: 10px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .buttons button {
    padding: 4px 8px;
    cursor: pointer;
  }
</style>
