// Vice Cover Studio — the cover renderer. Pure canvas, no libraries, no network.
// Draws a multi-panel GTA-poster-style cover from the user's photos and caption.

export const LAYOUTS = [
  { id: 'hero', name: 'Hero + 3', blurb: 'One big moment, three small ones' },
  { id: 'grid', name: 'Four Square', blurb: 'Four equal panels' },
  { id: 'bleed', name: 'Full Bleed', blurb: 'One photo edge to edge, snapshots on top' },
  { id: 'stack', name: 'Tilted Stack', blurb: 'Overlapping tilted snapshots' },
];

export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset', top: '#ff9a3d', mid: '#ff5e7a', deep: '#7b2d8b', accent: '#ffd166', ink: '#1c1030' },
  { id: 'neon', name: 'Neon Nights', top: '#19e3ff', mid: '#ff4fd8', deep: '#2b0a4d', accent: '#7dffce', ink: '#0d1030' },
  { id: 'gold', name: 'Gold Hour', top: '#ffe08a', mid: '#ff9e4f', deep: '#8a4b12', accent: '#fff3c4', ink: '#241503' },
  { id: 'midnight', name: 'Midnight', top: '#7aa8ff', mid: '#6a5cff', deep: '#120a33', accent: '#c9b8ff', ink: '#0a0618' },
];

export const LETTERINGS = [
  { id: 'block', name: 'Block', blurb: 'Heavy condensed capitals' },
  { id: 'script', name: 'Neon Script', blurb: 'Loose handwritten title' },
  { id: 'stencil', name: 'Stencil', blurb: 'Wide tracked capitals' },
];

export const SIZES = [
  { id: 'square', name: 'Square post', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait post', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide post', w: 1920, h: 1080 },
];

// A panel's photo placement: pan in -0.5..0.5 of the panel, zoom 1..3.
export function freshPan() {
  return { x: 0, y: 0, zoom: 1 };
}

export function freshState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    lettering: 'block',
    caption: 'Sunset Heist',
    sub: 'Leonida Nights',
    photos: [null, null, null, null],
    pans: [freshPan(), freshPan(), freshPan(), freshPan()],
    activePanel: 0,
  };
}

function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Panel rectangles for a layout, in fractions of the cover (before the title band).
function panelRects(layoutId, W, H) {
  const artH = H * 0.78;
  const g = Math.max(6, W * 0.008);
  if (layoutId === 'grid') {
    const w2 = (W - g * 3) / 2;
    const h2 = (artH - g * 3) / 2;
    return [
      { x: g, y: g, w: w2, h: h2 },
      { x: g * 2 + w2, y: g, w: w2, h: h2 },
      { x: g, y: g * 2 + h2, w: w2, h: h2 },
      { x: g * 2 + w2, y: g * 2 + h2, w: w2, h: h2 },
    ];
  }
  if (layoutId === 'bleed') {
    const iw = W * 0.52;
    const ih = artH * 0.42;
    return [
      { x: 0, y: 0, w: W, h: artH },
      { x: W * 0.05, y: artH - ih * 0.72, w: iw, h: ih, tilt: -0.045 },
      { x: W * 0.43, y: artH - ih * 0.62, w: iw, h: ih, tilt: 0.04 },
      { x: 0, y: 0, w: 0, h: 0, hidden: true },
    ];
  }
  if (layoutId === 'stack') {
    const iw = W * 0.58;
    const ih = artH * 0.62;
    return [
      { x: W * 0.06, y: artH * 0.06, w: iw, h: ih, tilt: -0.06 },
      { x: W * 0.36, y: artH * 0.16, w: iw, h: ih, tilt: 0.05 },
      { x: W * 0.2, y: artH * 0.3, w: iw, h: ih, tilt: -0.02 },
      { x: 0, y: 0, w: 0, h: 0, hidden: true },
    ];
  }
  // hero: one wide panel on top, three small ones below.
  const smallH = artH * 0.3;
  const bigH = artH - smallH - g;
  const smallW = (W - g * 4) / 3;
  return [
    { x: g, y: g, w: W - g * 2, h: bigH },
    { x: g, y: g * 2 + bigH, w: smallW, h: smallH },
    { x: g * 2 + smallW, y: g * 2 + bigH, w: smallW, h: smallH },
    { x: g * 3 + smallW * 2, y: g * 2 + bigH, w: smallW, h: smallH },
  ];
}

