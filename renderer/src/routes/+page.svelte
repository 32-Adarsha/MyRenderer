<script lang="ts">
  import { onMount } from "svelte";

  import { Renderer } from "$lib/webgl/Renderer";
  import { Shader } from "$lib/webgl/Shader";
  import { Shape3d } from "$lib/Shapes/Shape3d";
  import { Layer } from "$lib/Scene/Layer";
  import { Object } from "$lib/Scene/Object";
  import { Mesh } from "$lib/Scene/Mesh";
  import { Mat4 } from "$lib/math/Mat4";

  let canvas: HTMLCanvasElement;

  let baseAngle = $state(0);
  let shoulderAngle = $state(-25);
  let elbowAngle = $state(50);
  let wristAngle = $state(-25);
  let clawPinch = $state(15);
  let isAutoAnimating = $state(false);

  function resetPose() {
    baseAngle = 0;
    shoulderAngle = -25;
    elbowAngle = 50;
    wristAngle = -25;
    clawPinch = 15;
  }

  function toggleAutoAnimate() {
    isAutoAnimating = !isAutoAnimating;
  }

  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  onMount(() => {
    const renderer = Renderer.getInstance(canvas);
    renderer.enableDepthTest();

    const vertexSource = `#version 300 es
    layout(location = 0) in vec3 aPosition;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;

    void main() {
        gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    }
    `;

    const fragmentSource = `#version 300 es
    precision highp float;

    out vec4 fragColor;

    uniform vec3 uColor;

    void main() {
        fragColor = vec4(uColor, 1.0);
    }
    `;

    const shader = new Shader(vertexSource, fragmentSource);

    const layer = new Layer();

    const baseJoint = new Object(0, -1.3, -4.8);

    const basePedestal = new Mesh(
      Shape3d.Cylinder(0.65, 0.35, 32),
      0,
      0.175,
      0,
      [0.22, 0.25, 0.32],
    );
    baseJoint.addChild(basePedestal);

    const shoulderJoint = new Object(0, 0.35, 0);
    baseJoint.addChild(shoulderJoint);

    const shoulderBall = new Mesh(
      Shape3d.Sphere(0.24, 24, 24),
      0,
      0,
      0,
      [0.95, 0.65, 0.15],
    );
    shoulderJoint.addChild(shoulderBall);

    const lowerArm = new Mesh(
      Shape3d.Cylinder(0.18, 1.1, 24),
      0,
      0.55,
      0,
      [0.85, 0.38, 0.12],
    );
    shoulderJoint.addChild(lowerArm);

    const elbowJoint = new Object(0, 1.1, 0);
    shoulderJoint.addChild(elbowJoint);

    const elbowBall = new Mesh(
      Shape3d.Sphere(0.21, 24, 24),
      0,
      0,
      0,
      [0.95, 0.65, 0.15],
    );
    elbowJoint.addChild(elbowBall);

    const upperArm = new Mesh(
      Shape3d.Cylinder(0.14, 0.95, 24),
      0,
      0.475,
      0,
      [0.2, 0.55, 0.85],
    );
    elbowJoint.addChild(upperArm);

    const wristJoint = new Object(0, 0.95, 0);
    elbowJoint.addChild(wristJoint);

    const wristBall = new Mesh(
      Shape3d.Sphere(0.17, 20, 20),
      0,
      0,
      0,
      [0.32, 0.35, 0.42],
    );
    wristJoint.addChild(wristBall);

    const handPalm = new Mesh(
      Shape3d.Cube(0.32, 0.12, 0.18),
      0,
      0.14,
      0,
      [0.15, 0.72, 0.75],
    );
    wristJoint.addChild(handPalm);

    const leftClawJoint = new Object(-0.11, 0.2, 0);
    wristJoint.addChild(leftClawJoint);

    const leftClawMesh = new Mesh(
      Shape3d.Cube(0.06, 0.24, 0.08),
      0,
      0.12,
      0,
      [0.75, 0.78, 0.82],
    );
    leftClawJoint.addChild(leftClawMesh);

    const rightClawJoint = new Object(0.11, 0.2, 0);
    wristJoint.addChild(rightClawJoint);

    const rightClawMesh = new Mesh(
      Shape3d.Cube(0.06, 0.24, 0.08),
      0,
      0.12,
      0,
      [0.75, 0.78, 0.82],
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

    <div class="buttons">
      <button onclick={toggleAutoAnimate}>
        {isAutoAnimating ? "Stop Animation" : "Auto Animate"}
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
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #999;
    padding: 10px 14px;
    font-size: 13px;
    color: #222;
  }

  .controls h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
  }

  .row {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    gap: 8px;
  }

  .row label {
    width: 80px;
  }

  .row input[type="range"] {
    width: 120px;
  }

  .row input[type="number"] {
    width: 50px;
  }

  .buttons {
    margin-top: 10px;
    display: flex;
    gap: 6px;
  }

  .buttons button {
    padding: 3px 8px;
    cursor: pointer;
  }
</style>
