const { useEffect, useRef, useState, useCallback } = React;

const BeamLine = () => {
  const svgRef = useRef(null);
  const glowRef = useRef(null);
  const coreRef = useRef(null);
  const [dims, setDims] = useState(null);

  const measure = useCallback(() => {
    const container = document.querySelector('.case-rows');
    if (!container) return null;

    const rows = container.querySelectorAll('.case-row');
    if (!rows.length) return null;

    const cr = container.getBoundingClientRect();
    const W = cr.width;
    const H = cr.height;
    const hLines = [];
    const vSegs = [];

    rows.forEach((row, i) => {
      const rr = row.getBoundingClientRect();
      const yTop = rr.top - cr.top;
      const yBot = rr.bottom - cr.top;

      if (i === 0) hLines.push(yTop);
      hLines.push(yBot);

      const content = row.querySelector('.case-content');
      if (content) {
        const ccr = content.getBoundingClientRect();
        vSegs.push({ x: ccr.right - cr.left, yTop, yBot });
      }
    });

    return { W, H, hLines, vSegs };
  }, []);

  const buildPath = useCallback((d) => {
    if (!d) return '';
    const { W, hLines, vSegs } = d;
    const pts = [];

    // Detect single-column layout: case-content takes (nearly) full width,
    // so the desktop "vertical divider in the middle" doesn't exist. Use a
    // proper edge-to-edge zigzag instead. Threshold is generous (within 20%
    // of right edge) so subpixel rendering or padding doesn't break detection.
    const stacked =
      !vSegs.length ||
      vSegs.every(v => v.x >= W * 0.8) ||
      window.matchMedia('(max-width: 1024px)').matches;

    if (stacked) {
      // Inset the beam OUTSIDE the case-rows box so it sits in the parent
      // container's padding gutter, away from the body text. SVG has
      // overflow: visible so negative-x renders into the gutter cleanly.
      const OFFSET = 16;
      const leftX = -OFFSET;
      const rightX = W + OFFSET;
      pts.push(`M ${leftX} ${hLines[0]}`);
      pts.push(`L ${rightX} ${hLines[0]}`);
      let atRight = true;
      for (let i = 1; i < hLines.length; i++) {
        const y = hLines[i];
        if (atRight) {
          pts.push(`L ${rightX} ${y}`); // down the right edge
          pts.push(`L ${leftX} ${y}`);  // sweep left across the divider
        } else {
          pts.push(`L ${leftX} ${y}`);  // down the left edge
          pts.push(`L ${rightX} ${y}`); // sweep right across the divider
        }
        atRight = !atRight;
      }
      return pts.join(' ');
    }

    // Desktop: snake through the 2-column grid via the inner vertical divider.
    let goingRight = true;
    for (let i = 0; i < hLines.length; i++) {
      const y = hLines[i];

      if (i === 0) {
        pts.push(`M 0 ${y}`);
        pts.push(`L ${W} ${y}`);
        goingRight = true;
      } else {
        const v = vSegs[i - 1];
        if (!v) continue;

        if (goingRight) {
          // Came from right end → backtrack to vertical divider → go down → sweep left
          pts.push(`L ${v.x} ${hLines[i - 1]}`);
          pts.push(`L ${v.x} ${y}`);
          pts.push(`L 0 ${y}`);
          goingRight = false;
        } else {
          // Came from left end → go to vertical divider → go down → sweep right
          pts.push(`L ${v.x} ${hLines[i - 1]}`);
          pts.push(`L ${v.x} ${y}`);
          pts.push(`L ${W} ${y}`);
          goingRight = true;
        }
      }
    }

    return pts.join(' ');
  }, []);

  // Measure on mount + resize
  useEffect(() => {
    const update = () => setDims(measure());
    const timer = setTimeout(update, 400);
    window.addEventListener('resize', update);
    return () => { clearTimeout(timer); window.removeEventListener('resize', update); };
  }, [measure]);

  // Animate
  useEffect(() => {
    const glow = glowRef.current;
    const core = coreRef.current;
    if (!glow || !core || !dims) return;

    // Skip on reduced-motion preference. Mobile gets the animated zigzag —
    // buildPath has a stacked-layout branch that produces a clean edge-to-edge
    // zigzag along the horizontal row dividers.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const totalLen = glow.getTotalLength();
    const beamLen = Math.min(totalLen * 0.18, 600);
    const gap = totalLen;

    [glow, core].forEach(p => {
      p.style.strokeDasharray = `${beamLen} ${gap}`;
    });

    const duration = 14000;
    let start = null;
    let rafId = 0;
    let beamVisible = true;

    const beamIO = new IntersectionObserver(([entry]) => {
      beamVisible = entry.isIntersecting;
      if (beamVisible && !rafId) rafId = requestAnimationFrame(tick);
    }, { threshold: 0 });
    const mount = glow.closest('svg')?.parentElement;
    if (mount) beamIO.observe(mount);

    const tick = (ts) => {
      if (!beamVisible) { rafId = 0; return; }
      if (!start) start = ts;
      const progress = ((ts - start) % duration) / duration;
      const offset = totalLen - progress * (totalLen + beamLen);

      glow.style.strokeDashoffset = offset;
      core.style.strokeDashoffset = offset;

      const headDist = totalLen - offset;
      const headPt = glow.getPointAtLength(Math.max(0, Math.min(headDist, totalLen)));
      const tailPt = glow.getPointAtLength(Math.max(0, Math.min(headDist - beamLen, totalLen)));

      const grad = document.getElementById('beam-grad');
      if (grad) {
        grad.setAttribute('x1', tailPt.x);
        grad.setAttribute('y1', tailPt.y);
        grad.setAttribute('x2', headPt.x);
        grad.setAttribute('y2', headPt.y);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafId); beamIO.disconnect(); };
  }, [dims]);

  if (!dims) return null;
  const pathD = buildPath(dims);
  if (!pathD) return null;

  return React.createElement('svg', {
    ref: svgRef,
    width: dims.W,
    height: dims.H,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      pointerEvents: 'none',
      zIndex: 2,
      overflow: 'visible'
    }
  },
    React.createElement('defs', null,
      // Moving gradient — endpoints updated per frame to follow the beam
      React.createElement('linearGradient', {
        id: 'beam-grad',
        gradientUnits: 'userSpaceOnUse',
        x1: 0, y1: 0, x2: dims.W, y2: 0
      },
        React.createElement('stop', { offset: '0%', stopColor: '#4a7cff', stopOpacity: 0 }),
        React.createElement('stop', { offset: '20%', stopColor: '#4a7cff', stopOpacity: 0.8 }),
        React.createElement('stop', { offset: '50%', stopColor: '#38bdf8', stopOpacity: 1 }),
        React.createElement('stop', { offset: '80%', stopColor: '#00e5c8', stopOpacity: 0.8 }),
        React.createElement('stop', { offset: '100%', stopColor: '#00e5c8', stopOpacity: 0 })
      ),
      // Soft glow filter
      React.createElement('filter', {
        id: 'beam-glow',
        x: '-20%', y: '-20%', width: '140%', height: '140%'
      },
        React.createElement('feGaussianBlur', { stdDeviation: '6', result: 'blur' }),
        React.createElement('feMerge', null,
          React.createElement('feMergeNode', { in: 'blur' }),
          React.createElement('feMergeNode', { in: 'SourceGraphic' })
        )
      )
    ),
    // Glow layer (wider, blurred, dimmer)
    React.createElement('path', {
      ref: glowRef,
      d: pathD,
      fill: 'none',
      stroke: 'url(#beam-grad)',
      strokeWidth: 4,
      filter: 'url(#beam-glow)',
      opacity: 0.4,
      strokeLinecap: 'round'
    }),
    // Core beam (sharp, bright)
    React.createElement('path', {
      ref: coreRef,
      d: pathD,
      fill: 'none',
      stroke: 'url(#beam-grad)',
      strokeWidth: 1.5,
      opacity: 0.9,
      strokeLinecap: 'round'
    })
  );
};

window.addEventListener('DOMContentLoaded', () => {
  const caseRows = document.querySelector('.case-rows');
  if (!caseRows) return;

  caseRows.style.position = 'relative';

  const mount = document.createElement('div');
  mount.id = 'beam-mount';
  mount.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
  caseRows.appendChild(mount);

  ReactDOM.createRoot(mount).render(React.createElement(BeamLine));
});
