// Cover engine: draws a GTA-style multi-panel cover onto a canvas.
//
// Everything here is original art drawn in code: panels of the user's own
// photos with a Vice City colour grade, poster decorations (an outrun sun, palm
// and skyline silhouettes, halftone dots) and bold caption lettering. No
// Rockstar Games logo, official artwork, character or font is used anywhere.

/** Post sizes the app exports, in pixels. */
export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080 · square post' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350 · portrait post' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080 · wide post' },
};

/** Panel layouts: each names how many photos the cover holds. */
export const LAYOUTS = {
  hero: { label: 'Hero + two', panels: 3 },
  quad: { label: 'Four squares', panels: 4 },
  trio: { label: 'Three strips', panels: 3 },
  solo: { label: 'One photo', panels: 1 },
};

/** Colour grades: a top, middle and bottom wash laid over every panel. */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    top: 'rgba(255, 94, 98, 0.22)',
    mid: 'rgba(255, 170, 60, 0.14)',
    bottom: 'rgba(140, 30, 120, 0.34)',
  },
  neon: {
    label: 'Neon Night',
    top: 'rgba(0, 229, 255, 0.20)',
    mid: 'rgba(255, 0, 160, 0.14)',
    bottom: 'rgba(40, 0, 90, 0.40)',
  },
  dusk: {
    label: 'Palm Dusk',
    top: 'rgba(120, 80, 255, 0.22)',
    mid: 'rgba(0, 200, 190, 0.12)',
    bottom: 'rgba(20, 10, 60, 0.38)',
  },
  gold: {
    label: 'Golden Hour',
    top: 'rgba(255, 200, 80, 0.20)',
    mid: 'rgba(255, 120, 40, 0.14)',
    bottom: 'rgba(90, 30, 10, 0.36)',
  },
};

/** Caption lettering styles: fill gradient, outline and shadow. */
export const CAPTION_STYLES = {
  sunset: { label: 'Sunset gradient', stops: ['#fff7ae', '#ffb347', '#ff5e78', '#ff2e88'], outline: '#2b0a2e', shadow: 'rgba(0,0,0,0.55)' },
  neon: { label: 'Neon pink', stops: ['#ffffff', '#ff9de2', '#ff2ea6', '#b3007a'], outline: '#12002b', shadow: 'rgba(0,0,0,0.55)' },
  chrome: { label: 'Chrome white', stops: ['#ffffff', '#e8ecf4', '#b9c2d4', '#7d8aa5'], outline: '#101828', shadow: 'rgba(0,0,0,0.6)' },
};

/**
 * Panel rectangles for a layout, in canvas pixels. `gutter` is the dark gap
 * between panels; the cover keeps a thin outer frame of the same width.
 */
export function panelRects(layout, w, h, gutter) {
  const g = gutter;
  switch (layout) {
    case 'quad': {
      const pw = (w - g * 3) / 2;
      const ph = (h - g * 3) / 2;
      return [
        { x: g, y: g, w: pw, h: ph },
        { x: g * 2 + pw, y: g, w: pw, h: ph },
        { x: g, y: g * 2 + ph, w: pw, h: ph },
        { x: g * 2 + pw, y: g * 2 + ph, w: pw, h: ph },
      ];
    }
    case 'trio': {
      const pw = (w - g * 4) / 3;
      return [0, 1, 2].map((i) => ({ x: g + i * (pw + g), y: g, w: pw, h: h - g * 2 }));
    }
    case 'solo':
      return [{ x: g, y: g, w: w - g * 2, h: h - g * 2 }];
    case 'hero':
    default: {
      const leftW = w * 0.62 - g * 1.5;
      const rightX = g + leftW + g;
      const rightW = w - rightX - g;
      const halfH = (h - g * 3) / 2;
      return [
        { x: g, y: g, w: leftW, h: h - g * 2 },
        { x: rightX, y: g, w: rightW, h: halfH },
        { x: rightX, y: g * 2 + halfH, w: rightW, h: halfH },
      ];
    }
  }
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
function drawPanelPhoto(ctx, rect, panel) {
  const img = panel.img;
  if (!img) return;
  const zoom = panel.zoom ?? 1;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const ox = (panel.ox ?? 0) * rect.w;
  const oy = (panel.oy ?? 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, rect.x + (rect.w - pw) / 2 + ox, rect.y + (rect.h - ph) / 2 + oy, pw, ph);
  ctx.restore();
}

/** Lays a colour grade over a panel: a vertical wash plus a warm vignette. */
function gradePanel(ctx, rect, grade) {
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, grade.mid);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,0,20,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** An outrun sun: a striped disc, drawn with the grade's warm colours. */
function drawSun(ctx, cx, cy, r) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
  glow.addColorStop(0, 'rgba(255, 170, 60, 0.55)');
  glow.addColorStop(1, 'rgba(255, 170, 60, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffe259');
  disc.addColorStop(0.55, '#ff7e5f');
  disc.addColorStop(1, '#ec008c');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = disc;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Slits cut through the lower half, widening toward the bottom.
  ctx.fillStyle = 'rgba(20, 0, 30, 0.9)';
  let y = cy + r * 0.05;
  let slit = r * 0.06;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, slit);
    y += slit + r * 0.16;
    slit *= 1.5;
  }
  ctx.restore();
}

