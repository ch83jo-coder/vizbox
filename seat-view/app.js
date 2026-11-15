/* SEATVIEW TOKYO — 東京の映画館の座席からの見え方（依存ライブラリなしの静的アプリ） */
(() => {
  'use strict';

  // ───────────────────────── 劇場データ ─────────────────────────
  // 長さの単位はメートル。スクリーンは z=0 平面、客席は +z 方向。
  // rows の各列は [列名, 'ブロック|ブロック|ブロック', オプション]。ブロックは座席番号の範囲で、
  // 3つなら 左|中央|右（通路2本）、1つなら中央のみ。空文字のブロックは席なし。
  // オプション: gap = 列の前の横通路の幅, rise = 前列からの段差, pitch = 前列からの間隔,
  //             kind = 特別席の種類, only: 'center' = 特別席は中央ブロックのみ
  // スクリーンサイズと席数は公表値、列ごとの配置・段差・距離は公開情報からの推定。
  const KINDS = {
    std: { name: '通常席', w: 0, color: null },
    premium: { name: 'プレミアムシート', w: 0.72, color: [0.55, 0.36, 0.14] },
    box: { name: 'プレミア ボックス シート', w: 0.8, color: [0.30, 0.22, 0.17] },
    luxury: { name: 'プレミア ラグジュアリー シート', w: 0.86, color: [0.36, 0.26, 0.18] },
    grand: { name: 'グランドクラス', w: 1.15, color: [0.55, 0.42, 0.20] },
  };

  const HALLS = [
    {
      id: 'gcs-imax', area: '池袋', theater: 'グランドシネマサンシャイン 池袋', screen: 'シアター12', tag: 'IMAXレーザー/GT',
      screenW: 25.8, screenH: 18.9, screenBottom: 0.9, first: 6.8, seatW: 0.54, pitch: 1.05, riser: 0.5,
      ideal: 70, seed: 29, seatColor: [0.15, 0.18, 0.32], wall: [0.13, 0.14, 0.18],
      published: { screen: '幅25.8m × 高さ18.9m(1.43:1)', seats: '542席+車椅子2(資料により538〜544席)' },
      notes: [
        '日本最大級のIMAXスクリーン。前方(A〜D列)はかなり見上げる',
        'I列・L列は欠番(紛らわしいため廃止され、以降の列名が繰り上がった)',
        '標準の列は左1〜10・中央11〜30・右31〜40番の3ブロック',
        '最後列はグランドクラス(本アプリでは配置を推定)',
      ],
      estimated: '最前列までの距離・段差・前方ブロックの席数・特別席の位置',
      sources: [
        ['リアルサウンド(開業時の記事)', 'https://realsound.jp/movie/2019/07/post-390411_2.html'],
        ['cinetabi シアター12の座席', 'https://cinetabi.com/posts/grandcinema-sunshine-theater12'],
      ],
      rows: [
        ['A', '9-10|11-30|31-32', { rise: 0 }], ['B', '9-10|11-30|31-32', { rise: 0.16 }],
        ['C', '8-10|11-30|31-33', { rise: 0.18 }], ['D', '8-10|11-30|31-33', { rise: 0.2 }],
        ['E', '8-10|11-30|31-33', { rise: 0.22 }], ['F', '8-10|11-30|31-33', { rise: 0.25 }],
        ['G', '1-10|11-30|31-40', { gap: 1.3, rise: 0.45 }], ['H', '1-10|11-30|31-40'], ['J', '1-10|11-30|31-40'],
        ['K', '1-10|11-30|31-40'], ['M', '1-10|11-30|31-40'],
        ['N', '1-10|11-30|31-40', { gap: 1.3, rise: 0.6 }], ['O', '1-10|11-30|31-40'], ['P', '1-10|11-30|31-40'],
        ['Q', '1-10|11-30|31-40'], ['R', '1-10|11-20|21-30', { kind: 'grand', only: 'center', pitch: 1.5 }],
      ],
    },
    {
      id: 'toho-shinjuku-9', area: '新宿', theater: 'TOHOシネマズ 新宿', screen: 'スクリーン9', tag: 'TCX・ドルビーアトモス',
      screenW: 19.0, screenH: 8.0, screenBottom: 1.6, first: 5.6, seatW: 0.53, pitch: 1.05, riser: 0.36,
      ideal: 55, seed: 11, seatColor: [0.48, 0.10, 0.13], wall: [0.19, 0.16, 0.17],
      published: { screen: '幅19.0m × 高さ8.0m(TCX)', seats: '499席+車椅子2' },
      notes: [
        '各列の中央は16・17番(1〜32番)',
        'N〜O列中央がバランスのよい席として紹介されることが多い',
        'プレミア ボックス シートは18席(本アプリではL・M列の中央に配置)',
        'I列は欠番として扱っている(推定)',
      ],
      estimated: '列の総数・最前列までの距離・段差・横通路とボックス席の位置',
      sources: [
        ['TOHOシネマズ 新宿 施設紹介', 'https://www.prd.tohotheater.jp/theater/076/institution.html'],
        ['MOVIE WALKER PRESS', 'https://press.moviewalker.jp/th705/'],
      ],
      rows: [
        ['A', '3-6|7-26|27-30', { rise: 0 }], ['B', '3-6|7-26|27-30', { rise: 0.12 }], ['C', '3-6|7-26|27-30', { rise: 0.15 }],
        ['D', '1-6|7-26|27-32', { rise: 0.2 }], ['E', '1-6|7-26|27-32', { rise: 0.25 }],
        ['F', '1-6|7-26|27-32', { gap: 1.1, rise: 0.38 }], ['G', '1-6|7-26|27-32'], ['H', '1-6|7-26|27-32'], ['J', '1-6|7-26|27-32'],
        ['K', '1-6|7-26|27-32'], ['L', '1-6|7-15|27-32', { kind: 'box', only: 'center', pitch: 1.35 }],
        ['M', '1-6|7-15|27-32', { kind: 'box', only: 'center', pitch: 1.35 }],
        ['N', '1-6|7-26|27-32', { pitch: 1.2 }], ['O', '1-6|7-26|27-32'], ['P', '1-6|7-26|27-32'], ['Q', '1-6|7-26|27-32'],
        ['R', '|7-26|'],
      ],
    },
    {
      id: 'toho-hibiya-1', area: '日比谷', theater: 'TOHOシネマズ 日比谷', screen: 'スクリーン1', tag: 'TCX・ドルビーアトモス',
      screenW: 19.8, screenH: 8.3, screenBottom: 1.6, first: 5.4, seatW: 0.53, pitch: 1.05, riser: 0.36,
      ideal: 55, seed: 47, seatColor: [0.42, 0.11, 0.12], wall: [0.18, 0.16, 0.15],
      published: { screen: '幅19.8m × 高さ8.3m(TCX)', seats: '436席+車椅子3' },
      notes: [
        'H列はプレミア ラグジュアリー シート、I・J列はプレミア ボックス シート',
        '特別席の列は1〜26番(中央13・14番)、通常席の列は1〜36番(中央18・19番)',
        'K列18・19番付近がベストとする紹介が多い',
      ],
      estimated: '最前列までの距離・段差・横通路の位置・A〜G列の席数',
      sources: [
        ['TOHOシネマズ 日比谷 施設紹介', 'https://www.tohotheater.jp/theater/081/institution05.html'],
        ['映画館を見に行くヒト。(劇場レポート)', 'https://hihifilm412.hatenablog.com/entry/2019/02/06/000044'],
      ],
      rows: [
        ['A', '2-10|11-26|27-35', { rise: 0 }], ['B', '1-10|11-26|27-36', { rise: 0.12 }], ['C', '1-10|11-26|27-36', { rise: 0.15 }],
        ['D', '1-10|11-26|27-36', { rise: 0.2 }], ['E', '1-10|11-26|27-36', { rise: 0.25 }],
        ['F', '1-10|11-26|27-36', { gap: 1.1, rise: 0.38 }], ['G', '1-10|11-26|27-36'],
        ['H', '1-6|7-20|21-26', { kind: 'luxury', pitch: 1.6 }],
        ['I', '1-6|7-20|21-26', { kind: 'box', pitch: 1.4 }], ['J', '1-6|7-20|21-26', { kind: 'box', pitch: 1.4 }],
        ['K', '1-10|11-26|27-36', { pitch: 1.25 }], ['L', '1-10|11-26|27-36'], ['M', '1-10|11-26|27-36'],
      ],
    },
  ];
  const AISLE_W = 1.1, EYE_H = 1.18, MAX_PICK = 6;
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

  const range = (s) => {
    if (!s) return [];
    const [a, b] = s.split('-').map(Number);
    const out = [];
    for (let i = a; i <= (b || a); i++) out.push(i);
    return out;
  };

  // 劇場の形状と、座席ごとの見え方の指標を計算する。
  function buildHall(def) {
    const h = { ...def, screenCY: def.screenBottom + def.screenH / 2, aspect: def.screenW / def.screenH };
    // 列ごとのブロックと席幅を決める
    h.rowList = def.rows.map(([name, spec, o = {}], r) => {
      const parts = spec.split('|');
      const pos = parts.length === 3 ? ['left', 'center', 'right'] : ['center'];
      const blocks = parts.map((p, i) => {
        const special = o.kind && (o.only !== 'center' || pos[i] === 'center');
        const kind = special ? o.kind : 'std';
        return { pos: pos[i], nums: range(p.trim()), kind, w: KINDS[kind].w || h.seatW };
      });
      return { name, r, o, blocks };
    });
    const centerHalf = Math.max(...h.rowList.map((row) => {
      const c = row.blocks.find((b) => b.pos === 'center');
      return c ? (c.nums.length * c.w) / 2 : 0;
    }));
    const edge = centerHalf + AISLE_W; // 左右ブロックの内側の端
    h.aisleXs = h.rowList.some((row) => row.blocks.length === 3) ? [-(centerHalf + AISLE_W / 2), centerHalf + AISLE_W / 2] : [];

    h.seats = [];
    let z = def.first, y = 0;
    h.rowList.forEach((row, r) => {
      if (r > 0) {
        z += (row.o.pitch || h.pitch) + (row.o.gap || 0);
        y += row.o.rise ?? lastRise(h, r);
      }
      row.z = z; row.y = y; row.seats = [];
      for (const b of row.blocks) {
        const n = b.nums.length;
        const x0 = b.pos === 'center' ? -(n * b.w) / 2 : b.pos === 'left' ? -edge - n * b.w : edge;
        b.nums.forEach((num, i) => {
          const x = x0 + (i + 0.5) * b.w;
          const eye = [x, y + EYE_H, z];
          const s = {
            id: row.name + num, r, row: row.name, num, x, y, z, w: b.w, kind: b.kind, eye, ...metrics(h, eye),
            label: `${row.name}列 ${num}番`, short: row.name + num,
          };
          h.seats.push(s); row.seats.push(s);
        });
      }
      row.seats.sort((a, b) => a.x - b.x);
    });
    const xs = h.seats.map((s) => [s.x - s.w / 2, s.x + s.w / 2]).flat();
    h.minX = Math.min(...xs); h.maxX = Math.max(...xs);
    const seatsHalf = Math.max(-h.minX, h.maxX);
    h.halfW = Math.max(h.screenW / 2 + 1.0, seatsHalf + 1.3);
    h.sideAisle = seatsHalf + (h.halfW - seatsHalf) / 2;
    const last = h.rowList[h.rowList.length - 1];
    h.depth = last.z + 2.4;
    h.height = Math.max(h.screenBottom + h.screenH + 1.2, last.y + 3.4);
    h.kinds = [...new Set(h.seats.map((s) => s.kind))].filter((k) => k !== 'std');
    h.best = h.seats.slice().sort((a, b) => b.score - a.score)[0];
    return h;
  }
  // rise を指定しない列は、直前に指定された段差を引き継ぐ（無ければ既定値）。
  function lastRise(h, r) {
    for (let i = r - 1; i > 0; i--) if (h.rowList[i].o.rise != null && h.rowList[i].o.rise > 0) return h.rowList[i].o.rise;
    return h.riser;
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
    hall: halls[0], selected: [], focus: null, hover: null,
    heat: true, people: true, house: false, pattern: false,
  };
  const seatById = (id) => state.hall.seats.find((s) => s.id === id);
  const viewSeat = () => state.hover || (state.focus && seatById(state.focus))
    || (state.selected.length ? seatById(state.selected[state.selected.length - 1]) : state.hall.best);

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
    h.rowList.forEach((row, r) => {
      if (r === 0) return;
      const prev = h.rowList[r - 1];
      if (row.y - prev.y < 0.005) return;
      const z0 = row.z - Math.min(0.62, (row.z - prev.z) * 0.55), y = row.y;
      box(o, -W, 0, z0, W, y, D, carpet);
      for (const ax of aisles) {
        for (const dx of [-0.42, 0.42]) box(o, ax + dx - 0.05, y - 0.07, z0 - 0.012, ax + dx + 0.05, y - 0.04, z0, lamp, true);
      }
    });
    // 座席（特別席は幅も奥行きも大きく、色を変える）
    for (const s of h.seats) {
      const { x, y, z } = s, big = s.kind !== 'std';
      const c = KINDS[s.kind].color || h.seatColor, w = s.w * (big ? 0.4 : 0.44);
      const back = big ? 0.5 : 0.38, front = big ? 0.34 : 0.26;
      box(o, x - w, y + 0.18, z - front, x + w, y + 0.44, z + back - 0.12, c);
      box(o, x - w, y + 0.18, z + back - 0.12, x + w, y + (big ? 1.08 : 1.0), z + back, shade(c, 0.85));
      box(o, x - s.w / 2, y + 0.18, z - front + 0.04, x - w, y + 0.6, z + back, shade(c, 0.45));
      box(o, x + w, y + 0.18, z - front + 0.04, x + s.w / 2, y + 0.6, z + back, shade(c, 0.45));
    }
    return new Float32Array(o);
  }

  // 観客は埋まり具合を固定の疑似乱数で決め、席ごとの頂点範囲を覚えておく
  // （自分が座っている席の人だけ描かないため）。
  function buildPeopleMesh(h) {
    const o = [], ranges = {};
    const rnd = mulberry32(h.seed * 7 + 3);
    for (const s of h.seats) {
      const busy = rnd() < 0.25 + 0.45 * Math.pow(s.score / 100, 2);
      const jx = (rnd() - 0.5) * 0.06, t = 0.10 + rnd() * 0.16, tall = (rnd() - 0.5) * 0.1;
      const cloth = [t * (0.8 + rnd() * 0.5), t * (0.8 + rnd() * 0.4), t * (0.9 + rnd() * 0.6)];
      const hair = [0.05 + rnd() * 0.07, 0.045 + rnd() * 0.04, 0.04 + rnd() * 0.03];
      if (!busy) continue;
      const x = s.x + jx, y = s.y, z = s.z;
      const start = o.length / STRIDE;
      box(o, x - 0.21, y + 0.44, z + 0.02, x + 0.21, y + 0.98 + tall, z + 0.25, cloth);
      sphere(o, x, y + 1.14 + tall, z + 0.12, 0.105, 0.125, hair);
      ranges[s.id] = [start, o.length / STRIDE];
    }
    return { data: new Float32Array(o), ranges };
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
      draw(vp, h, glow, house, showPeople, skip) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(loc.uVP, false, vp);
        gl.uniform1i(loc.uTex, 0);
        gl.uniform3fv(loc.uGlow, glow);
        gl.uniform3f(loc.uSC, 0, h.screenCY, 0);
        gl.uniform2f(loc.uSS, h.screenW, h.screenH);
        gl.uniform1f(loc.uHouse, house);
        bind(meshes.hall); gl.drawArrays(gl.TRIANGLES, 0, meshes.hall.n);
        const pn = meshes.people.n;
        if (showPeople && pn) {
          bind(meshes.people);
          const [a, b] = skip || [pn, pn];
          if (a > 0) gl.drawArrays(gl.TRIANGLES, 0, a);
          if (b < pn) gl.drawArrays(gl.TRIANGLES, b, pn - b);
        }
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
  let glow = [0.4, 0.3, 0.4], frame = 0, last = 0, snap = true, peopleRanges = {};

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
    renderer.draw(vp, h, glow, cam.house, state.people, peopleRanges[viewSeat().id]);
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
  // 3D と同じ座標から描くので、通路・特別席の幅・横通路が実際の比率で並ぶ。
  const rowsEl = $('rows'), mapEl = $('map'), scrollEl = $('mapScroll');
  const LABEL_W = 22;

  function heatColor(score) {
    const t = clamp((score - 35) / 60, 0, 1);
    const stops = [[50, 50, 59], [125, 101, 64], [240, 182, 94]];
    const i = t < 0.5 ? 0 : 1, u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const c = stops[i].map((v, j) => Math.round(v + (stops[i + 1][j] - v) * u));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  function mapScale(h) {
    const avail = Math.max(260, scrollEl.clientWidth - 32 - LABEL_W * 2);
    const span = h.maxX - h.minX;
    // 通常席が 16〜32px になる範囲で、できるだけ横幅に収める
    return clamp(avail / span, 16 / (h.seatW * 0.86), 32 / (h.seatW * 0.86));
  }

  function renderMap() {
    const h = state.hall, k = mapScale(h);
    const sPx = h.seatW * k * 0.86, rowPx = sPx * 1.24, kz = rowPx / h.pitch;
    const width = (h.maxX - h.minX) * k, x0 = LABEL_W - h.minX * k;
    const z0 = h.rowList[0].z;
    rowsEl.textContent = '';
    mapEl.classList.toggle('dense', sPx < 21);
    mapEl.style.setProperty('--s', sPx + 'px');

    // スクリーン（実際の幅の比率で描く）
    const scr = $('screenArc');
    scr.style.width = h.screenW * k + 'px';
    scr.style.marginLeft = x0 - (h.screenW / 2) * k + 'px';
    $('screenLabel').textContent = `SCREEN ${h.screenW}m`;

    let bottom = 0;
    for (const row of h.rowList) {
      const top = (row.z - z0) * kz;
      bottom = top + sPx;
      for (const side of ['l', 'r']) {
        const l = document.createElement('span');
        l.className = 'row-label'; l.textContent = row.name; l.setAttribute('aria-hidden', 'true');
        l.style.top = top + 'px';
        if (side === 'l') l.style.left = '0'; else l.style.left = LABEL_W + width + 'px';
        rowsEl.append(l);
      }
      for (const s of row.seats) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'seat' + (s.kind !== 'std' ? ' sp' : ''); b.dataset.id = s.id; b.textContent = s.num;
        const w = s.w * k * (s.kind !== 'std' ? 0.9 : 0.86);
        b.style.width = w + 'px';
        b.style.left = x0 + s.x * k - w / 2 + 'px';
        b.style.top = top + 'px';
        b.style.setProperty('--heat', heatColor(s.score));
        const kind = s.kind !== 'std' ? `${KINDS[s.kind].name}、` : '';
        b.setAttribute('aria-label', `${s.label}、${kind}見やすさ ${s.score}点`);
        rowsEl.append(b);
      }
    }
    rowsEl.style.width = width + LABEL_W * 2 + 'px';
    rowsEl.style.height = bottom + 'px';
    applyHeat(); syncSeats();
    scrollEl.scrollLeft = (scrollEl.scrollWidth - scrollEl.clientWidth) / 2;
  }
  function applyHeat() {
    for (const b of rowsEl.querySelectorAll('.seat')) {
      if (state.heat) b.style.setProperty('--seat-c', b.style.getPropertyValue('--heat'));
      else b.style.removeProperty('--seat-c');
    }
    $('heatLegend').hidden = !state.heat;
    $('tHeat').setAttribute('aria-pressed', state.heat);
  }
  function syncSeats() {
    const v = viewSeat();
    for (const b of rowsEl.querySelectorAll('.seat')) {
      b.setAttribute('aria-pressed', state.selected.includes(b.dataset.id));
      b.classList.toggle('view', b.dataset.id === v.id);
    }
  }

  function toggleSeat(id) {
    const i = state.selected.indexOf(id);
    if (i >= 0) { state.selected.splice(i, 1); if (state.focus === id) state.focus = null; }
    else if (state.selected.length >= MAX_PICK) return toast(`比較できるのは${MAX_PICK}席までです`);
    else { state.selected.push(id); state.focus = id; }
    update();
  }

  rowsEl.addEventListener('click', (e) => { const b = e.target.closest('.seat'); if (b) toggleSeat(b.dataset.id); });
  rowsEl.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const b = e.target.closest('.seat');
    setHover(b ? seatById(b.dataset.id) : null);
  });
  rowsEl.addEventListener('pointerleave', () => setHover(null));
  rowsEl.addEventListener('focusin', (e) => { const b = e.target.closest('.seat'); if (b && b.matches(':focus-visible')) setHover(seatById(b.dataset.id)); });
  rowsEl.addEventListener('focusout', () => setHover(null));
  // 矢印キー：左右は同じ列の隣の席、上下は前後の列でいちばん近い席へ
  rowsEl.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
    const b = e.target.closest('.seat');
    if (!d || !b) return;
    e.preventDefault();
    const h = state.hall, s = seatById(b.dataset.id), row = h.rowList[s.r];
    let next;
    if (d[1]) next = row.seats[row.seats.indexOf(s) + d[1]];
    else {
      const to = h.rowList[s.r + d[0]];
      if (to) next = to.seats.reduce((a, c) => (Math.abs(c.x - s.x) < Math.abs(a.x - s.x) ? c : a));
    }
    if (next) rowsEl.querySelector(`[data-id="${next.id}"]`).focus();
  });
  function setHover(s) { if (state.hover !== s) { state.hover = s; update(); } }

  // ───────────────────────── パネル更新 ─────────────────────────
  let lastView = null;

  function update() {
    const h = state.hall, s = viewSeat();
    syncSeats();
    if (s !== lastView) { lastView = s; resetLook(); }

    const picked = state.selected.includes(s.id);
    const pill = $('viewState');
    pill.textContent = state.hover && !picked ? 'プレビュー' : picked ? '比較中の席' : 'おすすめ席';
    pill.classList.toggle('on', picked);
    $('viewSeat').textContent = `${h.screen} · ${s.label}`;
    $('viewKind').textContent = s.kind !== 'std' ? KINDS[s.kind].name : '';
    $('viewKind').hidden = s.kind === 'std';

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
    $('mDist').textContent = '約' + s.dist.toFixed(1) + 'm';
    tag('mDistTag', `スクリーン幅 ${h.screenW}m`);
    $('mH').textContent = Math.round(s.hAngle) + '°';
    tag('mHTag', dH > 18 ? 'いっぱい' : dH < -12 ? 'ゆとりあり' : 'ちょうどいい', Math.abs(dH) <= 12);
    $('mV').textContent = Math.round(aV) + '°';
    tag('mVTag', aV < 8 ? '快適' : aV < 18 ? 'ふつう' : '首に負担', aV < 8);
    $('mO').textContent = Math.round(s.off) + '°';
    tag('mOTag', s.off < 8 ? 'ど真ん中' : s.off < 20 ? 'やや端' : '端', s.off < 8);

    const n = state.selected.length;
    $('pickedLabel').textContent = n ? `比較リスト · ${h.screen}` : '席をタップすると比較リストに追加されます';
    const chips = $('pickedChips');
    chips.textContent = '';
    for (const id of state.selected) {
      const st = seatById(id), wrap = document.createElement('span');
      wrap.className = 'pchip' + (st === s ? ' on' : '');
      const v = document.createElement('button');
      v.type = 'button'; v.className = 'pchip-view'; v.dataset.view = id;
      v.setAttribute('aria-label', `${st.label}からの見え方を表示`);
      const b = document.createElement('b'); b.textContent = st.short;
      const sc = document.createElement('small'); sc.textContent = st.score + '点';
      v.append(b, sc);
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'pchip-x'; x.dataset.remove = id; x.textContent = '×';
      x.setAttribute('aria-label', `${st.label}を比較リストから外す`);
      wrap.append(v, x);
      chips.append(wrap);
    }
  }

  let toastT;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function renderFacts(h) {
    $('factTheater').textContent = `${h.theater} ${h.screen}`;
    $('factTag').textContent = `${h.area} · ${h.tag}`;
    const dl = $('factList');
    dl.textContent = '';
    const add = (k, v) => {
      const d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k; dd.textContent = v; d.append(dt, dd); dl.append(d);
    };
    add('スクリーン(公表値)', h.published.screen);
    add('座席数(公表値)', h.published.seats);
    add('本アプリの座席数', `${h.seats.length}席(車椅子スペースは含まない)`);
    add('列', `${h.rowList[0].name}〜${h.rowList[h.rowList.length - 1].name}列(${h.rowList.length}列)`);
    add('推定している値', h.estimated);
    const ul = $('factNotes');
    ul.textContent = '';
    for (const n of h.notes) { const li = document.createElement('li'); li.textContent = n; ul.append(li); }
    const src = $('factSources');
    src.textContent = '';
    for (const [label, url] of h.sources) {
      const a = document.createElement('a');
      a.href = url; a.textContent = label; a.target = '_blank'; a.rel = 'noopener noreferrer';
      src.append(a);
    }
    const kl = $('kindLegend');
    kl.hidden = !h.kinds.length;
    kl.lastChild.textContent = h.kinds.map((k) => KINDS[k].name).join('・');
  }

  function setHall(h) {
    state.hall = h; state.selected = []; state.focus = null; state.hover = null; snap = true;
    for (const t of $('tabs').children) {
      const on = t.dataset.id === h.id;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
    }
    if (renderer) {
      renderer.setMesh('hall', buildHallMesh(h));
      const p = buildPeopleMesh(h);
      renderer.setMesh('people', p.data);
      peopleRanges = p.ranges;
    }
    renderFacts(h); renderMap(); update();
    try { history.replaceState(null, '', '#' + h.id); } catch (e) { /* 無視 */ }
  }

  // ───────────────────────── コントロールの接続 ─────────────────────────
  for (const h of halls) {
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'tab'; t.dataset.id = h.id; t.setAttribute('role', 'tab');
    const b = document.createElement('b'); b.textContent = h.area;
    const sm = document.createElement('small');
    sm.textContent = h.screen + ' · ' + h.tag.replace(/・.*$/, '');
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
    const best = state.hall.seats.filter((s) => !state.selected.includes(s.id)).sort((a, b) => b.score - a.score)[0];
    if (!best) return;
    if (state.selected.length >= MAX_PICK) return toast(`比較できるのは${MAX_PICK}席までです`);
    state.selected.push(best.id); state.focus = best.id; update();
    toast(`${best.label} · 見やすさ ${best.score}点`);
  });
  $('pickedChips').addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]'), x = e.target.closest('[data-remove]');
    if (x) toggleSeat(x.dataset.remove);
    else if (v) { state.focus = v.dataset.view; update(); }
  });

  let resizeT;
  let lastW = 0;
  new ResizeObserver(() => {
    const w = scrollEl.clientWidth;
    if (Math.abs(w - lastW) < 2) return;
    lastW = w; clearTimeout(resizeT); resizeT = setTimeout(renderMap, 120);
  }).observe(scrollEl);

  if (!renderer) { $('nogl').hidden = false; canvas.hidden = true; $('hint').hidden = true; document.querySelector('.hud-tools').hidden = true; }
  setHall(halls.find((h) => '#' + h.id === location.hash) || halls[0]);
  addEventListener('hashchange', () => { const h = halls.find((x) => '#' + x.id === location.hash); if (h && h !== state.hall) setHall(h); });
  if (renderer) requestAnimationFrame(tick);
})();
