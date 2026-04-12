import { useEffect, useRef, useState, useCallback } from "react";
import { parseCubeFile, LutData } from "@/lib/lutParser";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp sampler3D;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_image;
uniform sampler3D u_lut;
uniform float u_intensity;
uniform float u_lutSize;

void main() {
  vec4 originalColor = texture(u_image, v_texCoord);
  
  float scale = (u_lutSize - 1.0) / u_lutSize;
  float offset = 0.5 / u_lutSize;
  vec3 lutCoord = originalColor.rgb * scale + offset;
  
  vec4 gradedColor = texture(u_lut, lutCoord);
  
  fragColor = vec4(mix(originalColor.rgb, gradedColor.rgb, u_intensity), originalColor.a);
}`;

interface LUTCanvasProps {
  imageUrl: string;
  lutUrl: string;
  intensity: number;
  className?: string;
  style?: React.CSSProperties;
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  return program;
}

const LUTCanvas = ({ imageUrl, lutUrl, intensity, className, style }: LUTCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const lutTexRef = useRef<WebGLTexture | null>(null);
  const imgTexRef = useRef<WebGLTexture | null>(null);
  const lutSizeRef = useRef(0);
  const lutCacheRef = useRef<{ url: string; data: LutData } | null>(null);
  const animFrameRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const imgReadyRef = useRef(false);
  const lutReadyRef = useRef(false);
  const dimensionsRef = useRef({ width: 800, height: 600 });

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || glRef.current) return glRef.current;

    const gl = canvas.getContext("webgl2", { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) {
      console.error("WebGL2 not supported");
      return null;
    }

    // Check for float texture support
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      console.warn("EXT_color_buffer_float not available, trying OES_texture_float_linear");
    }
    gl.getExtension("OES_texture_float_linear");

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = createProgram(gl, vs, fs);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(posLoc);
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);

    glRef.current = gl;
    programRef.current = program;
    return gl;
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas || !imgTexRef.current || !lutTexRef.current || lutSizeRef.current === 0) return;

    canvas.width = dimensionsRef.current.width;
    canvas.height = dimensionsRef.current.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imgTexRef.current);
    gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, lutTexRef.current);
    gl.uniform1i(gl.getUniformLocation(program, "u_lut"), 1);

    gl.uniform1f(gl.getUniformLocation(program, "u_intensity"), intensity / 100);
    gl.uniform1f(gl.getUniformLocation(program, "u_lutSize"), lutSizeRef.current);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [intensity]);

  const checkReady = useCallback(() => {
    if (imgReadyRef.current && lutReadyRef.current) {
      setReady(true);
    }
  }, []);

  // Load image
  useEffect(() => {
    const gl = initGL();
    if (!gl) return;

    imgReadyRef.current = false;
    setReady(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      dimensionsRef.current = { width: img.naturalWidth, height: img.naturalHeight };

      if (imgTexRef.current) gl.deleteTexture(imgTexRef.current);
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      imgTexRef.current = tex;
      imgReadyRef.current = true;
      checkReady();
    };
    img.src = imageUrl;
  }, [imageUrl, initGL, checkReady]);

  // Load LUT
  useEffect(() => {
    const gl = initGL();
    if (!gl) return;

    lutReadyRef.current = false;
    setReady(false);

    (async () => {
      try {
        let lutData: LutData;
        if (lutCacheRef.current?.url === lutUrl) {
          lutData = lutCacheRef.current.data;
        } else {
          lutData = await parseCubeFile(lutUrl);
          lutCacheRef.current = { url: lutUrl, data: lutData };
        }

        if (lutTexRef.current) gl.deleteTexture(lutTexRef.current);
        const tex = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_3D, tex);
        gl.texImage3D(
          gl.TEXTURE_3D, 0, gl.RGBA32F,
          lutData.size, lutData.size, lutData.size,
          0, gl.RGBA, gl.FLOAT, lutData.table
        );
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        lutTexRef.current = tex;
        lutSizeRef.current = lutData.size;
        lutReadyRef.current = true;
        checkReady();
      } catch (e) {
        console.error("Failed to load LUT:", e);
      }
    })();
  }, [lutUrl, initGL, checkReady]);

  // Render when ready or intensity changes
  useEffect(() => {
    if (!ready) return;
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => render());
  }, [ready, intensity, render]);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
    />
  );
};

export default LUTCanvas;

export async function renderLUTToDataURL(
  imageUrl: string,
  lutUrl: string,
  intensity: number,
  maxSize?: number
): Promise<string> {
  const lutData = await parseCubeFile(lutUrl);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (maxSize && (w > maxSize || h > maxSize)) {
        const scale = maxSize / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const gl = canvas.getContext("webgl2", { premultipliedAlpha: false, preserveDrawingBuffer: true });
      if (!gl) { reject(new Error("WebGL2 not available")); return; }

      gl.getExtension("EXT_color_buffer_float");
      gl.getExtension("OES_texture_float_linear");

      const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      const program = createProgram(gl, vs, fs);

      const posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
      ]), gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(program, "a_position");
      const texLoc = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(posLoc);
      gl.enableVertexAttribArray(texLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);

      const imgTex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const lutTex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_3D, lutTex);
      gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA32F, lutData.size, lutData.size, lutData.size, 0, gl.RGBA, gl.FLOAT, lutData.table);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.viewport(0, 0, w, h);
      gl.useProgram(program);
      gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
      gl.uniform1i(gl.getUniformLocation(program, "u_lut"), 1);
      gl.uniform1f(gl.getUniformLocation(program, "u_intensity"), intensity / 100);
      gl.uniform1f(gl.getUniformLocation(program, "u_lutSize"), lutData.size);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      resolve(canvas.toDataURL("image/png"));
      gl.deleteTexture(imgTex);
      gl.deleteTexture(lutTex);
      gl.deleteProgram(program);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
