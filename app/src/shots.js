// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the exported cover alone, full-bleed.
// `photo` picks the sample for the hero panel, `photo2` the second panel,
// `caption` the title, `sub` the subtitle, `layout`, `grade`, `size`,
// `captionStyle` and `captionPos` the rest. window.__shotReady is set once painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photos = [
    query.get('photo') ?? 'pier',
    query.get('photo2') ?? 'boulevard',
    query.get('photo3') ?? 'pier',
    query.get('photo4') ?? 'boulevard',
  ];
  await load({
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? 'wide',
    caption: query.get('caption') ?? 'VICE CITY',
    sub: query.get('sub') ?? 'Sunset Heist',
    captionStyle: query.get('captionStyle') ?? 'sunset',
    captionPos: query.get('captionPos') ?? 'bottom',
    photos,
    zooms: [1.05, 1.1, 1, 1.05],
    oxs: [0, 0.05, 0, -0.05],
    oys: [0, 0, 0.05, 0],
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
