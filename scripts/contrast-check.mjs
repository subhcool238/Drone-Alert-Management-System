#!/usr/bin/env node
/**
 * Dev-only visual audit for the running app. It is NOT part of the app bundle and adds
 * no dependency to package.json.
 *
 * What it does, for every screen state (Handover Briefing, each route, the Settings
 * sub-tabs, the Incidents tabs, the Header notifications panel and Header briefing):
 *   1. Measures every visible text element: real rendered text colour, effective
 *      background (transparent layers composited from the element down to the first
 *      opaque layer), WCAG contrast ratio, and rendered font size (SVG text is scaled by
 *      its on-screen scale factor).
 *   2. Counts failures against WCAG 2.2 AA: 4.5:1 for normal text, 3:1 for large text
 *      (24px, or 18.66px and bold). Disabled controls are reported separately against 3:1.
 *   3. Counts text under 12px.
 *   4. Optionally (--layout) checks for clipped, overflowing or overlapping text, and
 *      for horizontal overflow.
 *   5. Optionally (--shots=DIR) saves a screenshot of every state.
 *
 * Text over a photo or gradient cannot be measured exactly. Those items are flagged
 * "over-image" and reported with indicative ratios against black and mid-grey.
 *
 * Usage (the dev server must already be running):
 *   PUPPETEER_DIR=<folder containing node_modules/puppeteer-core> \
 *   node scripts/contrast-check.mjs --label=before --shots=<dir> --out=<report.json> \
 *        [--url=http://localhost:3000/Drone-Alert-Management-System/] \
 *        [--viewport=1440x900] [--layout]
 *
 * puppeteer-core is loaded from this project if installed, otherwise from PUPPETEER_DIR.
 * Chrome or Edge is found automatically, or set CHROME_PATH.
 *
 * Method limits: group opacity of ancestors is applied to the text colour only;
 * backdrop blur and blend modes are ignored.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const URL_BASE = args.url || 'http://localhost:3000/Drone-Alert-Management-System/';
const LABEL = args.label || 'run';
const [VW, VH] = (args.viewport || '1440x900').split('x').map(Number);
const SHOTS = args.shots && args.shots !== true ? args.shots : null;
const OUT = args.out && args.out !== true ? args.out : null;
const DO_LAYOUT = !!args.layout;

async function loadPuppeteer() {
  try {
    return (await import('puppeteer-core')).default;
  } catch { /* not installed in the project */ }
  if (process.env.PUPPETEER_DIR) {
    const req = createRequire(path.join(process.env.PUPPETEER_DIR, 'noop.js'));
    return req('puppeteer-core');
  }
  throw new Error('puppeteer-core not found. Set PUPPETEER_DIR to a folder that has it installed.');
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  const found = candidates.find(p => fs.existsSync(p));
  if (!found) throw new Error('No Chrome or Edge found. Set CHROME_PATH.');
  return found;
}

