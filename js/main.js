/* ==========================================================================
   QWERTYMC — interakcje
   Bez bibliotek, bez kroku budowania.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  const toastText = $('#toast-text');
  let toastTimer;
  function toast(message) {
    toastText.textContent = message;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2800);
  }

  /* ---------- Nawigacja ---------- */
  const nav = $('#nav');
  const navToggle = $('#nav-toggle');
  const navLinks = $('#nav-links');

  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  }
  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 781px)').addEventListener('change', () => setMenu(false));

  // podświetlanie aktywnej sekcji
  const spyLinks = new Map($$('[data-spy]').map((a) => [a.dataset.spy, a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      spyLinks.forEach((a, id) => a.classList.toggle('is-active', id === entry.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  ['start', 'rangi', 'sklep', 'regulamin'].forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------- Pojawianie się sekcji ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-in');
        io.unobserve(el);
        // po animacji zdejmujemy klasę, by nie kolidowała z hoverem
        const delay = (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 1000;
        setTimeout(() => el.classList.remove('reveal', 'is-in'), 900 + delay);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.remove('reveal'));
  }

  /* ---------- Kopiowanie IP ---------- */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* przechodzimy do wersji zapasowej */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  }

  function burst(host, count = 12) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'px-burst';
      const size = [4, 6, 8][(Math.random() * 3) | 0];
      p.style.width = p.style.height = size + 'px';
      p.style.setProperty('--dx', ((Math.random() * 2 - 1) * 110).toFixed(0) + 'px');
      p.style.setProperty('--dy', (-30 - Math.random() * 90).toFixed(0) + 'px');
      p.style.setProperty('--rot', ((Math.random() * 2 - 1) * 180).toFixed(0) + 'deg');
      if (Math.random() < 0.3) p.style.background = '#ebe9e4';
      host.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  }

  function selectText(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  $$('[data-copy]').forEach((btn) => {
    const label = $('.ip-action-text', btn);
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      if (ok) {
        btn.classList.add('is-copied');
        label.textContent = label.dataset.done;
        burst(btn);
        toast('Adres IP skopiowany. Wklej go w Minecraftcie.');
        clearTimeout(btn._timer);
        btn._timer = setTimeout(() => {
          btn.classList.remove('is-copied');
          label.textContent = label.dataset.idle;
        }, 2300);
      } else {
        selectText($('.ip-addr', btn));
        toast('Nie udało się skopiować. Adres jest zaznaczony — skopiuj go ręcznie.');
      }
    });
  });

  /* ---------- Hero: klawisze ---------- */
  const logo = $('.logo');
  const keys = new Map($$('.key', logo).map((k) => [k.dataset.k, k]));

  // wciskanie myszą / palcem
  keys.forEach((key) => {
    const down = () => key.classList.add('is-down');
    const up = () => key.classList.remove('is-down');
    key.addEventListener('pointerdown', down);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => key.addEventListener(ev, up));
  });

  // wciskanie prawdziwą klawiaturą + sekwencja QWERTYMC
  const secret = 'qwertymc';
  let buffer = '';
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    const k = (e.key || '').toLowerCase();
    const el = keys.get(k);
    if (!el) { buffer = ''; return; }
    el.classList.add('is-down');
    buffer = (buffer + k).slice(-secret.length);
    if (buffer === secret) { celebrate(); buffer = ''; }
  });
  addEventListener('keyup', (e) => {
    const el = keys.get((e.key || '').toLowerCase());
    if (el) el.classList.remove('is-down');
  });
  addEventListener('blur', () => keys.forEach((k) => k.classList.remove('is-down')));

  function celebrate() {
    toast('Wpisano QWERTYMC. Do zobaczenia na serwerze!');
    if (reduceMotion) return;
    keys.forEach((k) => {
      k.classList.remove('is-wave');
      void k.offsetWidth;
      k.classList.add('is-wave');
      setTimeout(() => k.classList.remove('is-wave'), 1200);
    });
  }

  // delikatny przechył logo za kursorem
  const hero = $('.hero');
  if (logo && hero && !reduceMotion && finePointer) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const step = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      logo.style.setProperty('--ry', (cx * 9).toFixed(2) + 'deg');
      logo.style.setProperty('--rx', (-cy * 7).toFixed(2) + 'deg');
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(step) : null;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      kick();
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  }

  /* ---------- Hero: teren z bloków ---------- */
  const terrain = $('.terrain');
  function buildTerrain() {
    if (!terrain) return;
    const w = Math.max(320, terrain.clientWidth);
    const h = terrain.clientHeight || 176;
    const cell = Math.max(16, Math.round(w / 62));
    const cols = Math.ceil(w / cell) + 1;
    terrain.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const layers = [
      { seed: 1.7, base: 0.60, amp: 0.30, fill: '#0e1511', edge: 'rgba(126,224,90,.14)' },
      { seed: 4.1, base: 0.34, amp: 0.22, fill: '#0b0c0e', edge: 'rgba(126,224,90,.36)' },
    ];

    let svg = '';
    layers.forEach((L) => {
      let fillPath = `M0 ${h}`;
      let edgePath = '';
      for (let i = 0; i < cols; i++) {
        const n = Math.sin(i * 0.21 + L.seed) * 0.5 + Math.sin(i * 0.07 + L.seed * 2.3) * 0.35 + Math.sin(i * 0.53 + L.seed * 0.7) * 0.15;
        const raw = (L.base + n * L.amp) * h;
        const height = Math.max(cell, Math.round(raw / cell) * cell);
        const y = h - height;
        const x0 = i * cell;
        const x1 = x0 + cell;
        fillPath += ` L${x0} ${y} L${x1} ${y}`;
        edgePath += (i === 0 ? `M${x0} ${y}` : ` L${x0} ${y}`) + ` L${x1} ${y}`;
      }
      fillPath += ` L${cols * cell} ${h} Z`;
      svg += `<path d="${fillPath}" fill="${L.fill}"/><path d="${edgePath}" fill="none" stroke="${L.edge}" stroke-width="2" shape-rendering="crispEdges"/>`;
    });
    terrain.innerHTML = svg;
  }
  buildTerrain();
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(buildTerrain, 150); });

  /* ---------- Hero: unoszące się piksele ---------- */
  (function particles() {
    const canvas = $('#px-canvas');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, items = [], raf = null, visible = true;

    const spawn = (initial) => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      s: [3, 4, 5, 6][(Math.random() * 4) | 0],
      v: 0.12 + Math.random() * 0.32,
      a: 0.07 + Math.random() * 0.2,
      green: Math.random() < 0.7,
      sway: Math.random() * Math.PI * 2,
    });

    function resize() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(46, w / 26));
      items = Array.from({ length: count }, () => spawn(true));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of items) {
        p.y -= p.v;
        p.sway += 0.01;
        ctx.fillStyle = p.green ? `rgba(126,224,90,${p.a})` : `rgba(235,233,228,${p.a * 0.55})`;
        ctx.fillRect(Math.round(p.x + Math.sin(p.sway) * 6), Math.round(p.y), p.s, p.s);
        if (p.y < -10) Object.assign(p, spawn(false));
      }
      raf = requestAnimationFrame(frame);
    }

    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

    resize();
    start();
    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(resize, 150); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  })();

  /* ---------- Rangi: przełącznik okresu ---------- */
  (function periods() {
    const group = $('#period');
    if (!group) return;
    const buttons = $$('button', group);
    const nums = $$('.price-num');
    const pers = $$('.price-per');

    function tween(el, from, to) {
      cancelAnimationFrame(el._raf);
      if (reduceMotion || from === to) { el.textContent = to; return; }
      const t0 = performance.now();
      const dur = 520;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (k < 1) el._raf = requestAnimationFrame(tick);
      };
      el._raf = requestAnimationFrame(tick);
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }

    function set(value, focus) {
      group.dataset.value = value;
      buttons.forEach((b) => {
        const on = b.dataset.period === value;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      nums.forEach((el) => tween(el, parseInt(el.textContent, 10) || 0, parseInt(el.dataset['p' + value], 10)));
      pers.forEach((el) => { el.textContent = `/ ${value} dni`; });
    }

    buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.period, false)));
    group.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const next = group.dataset.value === '30' ? '356' : '30';
      set(next, true);
    });
  })();

  /* ---------- Regulamin: rozwijane sekcje + wyszukiwarka ---------- */
  (function rules() {
    const groups = $$('.group');
    const input = $('#rule-search');
    const toggleAll = $('#toggle-all');
    const summary = $('#rules-summary');
    const empty = $('#rules-empty');
    if (!groups.length) return;

    const plural = (n) => (n === 1 ? 'punkt' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'punkty' : 'punktów');
    const norm = (s) => s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');

    function setOpen(group, open) {
      group.classList.toggle('is-open', open);
      $('.group-head', group).setAttribute('aria-expanded', String(open));
      const inner = $('.group-body > div', group);
      if (inner) inner.inert = !open;
    }
    const isOpen = (g) => g.classList.contains('is-open');
    const visibleGroups = () => groups.filter((g) => !g.hidden);

    function syncToggleLabel() {
      const vis = visibleGroups();
      const allOpen = vis.length > 0 && vis.every(isOpen);
      toggleAll.textContent = allOpen ? 'Zwiń wszystkie' : 'Rozwiń wszystkie';
    }

    groups.forEach((g, i) => {
      setOpen(g, i === 0);
      $('.group-head', g).addEventListener('click', () => { setOpen(g, !isOpen(g)); syncToggleLabel(); });
    });
    syncToggleLabel();

    toggleAll.addEventListener('click', () => {
      const vis = visibleGroups();
      const open = !vis.every(isOpen);
      vis.forEach((g) => setOpen(g, open));
      syncToggleLabel();
    });

    // wyszukiwarka
    const rules = $$('.rule');
    rules.forEach((r) => { r.dataset.t = norm(`${r.textContent} ${r.dataset.n}`); });
    let saved = null;

    function filter() {
      const tokens = norm(input.value.trim()).split(/\s+/).filter(Boolean);
      const searching = tokens.length > 0;
      if (searching && !saved) saved = groups.map(isOpen);

      let found = 0;
      groups.forEach((g) => {
        let hits = 0;
        let real = 0;
        let shown = 0;
        $$('.rule', g).forEach((r) => {
          const isReal = !r.classList.contains('rule--missing');
          const match = !searching || tokens.every((t) => r.dataset.t.includes(t));
          r.hidden = !match;
          if (isReal) real++;
          if (match) { shown++; if (isReal) hits++; }
        });
        g.hidden = searching && shown === 0;
        found += searching ? hits : 0;
        $('.group-count', g).textContent = searching ? `${hits} z ${real}` : `${real} ${plural(real)}`;
        if (searching && shown > 0) setOpen(g, true);
      });

      if (!searching && saved) {
        groups.forEach((g, i) => setOpen(g, saved[i]));
        saved = null;
      }

      const anyGroup = visibleGroups().length > 0;
      empty.hidden = anyGroup;
      summary.textContent = searching ? (anyGroup ? `Znaleziono: ${found}` : '') : '';
      syncToggleLabel();
    }
    input.addEventListener('input', filter);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { input.value = ''; filter(); } });
  })();

  /* ---------- Stopka ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
