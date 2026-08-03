/* =====================================================================
   FIRESONICS — SCRIPT
   -----------------------------------------------------------------
   Sections:
   1. Setup & config       — tune FRAME_COUNT / FRAME_PATH here
   2. Nav scroll state
   3. Hero reveal + ambient ember canvas
   4. Scroll-scrubbed frame-sequence reel (GSAP ScrollTrigger)
   5. Generic scroll reveals for cards / sections
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     1. CONFIG
     To use your own Blender-rendered sequence:
       - drop transparent WebP frames into assets/frames/
       - name them 0001.webp, 0002.webp, 0003.webp ... in order
       - set FRAME_COUNT below to match the total number of frames
     ------------------------------------------------------------------ */
  const FRAME_COUNT = 150;
  const FRAME_PATH = (i) => `assets/frames/${String(i).padStart(4, "0")}.webp`;

  document.getElementById("year").textContent = new Date().getFullYear();

  initNav();
  initHeroReveal();
  initHeroAmbientCanvas();
  initReel(FRAME_COUNT, FRAME_PATH);
  initScrollReveals();
});

/* =====================================================================
   2. NAV — adds a background once the page has scrolled past the hero
   ===================================================================== */
function initNav() {
  const nav = document.getElementById("nav");
  ScrollTrigger.create({
    start: 80,
    end: 99999,
    onUpdate: (self) => {
      nav.classList.toggle("is-scrolled", self.scroll() > 40);
    },
  });
}

/* =====================================================================
   3. HERO — staggered fade/rise-in for logo, title, subtitle, CTA
   ===================================================================== */
function initHeroReveal() {
  const items = gsap.utils.toArray("#hero [data-reveal]");
  gsap.set(items, { opacity: 0, y: 28 });
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: "power3.out",
    stagger: 0.12,
    delay: 0.15,
  });

  // Fade the scroll indicator out as the user starts scrolling.
  gsap.to("#scroll-indicator", {
    opacity: 0,
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "30% top",
      scrub: true,
    },
  });

  document.getElementById("scroll-indicator").addEventListener("click", () => {
    document.getElementById("reel").scrollIntoView({ behavior: "smooth" });
  });
}

/* =====================================================================
   3b. Ambient ember-particle canvas behind the hero copy.
   Lightweight, decorative, and purely additive — safe to delete this
   function (and its <canvas id="hero-noise"> element) if not wanted.
   ===================================================================== */
function initHeroAmbientCanvas() {
  const canvas = document.getElementById("hero-noise");
  const ctx = canvas.getContext("2d");
  let w, h, particles;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }

  function makeParticles() {
    const count = Math.floor((w * h) / 220000) + 18;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * h * 0.5,
      r: (Math.random() * 1.6 + 0.4) * devicePixelRatio,
      speed: (Math.random() * 0.35 + 0.08) * devicePixelRatio,
      drift: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.15,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 140, 70, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  resize();
  makeParticles();
  window.addEventListener("resize", () => {
    resize();
    makeParticles();
  });
  if (!reduceMotion) requestAnimationFrame(tick);
}

/* =====================================================================
   4. SCROLL-SCRUBBED FRAME-SEQUENCE REEL
   Preloads the transparent WebP sequence, pins the section for the
   duration of .reel's scroll height, and draws the frame that matches
   scroll progress. Crossfades adjacent frames for smooth interpolation
   instead of hard-cutting between stills.
   ===================================================================== */