/** A palm silhouette: a leaning trunk and six drooping fronds.
 *  Drawn in unit space (the trunk rises about 0.85 of a unit) and scaled by
 *  `s`, so every length here is a fraction of the palm's height. */
function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * lean, s);
  ctx.strokeStyle = '#160a24';
  ctx.fillStyle = '#160a24';
  ctx.lineCap = 'round';
  // Trunk, curving up and to the right; lineWidth is in local units too.
  ctx.lineWidth = 0.055;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0.05, -0.5, 0.22, -0.85);
  ctx.stroke();
  const topX = 0.22;
  const topY = -0.85;
  // Fronds fan out from the crown, each a drooping quadratic blade.
  for (let i = 0; i < 6; i++) {
    const a = (-150 + i * 48) * (Math.PI / 180);
    const len = 0.5 + (i % 2) * 0.12;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + 0.18;
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.6, topY + Math.sin(a) * len * 0.3 - 0.12, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** A low city skyline silhouette along the bottom of a panel. */
function drawSkyline(ctx, rect) {
  const base = rect.y + rect.h;
  const heights = [0.16, 0.26, 0.12, 0.32, 0.2, 0.38, 0.15, 0.28, 0.18, 0.24, 0.1, 0.3];
  const bw = rect.w / heights.length;
  ctx.fillStyle = 'rgba(12, 2, 26, 0.85)';
  heights.forEach((f, i) => {
    const bh = rect.h * f;
    ctx.fillRect(rect.x + i * bw, base - bh, bw * 0.92, bh);
  });
  // A few lit windows.
  ctx.fillStyle = 'rgba(255, 214, 90, 0.85)';
  for (let i = 0; i < heights.length; i++) {
    const bh = rect.h * heights[i];
    const wx = rect.x + i * bw + bw * 0.25;
    const wy = base - bh + rect.h * 0.04;
    if (i % 2 === 0) ctx.fillRect(wx, wy, bw * 0.18, rect.h * 0.03);
    if (i % 3 === 0) ctx.fillRect(wx + bw * 0.45, wy + rect.h * 0.06, bw * 0.18, rect.h * 0.03);
  }
}

/** Halftone dots across a band, for the printed-poster feel. */
function drawHalftone(ctx, x, y, w, h, gap, alpha) {
  ctx.fillStyle = `rgba(10, 0, 20, ${alpha})`;
  for (let row = 0; row * gap < h; row++) {
    for (let col = 0; col * gap < w; col++) {
      const r = gap * 0.16 * (1 + (row / Math.max(1, h / gap)) * 0.9);
      ctx.beginPath();
      ctx.arc(x + col * gap + (row % 2 ? gap / 2 : 0), y + row * gap, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Fits `text` to `maxWidth` by shrinking the font, then draws it centred. */
function drawFittedText(ctx, text, cx, y, maxWidth, startSize, fill, outline, shadow) {
  let size = startSize;
  const setFont = () => { ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`; };
  setFont();
  try { ctx.letterSpacing = `${Math.max(1, size * 0.03)}px`; } catch { /* older canvas */ }
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    setFont();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = shadow;
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.05;
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeText(text, cx, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, cx, y);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  return size;
}

/**
 * Draws the whole cover onto `canvas` (at the canvas's own size) from `state`:
 *   { layout, size, panels: [{img, zoom, ox, oy}], grade, title, subtitle,
 *     captionStyle, captionPos ('bottom' | 'top'), extras: {sun, palms, skyline, halftone} }
 * Panels without a photo render as a deep violet placeholder with a hint.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const gutter = Math.max(6, Math.round(w * 0.008));
  const rects = panelRects(state.layout, w, h, gutter);
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const style = CAPTION_STYLES[state.captionStyle] ?? CAPTION_STYLES.sunset;

  // Deep violet ground, then the panels.
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? {};
    if (panel.img) {
      drawPanelPhoto(ctx, rect, panel);
      gradePanel(ctx, rect, grade);
    } else {
      const ph = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      ph.addColorStop(0, '#3b1d5e');
      ph.addColorStop(1, '#1c0b33');
      ctx.fillStyle = ph;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `700 ${Math.max(14, rect.w * 0.045)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Thin bright keyline around each panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Poster decorations, drawn over the panels.
  if (state.extras?.sun && rects[0]) {
    const r0 = rects[0];
    // With a top caption the band covers the panel's top quarter, so the sun
    // sits lower to stay clear of the lettering.
    const sunY = state.captionPos === 'top' ? 0.42 : 0.24;
    drawSun(ctx, r0.x + r0.w * 0.72, r0.y + r0.h * sunY, Math.min(r0.w, r0.h) * 0.2);
  }
  if (state.extras?.skyline && rects[0]) drawSkyline(ctx, rects[0]);
  if (state.extras?.palms) {
    drawPalm(ctx, w * 0.03, h * 0.985, h * 0.24, 1);
    drawPalm(ctx, w * 0.97, h * 0.985, h * 0.19, -1);
  }
  if (state.extras?.halftone) {
    drawHalftone(ctx, w * 0.62, h * 0.02, w * 0.36, h * 0.1, Math.max(8, w * 0.012), 0.28);
  }

  // Caption: a shaded band, then the title and subtitle in bold lettering.
  const title = (state.title ?? '').trim().toUpperCase();
  const subtitle = (state.subtitle ?? '').trim();
  const atBottom = state.captionPos !== 'top';
  const bandH = h * 0.24;
  const bandY = atBottom ? h - bandH : 0;
  const shade = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (atBottom) {
    shade.addColorStop(0, 'rgba(10, 0, 20, 0)');
    shade.addColorStop(1, 'rgba(10, 0, 20, 0.72)');
  } else {
    shade.addColorStop(0, 'rgba(10, 0, 20, 0.72)');
    shade.addColorStop(1, 'rgba(10, 0, 20, 0)');
  }
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandY, w, bandH);

  if (title) {
    const fill = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    const stops = style.stops;
    stops.forEach((c, i) => fill.addColorStop(i / (stops.length - 1), c));
    const baseline = atBottom ? h - h * 0.055 : bandH * 0.62;
    drawFittedText(ctx, title, w / 2, baseline, w * 0.92, h * 0.115, fill, style.outline, style.shadow);
  }
  if (subtitle) {
    ctx.font = `700 ${Math.max(16, h * 0.032)}px Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, h * 0.006)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    const y = atBottom ? h - h * 0.015 : bandH * 0.88;
    ctx.fillText(subtitle.toUpperCase(), w / 2, y);
    ctx.shadowBlur = 0;
  }
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }

  // Outer poster frame.
  ctx.strokeStyle = '#f5e9ff';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.strokeRect(gutter / 2, gutter / 2, w - gutter, h - gutter);
}
