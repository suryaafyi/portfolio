function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeInQuad(t) { return t * t; }

function animate(el, from, to, duration, easeFn) {
  return new Promise(resolve => {
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const e = easeFn(t);
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e;
      const scale = (from.scale ?? 1) + ((to.scale ?? 1) - (from.scale ?? 1)) * e;
      const opacity = (from.opacity ?? 1) + ((to.opacity ?? 1) - (from.opacity ?? 1)) * e;
      const rotate = (from.rotate ?? 0) + ((to.rotate ?? 0) - (from.rotate ?? 0)) * e;

      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.opacity = String(opacity);
      el.style.transform = `scale(${scale}) rotate(${rotate}deg)`;

      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function initOpeningAnimation() {
  const splash = document.getElementById('opening-splash');
  if (!splash) return;

  // Only play the animation once per session
  if (sessionStorage.getItem('hasSeenIntro')) {
    splash.style.display = 'none';
    return;
  }
  sessionStorage.setItem('hasSeenIntro', 'true');

  const wrapper = document.getElementById('anim-letters-wrapper');
  if (!wrapper) return;

  const FONT_SIZE = window.innerWidth <= 768 ? 60 : 100;
  const CENTER_X = window.innerWidth / 2;
  const CENTER_Y = window.innerHeight / 2;

  // SURYA LETTER SET (with duplicate for animation balance)
  const letterDefs = ["S", "u", "r", "y", "a"];

  const els = letterDefs.map(char => {
    const el = document.createElement("div");
    el.className = "anim-letter";
    el.textContent = char;
    wrapper.appendChild(el);
    return { el, char };
  });

  // Measure widths
  els.forEach(o => { o.el.style.opacity = "0.01"; });
  const letterSpacing = 8;
  const widths = els.map(o => o.el.offsetWidth);
  const totalWidth = widths.reduce((acc, w) => acc + w, 0) + letterSpacing * (widths.length - 1);

  let x = CENTER_X - totalWidth / 2;
  const y = CENTER_Y - FONT_SIZE / 2;

  const finalPos = widths.map(w => {
    const pos = { x, y };
    x += w + letterSpacing;
    return pos;
  });

  els.forEach(o => { o.el.style.opacity = "0"; });

  // Flash element
  const flash = document.createElement("div");
  Object.assign(flash.style, {
    position: "absolute", width: "10px", height: "10px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(200,160,120,0.6) 0%, transparent 70%)",
    pointerEvents: "none", opacity: "0", zIndex: "10",
  });
  wrapper.appendChild(flash);

  async function run() {
    const sEl = els[0]; // S rises
    const yEl = els[3]; // y falls

    // STEP 1: S rises
    const sCenterX = CENTER_X - sEl.el.offsetWidth / 2;
    const sStartY = window.innerHeight + 50;
    const sEndY = CENTER_Y - FONT_SIZE / 2;

    await animate(sEl.el,
      { x: sCenterX, y: sStartY, scale: 4, opacity: 0.5 },
      { x: sCenterX, y: sEndY, scale: 1.2, opacity: 1 },
      700, easeOutCubic
    );

    await delay(150);

    // STEP 2: y falls
    const yStartX = CENTER_X - yEl.el.offsetWidth / 2 + 20;
    const yStartY = -120;
    const yCollideY = CENTER_Y - FONT_SIZE / 2;

    yEl.el.style.opacity = "1";
    await animate(yEl.el,
      { x: yStartX, y: yStartY, scale: 1, opacity: 1 },
      { x: yStartX, y: yCollideY, scale: 1, opacity: 1 },
      600, easeInQuad
    );

    // STEP 3: collision + shake
    flash.style.left = CENTER_X - 5 + "px";
    flash.style.top = CENTER_Y - 5 + "px";
    flash.style.opacity = "1";
    flash.style.animation = "flashBurst 0.5s ease-out forwards";
    wrapper.style.animation = "shake 0.4s ease-out";

    await Promise.all([
      animate(sEl.el,
        { x: sCenterX, y: sEndY, scale: 1.2, opacity: 1 },
        { x: sCenterX - 40, y: sEndY, scale: 1.3, opacity: 1 },
        150, easeOutCubic
      ),
      animate(yEl.el,
        { x: yStartX, y: yCollideY, scale: 1, opacity: 1 },
        { x: yStartX + 40, y: yCollideY, scale: 1.3, opacity: 1 },
        150, easeOutCubic
      ),
    ]);

    // STEP 4: burst
    const burstLetters = [
      { obj: els[1], angle: -140, dist: 250 },
      { obj: els[2], angle: -200, dist: 220 },
      { obj: els[4], angle: -20, dist: 200 }
      // { obj: els[5], angle: 30, dist: 260 },
    ];

    await Promise.all(
      burstLetters.map(bl => {
        const rad = (bl.angle * Math.PI) / 180;
        const bx = CENTER_X + Math.cos(rad) * bl.dist - 25;
        const by = CENTER_Y + Math.sin(rad) * bl.dist - FONT_SIZE / 2;
        return animate(bl.obj.el,
          { x: CENTER_X - 25, y: CENTER_Y - FONT_SIZE / 2, scale: 0.3, opacity: 0 },
          { x: bx, y: by, scale: 1.1, opacity: 1 },
          450, easeOutCubic
        );
      })
    );

    wrapper.style.animation = "";
    await delay(200);

    // STEP 5: settle
    await Promise.all(
      els.map((obj, i) => {
        const cx = parseFloat(obj.el.style.left) || 0;
        const cy = parseFloat(obj.el.style.top) || 0;
        return animate(obj.el,
          { x: cx, y: cy, scale: 1.1, opacity: 1 },
          { x: finalPos[i].x, y: finalPos[i].y, scale: 1, opacity: 1 },
          800, easeOutBack
        );
      })
    );

    // Hide duplicate "a"
    // els[5].el.style.opacity = "0";
    await delay(200);

    // STEP 6: Exit mask
    splash.style.clipPath = `circle(150% at ${CENTER_X}px ${CENTER_Y}px)`;
    splash.style.transition = "clip-path 0.85s cubic-bezier(0.4, 0, 0.2, 1)";

    await delay(50);
    splash.style.clipPath = `circle(0% at ${CENTER_X}px ${CENTER_Y}px)`;

    setTimeout(() => {
      splash.style.display = 'none';
    }, 900);
  }

  run();
}

// Start when document is ready
if (document.readyState === 'complete') {
  initOpeningAnimation();
} else {
  window.addEventListener('load', initOpeningAnimation);
}
