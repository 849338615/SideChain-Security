/* =============================================
   SIDECHAIN SECURITY — Landing Page Interactivity
   Scroll reveals, nav, form handling
   ============================================= */

(function () {
  'use strict';

  // ─── GSAP SCROLL PHYSICS & REVEALS ──────────────────
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Generic Section Reveals
    document.querySelectorAll('.reveal').forEach((el) => {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%", // Trigger when top of element hits 85% of viewport height
            toggleActions: "play none none none"
          }
        }
      );
    });

    // 1.5. Stat Bars animated fill & counter
    document.querySelectorAll('.stat-bar-group').forEach((group) => {
      const fill = group.querySelector('.stat-bar-fill');
      const valEl = group.querySelector('.stat-bar-value');
      if (!fill || !valEl) return;
      
      const targetVal = parseInt(valEl.getAttribute('data-target'), 10) || 0;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: group,
          start: "top 90%",
          toggleActions: "play none none none"
        }
      });

      // Animate the bar via transform (compositor-only; no layout reflow).
      tl.fromTo(fill,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.6, ease: "power3.out" },
        0
      );
      
      // Animate the number counter
      valEl.counter = 0;
      tl.fromTo(valEl, 
        { counter: 0 },
        { 
          counter: targetVal,
          duration: 1.6, 
          ease: "power3.out",
          onUpdate: () => {
            valEl.textContent = Math.round(valEl.counter) + "%";
          }
        },
        0
      );
      
      group.statTimeline = tl;
    });

    // 2. High-end Staggered Reveals for Products Grid
    const grids = document.querySelectorAll('.products-grid, .compliance-grid, .about-differentiators');
    grids.forEach(grid => {
      const cards = grid.children;
      gsap.fromTo(cards, 
        { autoAlpha: 0, y: 50, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.4)", // Slight spring-pop effect
          stagger: 0.12,
          scrollTrigger: {
            trigger: grid,
            start: "top 85%",
          }
        }
      );
    });

    // 3. Hero Headline Interactive Spotlight & Parallax
    // Tilt + spotlight depend on a real mouse cursor and meaningful pointer
    // precision — gate behind hover/fine-pointer and reduced-motion so the
    // listeners never attach on phones (where they'd waste cycles for an
    // effect touch users can't perceive).
    const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches
                 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heroSection = document.querySelector('.hero');
    const heroHeadline = document.querySelector('.hero h1');
    if (heroSection && heroHeadline && canTilt) {
      // Cache bounding rects; invalidate on scroll/resize to avoid forced
      // reflow on every mousemove tick.
      let heroRect = heroSection.getBoundingClientRect();
      let textRect = heroHeadline.getBoundingClientRect();
      const refreshRects = () => {
        heroRect = heroSection.getBoundingClientRect();
        textRect = heroHeadline.getBoundingClientRect();
      };
      window.addEventListener('scroll', refreshRects, { passive: true });
      window.addEventListener('resize', refreshRects);

      heroSection.addEventListener('mousemove', (e) => {
        const xPercent = (e.clientX - heroRect.left) / heroRect.width;
        const yPercent = (e.clientY - heroRect.top) / heroRect.height;

        // Calculate slight 3D tilt amount (centered at 0.5)
        const tiltX = (yPercent - 0.5) * -12;
        const tiltY = (xPercent - 0.5) * 16;

        gsap.to(heroHeadline, {
          rotationX: tiltX,
          rotationY: tiltY,
          x: (xPercent - 0.5) * -15,
          transformPerspective: 900,
          ease: "power2.out",
          duration: 0.6
        });

        const textX = e.clientX - textRect.left;
        const textY = e.clientY - textRect.top;

        gsap.to(heroHeadline, {
          '--mouse-x': `${textX}px`,
          '--mouse-y': `${textY}px`,
          duration: 0.1
        });
      });

      heroSection.addEventListener('mouseleave', () => {
        gsap.to(heroHeadline, {
          rotationX: 0,
          rotationY: 0,
          x: 0,
          ease: "power3.out",
          duration: 1.2
        });
        // Neutralize gradient
        gsap.to(heroHeadline, {
          '--mouse-x': `50%`,
          '--mouse-y': `50%`,
          duration: 1.2
        });
      });
    }
    // ── Gradient Beam riding horizontal + vertical divider lines ──
    var caseRowsContainer = document.querySelector('.case-rows');
    var caseRows = document.querySelectorAll('.case-row');
    if (caseRowsContainer && caseRows.length) {
      caseRowsContainer.style.position = 'relative';

      function buildBeamPath() {
        var W = caseRowsContainer.offsetWidth;
        var points = [];

        // Detect single-column layout. The CSS collapses the case-row grid to
        // 1fr at ≤1024px, so .case-content fills the full width and the
        // desktop "vertical divider in the middle" doesn't exist. Produce a
        // proper edge-to-edge zigzag along the actual horizontal dividers
        // instead of the desktop snake (which collapses to right-edge only).
        var stacked = window.matchMedia('(max-width: 1024px)').matches;

        if (stacked) {
          // Inset the beam OUTSIDE the .case-rows box on both edges so it
          // sits in the parent container's padding gutter rather than flush
          // against the text. .beam-svg has overflow: visible so negative-x
          // and >W coordinates render past the SVG bounds into the gutter.
          var OFFSET = 16;
          var leftX = -OFFSET;
          var rightX = W + OFFSET;

          // Collect every visible horizontal divider:
          //   1) top of row 0
          //   2) for each row: bottom of .case-content (mid-row divider
          //      between description and metrics)
          //   3) for each row: bottom of the row (between-row divider)
          var hYs = [caseRows[0].offsetTop];
          for (var s = 0; s < caseRows.length; s++) {
            var rowS = caseRows[s];
            var contentS = rowS.querySelector('.case-content');
            if (contentS) {
              // .case-content's offsetParent is .case-row (because the row
              // has position:relative). Add the row's offsetTop to get the
              // content-bottom Y in the case-rows coordinate system —
              // otherwise every row's content-bottom resolves to the same
              // small Y value and the beam jumps backward upward.
              hYs.push(rowS.offsetTop + contentS.offsetTop + contentS.offsetHeight);
            }
            hYs.push(rowS.offsetTop + rowS.offsetHeight);
          }

          points.push({ x: leftX, y: hYs[0] });
          points.push({ x: rightX, y: hYs[0] });
          var atRight = true;
          for (var h = 1; h < hYs.length; h++) {
            var y = hYs[h];
            if (atRight) {
              points.push({ x: rightX, y: y }); // down right edge
              points.push({ x: leftX, y: y });  // sweep left across divider
            } else {
              points.push({ x: leftX, y: y });  // down left edge
              points.push({ x: rightX, y: y }); // sweep right across divider
            }
            atRight = !atRight;
          }
        } else {
          for (var i = 0; i < caseRows.length; i++) {
            var row = caseRows[i];
            // Use offset-based positions (relative to offsetParent = case-rows)
            var topY = row.offsetTop;
            var bottomY = row.offsetTop + row.offsetHeight;

            // Vertical divider = border-right on .case-content
            var content = row.querySelector('.case-content');
            var divX = content.offsetLeft + content.offsetWidth;

            var goingRight = (i % 2 === 0);

            if (goingRight) {
              if (i === 0) {
                points.push({ x: 0, y: topY });
              }
              points.push({ x: divX, y: topY });
              points.push({ x: divX, y: bottomY });
              points.push({ x: W, y: bottomY });
            } else {
              points.push({ x: W, y: topY });
              points.push({ x: divX, y: topY });
              points.push({ x: divX, y: bottomY });
              if (i === caseRows.length - 1) {
                points.push({ x: 0, y: bottomY });
              }
            }
          }
        }

        // Remove duplicate points at row boundaries
        var clean = [points[0]];
        for (var j = 1; j < points.length; j++) {
          var prev = clean[clean.length - 1];
          if (Math.abs(points[j].x - prev.x) > 1 || Math.abs(points[j].y - prev.y) > 1) {
            clean.push(points[j]);
          }
        }

        var d = 'M ' + clean[0].x + ' ' + clean[0].y;
        for (var k = 1; k < clean.length; k++) {
          d += ' L ' + clean[k].x + ' ' + clean[k].y;
        }
        return d;
      }

      // Create SVG
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'beam-svg');

      // Gradient
      var defs = document.createElementNS(svgNS, 'defs');
      var grad = document.createElementNS(svgNS, 'linearGradient');
      grad.setAttribute('id', 'beamGradient');
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
      var stop1 = document.createElementNS(svgNS, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#4a7cff');
      var stop2 = document.createElementNS(svgNS, 'stop');
      stop2.setAttribute('offset', '50%');
      stop2.setAttribute('stop-color', '#2dd4bf');
      var stop3 = document.createElementNS(svgNS, 'stop');
      stop3.setAttribute('offset', '100%');
      stop3.setAttribute('stop-color', '#4a7cff');
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      grad.appendChild(stop3);
      defs.appendChild(grad);
      svg.appendChild(defs);

      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('class', 'beam-path');
      svg.appendChild(path);
      caseRowsContainer.appendChild(svg);

      function initBeam() {
        var W = caseRowsContainer.offsetWidth;
        var H = caseRowsContainer.offsetHeight;
        svg.setAttribute('width', W);
        svg.setAttribute('height', H);
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

        var d = buildBeamPath();
        path.setAttribute('d', d);

        var totalLength = path.getTotalLength();
        var beamLength = 300;

        path.style.strokeDasharray = beamLength + ' ' + (totalLength + beamLength);
        path.style.strokeDashoffset = beamLength;

        gsap.killTweensOf(path);

        // Scale duration to path length so beam pixel-speed stays consistent
        // between desktop and mobile (mobile path is longer due to extra
        // within-row dividers). Desktop floor stays at 6s; mobile lands
        // around 11s for a calm, deliberate pace.
        var SPEED = 600; // px/sec
        var duration = Math.max(6, totalLength / SPEED);

        gsap.timeline({
          scrollTrigger: { trigger: caseRowsContainer, start: 'top 80%' },
          repeat: -1,
          repeatDelay: 3,
          delay: 0.8
        }).fromTo(path,
          { strokeDashoffset: beamLength },
          { strokeDashoffset: -(totalLength + beamLength), duration: duration, ease: 'none' }
        );
      }

      // Wait for layout to fully settle before measuring
      setTimeout(initBeam, 100);

      // iOS Safari fires `resize` repeatedly while the URL bar collapses/
      // expands during scroll, even though the layout width doesn't change.
      // Re-running initBeam on each one kills the GSAP tween and makes the
      // beam disappear mid-scroll. Only re-init when the container width
      // actually changes (orientation flip, breakpoint crossing, true reflow).
      var resizeTimer;
      var lastBeamW = caseRowsContainer.offsetWidth;
      window.addEventListener('resize', function() {
        var newW = caseRowsContainer.offsetWidth;
        if (newW === lastBeamW) return;
        lastBeamW = newW;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initBeam, 200);
      });
    }

    // 4. The Challenge — Security Operations Monitor (layered visualizer)
    const challengeSection = document.querySelector('.challenge-pin-wrapper');
    if (challengeSection) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const cards          = gsap.utils.toArray('.signal-card');
      const pips           = gsap.utils.toArray('.signal-pip');
      const threatGlass    = document.querySelector('#threat-glass');
      const statusText     = document.querySelector('#status-text');
      const scanTimerEl    = document.querySelector('#scan-timer');
      const threatBarsEl   = document.querySelector('#threat-bars');
      const threatPctEl    = document.querySelector('#threat-pct');
      const pulseWaveEl    = document.querySelector('.lock-pulse-wave');
      const lockWrapEl     = document.querySelector('.lock-wrap');
      const lockShackleEl  = document.querySelector('#lock-shackle');
      const lockShackleHaloEl = document.querySelector('#lock-shackle-halo');
      const particlesGroup = document.querySelector('#threat-particles-group');
      const bezelTicksEl   = document.querySelector('#threat-bezel-ticks');

      const INTERVAL = 4800;
      let currentIndex    = -1;
      let autoTimer       = null;
      let typeTimer       = null;
      let scanTimerIv     = null;
      let pctTween        = null;
      let paused          = false;

      // Open = shackle raised 1px above the body (visible gap, reads as unlocked)
      // Closed = shackle seated flush into the body (reads as engaged)
      const SHACKLE_OPEN   = 'M8 10V6a4 4 0 0 1 8 0v4';
      const SHACKLE_CLOSED = 'M8 11V7a4 4 0 0 1 8 0v4';

      const cardStates = [
        { stateClass: 'state-breach', status: 'THREAT ANALYSIS',       threatLevel: 0.78, jitter: true,  pulse: false },
        { stateClass: 'state-risk',   status: 'COMPLIANCE BREACH RISK', threatLevel: 0.58, jitter: false, pulse: false },
        { stateClass: 'state-secure', status: 'SECURE & COMPLIANT',     threatLevel: 0,    jitter: false, pulse: true  }
      ];

      // ── Build 60 bezel ticks (major at cardinals) ──
      function buildBezelTicks() {
        if (!bezelTicksEl) return;
        const ns = 'http://www.w3.org/2000/svg';
        const cx = 200, cy = 200;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < 60; i++) {
          const deg = i * 6;
          const rad = (deg - 90) * Math.PI / 180;
          const major = (i % 15 === 0);
          const a = major ? 176 : 180;
          const b = major ? 192 : 188;
          const line = document.createElementNS(ns, 'line');
          line.setAttribute('x1', (cx + Math.cos(rad) * a).toFixed(2));
          line.setAttribute('y1', (cy + Math.sin(rad) * a).toFixed(2));
          line.setAttribute('x2', (cx + Math.cos(rad) * b).toFixed(2));
          line.setAttribute('y2', (cy + Math.sin(rad) * b).toFixed(2));
          if (major) line.setAttribute('class', 'major');
          frag.appendChild(line);
        }
        bezelTicksEl.appendChild(frag);
      }

      // ── Build ambient particles (deterministic so layout is stable) ──
      function buildParticles() {
        if (!particlesGroup) return;
        const ns = 'http://www.w3.org/2000/svg';
        const positions = [
          [ 86, 120, 1.2], [142,  70, 1.7], [220,  85, 1.0], [310,  95, 1.4],
          [345, 150, 1.1], [320, 260, 1.6], [360, 210, 1.0], [270, 320, 1.3],
          [160, 340, 1.5], [ 90, 295, 1.0], [ 55, 220, 1.3], [ 75, 170, 1.0],
          [115, 240, 1.6], [135, 180, 1.0], [255, 140, 1.2], [290, 200, 1.4],
          [235, 250, 1.0], [175, 120, 1.3], [195, 280, 1.0], [265,  75, 1.1],
          [310, 170, 1.0], [115,  90, 1.2]
        ];
        const frag = document.createDocumentFragment();
        positions.forEach(([cx, cy, r], i) => {
          const c = document.createElementNS(ns, 'circle');
          c.setAttribute('cx', cx);
          c.setAttribute('cy', cy);
          c.setAttribute('r', r);
          const dx   = ((i * 37) % 13) - 6;
          const dy   = ((i * 53) % 11) - 5;
          const dur  = (5 + (i % 7) * 0.8).toFixed(2);
          const del  = ((i % 5) * 0.4).toFixed(2);
          const pmin = (0.12 + (i % 4) * 0.05).toFixed(2);
          const pmax = (0.45 + (i % 3) * 0.1).toFixed(2);
          c.setAttribute('style',
            `--dx:${dx}px;--dy:${dy}px;--pdur:${dur}s;--pdelay:${del}s;--pmin:${pmin};--pmax:${pmax}`);
          frag.appendChild(c);
        });
        particlesGroup.appendChild(frag);
      }

      // ── Type-on for status text ──
      function typeOn(el, text) {
        clearInterval(typeTimer);
        if (prefersReducedMotion) { el.textContent = text; return; }
        el.textContent = '';
        let i = 0;
        typeTimer = setInterval(() => {
          i++;
          el.textContent = text.slice(0, i);
          if (i >= text.length) clearInterval(typeTimer);
        }, 32);
      }

      // ── Threat-level bars + percent counter ──
      function setThreatLevel(level) {
        if (threatBarsEl) {
          const bars = threatBarsEl.querySelectorAll('span');
          const filled = Math.round(level * bars.length);
          bars.forEach((b, i) => b.classList.toggle('filled', i < filled));
        }
        if (!threatPctEl) return;
        if (pctTween) pctTween.kill();
        const obj = { v: parseFloat(threatPctEl.textContent) || 0 };
        const target = Math.round(level * 100);
        if (prefersReducedMotion) {
          threatPctEl.textContent = target + '%';
        } else {
          pctTween = gsap.to(obj, {
            v: target,
            duration: 0.7,
            ease: 'power2.out',
            onUpdate: () => { threatPctEl.textContent = Math.round(obj.v) + '%'; }
          });
        }
      }

      // ── Shackle morph — updates main shackle + halo path together so the
      //    thickened glow shadow stays aligned during the transition ──
      function setShackle(closed) {
        const d = closed ? SHACKLE_CLOSED : SHACKLE_OPEN;
        if (lockShackleEl)     lockShackleEl.setAttribute('d', d);
        if (lockShackleHaloEl) lockShackleHaloEl.setAttribute('d', d);
      }

      // ── Scan timer (elapsed since init, HH:MM:SS) ──
      function startScanTimer() {
        clearInterval(scanTimerIv);
        if (!scanTimerEl) return;
        const start = Date.now();
        const pad = n => String(n).padStart(2, '0');
        const tick = () => {
          const s = Math.floor((Date.now() - start) / 1000);
          scanTimerEl.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
        };
        tick();
        scanTimerIv = setInterval(tick, 1000);
      }

      // ── Replay a one-shot CSS animation by toggling a class ──
      function replayClass(el, className, duration) {
        if (!el || prefersReducedMotion) return;
        el.classList.remove(className);
        void el.offsetWidth; // force reflow
        el.classList.add(className);
        if (duration) {
          clearTimeout(el['__replayT_' + className]);
          el['__replayT_' + className] = setTimeout(() => {
            el.classList.remove(className);
          }, duration);
        }
      }

      // ── Stagger ring color transitions for craft ──
      function staggerRings() {
        if (prefersReducedMotion) return;
        const rings = gsap.utils.toArray('.orbit ellipse');
        rings.forEach((ring, i) => {
          ring.style.transitionDelay = `${i * 60}ms`;
          setTimeout(() => { ring.style.transitionDelay = ''; }, 900 + i * 60);
        });
      }

      // ── Activate a state (choreographed) ──
      function activateCard(index) {
        if (index === currentIndex) return;
        const state = cardStates[index];

        cards.forEach((card, i) => {
          card.classList.toggle('active', i === index);
          card.style.setProperty('--card-accent', card.getAttribute('data-accent'));
        });
        pips.forEach((pip, i) => pip.classList.toggle('active', i === index));

        threatGlass.classList.remove('state-breach', 'state-risk', 'state-secure');
        threatGlass.classList.add(state.stateClass);

        staggerRings();
        setShackle(state.stateClass === 'state-secure');
        typeOn(statusText, state.status);
        setThreatLevel(state.threatLevel);

        if (state.jitter) replayClass(lockWrapEl, 'jitter', 480);
        if (state.pulse)  {
          replayClass(pulseWaveEl, 'pulse', 960);
          replayClass(threatGlass, 'bezel-flash', 700);
        }

        // New threat cycle → restart the scan timer from 00:00:00
        if (state.stateClass === 'state-breach') startScanTimer();

        currentIndex = index;
      }

      function nextCard() { activateCard((currentIndex + 1) % cardStates.length); }
      function startAuto()  { clearInterval(autoTimer); autoTimer = setInterval(nextCard, INTERVAL); }
      function stopAuto()   { clearInterval(autoTimer); autoTimer = null; }

      pips.forEach((pip, i) => {
        pip.addEventListener('click', () => { activateCard(i); startAuto(); });
      });

      // ── Pause when off-screen or tab hidden — saves main-thread + compositor work ──
      function pause() {
        if (paused) return;
        paused = true;
        stopAuto();
        clearInterval(typeTimer);
        clearInterval(scanTimerIv);
        threatGlass.classList.add('is-paused');
      }
      function resume() {
        if (!paused) return;
        paused = false;
        threatGlass.classList.remove('is-paused');
        startAuto();
        startScanTimer();
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { entry.isIntersecting ? resume() : pause(); });
      }, { rootMargin: '200px' });
      observer.observe(challengeSection);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          pause();
        } else {
          const rect = challengeSection.getBoundingClientRect();
          const inView = rect.top < window.innerHeight + 200 && rect.bottom > -200;
          if (inView) resume();
        }
      });

      // ── Init ──
      buildBezelTicks();
      buildParticles();
      cards.forEach(card => card.style.setProperty('--card-accent', card.getAttribute('data-accent')));
      activateCard(0);
      startAuto();
    }

  } else {
    // Fallback if GSAP fails to load
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  }


  // ─── NAV SCROLL STATE — Seamless Hero-to-Sticky Handoff ───
  const nav = document.getElementById('main-nav');
  const heroNavBar = document.getElementById('hero-nav-bar');
  const navStickyLinks = document.getElementById('nav-sticky-links');

  // Cache the hero-nav-bar's resting position (after page load + animations settle)
  let heroNavBarOffsetTop = 0;
  const recalcHeroNavPos = () => {
    if (heroNavBar) {
      const rect = heroNavBar.getBoundingClientRect();
      heroNavBarOffsetTop = rect.top + window.scrollY;
    }
  };
  
  let stickyLinksActive = false;

  const handleNavScroll = () => {
    const scrollY = window.scrollY;

    // Phase 2 logic: trigger when hero-nav-bar physically reaches the fixed nav position
    if (heroNavBar && navStickyLinks) {
      const heroNavBarHeight = heroNavBar.getBoundingClientRect().height || 50;
      // 32px is the approximate vertical center of the fixed sticky links from the top viewport
      const triggerPoint = heroNavBarOffsetTop + (heroNavBarHeight / 2) - 32;

      if (scrollY > triggerPoint && triggerPoint > 0) {
        // Hero nav bar has scrolled past → activate sticky global nav
        if (!stickyLinksActive) {
          stickyLinksActive = true;
          nav.classList.add('scrolled');
          nav.classList.remove('leaving');
          heroNavBar.classList.add('faded');
          navStickyLinks.classList.add('visible');
        }
      } else {
        // Hero nav bar is visible → deactivate sticky global nav
        if (stickyLinksActive) {
          stickyLinksActive = false;
          nav.classList.remove('scrolled');
          nav.classList.add('leaving');
          heroNavBar.classList.remove('faded');
          navStickyLinks.classList.remove('visible');
          
          // Remove the leaving class after animation concludes so the nav can naturally reset to the very top
          setTimeout(() => {
            if (!stickyLinksActive) {
              nav.classList.remove('leaving');
            }
          }, 400);
        }
      }
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  window.addEventListener('resize', () => {
    recalcHeroNavPos();
    handleNavScroll();
  });

  // Execute immediately so state is correct on reload without waiting for scroll
  recalcHeroNavPos();
  handleNavScroll();

  // Remove preload class after a tiny delay so initial position applies without transition
  setTimeout(() => {
    if (nav) nav.classList.remove('preload');
  }, 50);

  // Recalculate after initial layout/animations settle completely
  setTimeout(() => {
    recalcHeroNavPos();
    handleNavScroll();
  }, 1500);


  // ─── HAMBURGER MENU ─────────────────────────────────
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }


  // ─── SMOOTH SCROLL ──────────────────────────────────
  // Center the target section in the viewport when a nav link is clicked.
  // For sections taller than the viewport, scroll to the top with nav offset.
  // Destination is recomputed every animation frame so late layout shifts
  // (web-font swap, lazy-image decode) don't strand the scroll at a stale Y.
  const computeScrollTarget = (target) => {
    const navHeight = nav.getBoundingClientRect().height;
    const sectionRect = target.getBoundingClientRect();
    const sectionHeight = sectionRect.height;
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight - navHeight;

    let y;
    if (sectionHeight >= availableHeight) {
      y = window.scrollY + sectionRect.top - navHeight - 20;
    } else {
      const offset = (availableHeight - sectionHeight) / 2;
      y = window.scrollY + sectionRect.top - navHeight - offset;
    }
    const maxY = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    return Math.min(Math.max(0, y), maxY);
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const smoothScrollToTarget = (target) => {
    if (prefersReducedMotion) {
      window.scrollTo(0, computeScrollTarget(target));
      return;
    }

    const startY = window.scrollY;
    const startTime = performance.now();
    const duration = 700;
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    let cancelled = false;
    const cancel = () => { cancelled = true; };
    window.addEventListener('wheel', cancel, { passive: true, once: true });
    window.addEventListener('touchmove', cancel, { passive: true, once: true });
    window.addEventListener('keydown', cancel, { once: true });

    const cleanup = () => {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
      window.removeEventListener('keydown', cancel);
    };

    const step = (now) => {
      if (cancelled) { cleanup(); return; }
      const t = Math.min((now - startTime) / duration, 1);
      const destinationY = computeScrollTarget(target);
      const y = startY + (destinationY - startY) * easeInOutCubic(t);
      window.scrollTo(0, y);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        cleanup();
      }
    };

    requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      nav.classList.add('scrolled');
      smoothScrollToTarget(target);
    });
  });


  // ─── CONTACT FORM ───────────────────────────────────
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('contact-name');
      const company = document.getElementById('contact-company');
      const email = document.getElementById('contact-email');
      const message = document.getElementById('contact-message');
      let valid = true;

      [name, company, email, message].forEach((field) => {
        if (!field.value.trim()) {
          field.style.borderColor = 'rgba(255,80,80,0.5)';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.style.borderColor = 'rgba(255,80,80,0.5)';
        valid = false;
      }

      if (!valid) return;

      const submitBtn = document.getElementById('contact-submit');
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      setTimeout(() => {
        form.style.display = 'none';
        successMsg.style.display = 'block';
      }, 1200);
    });

    form.querySelectorAll('input, textarea').forEach((field) => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      });
    });
  }


  // ─── PRICING SPOTLIGHT — CURSOR-TRACKING BRAND GLOW ──────
  const pricingCards = document.querySelectorAll('.pricing-card');

  if (pricingCards.length) {
    pricingCards.forEach(function (card) {
      card.addEventListener('pointerenter', function () {
        card.style.setProperty('--spotlight-opacity', '1');
      });

      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--spotlight-opacity', '0');
      });

      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--spotlight-x', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--spotlight-y', (e.clientY - rect.top) + 'px');
      });
    });
  }


  // ─── ORBITAL TIMELINE — ROTATION & INTERACTION ─────
  const orbitalContainer = document.getElementById('orbital-container');
  const orbitalNodes = document.querySelectorAll('.orbital-node');

  if (orbitalContainer && orbitalNodes.length) {
    let rotationAngle = 0;
    let autoRotate = true;
    let activeNodeIdx = null;
    let rotationTimer = null;
    const TOTAL = orbitalNodes.length;
    // Mobile gets a tighter orbit + smaller nodes so the whole rosette fits
    // within narrow viewports. Matching CSS overrides shrink the rings,
    // core, and node icons to the same scale.
    const RADIUS_DESKTOP = 290;
    const RADIUS_MOBILE  = 150;
    const NODE_HALF_DESKTOP = 28; /* 56 / 2 */
    const NODE_HALF_MOBILE  = 24; /* 48 / 2 */
    const isMobileLayout = () => window.matchMedia('(max-width: 768px)').matches;

    function positionNodes() {
      const cx = orbitalContainer.offsetWidth / 2;
      const cy = orbitalContainer.offsetHeight / 2;
      const mobile = isMobileLayout();
      const RADIUS = mobile ? RADIUS_MOBILE : RADIUS_DESKTOP;
      const NODE_HALF = mobile ? NODE_HALF_MOBILE : NODE_HALF_DESKTOP;

      orbitalNodes.forEach((node, i) => {
        const angle = ((i / TOTAL) * 360 + rotationAngle) % 360;
        const radian = (angle * Math.PI) / 180;
        const x = RADIUS * Math.cos(radian);
        const y = RADIUS * Math.sin(radian);
        
        // 0 at bottom (sin=1), 1 at top (sin=-1)
        const verticalIntensity = (1 - Math.sin(radian)) / 2;
        
        const opacity = 0.7 + 0.3 * verticalIntensity;
        // The active node always has full opacity, otherwise use the calculated dimming
        node.style.opacity = node.classList.contains('active') ? 1 : opacity;
        
        // Apply a brightness glow scaling as it hits the top
        const brightness = 0.85 + 0.75 * verticalIntensity; // 0.85 at bottom, 1.6 at top
        const scale = 0.9 + 0.25 * verticalIntensity;       // 0.9 at bottom, 1.15 at top
        
        const zIndex = Math.round(100 + 50 * Math.cos(radian));

        node.style.left = (cx + x - NODE_HALF) + 'px';
        node.style.top = (cy + y - NODE_HALF) + 'px';
        node.style.zIndex = node.classList.contains('active') ? 200 : zIndex;
        // Do not override active node's transform so it can be handled by CSS if needed, or set it dynamically
        if (!node.classList.contains('active') && !node.classList.contains('related')) {
             node.style.transform = `scale(${scale})`;
             node.style.filter = `brightness(${brightness})`;
        } else {
             node.style.transform = 'scale(1)';
             node.style.filter = 'brightness(1.2)';
        }
      });
    }

    function startRotation() {
      if (rotationTimer) clearInterval(rotationTimer);
      rotationTimer = setInterval(() => {
        rotationAngle = (rotationAngle + 0.25) % 360;
        positionNodes();
      }, 50);
    }

    function stopRotation() {
      if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
      }
    }

    function centerOnNode(idx) {
      const targetAngle = (idx / TOTAL) * 360;
      rotationAngle = 270 - targetAngle;
      positionNodes();
    }

    function clearActive() {
      orbitalNodes.forEach(n => {
        n.classList.remove('active', 'related');
      });
      activeNodeIdx = null;
      autoRotate = true;
      startRotation();
    }

    function activateNode(idx) {
      // Clear all
      orbitalNodes.forEach(n => n.classList.remove('active', 'related'));

      if (activeNodeIdx === idx) {
        clearActive();
        return;
      }

      // Set active
      activeNodeIdx = idx;
      autoRotate = false;
      stopRotation();

      const node = orbitalNodes[idx];
      node.classList.add('active');

      // Highlight related
      const relatedStr = node.dataset.related || '';
      const relatedIds = relatedStr.split(',').map(Number);
      relatedIds.forEach(relIdx => {
        if (orbitalNodes[relIdx]) {
          orbitalNodes[relIdx].classList.add('related');
        }
      });

      centerOnNode(idx);
    }

    // Reposition on viewport changes — orientation flips and resize crossings
    // of the 768px breakpoint switch the orbit between desktop/mobile radii.
    window.addEventListener('resize', positionNodes, { passive: true });

    // Click handlers
    orbitalNodes.forEach((node, i) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        activateNode(i);
      });
    });

    // Click outside to deselect
    orbitalContainer.addEventListener('click', (e) => {
      if (e.target === orbitalContainer || e.target.classList.contains('orbital-ring')) {
        clearActive();
      }
    });

    // Only run the orbital interval while the section is visible
    const orbIO = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (autoRotate && !rotationTimer) startRotation();
      } else {
        stopRotation();
      }
    }, { threshold: 0 });
    orbIO.observe(orbitalContainer);

    positionNodes();
    startRotation();
  }


  // ─── TESTIMONIAL STARS ────────────────────────────
  const starSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  document.querySelectorAll('.t-card-quote').forEach((quote) => {
    const starsEl = document.createElement('div');
    starsEl.className = 't-card-stars';
    starsEl.innerHTML = starSvg.repeat(5);
    quote.parentNode.insertBefore(starsEl, quote);
  });

  // ─── TESTIMONIAL MARQUEE — column pause handled via CSS :hover ─────────

  // ─── FOOTER SVG TEXT HOVER EFFECT ─────────────────
  const footerSvg = document.getElementById('footer-hover-svg');
  const revealMask = document.getElementById('footerRevealMask');
  if (footerSvg && revealMask) {
    footerSvg.addEventListener('mousemove', (e) => {
      const rect = footerSvg.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * 100;
      const cy = ((e.clientY - rect.top) / rect.height) * 100;
      revealMask.setAttribute('cx', cx + '%');
      revealMask.setAttribute('cy', cy + '%');
    });

    footerSvg.addEventListener('mouseleave', () => {
      revealMask.setAttribute('cx', '50%');
      revealMask.setAttribute('cy', '50%');
    });
  }

  // ─── INDUSTRY SHOWCASE — GSAP ORB ANIMATIONS ────────
  const indSwitches = document.querySelectorAll('.ind-switch');
  const indPanels = document.querySelectorAll('.ind-panel');

  // Store per-panel GSAP timelines so we can kill/restart on switch
  const orbTimelines = new Map();

  function buildOrbTimeline(panel) {
    const orb = panel.querySelector('.ind-orb');
    if (!orb) return null;

    const ring = orb.querySelector('.ind-orb-ring');
    const glow = orb.querySelector('.ind-orb-glow');
    const icon = orb.querySelector('.ind-orb-icon');
    const sonars = orb.querySelectorAll('.ind-orb-sonar');

    // Read the orb's color from CSS custom property
    const orbColorRaw = getComputedStyle(orb).getPropertyValue('--orb-color').trim();
    const orbColor = orbColorRaw || '100, 160, 255';

    const master = gsap.timeline();

    // 1. Ring — slow rotation with subtle speed oscillation
    const ringTl = gsap.timeline({ repeat: -1 });
    ringTl.to(ring, {
      rotation: 360,
      duration: 20,
      ease: 'none',
    });
    // Layer a subtle scale breathe on the ring
    gsap.to(ring, {
      scale: 1.04,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // 2. Glow — organic breathing with scale + opacity
    gsap.to(glow, {
      scale: 1.15,
      opacity: 1,
      duration: 2.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    // Secondary glow shimmer — slight x/y drift
    gsap.to(glow, {
      x: 8,
      y: -6,
      duration: 4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // 3. Sonar pulse rings — staggered expanding rings
    const sonarTl = gsap.timeline({ repeat: -1, delay: 0.5 });
    sonars.forEach((s, i) => {
      sonarTl.fromTo(s, {
        scale: 0.8,
        opacity: 0,
        borderColor: `rgba(${orbColor}, 0.6)`,
      }, {
        scale: 1.8 + (i * 0.15),
        opacity: 0,
        borderColor: `rgba(${orbColor}, 0)`,
        duration: 2.8,
        ease: 'power1.out',
        keyframes: {
          opacity: [0, 0.5, 0],
          easeEach: 'sine.inOut',
        },
      }, i * 0.9);
    });

    // 4. Icon — gentle float + subtle glow pulse
    gsap.to(icon, {
      y: -8,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    // Icon brightness pulse — use drop-shadow on both ends so the yoyo
    // never interpolates through the entry animation's blur() filter.
    gsap.fromTo(icon, {
      filter: `drop-shadow(0 0 0px rgba(${orbColor}, 0))`,
    }, {
      filter: `drop-shadow(0 0 12px rgba(${orbColor}, 0.5))`,
      duration: 2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 1,
    });

    // 5. Orb container — very subtle scale breathe
    gsap.to(orb, {
      scale: 1.02,
      duration: 4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // 6. Entry burst — plays once on switch
    const entryTl = gsap.timeline();
    entryTl
      .fromTo(orb, {
        scale: 0.85,
        opacity: 0,
      }, {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: 'back.out(1.4)',
      })
      .fromTo(icon, {
        scale: 0.5,
        rotation: -15,
        opacity: 0,
        filter: 'blur(8px)',
      }, {
        scale: 1,
        rotation: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.7,
        ease: 'back.out(2)',
      }, '-=0.5')
      .fromTo(glow, {
        scale: 0.3,
        opacity: 0,
      }, {
        scale: 1,
        opacity: 0.7,
        duration: 0.9,
        ease: 'power2.out',
      }, '-=0.6')
      .fromTo(ring, {
        scale: 0.5,
        opacity: 0,
        rotation: -90,
      }, {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 1,
        ease: 'power2.out',
      }, '-=0.8');

    master.add(entryTl, 0);
    master.add(ringTl, 0);
    master.add(sonarTl, 0);

    return master;
  }

  function killOrbAnimations() {
    orbTimelines.forEach(tl => tl.kill());
    orbTimelines.clear();
    // Kill all tweens on orb elements
    document.querySelectorAll('.ind-orb, .ind-orb-ring, .ind-orb-glow, .ind-orb-icon, .ind-orb-sonar').forEach(el => {
      gsap.killTweensOf(el);
    });
  }

  function activatePanel(panel) {
    killOrbAnimations();
    indPanels.forEach(p => {
      p.classList.remove('active');
      p.style.animation = 'none';
    });

    void panel.offsetWidth;
    panel.style.animation = '';
    panel.classList.add('active');

    // Build GSAP orb animation for new panel
    const tl = buildOrbTimeline(panel);
    if (tl) orbTimelines.set(panel, tl);

    // Restart stat bars if they exist in this panel
    const statGroups = panel.querySelectorAll('.stat-bar-group');
    statGroups.forEach(group => {
      if (group.statTimeline) {
        group.statTimeline.restart();
      }
    });
  }

  if (indSwitches.length && indPanels.length) {
    // Switcher click handlers
    indSwitches.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.industry;
        indSwitches.forEach(s => {
          s.classList.remove('active');
          s.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const panel = document.querySelector(`.ind-panel[data-industry="${target}"]`);
        if (panel) activatePanel(panel);
      });
    });

    // Initialize the first active panel
    const firstActive = document.querySelector('.ind-panel.active');
    if (firstActive) {
      const tl = buildOrbTimeline(firstActive);
      if (tl) orbTimelines.set(firstActive, tl);
    }
  }

})();