/* ------------------------------------------------------------------ in-page code */
function measureInPage(withLayout) {
  const style = document.createElement('style');
  style.setAttribute('data-contrast-check', '1');
  style.textContent = '* { pointer-events: auto !important; }';
  document.head.appendChild(style);

  const parse = s => {
    if (!s) return { r: 0, g: 0, b: 0, a: 0 };
    let m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/);
    if (m) {
      let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return { r: +m[1], g: +m[2], b: +m[3], a };
    }
    m = s.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
    if (m) return { r: m[1] * 255, g: m[2] * 255, b: m[3] * 255, a: m[4] === undefined ? 1 : +m[4] };
    return { r: 0, g: 0, b: 0, a: 0 };
  };
  const over = (top, bottom) => {
    const a = top.a + bottom.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
      g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
      b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
      a
    };
  };
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

  const opacityChain = el => {
    let op = 1;
    for (let a = el; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
    return op;
  };
  const hidden = el => {
    for (let a = el; a; a = a.parentElement) {
      const c = getComputedStyle(a);
      if (c.display === 'none' || c.visibility === 'hidden') return true;
    }
    return false;
  };

  const items = [];
  const keptEls = new Set();

  const addItem = (el, text, rect, fgColor, fgAlpha, fontSize, fontWeight, svgScale) => {
    // Bring the element into view so elementsFromPoint can hit it
    if (rect.top < 0 || rect.bottom > innerHeight || rect.left < 0 || rect.right > innerWidth) {
      try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch { /* ignore */ }
      rect = (el.getBoundingClientRect && el.getBoundingClientRect()) || rect;
    }
    const cx = Math.min(Math.max(rect.left + rect.width / 2, 1), innerWidth - 1);
    const cy = Math.min(Math.max(rect.top + rect.height / 2, 1), innerHeight - 1);
    const stack = document.elementsFromPoint(cx, cy);
    let idx = -1;
    for (let a = el; a && idx < 0; a = a.parentElement) idx = stack.indexOf(a);
    // Skip text that is covered by an opaque layer above it (for example behind a modal)
    for (let i = 0; i < Math.max(idx, 0); i++) {
      const X = stack[i];
      if (X.contains(el) || el.contains(X)) continue;
      if (parse(getComputedStyle(X).backgroundColor).a >= 0.9) return null;
    }
    keptEls.add(el);
    // Group opacity (for example disabled:opacity-50) fades a whole subtree, so the button
    // background AND its label both blend with whatever is behind the group.
    let G = null;
    for (let x = el; x; x = x.parentElement) if (parseFloat(getComputedStyle(x).opacity) < 1) G = x;
    const idxG = G ? stack.indexOf(G) : -1;
    const P = opacityChain(el);
    const innerLayers = [];
    const outerLayers = [];
    let overImage = false, opaque = false;
    if (idx >= 0) {
      for (let i = idx; i < stack.length; i++) {
        const e = stack[i];
        if (e.tagName === 'IMG' || e.tagName === 'VIDEO' || e.tagName === 'CANVAS') { overImage = true; break; }
        const c = getComputedStyle(e);
        if (c.backgroundImage && c.backgroundImage !== 'none') overImage = true;
        const col = parse(c.backgroundColor);
        const inner = idxG >= 0 && i <= idxG;
        if (col.a > 0) {
          (inner ? innerLayers : outerLayers).push(col);
          if (!inner && col.a >= 0.99) { opaque = true; break; }
        }
      }
    }
    // backdrop outside the faded group
    const base = opaque ? outerLayers[outerLayers.length - 1] : { r: 255, g: 255, b: 255, a: 1 };
    let B = { ...base, a: 1 };
    for (let i = outerLayers.length - (opaque ? 2 : 1); i >= 0; i--) B = over(outerLayers[i], B);
    // content of the group: its own background layers, composited together
    let Cin = { r: 0, g: 0, b: 0, a: 0 };
    for (let i = innerLayers.length - 1; i >= 0; i--) Cin = over(innerLayers[i], Cin);
    const mix = (c, alpha) => ({ r: B.r * (1 - alpha) + c.r * alpha, g: B.g * (1 - alpha) + c.g * alpha, b: B.b * (1 - alpha) + c.b * alpha, a: 1 });
    const bg = mix(Cin, P * Cin.a);
    const textOver = over({ ...fgColor, a: fgColor.a * fgAlpha }, Cin);
    const fg = mix(textOver, P * textOver.a);
    const fgBase = { ...fgColor, a: fgColor.a * fgAlpha * P };
    const size = fontSize * (svgScale || 1);
    const large = size >= 24 || (size >= 18.66 && fontWeight >= 700);
    const needed = large ? 3 : 4.5;
    const r = ratio(fg, bg);
    const disabled = !!el.closest('button:disabled, [disabled], input:disabled, select:disabled');
    const item = {
      text: text.replace(/\s+/g, ' ').trim().slice(0, 40),
      fg: hex(fg), bg: hex(bg), ratio: Math.round(r * 100) / 100,
      size: Math.round(size * 10) / 10, weight: fontWeight, needed,
      pass: r >= needed, under12: size < 12, disabled,
      overImage, tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === 'string' ? el.className : '').slice(0, 90)
    };
    if (overImage) {
      item.ratioOverBlack = Math.round(ratio(over(fgBase, { r: 0, g: 0, b: 0, a: 1 }), { r: 0, g: 0, b: 0, a: 1 }) * 100) / 100;
      item.ratioOverGrey = Math.round(ratio(over(fgBase, { r: 128, g: 128, b: 128, a: 1 }), { r: 128, g: 128, b: 128, a: 1 }) * 100) / 100;
    }
    if (overImage) { el.setAttribute('data-cc', String(items.length)); item._cc = items.length; }
    items.push(item);
    return item;
  };

  const skipSel = 'script,style,noscript,option,optgroup,title,.material-symbols-outlined,[aria-hidden="true"]';

  // 1) text nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.nodeValue.trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || el.closest(skipSel) || hidden(el) || opacityChain(el) < 0.05) continue;
    if (el.closest('select')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    if (!rects.length) continue;
    const rect = rects[0];
    if (rect.width < 1 || rect.height < 1) continue;
    const cs = getComputedStyle(el);
    const isSvg = el instanceof SVGElement;
    if (isSvg) {
      let scale = 1;
      try {
        const bbox = el.getBBox();
        if (bbox.width > 0) scale = rect.width / bbox.width;
      } catch { /* ignore */ }
      const fillA = parseFloat(cs.fillOpacity);
      addItem(el, text, rect, parse(cs.fill), isNaN(fillA) ? 1 : fillA, parseFloat(cs.fontSize), parseInt(cs.fontWeight, 10), scale);
    } else {
      addItem(el, text, rect, parse(cs.color), 1, parseFloat(cs.fontSize), parseInt(cs.fontWeight, 10), 1);
    }
  }

  // 2) select values
  for (const sel of document.querySelectorAll('select')) {
    if (hidden(sel)) continue;
    const r = sel.getBoundingClientRect();
    if (r.width < 1) continue;
    const cs = getComputedStyle(sel);
    const label = sel.options[sel.selectedIndex]?.text || '';
    addItem(sel, label, r, parse(cs.color), 1, parseFloat(cs.fontSize), parseInt(cs.fontWeight, 10), 1);
  }

  // 3) placeholders
  for (const inp of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
    if (hidden(inp) || inp.value) continue;
    const r = inp.getBoundingClientRect();
    if (r.width < 1) continue;
    const cs = getComputedStyle(inp);
    const ph = getComputedStyle(inp, '::placeholder');
    const it = addItem(inp, 'placeholder: ' + inp.getAttribute('placeholder'), r, parse(ph.color), 1, parseFloat(cs.fontSize), parseInt(cs.fontWeight, 10), 1);
    if (it) it.placeholder = true;
  }

  const layout = null;
  for (const it of items) delete it._rect;
  style.remove();
  return { items, layout };
}


