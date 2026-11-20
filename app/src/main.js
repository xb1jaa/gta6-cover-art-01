// Vice Cover Studio — editor wiring: photos, panels, caption, export.
import { LAYOUTS, GRADES, LETTERINGS, SIZES, freshState, drawCover, renderCover } from './cover.js';
import { readShot } from './shots.js';

const state = freshState();
const SAMPLES = { boulevard: './samples/boulevard.jpg', pier: './samples/pier.jpg' };

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('sub');

function say(msg) {
  statusEl.textContent = msg;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

async function loadSample(name, intoPanels) {
  try {
    const img = await loadImage(SAMPLES[name] || SAMPLES.boulevard);
    for (const i of intoPanels) state.photos[i] = img;
    draw();
    return true;
  } catch (e) {
    say('Sample photo failed to load.');
    return false;
  }
}

function draw() {
  drawCover(ctx, canvas.width, canvas.height, state);
  document.querySelectorAll('[data-panel]').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.panel) === state.activePanel);
  });
}

function buildPickers() {
  const mk = (el, items, current, onPick) => {
    el.innerHTML = '';
    for (const item of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (item.id === current ? ' on' : '');
      b.textContent = item.name;
      b.title = item.blurb || '';
      b.addEventListener('click', () => {
        onPick(item.id);
        el.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
        b.classList.add('on');
        draw();
      });
      el.appendChild(b);
    }
  };
  mk(document.getElementById('layouts'), LAYOUTS, state.layout, (id) => { state.layout = id; });
  mk(document.getElementById('grades'), GRADES, state.grade, (id) => { state.grade = id; });
  mk(document.getElementById('letterings'), LETTERINGS, state.lettering, (id) => { state.lettering = id; });
  mk(document.getElementById('sizes'), SIZES, 'square', (id) => { state.size = id; });
  state.size = 'square';
}

function wirePanels() {
  document.querySelectorAll('[data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activePanel = Number(btn.dataset.panel);
      draw();
      say('Panel ' + (state.activePanel + 1) + ' selected — drag to move it, scroll to zoom.');
    });
  });
  document.querySelectorAll('[data-photo]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        state.photos[Number(input.dataset.photo)] = img;
        state.activePanel = Number(input.dataset.photo);
        draw();
        say('Photo loaded into panel ' + (Number(input.dataset.photo) + 1) + '.');
      } catch (e) {
        say('That file did not load as a photo.');
      }
    });
  });
  document.getElementById('loadSample').addEventListener('click', async () => {
    await loadSample('boulevard', [0, 1, 2, 3]);
    say('Sample photo loaded into every panel. Replace any panel with your own.');
  });
  document.getElementById('clearPhotos').addEventListener('click', () => {
    state.photos = [null, null, null, null];
    draw();
    say('Panels cleared.');
  });
}

function wireDrag() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    const p = pos(e);
    lastX = p.x;
    lastY = p.y;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = pos(e);
    const pan = state.pans[state.activePanel];
    pan.x = clamp(pan.x + (p.x - lastX), -0.5, 0.5);
    pan.y = clamp(pan.y + (p.y - lastY), -0.5, 0.5);
    lastX = p.x;
    lastY = p.y;
    draw();
  });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const pan = state.pans[state.activePanel];
    pan.zoom = clamp(pan.zoom * (e.deltaY < 0 ? 1.12 : 0.89), 1, 3);
    draw();
  }, { passive: false });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function wireText() {
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value;
    draw();
  });
  subInput.addEventListener('input', () => {
    state.sub = subInput.value;
    draw();
  });
}

function wireExport() {
  document.getElementById('export').addEventListener('click', () => {
    const size = SIZES.find((s) => s.id === (state.size || 'square')) || SIZES[0];
    const out = renderCover(state, size.w, size.h);
    out.toBlob((blob) => {
      if (!blob) {
        say('Export failed in this browser.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vice-cover-' + size.w + 'x' + size.h + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      say('Exported ' + size.w + ' x ' + size.h + ' PNG.');
    }, 'image/png');
  });
}

async function boot() {
  const shot = readShot();
  if (shot) {
    state.layout = shot.layout;
    state.grade = shot.grade;
    state.lettering = shot.lettering;
    state.caption = shot.caption;
    state.sub = shot.sub;
  }
  buildPickers();
  wirePanels();
  wireDrag();
  wireText();
  wireExport();
  if (shot) {
    captionInput.value = shot.caption;
    subInput.value = shot.sub;
    await loadSample(shot.photo, [0, 1, 2, 3]);
    if (shot.shot === 'cover') {
      document.body.classList.add('shot-cover');
      canvas.width = shot.w;
      canvas.height = shot.h;
      draw();
      document.title = 'Vice Cover Studio — cover';
    } else {
      draw();
      say('Editor with a sample photo loaded. Swap in your own photos to make it yours.');
    }
    return;
  }
  await loadSample('boulevard', [0, 1, 2, 3]);
  say('Sample photo loaded. Add your own photos, pick a layout and a grade, then export.');
}

boot();