function initReel(frameCount, framePath) {
  const canvas = document.getElementById("reel-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const images = new Array(frameCount);
  let loadedCount = 0;
  let naturalW = 1200;
  let naturalH = 800;

  function preload() {
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = framePath(i + 1);
      img.onload = () => {
        loadedCount++;
        if (i === 0) {
          naturalW = img.naturalWidth;
          naturalH = img.naturalHeight;
          sizeCanvas();
          drawFrame(0);
        }
      };
      images[i] = img;
    }
  }

  function sizeCanvas() {
    // Fit the canvas to the frame's aspect ratio within the viewport,
    // rendered at device pixel ratio for crisp playback.
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.82;
    const ratio = Math.min(maxW / naturalW, maxH / naturalH, 1.4);
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${naturalW * ratio}px`;
    canvas.style.height = `${naturalH * ratio}px`;
    canvas.width = naturalW * ratio * dpr;
    canvas.height = naturalH * ratio * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Draws frame at a fractional index, crossfading to the next frame
  // for smooth in-between motion rather than snapping frame-to-frame.
  function drawFrame(floatIndex) {
    const clamped = Math.max(0, Math.min(frameCount - 1, floatIndex));
    const i0 = Math.floor(clamped);
    const i1 = Math.min(frameCount - 1, i0 + 1);
    const t = clamped - i0;

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    const imgA = images[i0];
    const imgB = images[i1];

    if (imgA && imgA.complete) {
      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, 0, 0, w, h);
    }
    if (t > 0.02 && imgB && imgB.complete && imgB !== imgA) {
      ctx.globalAlpha = t;
      ctx.drawImage(imgB, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }

  preload();
  window.addEventListener("resize", sizeCanvas);

  // A single scrub-driven object tweened by GSAP gives us free easing/
  // smoothing on top of raw scroll input, then we paint from its value.
  const playhead = { frame: 0 };

ScrollTrigger.create({
    trigger: "#reel",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.4,
    // Snap scroll progress itself to whole-frame steps once scrolling
    // stops, so the reel never rests on a fractional (blended/blurry)
    // frame — it always settles on a single crisp still.
    snap: {
      snapTo: 1 / (frameCount - 1),
      duration: 0.2,
      ease: "power1.out",
    },
    onUpdate: (self) => {
      const target = self.progress * (frameCount - 1);
      gsap.to(playhead, {
        frame: target,
        duration: 0.3,
        ease: "power1.out",
        overwrite: true,
        onUpdate: () => drawFrame(playhead.frame),
        onComplete: () => {
          // Force an exact integer frame if we've landed within a hair
          // of one, so the final paint is guaranteed sharp even after
          // float drift (e.g. 45.0000004).
          const rounded = Math.round(playhead.frame);
          if (Math.abs(playhead.frame - rounded) < 0.01) {
            playhead.frame = rounded;
            drawFrame(rounded);
          }
        },
      });
    },
  });

  // Reveal the caption once the reel is mostly pinned in view.
  gsap.from("#reel .reel__caption", {
    opacity: 0,
    y: 20,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: "#reel",
      start: "top top",
      end: "top+=400 top",
      scrub: true,
    },
  });
}

/* =====================================================================
   5. GENERIC SCROLL REVEALS
   Any element with [data-reveal] outside the hero fades up into view
   the first time it crosses into the viewport. Feature/team/tech cards
   additionally stagger within their own group.
   ===================================================================== */
function initScrollReveals() {
  const groups = [
    "#feature-cards .card",
    ".tech-grid .tech-item",
    ".team-grid .team-card",
  ];

  groups.forEach((selector) => {
    const items = gsap.utils.toArray(selector);
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 32 });
    ScrollTrigger.batch(items, {
      start: "top 88%",
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
        }),
      once: true,
    });
  });

  // Simple one-off fade-ups for everything else marked [data-reveal]
  // outside the hero and the groups already handled above.
  const handled = new Set();
  groups.forEach((sel) => gsap.utils.toArray(sel).forEach((el) => handled.add(el)));

  const singles = gsap.utils.toArray("[data-reveal]").filter(
    (el) => !el.closest("#hero") && !handled.has(el)
  );

  singles.forEach((el) => {
    gsap.set(el, { opacity: 0, y: 26 });
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () =>
        gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }),
    });
  });
}