// Draw one photo into a panel rect with cover-fit, pan and zoom. The vertical
// anchor sits near the top of the photo (bias 0.15 of the overflow) so a face
// near the top of a portrait photo survives a wide panel's crop.
function drawPhoto(ctx, img, rect, pan) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (pan.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (pan.x || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) * 0.15 + (pan.y || 0) * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// A soft colour wash over a panel so the panels feel graded, not raw.
function washPanel(ctx, rect, grade, strength) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, hexA(grade.top, 0.10 * strength));
  grad.addColorStop(0.55, hexA(grade.mid, 0.16 * strength));
  grad.addColorStop(1, hexA(grade.deep, 0.34 * strength));
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Halftone dots fading down the panel, poster-print feel.
function halftone(ctx, rect, step) {
  ctx.save();
  ctx.fillStyle = 'rgba(12,8,24,0.16)';
  for (let y = rect.y + step; y < rect.y + rect.h; y += step) {
    const fade = 1 - (y - rect.y) / rect.h;
    const r = Math.max(0.4, step * 0.14 * fade);
    for (let x = rect.x + step / 2; x < rect.x + rect.w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function vignette(ctx, W, H) {
  const grad = ctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.42, W / 2, H * 0.5, Math.max(W, H) * 0.78);
  grad.addColorStop(0, 'rgba(10,6,20,0)');
  grad.addColorStop(1, 'rgba(10,6,20,0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function titleFont(letteringId, size) {
  if (letteringId === 'script') return `italic 700 ${size}px "Brush Script MT", "Segoe Script", cursive`;
  if (letteringId === 'stencil') return `800 ${size}px Arial, Helvetica, sans-serif`;
  return `900 ${size}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
}

function drawTitle(ctx, state, grade, bandY, bandH, W) {
  const pad = W * 0.045;
  const title = (state.caption || 'Untitled').toUpperCase();
  const sub = state.sub || '';
  const lettering = state.lettering;
  // The title must fit the band: shrink it until it measures inside the cover.
  const maxTitleW = W - pad * 2;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  if (lettering === 'stencil') {
    let size = Math.round(W * 0.072);
    let tracking = size * 0.14;
    const measure = () => {
      ctx.font = titleFont('stencil', size);
      let w = 0;
      for (const ch of title) w += ctx.measureText(ch).width + tracking;
      return w;
    };
    while (size > Math.round(W * 0.03) && measure() > maxTitleW) {
      size = Math.round(size * 0.92);
      tracking = size * 0.14;
    }
    ctx.font = titleFont('stencil', size);
    let x = pad;
    const y = bandY + bandH * 0.52;
    ctx.fillStyle = grade.accent;
    for (const ch of title) {
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + tracking;
    }
    ctx.font = `700 ${Math.round(W * 0.028)}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub.toUpperCase(), pad, bandY + bandH * 0.82);
  } else if (lettering === 'script') {
    let size = Math.round(W * 0.115);
    ctx.font = titleFont('script', size);
    while (size > Math.round(W * 0.04) && ctx.measureText(state.caption || 'Untitled').width > maxTitleW) {
      size = Math.round(size * 0.92);
      ctx.font = titleFont('script', size);
    }
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = W * 0.012;
    ctx.shadowOffsetY = W * 0.004;
    ctx.fillText(state.caption || 'Untitled', pad, bandY + bandH * 0.58);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.font = `800 ${Math.round(W * 0.03)}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub.toUpperCase(), pad, bandY + bandH * 0.86);
  } else {
    let size = Math.round(W * 0.105);
    ctx.font = titleFont('block', size);
    while (size > Math.round(W * 0.04) && ctx.measureText(title).width > maxTitleW) {
      size = Math.round(size * 0.92);
      ctx.font = titleFont('block', size);
    }
    const y = bandY + bandH * 0.56;
    ctx.lineWidth = Math.max(2, W * 0.006);
    ctx.strokeStyle = grade.ink;
    ctx.strokeText(title, pad, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, pad, y);
    ctx.font = `800 ${Math.round(W * 0.03)}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub.toUpperCase(), pad, bandY + bandH * 0.86);
  }
  // Kicker at the bottom-right of the band, clear of the title and subtitle.
  ctx.font = `800 ${Math.round(W * 0.022)}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.textAlign = 'right';
  ctx.fillText('COVER STUDIO', W - pad, bandY + bandH * 0.97);
  ctx.textAlign = 'left';
  ctx.restore();
}

// The main entry point: draw the whole cover onto ctx at W x H.
export function drawCover(ctx, W, H, state) {
  const grade = gradeById(state.grade);
  const rects = panelRects(state.layout, W, H);
  const artH = H * 0.78;
  const bandY = artH;

  // Paper: white poster base.
  ctx.save();
  ctx.fillStyle = '#f7f2e9';
  ctx.fillRect(0, 0, W, H);

  // Sunset sky behind the panels so the gutters glow.
  const sky = ctx.createLinearGradient(0, 0, 0, artH);
  sky.addColorStop(0, grade.top);
  sky.addColorStop(0.55, grade.mid);
  sky.addColorStop(1, grade.deep);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, artH);

  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (rect.hidden || rect.w <= 0) continue;
    const img = state.photos[i];
    ctx.save();
    if (rect.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    }
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img) {
      drawPhoto(ctx, img, rect, state.pans[i] || freshPan());
      washPanel(ctx, rect, grade, 1);
    } else {
      ctx.fillStyle = grade.deep;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `700 ${Math.round(W * 0.022)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.textAlign = 'left';
    }
    halftone(ctx, rect, Math.max(9, W * 0.012));
    ctx.restore();
    // Panel frame.
    ctx.save();
    if (rect.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    }
    ctx.strokeStyle = '#f7f2e9';
    ctx.lineWidth = Math.max(3, W * 0.006);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  vignette(ctx, W, H);

  // Title band.
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, H);
  bandGrad.addColorStop(0, grade.deep);
  bandGrad.addColorStop(1, grade.ink);
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, W, H - bandY);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, W, Math.max(3, H * 0.006));
  drawTitle(ctx, state, grade, bandY, H - bandY, W);
  ctx.restore();
}

// Render the cover to a fresh canvas at the requested size.
export function renderCover(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, w, h, state);
  return canvas;
}
