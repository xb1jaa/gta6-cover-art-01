// Wires the editor: pick photos, choose a layout, grade and size, drag to crop
// each panel, edit the caption, and export the cover as a PNG. A `?shot=`
// query sets up a fixed scene for a screenshot instead (./shots.js).
import { SIZES, LAYOUTS, GRADES, CAPTION_STYLES, panelRects, drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');

/** The cover being edited: one panel entry per layout slot. */
const state = {
  layout: 'hero',
  size: 'wide',
  grade: 'sunset',
  captionStyle: 'sunset',
  captionPos: 'bottom',
  title: 'VICE CITY',
  subtitle: 'Sunset Heist',
  extras: { sun: true, palms: true, skyline: true, halftone: true },
  panels: [{ img: null, zoom: 1, ox: 0, oy: 0 }, { img: null, zoom: 1, ox: 0, oy: 0 }, { img: null, zoom: 1, ox: 0, oy: 0 }, { img: null, zoom: 1, ox: 0, oy: 0 }],
};

let selectedPanel = 0;
let dragging = null;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function currentSize() {
  return SIZES[state.size];
}

function redraw() {
  const { w, h } = currentSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  syncPanelControls();
}

/** Shows the selected panel's crop controls and the panel thumbnails. */
function syncPanelControls() {
  const count = LAYOUTS[state.layout].panels;
  document.querySelectorAll('#panels .panel-btn').forEach((btn, i) => {
    btn.hidden = i >= count;
    btn.classList.toggle('active', i === selectedPanel);
    btn.textContent = `Panel ${i + 1}${state.panels[i].img ? ' ✓' : ''}`;
  });
  const panel = state.panels[selectedPanel];
  document.getElementById('zoom').value = panel.zoom;
  document.getElementById('pan-x').value = panel.ox;
  document.getElementById('pan-y').value = panel.oy;
  document.getElementById('zoom-val').textContent = `${Math.round(panel.zoom * 100)}%`;
}

/** Builds a row of choice buttons into `el` from a {key: {label}} map. */
function buildChoices(el, options, current, onPick) {
  el.innerHTML = '';
  Object.entries(options).forEach(([key, value]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    btn.textContent = value.label;
    if (key === current) btn.classList.add('active');
    btn.addEventListener('click', () => {
      onPick(key);
      el.querySelectorAll('.choice').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
    el.appendChild(btn);
  });
}

buildChoices(document.getElementById('layouts'), LAYOUTS, state.layout, (key) => {
  state.layout = key;
  selectedPanel = 0;
  redraw();
});
buildChoices(document.getElementById('grades'), GRADES, state.grade, (key) => {
  state.grade = key;
  redraw();
});
buildChoices(document.getElementById('sizes'), SIZES, state.size, (key) => {
  state.size = key;
  redraw();
});
buildChoices(document.getElementById('caption-styles'), CAPTION_STYLES, state.captionStyle, (key) => {
  state.captionStyle = key;
  redraw();
});

document.getElementById('caption-pos').addEventListener('change', (e) => {
  state.captionPos = e.target.value;
  redraw();
});

['sun', 'palms', 'skyline', 'halftone'].forEach((name) => {
  document.getElementById(`extra-${name}`).addEventListener('change', (e) => {
    state.extras[name] = e.target.checked;
    redraw();
  });
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// Panel selection and per-panel photo.
document.querySelectorAll('#panels .panel-btn').forEach((btn, i) => {
  btn.addEventListener('click', () => { selectedPanel = i; syncPanelControls(); });
});
document.getElementById('panel-photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.panels[selectedPanel].img = await loadImage(URL.createObjectURL(file));
  state.panels[selectedPanel].zoom = 1;
  state.panels[selectedPanel].ox = 0;
  state.panels[selectedPanel].oy = 0;
  status.textContent = `Photo loaded into panel ${selectedPanel + 1}. Drag it on the cover to position it.`;
  redraw();
});
document.getElementById('fill-all').addEventListener('click', () => {
  const img = state.panels[selectedPanel].img;
  if (!img) { status.textContent = 'Load a photo into the selected panel first.'; return; }
  state.panels.forEach((p) => { p.img = img; });
  status.textContent = 'One photo fills every panel — crop each one differently.';
  redraw();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('pan-x').addEventListener('input', (e) => {
  state.panels[selectedPanel].ox = Number(e.target.value);
  redraw();
});
document.getElementById('pan-y').addEventListener('input', (e) => {
  state.panels[selectedPanel].oy = Number(e.target.value);
  redraw();
});

// Sample photos ship with the app, so it works with no upload.
document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const img = await loadImage(`samples/${btn.dataset.sample}.jpg`);
    state.panels[selectedPanel].img = img;
    status.textContent = `Sample photo loaded into panel ${selectedPanel + 1}.`;
    redraw();
  });
});

// Drag on the preview pans the panel under the pointer; the wheel zooms it.
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  const rects = panelRects(state.layout, canvas.width, canvas.height, Math.max(6, Math.round(canvas.width * 0.008)));
  const idx = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  return { idx, x, y };
}
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (hit.idx < 0) return;
  selectedPanel = hit.idx;
  const panel = state.panels[hit.idx];
  dragging = { idx: hit.idx, startX: hit.x, startY: hit.y, ox: panel.ox, oy: panel.oy };
  canvas.setPointerCapture(e.pointerId);
  syncPanelControls();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const hit = panelAt(e.clientX, e.clientY);
  const panel = state.panels[dragging.idx];
  const rects = panelRects(state.layout, canvas.width, canvas.height, Math.max(6, Math.round(canvas.width * 0.008)));
  const rect = rects[dragging.idx];
  panel.ox = dragging.ox + (hit.x - dragging.startX) / rect.w;
  panel.oy = dragging.oy + (hit.y - dragging.startY) / rect.h;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const hit = panelAt(e.clientX, e.clientY);
  if (hit.idx < 0) return;
  const panel = state.panels[hit.idx];
  panel.zoom = Math.min(3, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  selectedPanel = hit.idx;
  redraw();
}, { passive: false });

// Export: render the cover at full size and download it as a PNG.
async function exportPng() {
  const { w, h } = currentSize();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${w}x${h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  status.textContent = `Saved vice-cover-${w}x${h}.png (${(blob.size / 1024).toFixed(0)} KB).`;
}
document.getElementById('export').addEventListener('click', exportPng);

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (scene) => {
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.size = scene.size;
    state.title = scene.caption;
    state.subtitle = scene.sub;
    state.captionStyle = scene.captionStyle;
    state.captionPos = scene.captionPos;
    for (let i = 0; i < scene.photos.length; i++) {
      state.panels[i].img = await loadImage(`samples/${scene.photos[i]}.jpg`);
      state.panels[i].zoom = scene.zooms?.[i] ?? 1;
      state.panels[i].ox = scene.oxs?.[i] ?? 0;
      state.panels[i].oy = scene.oys?.[i] ?? 0;
    }
    titleInput.value = scene.caption;
    subtitleInput.value = scene.sub;
    redraw();
  });
} else {
  // First run: the pier sample in the hero panel, so the cover is never blank.
  loadImage('samples/pier.jpg').then((img) => {
    state.panels[0].img = img;
    redraw();
  }).catch(() => redraw());
  redraw();
}
