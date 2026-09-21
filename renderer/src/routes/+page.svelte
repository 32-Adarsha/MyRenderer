<script lang="ts">
    import { onMount } from "svelte";

    import { Renderer } from "$lib/webgl/Renderer";
    import { Shader } from "$lib/webgl/Shader";
    import { VertexBuffer } from "$lib/webgl/VertexBuffer";
    import { VertexArray } from "$lib/webgl/VertexArray";
    import { VertexLayout } from "$lib/webgl/VertexLayout";

    let canvas: HTMLCanvasElement;

    onMount(() => {
        // 1. Initialize renderer
        const renderer = Renderer.getInstance(canvas);

        renderer.enableDepthTest();

        // 2. Vertex shader
        const vertexSource = `#version 300 es

        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aColor;

        out vec3 vColor;

        void main() {
            gl_Position = vec4(aPosition, 1.0);
            vColor = aColor;
        }
        `;

        // 3. Fragment shader
        const fragmentSource = `#version 300 es

        precision mediump float;

        in vec3 vColor;

        out vec4 fragColor;

        void main() {
            fragColor = vec4(vColor, 1.0);
        }
        `;

        const shader = new Shader(
            vertexSource,
            fragmentSource
        );

        // 4. Vertex data
        const vertices = new Float32Array([
            // position          // color
             0.0,  0.5, 0.0,     1.0, 0.0, 0.0,
            -0.5, -0.5, 0.0,     0.0, 1.0, 0.0,
             0.5, -0.5, 0.0,     0.0, 0.0, 1.0
        ]);

        // 5. Vertex buffer
        const vertexBuffer = new VertexBuffer();

        vertexBuffer.setData(vertices);

        // 6. Describe vertex layout
        const layout = new VertexLayout([
            { location: 0, size: 3 },
            { location: 1, size: 3 }
        ]);

        // 7. VAO
        const vertexArray = new VertexArray();

        vertexArray.addBuffer(
            vertexBuffer,
            layout
        );

        // 8. Render function
        const render = () => {
            renderer.clear(
                244 / 255,
                244 / 255,
                244 / 255,
                1.0
            );

            shader.use();

            renderer.drawArrays(
                vertexArray,
                3
            );
        };

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            renderer.setViewport(0, 0, canvas.width, canvas.height);
            render();
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    });
</script>

<canvas bind:this={canvas}></canvas>

<style>
    :global(html, body) {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    canvas {
        display: block;
        width: 100vw;
        height: 100vh;
    }
</style>
