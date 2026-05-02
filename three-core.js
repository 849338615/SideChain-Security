// ═══════════════════════════════════════════════════════════════════════════
// DATA VAULT CORE — Cinematic Scroll-Animated Data Security Visualization
// ═══════════════════════════════════════════════════════════════════════════
// Layered encryption architecture mapped 1:1 to section copy:
//   Layer 0: Core              — dispersive crystal (data at rest)
//   Layer 1: Encryption cage   — geodesic hex lattice (encryption layer)
//   Layer 2: HSM appliances    — 6 hex prisms on equatorial orbit (HSMs)
//   Layer 3: Key ring          — 12 pulsing hex fragments (key lifecycle)
//   Layer 4: Sentinel shell    — dodecahedron wireframe (perimeter)
//   Layer 5: Data streams      — shader-pulsed lines (encrypted data flow)
//
// Post-processing: UnrealBloom + FXAA.  Scroll-driven layer assembly via GSAP.
// ═══════════════════════════════════════════════════════════════════════════

const __initVaultCore = () => {
  const container = document.getElementById('three-cyber-core');
  if (!container || typeof THREE === 'undefined') return;

  // ── Scene, Camera, Renderer ──
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Radial feather mask — fades the canvas rectangle edges to transparent so
  // the 3D visual blends into the page with no perceivable box boundary.
  // Compositor-only; no per-frame cost.
  const featherMask = 'radial-gradient(ellipse 65% 65% at 50% 50%, black 45%, transparent 92%)';
  renderer.domElement.style.maskImage = featherMask;
  renderer.domElement.style.webkitMaskImage = featherMask;

  // ── Color Palette ──
  const TEAL       = 0x00e5c8;
  const TEAL_SOFT  = 0x5ef0dc;
  const BLUE       = 0x4a7cff;
  const DEEP_BLUE  = 0x1a3a8a;
  const WHITE      = 0xffffff;

  // No scene fog — renderer is alpha:true so empty pixels stay transparent and
  // the 3D visual blends with the page's radial-gradient background.

  // ── Helper: circular particle glow texture ──
  const createGlowTexture = (color = '255,255,255') => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(${color},1)`);
    gradient.addColorStop(0.3, `rgba(${color},0.6)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  };

  // ── Master group ──
  const vaultGroup = new THREE.Group();
  scene.add(vaultGroup);
  vaultGroup.scale.set(0.9, 0.9, 0.9);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 0 — CORE: dispersive crystal + fresnel rim (data at rest)
  // ════════════════════════════════════════════════════════════════════════
  const coreGroup = new THREE.Group();

  // Outer crystal shell — refractive, iridescent
  const coreGeo = new THREE.IcosahedronGeometry(0.55, 2);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: TEAL,
    emissive: TEAL,
    emissiveIntensity: 0.35,
    roughness: 0.05,
    metalness: 0.2,
    transmission: 0.95,
    thickness: 2.0,
    ior: 2.33,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    transparent: true,
    opacity: 0.92
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreGroup.add(coreMesh);

  // Inner crystal — counter-rotating for parallax refraction
  const coreInnerGeo = new THREE.IcosahedronGeometry(0.32, 1);
  const coreInnerMat = new THREE.MeshPhysicalMaterial({
    color: TEAL_SOFT,
    emissive: TEAL,
    emissiveIntensity: 1.2,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.6,
    thickness: 1.0,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.9
  });
  const coreInnerMesh = new THREE.Mesh(coreInnerGeo, coreInnerMat);
  coreGroup.add(coreInnerMesh);

  // Wireframe overlay — digital facet cues
  const coreWireGeo = new THREE.IcosahedronGeometry(0.57, 2);
  const coreEdges = new THREE.EdgesGeometry(coreWireGeo);
  const coreWireMat = new THREE.LineBasicMaterial({
    color: WHITE,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const coreWire = new THREE.LineSegments(coreEdges, coreWireMat);
  coreGroup.add(coreWire);

  // Fresnel rim shell — silhouette glow independent of lighting
  const fresnelGeo = new THREE.IcosahedronGeometry(0.62, 3);
  const fresnelMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor:     { value: new THREE.Color(TEAL) },
      uPower:     { value: 2.6 },
      uIntensity: { value: 1.6 }
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fres = pow(1.0 - max(dot(vNormal, viewDir), 0.0), uPower) * uIntensity;
        gl_FragColor = vec4(uColor * fres, fres);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide
  });
  const fresnelMesh = new THREE.Mesh(fresnelGeo, fresnelMat);
  coreGroup.add(fresnelMesh);

  // Core internal point light — adds subtle specular kick
  const coreLight = new THREE.PointLight(TEAL, 6, 12);
  coreGroup.add(coreLight);

  vaultGroup.add(coreGroup);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 1 — ENCRYPTION CAGE: geodesic hex lattice
  // ════════════════════════════════════════════════════════════════════════
  const latticeGroup = new THREE.Group();

  const cageGeo = new THREE.IcosahedronGeometry(1.25, 2); // subdivided → geodesic hex/pent pattern
  const cageEdges = new THREE.EdgesGeometry(cageGeo);
  const cageMat = new THREE.LineBasicMaterial({
    color: TEAL,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const cageMesh = new THREE.LineSegments(cageEdges, cageMat);
  latticeGroup.add(cageMesh);

  // Secondary cage — slightly larger, blue, inversely rotating for depth
  const cage2Geo = new THREE.IcosahedronGeometry(1.38, 1);
  const cage2Edges = new THREE.EdgesGeometry(cage2Geo);
  const cage2Mat = new THREE.LineBasicMaterial({
    color: BLUE,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const cage2Mesh = new THREE.LineSegments(cage2Edges, cage2Mat);
  latticeGroup.add(cage2Mesh);

  // 12 shield nodes on the 12 vertices of an icosahedron — disciplined placement
  const nodeAnchorGeo = new THREE.IcosahedronGeometry(1.25, 0);
  const nodeVerts = nodeAnchorGeo.getAttribute('position');
  const shieldNodeGeo = new THREE.OctahedronGeometry(0.055, 0);
  const shieldNodeMat = new THREE.MeshBasicMaterial({
    color: TEAL,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const shieldSeen = new Set();
  for (let i = 0; i < nodeVerts.count; i++) {
    const x = nodeVerts.getX(i), y = nodeVerts.getY(i), z = nodeVerts.getZ(i);
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (shieldSeen.has(key)) continue;
    shieldSeen.add(key);
    const node = new THREE.Mesh(shieldNodeGeo, shieldNodeMat.clone());
    node.position.set(x, y, z);
    node.userData = { basePhase: i * 0.52 };
    latticeGroup.add(node);
  }

  vaultGroup.add(latticeGroup);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 2 — HSM APPLIANCES: 6 hex prisms on equatorial orbit
  // ════════════════════════════════════════════════════════════════════════
  const hsmGroup = new THREE.Group();
  const hsmCount = 6;
  const hsmRadius = 1.78;
  const hsmBodyGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.22, 6, 1, false);
  const hsmBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x1b2230,
    metalness: 0.9,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 1.0
  });
  const hsmEdgeMat = new THREE.LineBasicMaterial({
    color: TEAL,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const hsmLedGeo = new THREE.SphereGeometry(0.022, 8, 8);
  const hsmLedMat = new THREE.MeshBasicMaterial({
    color: TEAL,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < hsmCount; i++) {
    const angle = (i / hsmCount) * Math.PI * 2;
    const appliance = new THREE.Group();

    const body = new THREE.Mesh(hsmBodyGeo, hsmBodyMat.clone());
    appliance.add(body);

    const edges = new THREE.EdgesGeometry(hsmBodyGeo);
    const edgeLines = new THREE.LineSegments(edges, hsmEdgeMat.clone());
    appliance.add(edgeLines);

    const led = new THREE.Mesh(hsmLedGeo, hsmLedMat.clone());
    led.position.y = 0.13;
    appliance.add(led);

    appliance.position.set(hsmRadius * Math.cos(angle), 0, hsmRadius * Math.sin(angle));
    // orient hex faces tangent to orbit
    appliance.rotation.y = -angle;
    appliance.rotation.z = Math.PI / 2; // lay the cylinder on its side around the orbit

    appliance.userData = {
      orbitAngle: angle,
      orbitSpeed: 0.0025,
      ledMat: led.material,
      phase: i * (Math.PI * 2 / hsmCount)
    };
    hsmGroup.add(appliance);
  }
  vaultGroup.add(hsmGroup);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 3 — KEY FRAGMENTS: 12 pulsing hex fragments on tilted inner orbit
  // ════════════════════════════════════════════════════════════════════════
  const keyGroup = new THREE.Group();
  const keyCount = 12;
  const keyRadius = 1.08;
  const keyTilt = 0.38;
  const keyFragGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.07, 6, 1, false);
  const keyFragMat = new THREE.MeshPhysicalMaterial({
    color: TEAL,
    emissive: TEAL,
    emissiveIntensity: 0.9,
    metalness: 0.7,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9
  });

  for (let i = 0; i < keyCount; i++) {
    const angle = (i / keyCount) * Math.PI * 2;
    const frag = new THREE.Mesh(keyFragGeo, keyFragMat.clone());
    frag.position.set(
      keyRadius * Math.cos(angle),
      Math.sin(angle) * Math.sin(keyTilt) * keyRadius * 0.3,
      keyRadius * Math.sin(angle)
    );
    frag.rotation.x = keyTilt;
    frag.rotation.z = angle;
    frag.userData = {
      orbitAngle: angle,
      orbitSpeed: 0.0018,
      phase: (i / keyCount) * Math.PI * 2
    };
    keyGroup.add(frag);
  }
  keyGroup.rotation.x = keyTilt;
  vaultGroup.add(keyGroup);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 3b — PARTICLES: tight inner cocoon + equatorial perimeter ring
  // ════════════════════════════════════════════════════════════════════════
  const particleGroup = new THREE.Group();

  // Inner cocoon — thin shell around the encryption cage
  const innerCount = 250;
  const innerPos = new Float32Array(innerCount * 3);
  for (let i = 0; i < innerCount; i++) {
    const r = 1.0 + Math.random() * 0.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    innerPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    innerPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    innerPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const innerParticleGeo = new THREE.BufferGeometry();
  innerParticleGeo.setAttribute('position', new THREE.BufferAttribute(innerPos, 3));
  const innerParticleMat = new THREE.PointsMaterial({
    color: TEAL,
    size: 0.05,
    map: createGlowTexture('0,229,200'),
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const innerParticles = new THREE.Points(innerParticleGeo, innerParticleMat);
  particleGroup.add(innerParticles);

  // Equatorial perimeter ring — Saturn-like band at r~2.1 (perimeter glow)
  const ringCount = 350;
  const ringPos = new Float32Array(ringCount * 3);
  for (let i = 0; i < ringCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = 2.05 + Math.random() * 0.18;
    const y = (Math.random() - 0.5) * 0.08;
    ringPos[i * 3]     = r * Math.cos(theta);
    ringPos[i * 3 + 1] = y;
    ringPos[i * 3 + 2] = r * Math.sin(theta);
  }
  const ringParticleGeo = new THREE.BufferGeometry();
  ringParticleGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
  const ringParticleMat = new THREE.PointsMaterial({
    color: BLUE,
    size: 0.045,
    map: createGlowTexture('120,170,255'),
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const ringParticles = new THREE.Points(ringParticleGeo, ringParticleMat);
  ringParticles.rotation.x = 0.25;
  particleGroup.add(ringParticles);

  vaultGroup.add(particleGroup);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 4 — SENTINEL SHELL: single dodecahedron wireframe + vertex lights
  // ════════════════════════════════════════════════════════════════════════
  const shellGroup = new THREE.Group();

  const shellGeo = new THREE.DodecahedronGeometry(2.05, 0);
  const shellEdges = new THREE.EdgesGeometry(shellGeo);
  const shellMat = new THREE.LineBasicMaterial({
    color: BLUE,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const shellMesh = new THREE.LineSegments(shellEdges, shellMat);
  shellGroup.add(shellMesh);

  // Vertex sentinel lights — small glowing octahedra at each unique vertex
  const shellVerts = shellGeo.getAttribute('position');
  const sentinelGeo = new THREE.OctahedronGeometry(0.04, 0);
  const sentinelMat = new THREE.MeshBasicMaterial({
    color: TEAL,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const uniqueShellVerts = [];
  const shellSeen = new Set();
  for (let i = 0; i < shellVerts.count; i++) {
    const x = shellVerts.getX(i), y = shellVerts.getY(i), z = shellVerts.getZ(i);
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (shellSeen.has(key)) continue;
    shellSeen.add(key);
    uniqueShellVerts.push(new THREE.Vector3(x, y, z));
    const sentinel = new THREE.Mesh(sentinelGeo, sentinelMat.clone());
    sentinel.position.set(x, y, z);
    sentinel.userData = { basePhase: i * 0.7 };
    shellGroup.add(sentinel);
  }

  vaultGroup.add(shellGroup);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 5 — DATA STREAMS: shader-pulsed lines from core to sentinels
  // ════════════════════════════════════════════════════════════════════════
  const streamGroup = new THREE.Group();

  // Custom shader material with traveling pulse via per-vertex progress attribute.
  // Each line: vertex 0 at core (progress=0), vertex 1 at sentinel (progress=1).
  // Per-line phase randomises when each stream "fires."
  const streamMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:    { value: 0 },
      uColor:   { value: new THREE.Color(TEAL) },
      uOpacity: { value: 0.0 }  // tween via GSAP
    },
    vertexShader: /* glsl */ `
      attribute float aProgress;
      attribute float aPhase;
      varying float vProgress;
      varying float vPhase;
      void main() {
        vProgress = aProgress;
        vPhase = aPhase;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3  uColor;
      uniform float uOpacity;
      varying float vProgress;
      varying float vPhase;
      void main() {
        // Two traveling pulses per line, phase-offset per stream
        float wave = sin(vProgress * 6.2831 - uTime * 1.6 + vPhase);
        float pulse = pow(max(wave, 0.0), 4.0);
        // Base gradient: brighter near core, dimmer at perimeter
        float base = mix(0.5, 0.08, vProgress);
        float alpha = (base + pulse * 0.9) * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
  });

  uniqueShellVerts.forEach((v, idx) => {
    const positions = new Float32Array([0, 0, 0, v.x, v.y, v.z]);
    const progress  = new Float32Array([0, 1]);
    const phase     = new Float32Array([idx * 0.91, idx * 0.91]);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position',  new THREE.BufferAttribute(positions, 3));
    lineGeo.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1));
    lineGeo.setAttribute('aPhase',    new THREE.BufferAttribute(phase, 1));
    const line = new THREE.LineSegments(lineGeo, streamMat);
    streamGroup.add(line);
  });

  vaultGroup.add(streamGroup);

  // ════════════════════════════════════════════════════════════════════════
  // LIGHTING — cinematic 3-point (tuned lower; bloom amplifies emissives)
  // ════════════════════════════════════════════════════════════════════════
  const ambient = new THREE.AmbientLight(WHITE, 0.9);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(WHITE, DEEP_BLUE, 2.0);
  scene.add(hemi);

  const keyLight = new THREE.PointLight(WHITE, 10, 20);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(BLUE, 6, 18);
  rimLight.position.set(-4, -2, -5);
  scene.add(rimLight);

  // ════════════════════════════════════════════════════════════════════════
  // POST-PROCESSING — UnrealBloom + FXAA
  // ════════════════════════════════════════════════════════════════════════
  const hasComposer = typeof THREE.EffectComposer !== 'undefined'
    && typeof THREE.UnrealBloomPass !== 'undefined'
    && typeof THREE.ShaderPass !== 'undefined'
    && typeof THREE.FXAAShader !== 'undefined';

  let composer = null;
  let bloomPass = null;
  let fxaaPass = null;

  if (hasComposer) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.85,  // strength — final target; tweened 0→this on scroll
      0.5,   // radius — slightly tighter to keep bloom crisp inside the feather mask
      0.12   // threshold
    );
    composer.addPass(bloomPass);

    fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
    const pr = renderer.getPixelRatio();
    fxaaPass.material.uniforms.resolution.value.set(
      1 / (container.clientWidth * pr),
      1 / (container.clientHeight * pr)
    );
    composer.addPass(fxaaPass);

    // Luminance-to-alpha pass: UnrealBloomPass writes an opaque black backdrop,
    // which shows up as a black box around the 3D object. Remap alpha from
    // max(R,G,B) so dark pixels become transparent and the page background
    // shows through, while bright emissive pixels stay fully visible.
    const alphaPass = new THREE.ShaderPass(new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(tDiffuse, vUv);
          float a = max(max(c.r, c.g), c.b);
          gl_FragColor = vec4(c.rgb, a);
        }
      `
    }));
    alphaPass.renderToScreen = true;
    composer.addPass(alphaPass);
  }

  // ════════════════════════════════════════════════════════════════════════
  // INTERACTION — gentle mouse parallax on vault rotation
  // ════════════════════════════════════════════════════════════════════════
  const parallax = { targetX: 0, targetY: 0, curX: 0, curY: 0 };
  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
    parallax.targetY =  nx * 0.18;
    parallax.targetX =  ny * 0.12;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ════════════════════════════════════════════════════════════════════════
  const clock = new THREE.Clock();

  let vaultVisible = true;
  let vaultRafId = 0;
  const vaultIO = new IntersectionObserver(([entry]) => {
    vaultVisible = entry.isIntersecting;
    if (vaultVisible && !vaultRafId) {
      clock.start();
      vaultRafId = requestAnimationFrame(animate);
    }
  }, { threshold: 0 });
  vaultIO.observe(container);

  const animate = () => {
    if (!vaultVisible) { vaultRafId = 0; return; }
    vaultRafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Core — nested counter-rotation + breathing
    const coreScale = 1 + Math.sin(t * 1.8) * 0.025;
    coreMesh.scale.setScalar(coreScale);
    coreMesh.rotation.y = t * 0.18;
    coreMesh.rotation.x = Math.sin(t * 0.3) * 0.12;

    coreInnerMesh.rotation.y = -t * 0.35;
    coreInnerMesh.rotation.z =  t * 0.22;

    coreWire.rotation.y = t * 0.18;
    coreWire.rotation.x = Math.sin(t * 0.3) * 0.12;

    // Lattice — single cohesive rotation; shield nodes pulse opacity
    latticeGroup.rotation.y = t * 0.08;
    latticeGroup.rotation.x = Math.sin(t * 0.15) * 0.08;
    latticeGroup.children.forEach(child => {
      if (child.userData.basePhase !== undefined && child.material) {
        child.material.opacity = 0.6 + Math.sin(t * 1.4 + child.userData.basePhase) * 0.35;
      }
    });
    // Counter-rotation on secondary cage for depth
    cage2Mesh.rotation.y = -t * 0.12;
    cage2Mesh.rotation.z =  t * 0.05;

    // HSM orbit
    hsmGroup.children.forEach(app => {
      const ud = app.userData;
      ud.orbitAngle += ud.orbitSpeed;
      app.position.x = hsmRadius * Math.cos(ud.orbitAngle);
      app.position.z = hsmRadius * Math.sin(ud.orbitAngle);
      app.rotation.y = -ud.orbitAngle;
      // Status LED pulse (traveling wave around the ring)
      if (ud.ledMat) {
        ud.ledMat.opacity = 0.5 + Math.sin(t * 2.2 + ud.phase) * 0.5;
      }
    });

    // Key fragments — traveling-wave opacity pulse around the ring
    keyGroup.rotation.y = t * 0.35;
    keyGroup.children.forEach(frag => {
      const ud = frag.userData;
      const wave = Math.sin(t * 1.8 - ud.phase * 2);
      frag.material.opacity = 0.35 + Math.max(wave, 0) * 0.75;
      frag.material.emissiveIntensity = 0.6 + Math.max(wave, 0) * 1.4;
      const s = 1 + Math.max(wave, 0) * 0.15;
      frag.scale.setScalar(s);
    });

    // Particles — slow drift
    innerParticles.rotation.y = t * 0.05;
    innerParticles.rotation.x = Math.sin(t * 0.2) * 0.04;
    ringParticles.rotation.y = t * 0.035;

    // Shell — slow rotation + dashed-feel opacity pulse, vertex sentinels blink
    shellMesh.rotation.y = -t * 0.035;
    shellMesh.rotation.z =  t * 0.012;
    shellMesh.material.opacity = 0.3 + Math.sin(t * 0.8) * 0.12;
    shellGroup.children.forEach(child => {
      if (child.userData.basePhase !== undefined && child.material) {
        child.material.opacity = 0.55 + Math.sin(t * 1.6 + child.userData.basePhase) * 0.4;
      }
    });

    // Streams — advance shader time
    streamMat.uniforms.uTime.value = t;

    // Core light breathing
    coreLight.intensity = 5 + Math.sin(t * 2) * 2.5;

    // Ambient vertical float
    vaultGroup.position.y = Math.sin(t * 0.6) * 0.1;

    // Mouse parallax (lerped, additive on top of scroll-driven rotation)
    parallax.curX += (parallax.targetX - parallax.curX) * 0.06;
    parallax.curY += (parallax.targetY - parallax.curY) * 0.06;
    // Apply as delta each frame — re-set rotation relative to GSAP target.
    // GSAP sets vaultGroup.rotation.y/.z directly; we only add to .x which GSAP doesn't touch.
    vaultGroup.rotation.x = parallax.curX;
    // Blend parallax Y into scroll Y by modifying a child wrapper would be cleaner,
    // but GSAP overwrites .y each tick, so add parallax via a subtle camera shift instead:
    camera.position.x = parallax.curY * 0.6;
    camera.position.y = parallax.curX * 0.6;
    camera.lookAt(0, 0, 0);

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  };

  vaultRafId = requestAnimationFrame(animate);

  // ════════════════════════════════════════════════════════════════════════
  // RESPONSIVE
  // ════════════════════════════════════════════════════════════════════════
  const onResize = () => {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) {
      composer.setSize(w, h);
      const pr = renderer.getPixelRatio();
      if (fxaaPass) {
        fxaaPass.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
      }
    }
  };
  window.addEventListener('resize', onResize);

  // ════════════════════════════════════════════════════════════════════════
  // GSAP SCROLL ASSEMBLY — layers scatter → condense → bloom lights up
  // ════════════════════════════════════════════════════════════════════════
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    // Belt-and-suspenders: UMD auto-registers, but calling explicitly
    // guarantees scrollTrigger configs in tweens resolve correctly.
    if (typeof gsap.registerPlugin === 'function') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Initial scattered state — layers exploded outward, faded
    latticeGroup.scale.set(2.5, 2.5, 2.5);
    latticeGroup.children.forEach(c => { if (c.material) c.material.opacity = 0; });

    hsmGroup.scale.set(3.2, 3.2, 3.2);
    hsmGroup.children.forEach(app => app.traverse(c => { if (c.material) c.material.opacity = 0; }));

    keyGroup.scale.set(2.6, 2.6, 2.6);
    keyGroup.children.forEach(f => { if (f.material) f.material.opacity = 0; });

    shellGroup.scale.set(4.0, 4.0, 4.0);
    shellGroup.children.forEach(c => { if (c.material) c.material.opacity = 0; });

    particleGroup.scale.set(4.0, 4.0, 4.0);

    coreGroup.scale.set(0.3, 0.3, 0.3);

    if (bloomPass) bloomPass.strength = 0;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.why-titan',
        start: 'top 120%',
        end: 'top 10%',
        scrub: 1.5
      }
    });

    // Core ignites first
    tl.to(coreGroup.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' }, 0);

    // Particles condense
    tl.to(particleGroup.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power2.inOut' }, 0.05);

    // Lattice cage condenses + fades in
    tl.to(latticeGroup.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power2.inOut' }, 0.15);
    tl.to(cageMat,  { opacity: 0.55, duration: 0.3 }, 0.15);
    tl.to(cage2Mat, { opacity: 0.28, duration: 0.3 }, 0.15);
    // Shield nodes fade via their cloned materials
    latticeGroup.children.forEach(c => {
      if (c.userData.basePhase !== undefined && c.material) {
        tl.to(c.material, { opacity: 0.9, duration: 0.3 }, 0.18);
      }
    });

    // HSM appliances assemble
    tl.to(hsmGroup.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power2.inOut' }, 0.25);
    hsmGroup.children.forEach(app => {
      app.traverse(c => {
        if (c.material) tl.to(c.material, { opacity: c.material.blending === THREE.AdditiveBlending ? 0.95 : 1.0, duration: 0.3 }, 0.28);
      });
    });

    // Key fragments reveal
    tl.to(keyGroup.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power2.inOut' }, 0.3);
    keyGroup.children.forEach(f => {
      if (f.material) tl.to(f.material, { opacity: 0.85, duration: 0.3 }, 0.33);
    });

    // Sentinel shell closes last
    tl.to(shellGroup.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power3.inOut' }, 0.4);
    tl.to(shellMat, { opacity: 0.4, duration: 0.3 }, 0.42);
    shellGroup.children.forEach(c => {
      if (c.userData.basePhase !== undefined && c.material) {
        tl.to(c.material, { opacity: 0.85, duration: 0.3 }, 0.45);
      }
    });

    // Streams flicker to life
    tl.to(streamMat.uniforms.uOpacity, { value: 0.45, duration: 0.3 }, 0.5);

    // Bloom strength rises with the assembly — the scene literally lights up
    if (bloomPass) {
      tl.to(bloomPass, { strength: 0.85, duration: 0.6, ease: 'power2.inOut' }, 0.1);
    }

    // Phase 2 — continuous majestic rotation driven by scroll
    gsap.to(vaultGroup.rotation, {
      y: Math.PI * 3,
      z: Math.PI / 5,
      scrollTrigger: {
        trigger: '.why-titan',
        start: 'top 120%',
        end: 'bottom top',
        scrub: 0.5
      }
    });

    // Re-measure trigger boundaries once layout stabilizes. The vault is
    // lazy-loaded, so fonts/images/reveal classes may settle *after* the
    // triggers are created, leaving their cached start/end pixel offsets
    // stale — which locks a scrubbed timeline at an incorrect mid-progress.
    const refreshTriggers = () => {
      try { ScrollTrigger.refresh(); } catch (_) {}
    };
    if (document.readyState === 'complete') {
      requestAnimationFrame(refreshTriggers);
    } else {
      window.addEventListener('load', refreshTriggers, { once: true });
    }
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(refreshTriggers).catch(() => {});
    }
  } else {
    // No GSAP — reveal all layers immediately
    if (bloomPass) bloomPass.strength = 0.85;
    streamMat.uniforms.uOpacity.value = 0.45;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __initVaultCore);
} else {
  __initVaultCore();
}
