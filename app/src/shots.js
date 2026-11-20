// Shot mode for screenshots: reads the page's query string and tells main.js
// what to show. ?shot=cover draws one exported cover full-frame; ?shot=editor
// shows the editor with a sample photo loaded. Any other page is the plain app.
export function readShot() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (shot !== 'cover' && shot !== 'editor') return null;
  const size = q.get('size') || 'square';
  const dims = { square: [1080, 1080], portrait: [1080, 1350], wide: [1920, 1080] }[size] || [1080, 1080];
  return {
    shot,
    photo: q.get('photo') || 'boulevard',
    caption: q.get('caption') || 'Sunset Heist',
    sub: q.get('sub') || 'Leonida Nights',
    layout: q.get('layout') || 'hero',
    grade: q.get('grade') || 'sunset',
    lettering: q.get('lettering') || 'block',
    w: Number(q.get('w') || dims[0]),
    h: Number(q.get('h') || dims[1]),
  };
}
