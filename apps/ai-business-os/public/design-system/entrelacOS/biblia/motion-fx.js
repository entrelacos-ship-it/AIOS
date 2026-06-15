/* =================================================================
   biblia/motion-fx.js — Motor da biblioteca Motion Effects
   Tabs (HTML/CSS/JS), copy-to-clipboard, observers para reveals,
   counter animado, magnetic, tilt, ripple, splittext, marquee pause.
   ================================================================= */
(function () {
  'use strict';

  // --- Tabs (HTML/CSS/JS) ----------------------------------------
  document.querySelectorAll('.fx-tabs').forEach(tabs => {
    const card = tabs.closest('.fx-card');
    tabs.querySelectorAll('.fx-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        tabs.querySelectorAll('.fx-tab').forEach(b => b.classList.toggle('is-active', b === btn));
        card.querySelectorAll('.fx-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
      });
    });
  });

  // --- Copy to clipboard ------------------------------------------
  document.querySelectorAll('.fx-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.fx-panel');
      const code = panel.querySelector('pre').innerText;
      navigator.clipboard.writeText(code).then(() => {
        btn.classList.add('copied');
        const original = btn.textContent;
        btn.textContent = 'Copiado ✓';
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = original; }, 1400);
      });
    });
  });

  // --- 01 Reveal on scroll ----------------------------------------
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  // --- 02 Stagger -------------------------------------------------
  document.querySelectorAll('[data-stagger]').forEach(group => {
    const children = group.querySelectorAll('[data-stagger-item]');
    const step = parseInt(group.dataset.stagger || '90', 10);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          children.forEach((c, i) => setTimeout(() => c.classList.add('is-revealed'), i * step));
          io.unobserve(group);
        }
      });
    }, { threshold: 0.18 });
    io.observe(group);
  });

  // --- 03 Counter -------------------------------------------------
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const animateCount = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      const duration = parseInt(el.dataset.dur || '1800', 10);
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const v = target * easeOut(t);
        el.textContent = v.toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  }

  // --- 06 Magnetic button -----------------------------------------
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    const strength = parseFloat(btn.dataset.magnetic) || 0.35;
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
  });

  // --- 07 Cursor spotlight ----------------------------------------
  document.querySelectorAll('[data-spotlight]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  // --- 11 Tilt 3D -------------------------------------------------
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const max = parseFloat(card.dataset.tilt) || 8;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(0)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = 'perspective(900px) rotateY(0) rotateX(0)'; });
  });

  // --- 12 Ripple --------------------------------------------------
  document.querySelectorAll('[data-ripple]').forEach(btn => {
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'fx-ripple-wave';
      const size = Math.max(r.width, r.height) * 2;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  // --- 13 Split text reveal ---------------------------------------
  document.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'fx-split-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.transitionDelay = (i * 25) + 'ms';
      el.appendChild(span);
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    io.observe(el);
  });

  // --- 15 Scroll progress (page-wide; opt-in element) -------------
  const progressBar = document.querySelector('[data-scroll-progress]');
  if (progressBar) {
    const update = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      progressBar.style.transform = `scaleX(${scrolled})`;
    };
    document.addEventListener('scroll', update, { passive: true });
    update();
  }

  // --- 16 Parallax simples ----------------------------------------
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    const update = () => {
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const r = el.getBoundingClientRect();
        const mid = window.innerHeight / 2;
        const offset = (r.top + r.height / 2 - mid) * -speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    };
    document.addEventListener('scroll', update, { passive: true });
    update();
  }
})();
