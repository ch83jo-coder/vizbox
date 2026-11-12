/* SEATVIEW — 予約前の座席ビュー（依存ライブラリなしの静的アプリ） */
(() => {
  'use strict';

  // ───────────────────────── 上映館データ ─────────────────────────
  // 長さの単位はメートル。スクリーンは z=0 平面、客席は +z 方向。
  const HALLS = [
    { id: 'std', name: 'シアター1', tag: 'スタンダード', rows: 10, cols: 14, aisles: [3, 9],
      seatW: 0.56, pitch: 1.05, riser: 0.32, first: 5.5, screenW: 12, aspect: 2.39, screenBottom: 1.6,
      ideal: 50, price: 2000, seed: 11, seatColor: [0.50, 0.10, 0.12], wall: [0.20, 0.17, 0.18] },
    { id: 'large', name: 'シアター2', tag: 'ラージスクリーン', rows: 14, cols: 22, aisles: [5, 15],
      seatW: 0.58, pitch: 1.15, riser: 0.45, first: 7.5, screenW: 22, aspect: 1.9, screenBottom: 1.8,
      ideal: 60, price: 2600, seed: 29, seatColor: [0.14, 0.17, 0.30], wall: [0.15, 0.16, 0.20] },
    { id: 'private', name: 'シアター3', tag: 'プライベート', rows: 5, cols: 8, aisles: [3],
      seatW: 0.9, pitch: 1.7, riser: 0.3, first: 4.5, screenW: 8.5, aspect: 2.39, screenBottom: 1.3,
      ideal: 50, price: 4500, seed: 47, seatColor: [0.46, 0.31, 0.19], wall: [0.19, 0.17, 0.15] },
  ];
  const AISLE_W = 1.1, EYE_H = 1.18, MAX_PICK = 8;
  const ROW_NAMES = 'ABCDEFGHIJKLMNOPQRST';
  const DEG = 180 / Math.PI;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (id) => document.getElementById(id);

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 上映館の形状と、座席ごとの見え方の指標を計算する。
  function buildHall(def) {
    const h = { ...def };
    const xs = [];
    let x = 0;
    for (let c = 0; c < h.cols; c++) {
      xs.push(x);
      x += h.seatW;
      if (h.aisles.includes(c)) x += AISLE_W;
    }
    const mid = (xs[0] + xs[xs.length - 1]) / 2;
    h.xs = xs.map((v) => v - mid);
    h.aisleXs = h.aisles.map((c) => h.xs[c] + h.seatW / 2 + AISLE_W / 2);
    h.screenH = h.screenW / h.aspect;
    h.screenCY = h.screenBottom + h.screenH / 2;
    const seatsHalf = h.xs[h.cols - 1] + h.seatW / 2;
    h.halfW = Math.max(h.screenW / 2 + 1.0, seatsHalf + 1.3);
    h.sideAisle = seatsHalf + (h.halfW - seatsHalf) / 2;
    h.depth = h.first + (h.rows - 1) * h.pitch + 2.2;
    h.height = Math.max(h.screenBottom + h.screenH + 1.0, (h.rows - 1) * h.riser + 3.3);

    h.seats = [];
    for (let r = 0; r < h.rows; r++) {
      for (let c = 0; c < h.cols; c++) {
        const eye = [h.xs[c], r * h.riser + EYE_H, h.first + r * h.pitch];
        const m = metrics(h, eye);
        h.seats.push({ id: r + '-' + c, r, c, eye, ...m, label: ROW_NAMES[r] + '列 ' + (c + 1) + '番', short: ROW_NAMES[r] + (c + 1) });
      }
    }
    // スコアの高い席ほど先に売れるように予約済みの席を作る。
    const rnd = mulberry32(h.seed);
    for (const s of h.seats) s.taken = rnd() < 0.08 + 0.5 * Math.pow(s.score / 100, 2.2);
    h.best = h.seats.filter((s) => !s.taken).sort((a, b) => b.score - a.score)[0] || h.seats[0];
    return h;
  }

  function metrics(h, eye) {
    const [ex, ey, ez] = eye;
    const dist = Math.hypot(ex, h.screenCY - ey, ez);
    const hAngle = (Math.atan2(h.screenW / 2 - ex, ez) - Math.atan2(-h.screenW / 2 - ex, ez)) * DEG;
    const elev = Math.atan2(h.screenCY - ey, Math.hypot(ex, ez)) * DEG;
    const off = Math.abs(Math.atan2(ex, ez)) * DEG;
    const s1 = clamp(1 - Math.abs(hAngle - h.ideal) / 40, 0, 1);
    const s2 = clamp(1 - Math.max(0, Math.abs(elev) - 5) / 30, 0, 1);
    const s3 = clamp(1 - Math.max(0, off - 5) / 40, 0, 1);
    const score = Math.round(100 * (0.45 * s1 + 0.3 * s2 + 0.25 * s3));
    return { dist, hAngle, elev, off, score };
  }

  // ───────────────────────── 状態 ─────────────────────────
  const halls = HALLS.map(buildHall);
  const state = {
    hall: halls[0], selected: [], hover: null,
    heat: true, people: true, house: false, pattern: false,
  };
  const seatById = (id) => state.hall.seats.find((s) => s.id === id);
  const viewSeat = () => state.hover || (state.selected.length ? seatById(state.selected[state.selected.length - 1]) : state.hall.best);

  // ───────────────────────── 3D レンダラー (WebGL) ─────────────────────────
  const STRIDE = 11; // pos3 normal3 color3 uv2

  function pushVert(o, p, n, c, u, v) { o.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], u, v); }
  function quad(o, a, b, c, d, n, col, uv) {
    const t = uv ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[-1, -1], [-1, -1], [-1, -1], [-1, -1]];
    const v = [a, b, c, d];
    for (const i of [0, 1, 2, 0, 2, 3]) pushVert(o, v[i], n, col, t[i][0], t[i][1]);
  }
  function box(o, x0, y0, z0, x1, y1, z1, col, emissive) {
    const N = (n) => (emissive ? [0, 0, 0] : n);
    quad(o, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], N([0, 0, -1]), col);
    quad(o, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], N([0, 0, 1]), col);
    quad(o, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], N([-1, 0, 0]), col);
    quad(o, [x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], N([1, 0, 0]), col);
    quad(o, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], N([0, 1, 0]), col);
    quad(o, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], N([0, -1, 0]), col);
  }
  function sphere(o, cx, cy, cz, rx, ry, col) {
    const SEG = 10, RING = 7;
    const pt = (i, j) => {
      const th = (i / SEG) * Math.PI * 2, ph = (j / RING) * Math.PI;
      const n = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      return [[cx + n[0] * rx, cy + n[1] * ry, cz + n[2] * rx], n];
    };
    for (let j = 0; j < RING; j++) for (let i = 0; i < SEG; i++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      for (const q of [a, b, c, a, c, d]) pushVert(o, q[0], q[1], col, -1, -1);
    }
  }

  function buildHallMesh(h) {
    const o = [];
    const W = h.halfW, D = h.depth, H = h.height;
    const carpet = [0.17, 0.14, 0.15], wall = h.wall, dark = [0.035, 0.035, 0.04];
    const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

    // 床・天井・前後の壁
    quad(o, [-W, 0, -0.6], [W, 0, -0.6], [W, 0, D], [-W, 0, D], [0, 1, 0], carpet);
    quad(o, [-W, H, -0.6], [W, H, -0.6], [W, H, D], [-W, H, D], [0, -1, 0], shade(wall, 0.45));
    quad(o, [-W, 0, -0.6], [W, 0, -0.6], [W, H, -0.6], [-W, H, -0.6], [0, 0, 1], dark);
    quad(o, [-W, 0, D], [W, 0, D], [W, H, D], [-W, H, D], [0, 0, -1], shade(wall, 0.8));
    // 側壁：吸音パネルが交互に見えるよう分割する。
    const panel = 1.6;
    for (let z = -0.6, i = 0; z < D; z += panel, i++) {
      const z1 = Math.min(D, z + panel), col = shade(wall, i % 2 ? 1 : 0.8);
      quad(o, [-W, 0, z], [-W, 0, z1], [-W, H, z1], [-W, H, z], [1, 0, 0], col);
      quad(o, [W, 0, z], [W, 0, z1], [W, H, z1], [W, H, z], [-1, 0, 0], col);
    }
    // スクリーンとマスキング
    const sw = h.screenW / 2, sb = h.screenBottom, st = sb + h.screenH;
    quad(o, [-sw, sb, 0], [sw, sb, 0], [sw, st, 0], [-sw, st, 0], [0, 0, 1], [1, 1, 1], true);
    const m = 0.18;
    box(o, -sw - m, sb - m, -0.05, sw + m, sb, 0.02, dark);
    box(o, -sw - m, st, -0.05, sw + m, st + m, 0.02, dark);
    box(o, -sw - m, sb, -0.05, -sw, st, 0.02, dark);
    box(o, sw, sb, -0.05, sw + m, st, 0.02, dark);

    // 段床と通路の誘導灯
    const lamp = [1.0, 0.72, 0.36];
    const aisles = [...h.aisleXs, -h.sideAisle, h.sideAisle];
    for (let r = 1; r < h.rows; r++) {
      const z0 = h.first + r * h.pitch - h.pitch * 0.62, y = r * h.riser;
      box(o, -W, 0, z0, W, y, D, carpet);
      for (const ax of aisles) {
        for (const dx of [-0.42, 0.42]) box(o, ax + dx - 0.05, y - 0.07, z0 - 0.012, ax + dx + 0.05, y - 0.04, z0, lamp, true);
      }
    }
    // 座席
    for (const s of h.seats) {
      const x = s.eye[0], y = s.r * h.riser, z = s.eye[2], w = h.seatW * 0.44;
      const c = h.seatColor;
      box(o, x - w, y + 0.18, z - 0.26, x + w, y + 0.44, z + 0.26, c);
      box(o, x - w, y + 0.18, z + 0.26, x + w, y + 1.0, z + 0.38, shade(c, 0.85));
      box(o, x - h.seatW / 2, y + 0.18, z - 0.22, x - w, y + 0.6, z + 0.36, shade(c, 0.45));
      box(o, x + w, y + 0.18, z - 0.22, x + h.seatW / 2, y + 0.6, z + 0.36, shade(c, 0.45));
    }
    return new Float32Array(o);
  }

  function buildPeopleMesh(h) {
    const o = [];
    const rnd = mulberry32(h.seed * 7 + 3);
    for (const s of h.seats) {
      if (!s.taken) continue;
      const x = s.eye[0] + (rnd() - 0.5) * 0.06, y = s.r * h.riser, z = s.eye[2];
      const t = 0.10 + rnd() * 0.16, tall = (rnd() - 0.5) * 0.1;
      const cloth = [t * (0.8 + rnd() * 0.5), t * (0.8 + rnd() * 0.4), t * (0.9 + rnd() * 0.6)];
      const hair = [0.05 + rnd() * 0.07, 0.045 + rnd() * 0.04, 0.04 + rnd() * 0.03];
      box(o, x - 0.21, y + 0.44, z + 0.02, x + 0.21, y + 0.98 + tall, z + 0.25, cloth);
      sphere(o, x, y + 1.14 + tall, z + 0.12, 0.105, 0.125, hair);
    }
    return new Float32Array(o);
  }

  const VS = `
    attribute vec3 aP; attribute vec3 aN; attribute vec3 aC; attribute vec2 aUV;
    uniform mat4 uVP; varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec2 vUV;
    void main(){ vP=aP; vN=aN; vC=aC; vUV=aUV; gl_Position=uVP*vec4(aP,1.0); }`;
  const FS = `
    precision mediump float;
    varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec2 vUV;
    uniform sampler2D uTex; uniform vec3 uGlow; uniform vec3 uSC; uniform vec2 uSS; uniform float uHouse;
    void main(){
      vec3 col;
      if (vUV.x > -0.5) {
        col = texture2D(uTex, vUV).rgb + uHouse * 0.05;
      } else if (dot(vN, vN) < 0.01) {
        col = vC;
      } else {
        vec3 n = normalize(vN);
        vec3 light = vec3(0.0);
        // スクリーンを3点の面光源サンプルで近似する。
        for (int i = -1; i <= 1; i++) {
          vec3 L = uSC + vec3(float(i) * uSS.x * 0.33, 0.0, 0.3) - vP;
          float d = length(L); L /= d;
          float ndl = max(dot(n, L) * 0.7 + 0.3, 0.0);
          light += uGlow * ndl / (1.0 + 0.010 * d * d);
        }
        light = light * 0.62 + vec3(0.02);
        light += uHouse * vec3(0.95, 0.88, 0.78) * (0.62 + 0.38 * n.y);
        col = sqrt(vC * light);
      }
      gl_FragColor = vec4(col, 1.0);
    }`;

  function createRenderer(canvas) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    const loc = {};
    for (const n of ['aP', 'aN', 'aC', 'aUV']) loc[n] = gl.getAttribLocation(prog, n);
    for (const n of ['uVP', 'uTex', 'uGlow', 'uSC', 'uSS', 'uHouse']) loc[n] = gl.getUniformLocation(prog, n);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.02, 0.02, 0.022, 1);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const meshes = { hall: { buf: gl.createBuffer(), n: 0 }, people: { buf: gl.createBuffer(), n: 0 } };
    const bind = (m) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
      const B = STRIDE * 4;
      [['aP', 3, 0], ['aN', 3, 12], ['aC', 3, 24], ['aUV', 2, 36]].forEach(([n, size, offs]) => {
        gl.enableVertexAttribArray(loc[n]);
        gl.vertexAttribPointer(loc[n], size, gl.FLOAT, false, B, offs);
      });
    };
    return {
      setMesh(name, data) {
        const m = meshes[name];
        gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        m.n = data.length / STRIDE;
      },
      setTexture(src) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
        gl.generateMipmap(gl.TEXTURE_2D);
      },
      draw(vp, h, glow, house, showPeople) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(loc.uVP, false, vp);
        gl.uniform1i(loc.uTex, 0);
        gl.uniform3fv(loc.uGlow, glow);
        gl.uniform3f(loc.uSC, 0, h.screenCY, 0);
        gl.uniform2f(loc.uSS, h.screenW, h.screenH);
        gl.uniform1f(loc.uHouse, house);
        bind(meshes.hall); gl.drawArrays(gl.TRIANGLES, 0, meshes.hall.n);
        if (showPeople && meshes.people.n) { bind(meshes.people); gl.drawArrays(gl.TRIANGLES, 0, meshes.people.n); }
      },
    };
  }

  // 行列（column-major）
  function perspective(fovy, aspect, n, f) {
    const t = 1 / Math.tan(fovy / 2);
    return [t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0];
  }
  function viewMatrix(e, f) {
    const sl = Math.hypot(f[2], f[0]) || 1;
    const s = [-f[2] / sl, 0, f[0] / sl];
    const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return [s[0], u[0], -f[0], 0, s[1], u[1], -f[1], 0, s[2], u[2], -f[2], 0, -dot(s, e), -dot(u, e), dot(f, e), 1];
  }
  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let v = 0;
      for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = v;
    }
    return o;
  }

  // ───────────────────────── スクリーンに映す映像 ─────────────────────────
  const film = document.createElement('canvas');
  film.width = 1024; film.height = 512;
  const fx = film.getContext('2d');
  const probe = document.createElement('canvas');
  probe.width = probe.height = 4;
  const px = probe.getContext('2d', { willReadFrequently: true });
  const stars = (() => { const r = mulberry32(5); return Array.from({ length: 90 }, () => [r(), r() * 0.55, 0.4 + r() * 1.1, r() * 6.28]); })();

  function ridge(x, i) {
    return Math.sin(x * 1.3 + i * 2.1) * 0.5 + Math.sin(x * 2.9 + i * 5.3) * 0.28 + Math.sin(x * 6.7 + i * 1.7) * 0.12;
  }
  function drawFilm(t, h) {
    const W = film.width, H = film.height, kx = 2 / h.aspect; // 横に引き伸ばされる分を補正
    if (state.pattern) return drawPattern(W, H, kx, h);
    const g = fx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#120e2e'); g.addColorStop(0.42, '#51296c'); g.addColorStop(0.66, '#d9604f'); g.addColorStop(0.8, '#ffc57e');
    fx.fillStyle = g; fx.fillRect(0, 0, W, H);
    for (const [sx, sy, sr, ph] of stars) {
      fx.globalAlpha = (0.35 + 0.35 * Math.sin(t * 1.3 + ph)) * (1 - sy / 0.55);
      fx.fillStyle = '#fff';
      fx.fillRect(sx * W, sy * H, sr * kx * 1.6, sr * 1.6);
    }
    fx.globalAlpha = 1;
    // 太陽
    const sunX = W * 0.63, sunY = H * (0.69 + 0.025 * Math.sin(t * 0.12));
    fx.save(); fx.translate(sunX, sunY); fx.scale(kx, 1);
    const sg = fx.createRadialGradient(0, 0, 0, 0, 0, 230);
    sg.addColorStop(0, 'rgba(255,240,205,1)'); sg.addColorStop(0.16, 'rgba(255,226,170,.95)');
    sg.addColorStop(0.2, 'rgba(255,190,120,.45)'); sg.addColorStop(1, 'rgba(255,170,110,0)');
    fx.fillStyle = sg; fx.beginPath(); fx.arc(0, 0, 230, 0, 7); fx.fill(); fx.restore();
    // 重なる稜線
    const cols = ['#8a4a7c', '#5f3168', '#371e4c', '#190f2a', '#09060f'];
    cols.forEach((c, i) => {
      const base = H * (0.66 + 0.075 * i), amp = 46 - i * 3, sp = 0.012 + i * 0.012;
      fx.fillStyle = c; fx.beginPath(); fx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) fx.lineTo(x, base - amp * ridge((x / W) * (3 + i) * h.aspect / 2 + t * sp * (i + 1), i));
      fx.lineTo(W, H); fx.fill();
      const mg = fx.createLinearGradient(0, base - 10, 0, base + 70);
      mg.addColorStop(0, 'rgba(255,170,140,0)'); mg.addColorStop(1, `rgba(255,170,140,${0.16 - i * 0.03})`);
      fx.fillStyle = mg; fx.fillRect(0, base - 10, W, 80);
    });
    // 字幕
    fx.save(); fx.translate(W / 2, H * 0.9); fx.scale(kx, 1);
    fx.font = '600 27px "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif';
    fx.textAlign = 'center'; fx.textBaseline = 'middle';
    fx.shadowColor = 'rgba(0,0,0,.9)'; fx.shadowBlur = 8; fx.fillStyle = '#fff';
    fx.fillText(SUBS[Math.floor(t / 6) % SUBS.length], 0, 0);
    fx.restore();
  }
  const SUBS = ['「ここから見ると、まるで違って見える」', '「夜が明ける前に、稜線を越えないと」', '「いい席を選んだみたいだね」'];

  function drawPattern(W, H, kx, h) {
    fx.fillStyle = '#0e1014'; fx.fillRect(0, 0, W, H);
    fx.strokeStyle = 'rgba(255,255,255,.28)'; fx.lineWidth = 2;
    const cell = H / 8, stepX = cell * kx;
    fx.beginPath();
    for (let x = W / 2 % stepX; x < W; x += stepX) { fx.moveTo(x, 0); fx.lineTo(x, H); }
    for (let y = 0; y <= H; y += cell) { fx.moveTo(0, y); fx.lineTo(W, y); }
    fx.stroke();
    fx.strokeStyle = '#f2eee7'; fx.lineWidth = 6; fx.strokeRect(3, 3, W - 6, H - 6);
    fx.strokeStyle = '#f0b65e'; fx.lineWidth = 3;
    fx.beginPath(); fx.moveTo(0, 0); fx.lineTo(W, H); fx.moveTo(W, 0); fx.lineTo(0, H); fx.stroke();
    const ring = (cx, cy, r) => { fx.save(); fx.translate(cx, cy); fx.scale(kx, 1); fx.beginPath(); fx.arc(0, 0, r, 0, 7); fx.stroke(); fx.restore(); };
    ring(W / 2, H / 2, H * 0.36);
    for (const [cx, cy] of [[0.1, 0.18], [0.9, 0.18], [0.1, 0.82], [0.9, 0.82]]) ring(W * cx, H * cy, H * 0.1);
    fx.save(); fx.translate(W / 2, H / 2); fx.scale(kx, 1);
    fx.fillStyle = '#0e1014'; fx.fillRect(-190, -30, 380, 60);
    fx.fillStyle = '#f2eee7'; fx.font = '700 30px system-ui, sans-serif'; fx.textAlign = 'center'; fx.textBaseline = 'middle';
    fx.fillText('TEST PATTERN · ' + h.aspect.toFixed(2) + ':1', 0, 2);
    fx.restore();
  }
  function filmGlow() {
    px.drawImage(film, 0, 0, 4, 4);
    const d = px.getImageData(0, 0, 4, 4).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const k = 1 / (16 * 255);
    return [r * k + 0.05, g * k + 0.05, b * k + 0.05];
  }

  // ───────────────────────── カメラとループ ─────────────────────────
  const canvas = $('gl');
  const renderer = createRenderer(canvas);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cam = { eye: [0, 2, 10], yaw: 0, pitch: 0, yawT: 0, pitchT: 0, house: 0 };
  let glow = [0.4, 0.3, 0.4], frame = 0, last = 0, snap = true;

  function fitCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
  }

  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const h = state.hall, target = viewSeat().eye;
    const k = snap || reduced ? 1 : 1 - Math.exp(-dt * 7);
    snap = false;
    for (let i = 0; i < 3; i++) cam.eye[i] += (target[i] - cam.eye[i]) * k;
    cam.yaw += (cam.yawT - cam.yaw) * k;
    cam.pitch += (cam.pitchT - cam.pitch) * k;
    cam.house += ((state.house ? 1 : 0) - cam.house) * (reduced ? 1 : 1 - Math.exp(-dt * 5));

    fitCanvas();
    const t = reduced ? 3 : now / 1000;
    drawFilm(t, h);
    renderer.setTexture(film);
    if (frame++ % 12 === 0) glow = filmGlow();

    const [ex, ey, ez] = cam.eye;
    const yaw = Math.atan2(-ex, ez) + cam.yaw;
    const pitch = clamp(Math.atan2(h.screenCY - ey, Math.hypot(ex, ez)) + cam.pitch, -1.2, 1.2);
    const f = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
    const aspect = canvas.width / canvas.height;
    const fovy = 2 * Math.atan(Math.tan((88 / DEG) / 2) / Math.max(aspect, 1.2));
    const vp = mul(perspective(fovy, aspect, 0.08, 120), viewMatrix(cam.eye, f));
    renderer.draw(vp, h, glow, cam.house, state.people);
  }

  // ドラッグで見回す
  if (renderer) {
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, yaw: cam.yawT, pitch: cam.pitchT };
      canvas.setPointerCapture(e.pointerId); canvas.classList.add('dragging');
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      cam.yawT = clamp(drag.yaw - (e.clientX - drag.x) * 0.005, -1.3, 1.3);
      cam.pitchT = clamp(drag.pitch + (e.clientY - drag.y) * 0.005, -0.7, 0.7);
      $('tReset').hidden = false; $('hint').classList.add('gone');
    });
    const end = () => { drag = null; canvas.classList.remove('dragging'); };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('dblclick', resetLook);
  }
  function resetLook() { cam.yawT = 0; cam.pitchT = 0; $('tReset').hidden = true; }

  // ───────────────────────── 座席表 ─────────────────────────
  const rowsEl = $('rows'), mapEl = $('map'), scrollEl = $('mapScroll');

  function heatColor(score) {
    const t = clamp((score - 35) / 60, 0, 1);
    const stops = [[50, 50, 59], [125, 101, 64], [240, 182, 94]];
    const i = t < 0.5 ? 0 : 1, u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const c = stops[i].map((v, j) => Math.round(v + (stops[i + 1][j] - v) * u));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  function renderMap() {
    const h = state.hall;
    rowsEl.textContent = '';
    for (let r = 0; r < h.rows; r++) {
      const row = document.createElement('div');
      row.className = 'row';
      const lab = () => { const l = document.createElement('span'); l.className = 'row-label'; l.textContent = ROW_NAMES[r]; l.setAttribute('aria-hidden', 'true'); return l; };
      row.append(lab());
      for (let c = 0; c < h.cols; c++) {
        const s = h.seats[r * h.cols + c];
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'seat'; b.dataset.id = s.id; b.textContent = c + 1;
        b.style.setProperty('--heat', heatColor(s.score));
        if (s.taken) { b.disabled = true; b.textContent = ''; b.setAttribute('aria-label', s.label + '、予約済み'); }
        else { b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', `${s.label}、見やすさ ${s.score}点`); }
        row.append(b);
        if (h.aisles.includes(c)) { const a = document.createElement('span'); a.className = 'aisle'; row.append(a); }
      }
      row.append(lab());
      rowsEl.append(row);
    }
    applyHeat(); sizeMap(); syncSeats();
    scrollEl.scrollLeft = (scrollEl.scrollWidth - scrollEl.clientWidth) / 2;
  }
  function applyHeat() {
    for (const b of rowsEl.querySelectorAll('.seat:not(:disabled)')) {
      if (state.heat) b.style.setProperty('--seat-c', b.style.getPropertyValue('--heat'));
      else b.style.removeProperty('--seat-c');
    }
    $('heatLegend').hidden = !state.heat;
    $('tHeat').setAttribute('aria-pressed', state.heat);
  }
  function sizeMap() {
    const h = state.hall, avail = scrollEl.clientWidth - 32;
    let s = 34, g = 5;
    for (; s > 18; s--) {
      g = s >= 24 ? 5 : 3;
      if (h.cols * (s + g) + h.aisles.length * (s * 0.7 + g) + 2 * (16 + g) <= avail) break;
    }
    mapEl.style.setProperty('--s', s + 'px');
    mapEl.style.setProperty('--g', g + 'px');
    mapEl.classList.toggle('dense', s < 24);
  }
  function syncSeats() {
    const v = viewSeat();
    for (const b of rowsEl.querySelectorAll('.seat')) {
      if (!b.disabled) b.setAttribute('aria-pressed', state.selected.includes(b.dataset.id));
      b.classList.toggle('view', b.dataset.id === v.id);
    }
  }

  function toggleSeat(id) {
    const i = state.selected.indexOf(id);
    if (i >= 0) state.selected.splice(i, 1);
    else if (state.selected.length >= MAX_PICK) return toast(`一度に選べるのは${MAX_PICK}席までです`);
    else state.selected.push(id);
    update();
  }

  rowsEl.addEventListener('click', (e) => { const b = e.target.closest('.seat'); if (b && !b.disabled) toggleSeat(b.dataset.id); });
  rowsEl.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const b = e.target.closest('.seat');
    setHover(b && !b.disabled ? seatById(b.dataset.id) : null);
  });
  rowsEl.addEventListener('pointerleave', () => setHover(null));
  rowsEl.addEventListener('focusin', (e) => { const b = e.target.closest('.seat'); if (b && b.matches(':focus-visible')) setHover(seatById(b.dataset.id)); });
  rowsEl.addEventListener('focusout', () => setHover(null));
  rowsEl.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
    const b = e.target.closest('.seat');
    if (!d || !b) return;
    e.preventDefault();
    let [r, c] = b.dataset.id.split('-').map(Number);
    for (;;) { // 予約済みの席は飛ばす
      r += d[0]; c += d[1];
      const n = rowsEl.querySelector(`[data-id="${r}-${c}"]`);
      if (!n) return;
      if (!n.disabled) return n.focus();
    }
  });
  function setHover(s) { if (state.hover !== s) { state.hover = s; update(); } }

  // ───────────────────────── パネル更新 ─────────────────────────
  const won = (n) => n.toLocaleString('ja-JP') + '円';
  let lastView = null;

  function update() {
    const h = state.hall, s = viewSeat();
    syncSeats();
    if (s !== lastView) { lastView = s; resetLook(); }

    const picked = state.selected.includes(s.id);
    const pill = $('viewState');
    pill.textContent = picked ? '選択した席' : state.hover ? 'プレビュー' : 'おすすめ席';
    pill.classList.toggle('on', picked);
    $('viewSeat').textContent = `${h.name} · ${s.label}`;

    $('scoreNum').textContent = s.score;
    $('ring').style.strokeDashoffset = 169.65 * (1 - s.score / 100);
    $('grade').textContent = s.score >= 85 ? '最高の見え方' : s.score >= 70 ? '見やすい席' : s.score >= 50 ? '標準的な見え方' : '少し見づらい席';
    const dH = s.hAngle - h.ideal, aV = Math.abs(s.elev);
    const say = [dH > 18 ? '画面が視野からあふれるほど近く、迫力はありますが目が忙しい席です。'
      : dH < -12 ? '画面はやや小さく感じますが、全体を楽に見渡せる距離です。'
      : '画面が視野にちょうどよく収まる距離です。'];
    if (aV >= 18) say.push('かなり見上げるので、首が疲れるかもしれません。');
    if (s.off >= 20) say.push('端の席なので、画面が斜めに見えます。');
    else if (s.off < 8 && aV < 8 && Math.abs(dH) <= 12) say.push('ど真ん中で、目線の高さも快適です。');
    $('say').textContent = say.join('');

    const tag = (id, text, good) => { const el = $(id); el.textContent = text; el.classList.toggle('good', !!good); };
    $('mDist').textContent = s.dist.toFixed(1) + 'm';
    tag('mDistTag', `スクリーン幅 ${h.screenW}m`);
    $('mH').textContent = Math.round(s.hAngle) + '°';
    tag('mHTag', dH > 18 ? 'いっぱい' : dH < -12 ? 'ゆとりあり' : 'ちょうどいい', Math.abs(dH) <= 12);
    $('mV').textContent = Math.round(aV) + '°';
    tag('mVTag', aV < 8 ? '快適' : aV < 18 ? 'ふつう' : '首に負担', aV < 8);
    $('mO').textContent = Math.round(s.off) + '°';
    tag('mOTag', s.off < 8 ? 'ど真ん中' : s.off < 20 ? 'やや端' : '端', s.off < 8);

    const n = state.selected.length;
    $('pickedLabel').textContent = n ? `${h.name} ${h.tag}` : '座席を選んでください';
    const chips = $('pickedChips');
    chips.textContent = '';
    for (const id of state.selected) {
      const st = seatById(id), c = document.createElement('button');
      c.type = 'button'; c.className = 'pchip'; c.dataset.id = id;
      c.setAttribute('aria-label', st.label + 'の選択を解除');
      c.append(st.short); const x = document.createElement('i'); x.textContent = '×'; c.append(x);
      chips.append(c);
    }
    $('totalCount').textContent = n ? `${n}名` : '';
    $('totalPrice').textContent = n ? won(n * h.price) : '';
    $('bBook').disabled = !n;
  }

  let toastT;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function setHall(h) {
    state.hall = h; state.selected = []; state.hover = null; snap = true;
    for (const t of $('tabs').children) {
      const on = t.dataset.id === h.id;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
    }
    if (renderer) {
      renderer.setMesh('hall', buildHallMesh(h));
      renderer.setMesh('people', buildPeopleMesh(h));
    }
    renderMap(); update();
  }

  // ───────────────────────── コントロールの接続 ─────────────────────────
  for (const h of halls) {
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'tab'; t.dataset.id = h.id; t.setAttribute('role', 'tab');
    const b = document.createElement('b'); b.textContent = h.name;
    const sm = document.createElement('small'), n = document.createElement('span');
    n.textContent = `${h.rows * h.cols}席`; sm.append(h.tag, n);
    t.append(b, sm);
    t.addEventListener('click', () => setHall(h));
    $('tabs').append(t);
  }
  $('tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const i = halls.indexOf(state.hall) + (e.key === 'ArrowRight' ? 1 : -1);
    const h = halls[(i + halls.length) % halls.length];
    setHall(h); $('tabs').querySelector(`[data-id="${h.id}"]`).focus();
  });

  const toggle = (id, key, after) => $(id).addEventListener('click', () => {
    state[key] = !state[key]; $(id).setAttribute('aria-pressed', state[key]); if (after) after();
  });
  toggle('tPeople', 'people'); toggle('tHouse', 'house'); toggle('tPattern', 'pattern'); toggle('tHeat', 'heat', applyHeat);
  $('tReset').addEventListener('click', resetLook);
  $('bBest').addEventListener('click', () => {
    const best = state.hall.seats.filter((s) => !s.taken && !state.selected.includes(s.id)).sort((a, b) => b.score - a.score)[0];
    if (!best) return;
    if (state.selected.length >= MAX_PICK) return toast(`一度に選べるのは${MAX_PICK}席までです`);
    state.selected.push(best.id); update();
    toast(`${best.label} · 見やすさ ${best.score}点`);
  });
  $('pickedChips').addEventListener('click', (e) => { const c = e.target.closest('.pchip'); if (c) toggleSeat(c.dataset.id); });
  $('bBook').addEventListener('click', () => {
    const h = state.hall, list = $('dlgList');
    list.textContent = '';
    const rows = [['作品', '夜明けの稜線'], ['上映', `本日 19:40 · ${h.name} ${h.tag}`],
      ['座席', state.selected.map((id) => seatById(id).short).join(', ')], ['お支払い金額', won(state.selected.length * h.price)]];
    for (const [k, v] of rows) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k; dd.textContent = v; list.append(dt, dd);
    }
    $('dlg').showModal();
  });
  $('dlg').addEventListener('close', () => { if ($('dlg').returnValue === 'ok') toast('デモ予約が完了しました'); });

  new ResizeObserver(sizeMap).observe(scrollEl);

  if (!renderer) { $('nogl').hidden = false; canvas.hidden = true; $('hint').hidden = true; document.querySelector('.hud-tools').hidden = true; }
  setHall(halls[0]);
  if (renderer) requestAnimationFrame(tick);
})();
