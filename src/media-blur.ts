/** A shared, separable Gaussian field. Broad diffusion must not use nine sparse taps. */
export function createMediaBlur(gl: WebGLRenderingContext) {
  const vertex = `attribute vec2 a_position; varying vec2 v_uv;
    void main(){v_uv=a_position;gl_Position=vec4(a_position*2.0-1.0,0.0,1.0);}`;
  const fragment = `precision highp float;
    uniform sampler2D u_image; uniform vec2 u_view; uniform vec4 u_sourceRect;
    uniform vec3 u_background; uniform vec2 u_step; uniform float u_original;
    varying vec2 v_uv;
    vec3 readAt(vec2 point){
      vec2 uv=u_original>0.5?(point-u_sourceRect.xy)/u_sourceRect.zw:point/u_view;
      if(u_original>0.5&&(uv.x<0.0||uv.y<0.0||uv.x>1.0||uv.y>1.0))return u_background;
      vec4 c=texture2D(u_image,clamp(uv,0.0,1.0));return mix(u_background,c.rgb,c.a);
    }
    void main(){
      vec3 color=vec3(0.0);float total=0.0;
      for(int i=-12;i<=12;i++){float f=float(i);float weight=exp(-f*f/32.0);
        color+=readAt(v_uv*u_view+u_step*f)*weight;total+=weight;}
      gl_FragColor=vec4(color/total,1.0);
    }`;
  const program = gl.createProgram(); if (!program) throw new Error('blur-program-allocation-failed');
  const shaders: WebGLShader[] = [];
  let buffer: WebGLBuffer | null = null, framebuffer: WebGLFramebuffer | null = null;
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type); if (!shader) throw new Error('blur-shader-allocation-failed');
      shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'blur-shader-failed');
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('blur-program-link-failed');
    buffer = gl.createBuffer(); framebuffer = gl.createFramebuffer();
    if (!buffer || !framebuffer) throw new Error('blur-buffer-allocation-failed');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]), gl.STATIC_DRAW);
  } catch (error) {
    if (buffer) gl.deleteBuffer(buffer); if (framebuffer) gl.deleteFramebuffer(framebuffer); gl.deleteProgram(program); throw error;
  } finally { for (const shader of shaders) gl.deleteShader(shader); }
  const locations = Object.fromEntries(['image','view','sourceRect','background','step','original'].map(name => [name, gl.getUniformLocation(program, `u_${name}`)]));
  const attribute = gl.getAttribLocation(program, 'a_position');
  const cache = new Map<string, { textures: [WebGLTexture, WebGLTexture]; version: number; width: number; height: number }>();
  const used = new Set<string>();
  function clear() {
    for (const entry of cache.values()) for (const texture of entry.textures) gl.deleteTexture(texture);
    cache.clear();
  }
  return {
    begin() { used.clear(); },
    get(source: WebGLTexture, view: [number, number], sourceRect: [number, number, number, number], background: readonly [number, number, number], radius: number, version: number) {
      const key = [radius, ...view, ...sourceRect, ...background].join(':'); used.add(key);
      let entry = cache.get(key);
      if (!entry) {
        const downsample = Math.max(1, Math.min(4, radius / 4), Math.max(...view) / 512);
        const width = Math.max(1, Math.ceil(view[0] / downsample)), height = Math.max(1, Math.ceil(view[1] / downsample));
        const textures: WebGLTexture[] = [];
        try {
          for (let i = 0; i < 2; i++) {
            const texture = gl.createTexture(); if (!texture) throw new Error('blur-texture-allocation-failed');
            textures.push(texture); gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          }
        } catch (error) { for (const texture of textures) gl.deleteTexture(texture); throw error; }
        entry = { textures: textures as [WebGLTexture, WebGLTexture], version: -1, width, height }; cache.set(key, entry);
      }
      if (entry.version !== version) {
        gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.viewport(0, 0, entry.width, entry.height);
        gl.uniform1i(locations.image, 0); gl.uniform2f(locations.view, ...view);
        gl.uniform4f(locations.sourceRect, ...sourceRect); gl.uniform3f(locations.background, ...background);
        try {
          for (let pass = 0; pass < 2; pass++) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, entry.textures[pass], 0);
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('blur-framebuffer-incomplete');
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, pass ? entry.textures[0] : source);
            gl.uniform1f(locations.original, pass ? 0 : 1);
            gl.uniform2f(locations.step, pass ? 0 : radius / 4, pass ? radius / 4 : 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
          entry.version = version;
        } finally { gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
      }
      return entry.textures[1];
    },
    end() { for (const [key, entry] of cache) if (!used.has(key)) { for (const texture of entry.textures) gl.deleteTexture(texture); cache.delete(key); } },
    clear,
    destroy() { clear(); gl.deleteFramebuffer(framebuffer); gl.deleteBuffer(buffer); gl.deleteProgram(program); },
  };
}
