"use client";

import { useEffect } from "react";

function initializeFrames() {
const canvas = document.querySelector('#frames');
const ctx = canvas.getContext('2d');
const sequence = document.querySelector('.sequence');
const stage = document.querySelector('.stage');
const status = document.querySelector('#upload-status');
const upload = document.querySelector('#upload');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let disposed = false;
let sources = [], ownedUrls = [], cache = new Map(), currentFrame = -1, progress = 0, scheduled = false, generation = 0;
const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
function resize() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(stage.clientWidth * ratio);
  canvas.height = Math.round(stage.clientHeight * ratio);
  paint();
}
function draw(img) {
  const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
  const w = img.width * scale, h = img.height * scale;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}
function getImage(index) {
  if (cache.has(index)) return cache.get(index);
  const img = new Image();
  const entry = { img, ready: false, failed: false };
  const revision = generation;
  cache.set(index, entry);
  img.onload = () => {
    if (revision !== generation) return;
    entry.ready = true;
    if (index === currentFrame) { draw(img); stage.classList.add('has-frames'); }
  };
  img.onerror = () => {
    if (revision !== generation) return;
    entry.failed = true;
    if (index === currentFrame) status.textContent = `Could not decode frame ${index + 1}. Try a PNG, JPG or WEBP sequence.`;
  };
  img.src = sources[index];
  return entry;
}
function paint() {
  if (!sources.length) return;
  currentFrame = reducedMotion ? 0 : Math.round(progress * (sources.length - 1));
  document.querySelector('#frame-number').textContent = String(currentFrame + 1).padStart(3, '0');
  const entry = getImage(currentFrame);
  if (entry.ready) { draw(entry.img); stage.classList.add('has-frames'); }
  for (let offset = -2; offset <= 3; offset++) {
    const index = currentFrame + offset;
    if (index >= 0 && index < sources.length) getImage(index);
  }
  for (const key of cache.keys()) if (Math.abs(key - currentFrame) > 8) cache.delete(key);
}
function update() {
  scheduled = false;
  const rect = sequence.getBoundingClientRect();
  progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, sequence.offsetHeight - stage.offsetHeight)));
  document.querySelector('#progress-fill').style.width = `${progress * 100}%`;
  const chapter = progress < .34 ? 0 : progress < .7 ? 1 : 2;
  document.querySelectorAll('.scene').forEach((scene, i) => scene.classList.toggle('active', i === chapter));
  document.querySelector('#chapter-number').textContent = String(chapter + 1).padStart(2, '0');
  if (!reducedMotion) {
    document.querySelector('.orb').style.transform = `rotate(${-25 + progress * 65}deg) scale(${1 + progress * .2})`;
    document.querySelector('.core').style.transform = `rotate(${-12 + progress * 30}deg)`;
  }
  paint();
}
let animationId;
function onScroll() { if (!scheduled) { scheduled = true; animationId = requestAnimationFrame(update); } }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', resize);
function installFrames(items) {
  if (!items.length) throw new Error('No PNG, JPG or WEBP frames found.');
  generation++;
  cache.clear();
  stage.classList.remove('has-frames');
  ownedUrls.forEach(url => URL.revokeObjectURL(url));
  ownedUrls = [];
  sources = items.sort(naturalSort).map(item => {
    if (item.url) return item.url;
    const url = URL.createObjectURL(item.blob);
    ownedUrls.push(url);
    return url;
  });
  document.querySelector('#frame-total').textContent = String(sources.length).padStart(3, '0');
  status.textContent = `${sources.length} frames loaded. Scroll to explore your sequence.`;
  document.querySelector('#return-link').hidden = false;
  update();
}
// Read ZIP central-directory metadata; never execute or write archive contents.
async function unzipFrames(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let end = bytes.length - 22;
  for (; end >= Math.max(0, bytes.length - 65557); end--) {
    if (view.getUint32(end, true) === 0x06054b50) break;
  }
  if (end < Math.max(0, bytes.length - 65557)) throw new Error('This file is not a supported ZIP archive.');
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error('Multi-part ZIP files are not supported.');
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true), total = 0;
  if (count === 65535 || cursor === 0xffffffff) throw new Error('Please use a standard ZIP instead of ZIP64.');
  const frames = [];
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50) throw new Error('The ZIP directory is damaged.');
    const flags = view.getUint16(cursor + 8, true), method = view.getUint16(cursor + 10, true);
    const compressed = view.getUint32(cursor + 20, true), size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true), extra = view.getUint16(cursor + 30, true), comment = view.getUint16(cursor + 32, true);
    const local = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extra + comment;
    if (!/\.(png|jpe?g|webp)$/i.test(name) || name.startsWith('__MACOSX/') || /(^|\/)\._/.test(name)) continue;
    if (flags & 1) throw new Error('Please use a ZIP without a password.');
    total += size;
    if (frames.length >= 1500 || total > 1024 * 1024 * 1024 || size > 50 * 1024 * 1024) throw new Error('This sequence is too large. Use up to 1,500 frames and 1 GB of extracted images.');
    if (local + 30 > bytes.length || view.getUint32(local, true) !== 0x04034b50) throw new Error('A ZIP frame header is damaged.');
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    if (start + compressed > bytes.length) throw new Error('The ZIP archive is incomplete.');
    let blob = new Blob([bytes.subarray(start, start + compressed)]);
    if (method === 8) blob = await new Response(blob.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
    else if (method !== 0) throw new Error('Unsupported ZIP compression. Please use a standard ZIP or select image files.');
    if (blob.size !== size) throw new Error('A frame could not be extracted completely.');
    frames.push({ name, blob });
    if (frames.length % 10 === 0) { status.textContent = `Preparing ${frames.length} frames…`; await new Promise(resolve => setTimeout(resolve, 0)); }
  }
  return frames;
}
async function onUpload() {
  const files = [...upload.files];
  if (!files.length) return;
  upload.disabled = true;
  status.textContent = 'Preparing your frames…';
  try {
    const archive = files.find(file => /\.zip$/i.test(file.name));
    const items = archive ? await unzipFrames(archive) : files.filter(file => /\.(png|jpe?g|webp)$/i.test(file.name)).map(file => ({ name: file.name, blob: file }));
    if (!disposed) installFrames(items);
  } catch (error) { status.textContent = error.message || 'Unable to load frames. Try selecting the extracted images.'; }
  finally { upload.disabled = false; upload.value = ''; }
}
upload.addEventListener('change', onUpload);
async function loadBundled() {
  try {
    const response = await fetch('/frames/manifest.json');
    if (!response.ok) return;
    const names = await response.json();
    if (!disposed && Array.isArray(names) && names.length) installFrames(names.map(name => ({ name, url: `/frames/${encodeURIComponent(name)}` })));
  } catch { /* The browser importer remains available when no bundled frames exist. */ }
}
resize(); update(); loadBundled();

return () => {
 disposed = true; generation++;
 cancelAnimationFrame(animationId);
 removeEventListener("scroll", onScroll);
 removeEventListener("resize", resize);
 upload.removeEventListener("change", onUpload);
 ownedUrls.forEach(url => URL.revokeObjectURL(url));
 cache.clear();
};

}

export default function FrameController() {
 useEffect(initializeFrames, []);
 return null;
}