/* Layout problems: clipped, overflowing or overlapping text, using only text that is
   visible in the current viewport (no scrolling, so scroll side effects cannot show up). */
function layoutInPage() {
  const style = document.createElement('style');
  style.setAttribute('data-contrast-check', '1');
  style.textContent = '* { pointer-events: auto !important; }';
  document.head.appendChild(style);
  const skipSel = 'script,style,noscript,option,optgroup,title,.material-symbols-outlined,[aria-hidden="true"]';
  const hiddenEl = el => {
    for (let a = el; a; a = a.parentElement) {
      const c = getComputedStyle(a);
      if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) < 0.05) return true;
    }
    return false;
  };
  const layout = { clipped: [], overlaps: [], offscreenRight: [], hScroll: null, scrollers: [] };
  const seen = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue.trim();
    const el = node.parentElement;
    if (!text || !el || el.closest(skipSel) || el instanceof SVGElement || hiddenEl(el) || el.closest('select')) continue;
    if (seen.has(el)) continue;
    const rg = document.createRange(); rg.selectNodeContents(el);
    const r = rg.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.top < 0 || r.left < 0 || r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5) {
      if (r.right > innerWidth + 1 && r.left < innerWidth) layout.offscreenRight.push({ text: text.slice(0, 40), right: Math.round(r.right) });
      continue;
    }
    const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const top = stack[0];
    if (!top || !(top === el || top.contains(el) || el.contains(top))) continue;
    seen.set(el, { text: text.slice(0, 40), r });
  }
  for (const [el, info] of seen) {
    const cs = getComputedStyle(el);
    const r = info.r;
    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      layout.clipped.push({ text: info.text, why: 'text wider than its box (' + el.scrollWidth + ' > ' + el.clientWidth + ')' });
      continue;
    }
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const ac = getComputedStyle(a);
      const ar = a.getBoundingClientRect();
      // Content inside a scroll container that is partly out of view is normal scrolling, not clipping
      if (((ac.overflowY === 'auto' || ac.overflowY === 'scroll') && (r.bottom > ar.bottom + 2 || r.top < ar.top - 2)) ||
          ((ac.overflowX === 'auto' || ac.overflowX === 'scroll') && (r.right > ar.right + 2 || r.left < ar.left - 2))) break;
      const clipX = ac.overflowX === 'hidden' || ac.overflowX === 'clip';
      const clipY = ac.overflowY === 'hidden' || ac.overflowY === 'clip';
      if (clipX && (r.right > ar.right + 2 || r.left < ar.left - 2)) {
        layout.clipped.push({ text: info.text, why: 'cut off at the side by a parent (' + Math.round(Math.max(r.right - ar.right, ar.left - r.left)) + 'px)' });
        break;
      }
      if (clipY && (r.bottom > ar.bottom + 2 || r.top < ar.top - 2)) {
        layout.clipped.push({ text: info.text, why: 'cut off at top or bottom by a parent (' + Math.round(Math.max(r.bottom - ar.bottom, ar.top - r.top)) + 'px)' });
        break;
      }
    }
  }
  const boxes = [...seen.entries()].map(([el, info]) => ({ el, r: info.r, text: info.text }));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i], B = boxes[j];
      if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
      const w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
      const h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (w > 2 && h > 2) {
        const small = Math.min(A.r.width * A.r.height, B.r.width * B.r.height);
        if ((w * h) / small > 0.25) layout.overlaps.push({ a: A.text, b: B.text });
      }
    }
  }
  layout.hScroll = document.documentElement.scrollWidth > innerWidth + 1
    ? { scrollWidth: document.documentElement.scrollWidth, innerWidth } : null;
  for (const e of document.querySelectorAll('*')) {
    const c = getComputedStyle(e);
    if ((c.overflowX === 'auto' || c.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) {
      layout.scrollers.push({ tag: e.tagName.toLowerCase(), cls: (typeof e.className === 'string' ? e.className : '').slice(0, 60), over: e.scrollWidth - e.clientWidth });
    }
  }
  style.remove();
  return layout;
}

