/* 360 Graphics TZ — interactions and motion */
(() => {
  const html = document.documentElement, body = document.body;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motion = !!(window.gsap && window.ScrollTrigger) && !reduce;
  let lenis = null;
  const lockScroll = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); html.style.overflow = on ? 'hidden' : ''; };

  /* =============== always-on behaviour =============== */

  // mobile menu
  const menuBtn = $('.menu-btn'), menu = $('#menu');
  const setMenu = (open) => {
    html.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    $('span', menuBtn).textContent = open ? 'Close' : 'Menu';
    lockScroll(open);
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
    matchMedia('(min-width: 860px)').addEventListener('change', (e) => e.matches && setMenu(false));
  }

  // header hides on the way down, returns on the way up
  const header = $('.header');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!html.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > lastY && y > 160);
    lastY = y;
  }, { passive: true });

  const refresh = () => motion && ScrollTrigger.refresh();
  const popIn = (els) => motion && els.length && gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', stagger: .04, overwrite: true, clearProps: 'transform' });

  // chip filters (services + work)
  $$('[data-filter]').forEach((bar) => {
    const kind = bar.dataset.filter;
    bar.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip'); if (!chip) return;
      $$('.chip', bar).forEach((c) => c.setAttribute('aria-pressed', c === chip));
      const f = chip.dataset.f;
      const items = kind === 'svc' ? $$('.svc-group') : $$('.tile');
      const shown = [];
      items.forEach((el) => {
        const on = f === 'all' || (el.dataset.g || el.dataset.c) === f;
        el.hidden = !on; if (on) shown.push(el);
      });
      popIn(shown); refresh();
    });
  });

  // service accordion
  $$('.svc > button').forEach((b) => b.addEventListener('click', () => {
    const li = b.parentElement, open = !li.classList.contains('is-open');
    li.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open);
    setTimeout(refresh, 600);
  }));

  // work lightbox
  const lb = $('.lightbox');
  if (lb) {
    const im = $('.lightbox-stage img', lb), cap = $('.lightbox-cap', lb), n = $('.lightbox-n', lb);
    let list = [], idx = 0, opener = null;
    const show = (i) => {
      idx = (i + list.length) % list.length;
      const t = list[idx], src = $('img', t);
      im.classList.remove('is-in');
      setTimeout(() => {
        im.src = src.currentSrc || src.src; im.alt = src.alt;
        im.width = src.naturalWidth || src.width; im.height = src.naturalHeight || src.height;
        cap.innerHTML = ''; cap.append(t.dataset.title); const s = document.createElement('span'); s.textContent = t.dataset.sub; cap.append(s);
        n.textContent = `${idx + 1} / ${list.length}`;
        requestAnimationFrame(() => im.classList.add('is-in'));
      }, 160);
    };
    const open = (t) => { list = $$('.tile:not([hidden])'); opener = t; lb.hidden = false; requestAnimationFrame(() => lb.classList.add('is-open')); lockScroll(true); show(list.indexOf(t)); $('[data-lb="close"]', lb).focus(); };
    const close = () => { lb.classList.remove('is-open'); lockScroll(false); setTimeout(() => { lb.hidden = true; }, 400); opener && opener.focus(); };
    $$('.tile').forEach((t) => t.addEventListener('click', () => open(t)));
    lb.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lb]');
      if (b) ({ close, prev: () => show(idx - 1), next: () => show(idx + 1) })[b.dataset.lb]();
      else if (e.target === lb || e.target.classList.contains('lightbox-stage')) close();
    });
    addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = $$('button', lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // contact brief -> WhatsApp
  const brief = $('#brief');
  if (brief) {
    const preview = $('#b-preview'), err = $('#b-err');
    const val = (n) => brief.elements[n].value.trim();
    const picks = () => $$('[data-pick][aria-pressed="true"]', brief).map((b) => b.textContent);
    const compose = () => {
      const lines = ['Habari 360 Graphics!'];
      const p = picks();
      if (p.length) lines.push('I need: ' + p.join(', '));
      if (val('name')) lines.push('Name: ' + val('name'));
      if (val('biz')) lines.push('Business or event: ' + val('biz'));
      if (val('more')) lines.push('Details: ' + val('more'));
      if (val('when')) lines.push('Needed by: ' + val('when'));
      return lines.join('\n');
    };
    const update = () => { preview.textContent = compose(); if (picks().length || val('more')) err.hidden = true; };
    brief.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); update(); } });
    brief.addEventListener('input', update);
    brief.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!picks().length && !val('more')) { err.hidden = false; return; }
      window.open('https://wa.me/255689417045?text=' + encodeURIComponent(compose()), '_blank', 'noopener');
    });
    update();
  }

  if (!motion) { html.classList.add('no-anim'); window.__siteReady = true; return; }

  /* =============== motion =============== */
  gsap.registerPlugin(ScrollTrigger);
  window.__siteReady = true;

  // smooth scrolling on desktop
  if (fine && window.Lenis) {
    lenis = new Lenis({ duration: 1.05 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // split headings into masked words
  const split = (el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span class="wi">${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></span>`).join(' ');
    el.classList.add('is-split');
    const wi = $$('.wi', el);
    gsap.set(wi, { yPercent: 118 });
    return wi;
  };

  /* ---- page transition + first-visit loader ---- */
  const iris = $('.iris');
  const logoPoint = () => { const r = $('.brand img').getBoundingClientRect(); return `${r.left + r.width / 2}px ${r.top + r.height / 2}px`; };
  const enter = () => {
    const first = body.dataset.page === 'home' && !sessionStorage.getItem('g360');
    try { sessionStorage.setItem('g360', '1'); } catch (_) {}
    const at = logoPoint();
    const tl = gsap.timeline({ onComplete: () => { iris.style.visibility = 'hidden'; iris.classList.remove('is-loader'); } });
    if (first) {
      iris.classList.add('is-loader');
      const c = { v: 0 }, num = $('.iris-count b');
      tl.to(c, { v: 360, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(c.v); } })
        .to('.iris-count', { scale: .85, opacity: 0, duration: .3, ease: 'power2.in' }, '+=.15');
    }
    tl.add(pageIn, first ? '-=.05' : .1)
      .fromTo(iris, { clipPath: `circle(150% at ${at})` }, { clipPath: `circle(0% at ${at})`, duration: .95, ease: 'power3.inOut' }, '<');
  };
  const leave = (href, x, y) => {
    iris.classList.remove('is-loader'); iris.style.visibility = 'visible';
    const at = `${x}px ${y}px`;
    gsap.fromTo(iris, { clipPath: `circle(0% at ${at})` }, { clipPath: `circle(150% at ${at})`, duration: .65, ease: 'power3.in', onComplete: () => { location.href = href; } });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (!/^(https?|file):$/.test(url.protocol) || url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) { // same page
      if (url.hash) { const t = $(url.hash); if (t) { e.preventDefault(); lenis ? lenis.scrollTo(t) : t.scrollIntoView({ behavior: 'smooth' }); } }
      else { e.preventDefault(); if (html.classList.contains('menu-open')) setMenu(false); lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: 'smooth' }); }
      return;
    }
    e.preventDefault();
    leave(url.href, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) { gsap.killTweensOf(iris); iris.style.visibility = 'hidden'; } });

  /* ---- cursor follower ---- */
  if (fine) {
    html.classList.add('has-cursor');
    const cur = $('.cursor');
    const qx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    gsap.set(cur, { x: innerWidth / 2, y: innerHeight / 2 });
    addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]'), link = e.target.closest('a, button');
      cur.classList.toggle('is-label', !!lab); cur.classList.toggle('is-link', !lab && !!link);
      cur.textContent = lab ? lab.dataset.cursor : '';
    });
    // magnetic buttons
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .35, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: 'power3' }); });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.4)' }));
    });
    // service preview image that follows the pointer
    const peek = $('.peek');
    if (peek) {
      const px = gsap.quickTo(peek, 'x', { duration: .5, ease: 'power3' }), py = gsap.quickTo(peek, 'y', { duration: .5, ease: 'power3' });
      const pim = $('img', peek);
      $$('.svc-group').forEach((g) => {
        const ul = $('ul', g);
        ul.addEventListener('pointerenter', () => { const s = `img/work/${g.dataset.img}.webp`; if (!pim.src.endsWith(s)) pim.src = s; peek.classList.add('is-on'); });
        ul.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
        ul.addEventListener('pointermove', (e) => { px(Math.min(e.clientX + 36, innerWidth - 250)); py(Math.min(Math.max(e.clientY - 150, 90), innerHeight - 300)); });
      });
    }
  }

  /* ---- marquees: drift, and speed up with scroll ---- */
  let vel = 0, prevY = scrollY;
  $$('.marquee-row').forEach((row) => {
    const base = row.innerHTML; let guard = 0;
    while (row.scrollWidth < innerWidth * 1.5 && guard++ < 6) row.innerHTML += base;
    row.innerHTML += row.innerHTML;
    const dir = +row.dataset.dir || -1; let x = 0, half = 0;
    const measure = () => { half = row.scrollWidth / 2; };
    measure(); addEventListener('load', measure); addEventListener('resize', measure);
    $$('img', row).forEach((i) => i.addEventListener('load', measure));
    gsap.ticker.add((t, dt) => {
      if (!half) return;
      x += dir * dt * (.045 + Math.min(Math.abs(vel), 60) * .012);
      if (x <= -half) x += half; if (x > 0) x -= half;
      row.style.transform = `translate3d(${x}px,0,0)`;
    });
  });
  gsap.ticker.add(() => { const y = scrollY; vel += ((y - prevY) - vel) * .12; prevY = y; });

  /* ---- home: the 360° dial ---- */
  const dial = $('.dial');
  if (dial) {
    const arc = $('.dial-arc', dial), dot = $('.dial-dot', dial), num = $('.dial-deg b', dial), word = $('.dial-word', dial), spin = $('.dial-spin', dial);
    const words = JSON.parse(dial.dataset.words), R = 212, C = 2 * Math.PI * R;
    arc.style.strokeDasharray = C;
    if (!fine) $('.dial-hint', dial).textContent = 'Drag around the ring';
    let cur = 0, target = 50, auto = true, lastMove = 0, lastI = -1, rot = 0, dragging = false;
    const aim = (e) => {
      const r = dial.getBoundingClientRect();
      let a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
      let d = a - target % 360; d = ((d + 540) % 360) - 180;
      target += d; auto = false; lastMove = performance.now();
    };
    $('.hero').addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || dragging) aim(e); });
    dial.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { dragging = true; aim(e); } });
    addEventListener('pointerup', () => { dragging = false; });
    addEventListener('pointercancel', () => { dragging = false; });
    gsap.ticker.add((t, dt) => {
      if (!auto && !dragging && performance.now() - lastMove > 2200) auto = true;
      if (auto) target += dt * .022;
      cur += (target - cur) * Math.min(1, dt * .009);
      const a = ((cur % 360) + 360) % 360, rad = (a - 90) * Math.PI / 180;
      arc.style.strokeDashoffset = C * (1 - a / 360);
      dot.setAttribute('cx', 300 + R * Math.cos(rad)); dot.setAttribute('cy', 300 + R * Math.sin(rad));
      num.textContent = Math.round(a) % 360;
      const i = Math.floor(a / (360 / words.length)) % words.length;
      if (i !== lastI) { lastI = i; word.textContent = words[i]; gsap.fromTo(word, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out', overwrite: true }); }
      rot -= dt * .004;
      spin.setAttribute('transform', `rotate(${rot + scrollY * .06} 300 300)`);
    });
    gsap.to('.hero h1', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(dial, { scale: .86, yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---- home: horizontal services track (pins first, so later triggers measure correctly) ---- */
  const track = $('.hs-track');
  if (track) {
    gsap.matchMedia().add('(min-width: 900px)', () => {
      const hs = $('.hs'), dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: hs, start: 'center center', end: () => '+=' + dist(), pin: true, scrub: .7, invalidateOnRefresh: true, anticipatePin: 1 } });
      $$('.hs-panel figure', track).forEach((f) => gsap.fromTo(f, { rotate: 16, xPercent: 18 }, { rotate: 3, xPercent: -8, ease: 'none', scrollTrigger: { trigger: f.parentElement, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } }));
    });
  }

  /* ---- home: process dial ---- */
  const steps = $$('.proc-step');
  if (steps.length) {
    const pa = $('.proc-arc'), pd = $('.proc-dot'), pn = $('.proc-dial .n span'), PC = 2 * Math.PI * 170, st = { a: 90 };
    const draw = () => { const rad = (st.a - 90) * Math.PI / 180; pa.style.strokeDasharray = PC; pa.style.strokeDashoffset = PC * (1 - st.a / 360); pd.setAttribute('cx', 200 + 170 * Math.cos(rad)); pd.setAttribute('cy', 200 + 170 * Math.sin(rad)); };
    draw();
    const go = (i) => {
      steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
      gsap.to(st, { a: (i + 1) * 90 - (i === 3 ? .5 : 0), duration: .9, ease: 'power3.inOut', onUpdate: draw, overwrite: true });
      if (pn.textContent !== String(i + 1)) gsap.to(pn, { yPercent: -30, opacity: 0, duration: .2, onComplete: () => { pn.textContent = i + 1; gsap.fromTo(pn, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .35, ease: 'power3.out' }); } });
    };
    steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 58%', end: 'bottom 58%', onToggle: (self) => self.isActive && go(i) }));
  }

  /* ---- section colour themes ---- */
  $$('main [data-theme], footer[data-theme]').forEach((sec) => ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) body.dataset.theme = sec.dataset.theme; },
  }));

  /* ---- scroll reveals ---- */
  const firstScreen = (el) => el.getBoundingClientRect().top < innerHeight * .95;
  const heads = $$('[data-split]').map((el) => ({ el, wi: split(el) }));
  const showHead = (h, delay = 0) => gsap.to(h.wi, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: .05, delay });
  const reveals = $$('[data-reveal]');
  const showReveal = (els, delay = 0) => gsap.fromTo(els, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .08, delay, overwrite: true });
  const tiles = $$('.tile');
  if (tiles.length) gsap.set(tiles, { opacity: 0, y: 40 });

  function pageIn() { // runs as the transition opens
    heads.filter((h) => firstScreen(h.el)).forEach((h) => { h.done = true; showHead(h, .25); });
    const now = reveals.filter(firstScreen); now.forEach((el) => { el._done = true; });
    if (now.length) showReveal(now, .55);
    if (dial) gsap.from(dial, { scale: .6, rotate: -40, opacity: 0, duration: 1.4, ease: 'power3.out', delay: .2 });
    heads.filter((h) => !h.done).forEach((h) => ScrollTrigger.create({ trigger: h.el, start: 'top 88%', once: true, onEnter: () => showHead(h) }));
    ScrollTrigger.batch(reveals.filter((el) => !el._done), { start: 'top 90%', once: true, onEnter: (b) => showReveal(b) });
    if (tiles.length) ScrollTrigger.batch(tiles, { start: 'top 96%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .07 }) });
    $$('[data-clip]').forEach((el) => {
      const im = $('img', el);
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        .fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' })
        .fromTo(im, { scale: 1.3 }, { scale: 1, duration: 1.5, ease: 'power3.out', clearProps: 'transform' }, 0);
    });
    $$('[data-speed]').forEach((el) => {
      if (innerWidth < 700) return;
      const sp = +el.dataset.speed;
      gsap.fromTo(el, { y: 60 * sp }, { y: -60 * sp, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-count]').forEach((el) => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '', plain = el.dataset.plain, o = { v: plain ? end - 60 : 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => { const v = Math.round(o.v); el.textContent = (plain ? v : v.toLocaleString('en-US')) + suf; } }) });
    });
    ScrollTrigger.refresh();
  }

  addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  enter();
})();