/* ------------------------------------------------------------------ driver */
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Text over a photo: hide the text, screenshot its box, and judge the real pixels behind it.
async function sampleOverImage(page, items) {
  for (const it of items) {
    if (!it.overImage || it._cc === undefined) continue;
    const rect = await page.evaluate(id => {
      const el = document.querySelector('[data-cc="' + id + '"]');
      if (!el) return null;
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      el.setAttribute('data-cc-style', el.getAttribute('style') || '');
      el.style.setProperty('color', 'transparent', 'important');
      el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      el.style.setProperty('text-shadow', 'none', 'important');
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    }, it._cc);
    if (rect && rect.width >= 1 && rect.height >= 1) {
      const x = Math.max(0, Math.floor(rect.x)), y = Math.max(0, Math.floor(rect.y));
      const width = Math.min(Math.ceil(rect.width), VW - x), height = Math.min(Math.ceil(rect.height), VH - y);
      if (width >= 1 && height >= 1) {
        const b64 = await page.screenshot({ clip: { x, y, width, height }, encoding: 'base64' });
        const stats = await page.evaluate(async data => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + data;
          await img.decode();
          const c = document.createElement('canvas');
          c.width = img.width; c.height = img.height;
          const g = c.getContext('2d');
          g.drawImage(img, 0, 0);
          const px = g.getImageData(0, 0, c.width, c.height).data;
          const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
          const L = [];
          for (let i = 0; i < px.length; i += 4) L.push(0.2126 * f(px[i]) + 0.7152 * f(px[i + 1]) + 0.0722 * f(px[i + 2]));
          L.sort((a, b) => a - b);
          const at = p => L[Math.min(L.length - 1, Math.floor(L.length * p))];
          return { p5: at(0.05), p50: at(0.5), p95: at(0.95) };
        }, b64);
        // text luminance from the measured colour
        const hexv = it.fg.replace('#', '');
        const rgb = [0, 2, 4].map(i => parseInt(hexv.slice(i, i + 2), 16));
        const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        const Lf = 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
        const ratioWith = Lp => (Math.max(Lf, Lp) + 0.05) / (Math.min(Lf, Lp) + 0.05);
        // worst case: light text against the lightest pixels, dark text against the darkest
        const worstL = Lf > stats.p50 ? stats.p95 : stats.p5;
        it.sampledWorst = Math.round(ratioWith(worstL) * 100) / 100;
        it.sampledMedian = Math.round(ratioWith(stats.p50) * 100) / 100;
      }
    }
    await page.evaluate(id => {
      const el = document.querySelector('[data-cc="' + id + '"]');
      if (!el) return;
      const prev = el.getAttribute('data-cc-style');
      if (prev) el.setAttribute('style', prev); else el.removeAttribute('style');
      el.removeAttribute('data-cc-style');
      el.removeAttribute('data-cc');
    }, it._cc);
    delete it._cc;
  }
}

const clickByText = (page, selector, re) =>
  page.evaluate((sel, src) => {
    const re = new RegExp(src, 'i');
    const el = [...document.querySelectorAll(sel)].find(e => re.test(e.innerText || ''));
    if (el) el.click();
    return !!el;
  }, selector, re.source);

async function main() {
  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH });
  await page.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(800);

  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const results = [];
  let n = 0;
  const capture = async name => {
    await sleep(350);
    n += 1;
    const layout = DO_LAYOUT ? await page.evaluate(layoutInPage) : { clipped: [], overlaps: [], offscreenRight: [], hScroll: null, scrollers: [] };
    const { items } = await page.evaluate(measureInPage, false);
    await sampleOverImage(page, items);
    // screenshot after measurement (measurement may scroll); scroll back to top first
    await page.evaluate(() => { document.querySelectorAll("*").forEach(e => { if (e.scrollTop) e.scrollTop = 0; if (e.scrollLeft) e.scrollLeft = 0; }); });
    await sleep(150);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, String(n).padStart(2, '0') + '-' + name + '.png') });
    const measured = items.filter(i => !i.disabled);
    const fails = measured.filter(i => !i.pass && !i.overImage);
    results.push({
      state: name,
      total: items.length,
      failing: fails.length,
      under12: items.filter(i => i.under12).length,
      overImage: items.filter(i => i.overImage).length,
      overImageFailing: items.filter(i => i.overImage && !i.disabled && i.sampledWorst !== undefined && i.sampledWorst < i.needed).length,
      disabledBelow3: items.filter(i => i.disabled && i.ratio < 3).length,
      failures: fails,
      under12Items: items.filter(i => i.under12).map(i => ({ text: i.text, size: i.size })),
      overImageItems: items.filter(i => i.overImage),
      disabledItems: items.filter(i => i.disabled),
      layout
    });
  };

  // 1) Handover Briefing (shown on load)
  await capture('handover-briefing');
  await page.evaluate(() => {
    const cb = document.querySelector('input[type=checkbox]');
    if (cb) cb.click();
  });
  await sleep(250);
  await clickByText(page, 'button', /acknowledge/);
  await sleep(500);

  const go = async (hash, name, after) => {
    await page.evaluate(h => { location.hash = h; }, hash);
    await sleep(700);
    if (after) await after();
    await capture(name);
  };

  await go('#/', 'dashboard');
  await clickByText(page, 'main button', /^3D$/);
  await sleep(500);
  await capture('dashboard-3d');
  await clickByText(page, 'main button', /^2D$/);
  await go('#/fleet', 'fleet');
  await go('#/manual', 'manual-control');
  // Fault drone selected: the Manual Control buttons are disabled
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('aside div')].find(d => d.className.includes('cursor-pointer') && /Surveyor-X/.test(d.innerText));
    if (card) card.click();
  });
  await sleep(400);
  await capture('manual-control-fault');
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('aside div')].find(d => d.className.includes('cursor-pointer') && /Sentinel-1/.test(d.innerText));
    if (card) card.click();
  });
  await go('#/patrols', 'patrol-routes');
  await go('#/incidents', 'incidents-list');
  await clickByText(page, 'main button', /tactical analytics/);
  await sleep(900);
  await capture('incidents-analytics');
  await clickByText(page, 'main button', /report center/);
  await sleep(500);
  await capture('incidents-reports');
  for (const tab of ['roles', 'alerts', 'integrations', 'channels', 'region', 'about']) {
    await go('#/settings/' + tab, 'settings-' + tab);
  }
  // Header notifications panel and Header briefing, on the Dashboard
  await page.evaluate(() => { location.hash = '#/'; });
  await sleep(700);
  await page.evaluate(() => document.querySelector('header button[aria-label="Notifications"]')?.click());
  await sleep(400);
  const hasPanel = await page.evaluate(() => !!document.querySelector('header .max-h-\\[350px\\]'));
  if (!hasPanel) {
    await clickByText(page, 'header button', /notifications/);
    await sleep(400);
  }
  await capture('notifications-panel');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const open = !!document.querySelector('header .max-h-\\[350px\\]');
    if (open) document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  await sleep(300);
  await page.evaluate(() => {
    const profile = [...document.querySelectorAll('header div')].find(d => d.className.includes('cursor-pointer') && /Isabelle/.test(d.innerText));
    if (profile) profile.click();
  });
  await sleep(400);
  await capture('header-briefing');

  await browser.close();

  // report
  const total = { total: 0, failing: 0, under12: 0, overImage: 0, disabledBelow3: 0 };
  console.log(`\nContrast check (${LABEL}, ${VW}x${VH})`);
  console.log('state'.padEnd(24) + 'texts'.padStart(7) + 'fail'.padStart(7) + '<12px'.padStart(8) + 'overImg'.padStart(9) + 'imgFail'.padStart(9) + 'disabled<3'.padStart(12));
  for (const r of results) {
    console.log(r.state.padEnd(24) + String(r.total).padStart(7) + String(r.failing).padStart(7) + String(r.under12).padStart(8) + String(r.overImage).padStart(9) + String(r.overImageFailing).padStart(9) + String(r.disabledBelow3).padStart(12));
    total.total += r.total; total.failing += r.failing; total.under12 += r.under12; total.overImage += r.overImage; total.overImageFailing = (total.overImageFailing || 0) + r.overImageFailing; total.disabledBelow3 += r.disabledBelow3;
  }
  console.log('TOTAL'.padEnd(24) + String(total.total).padStart(7) + String(total.failing).padStart(7) + String(total.under12).padStart(8) + String(total.overImage).padStart(9) + String(total.overImageFailing || 0).padStart(9) + String(total.disabledBelow3).padStart(12));
  if (DO_LAYOUT) {
    console.log('\nLayout problems:');
    for (const r of results) {
      const L = r.layout;
      const parts = [];
      if (L.clipped.length) parts.push(L.clipped.length + ' clipped');
      if (L.overlaps.length) parts.push(L.overlaps.length + ' overlapping');
      if (L.offscreenRight.length) parts.push(L.offscreenRight.length + ' off right edge');
      if (L.hScroll) parts.push('page h-scroll');
      if (L.scrollers.length) parts.push(L.scrollers.length + ' h-scrolling containers');
      console.log('  ' + r.state.padEnd(24) + (parts.join(', ') || 'none'));
    }
  }
  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ label: LABEL, viewport: [VW, VH], total, results }, null, 2));
    console.log('\nFull report: ' + OUT);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
