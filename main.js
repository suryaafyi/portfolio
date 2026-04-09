import './style.css'
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject({ mode: import.meta.env.MODE === 'development' ? 'development' : 'production' });

const container = document.getElementById('container');

// ==== Interactive Scattered Objects Logic ====
const interactiveObjects = document.querySelectorAll('.interactive-object');

interactiveObjects.forEach(el => {
  const soundAttr = el.getAttribute('data-sound');
  const baseRotation = parseInt(el.getAttribute('data-rotation') || '0');
  const audio = soundAttr ? new Audio(soundAttr) : null;

  if (audio) {
    audio.volume = 0.25; // Set hover effect volume aggressively lower since 0.5 can still sound very loud
  }

  el.addEventListener('mouseenter', () => {
    // Add 20-30 deg to the base rotation preserving the organic layout angle
    const angle = Math.floor(Math.random() * 11) + 20;
    const sign = Math.random() > 0.5 ? 1 : -1;
    const newRotation = baseRotation + (angle * sign);
    el.style.transform = `scale(1.1) rotate(${newRotation}deg)`;

    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => { /* Ignore missing audio */ });
    }
  });

  el.addEventListener('mouseleave', () => {
    el.style.transform = `scale(1) rotate(${baseRotation}deg)`;
  });
});

// ==== Mini Music Player Logic ====
const miniPlayer = document.getElementById('mini-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const vinylRecord = document.getElementById('vinyl-record');
const vinylImage = vinylRecord.querySelector('.vinyl-image');
const playerAudio = document.getElementById('player-audio');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');

playerAudio.volume = 0.25; // Set background music volume aggressively lower

const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const trackProgress = document.getElementById('track-progress');
const trackLine = document.getElementById('track-line');

const playlist = [
  { title: "Sunflower", artist: "Post Malone", file: "/assets/sounds/sunflower.mp3", cover: "/assets/images/sunflower-vinyl.png" },
  { title: "505", artist: "Arctic Monkeys", file: "/assets/sounds/arctic-monkeys-505.mp3", cover: "/assets/images/artic-vinyl.png" },
  { title: "Blinding Lights", artist: "Weeknd", file: "/assets/sounds/blinding-lights-the-weeknd.mp3", cover: "/assets/images/weeknd-vinyl.png" },
  { title: "Dracula", artist: "Tame Impala & JENNIE", file: "/assets/sounds/dracula.mp3", cover: "/assets/images/dracula-vinyl.png" }
];

let currentTrackIndex = 0;
let isMusicPlaying = false;

// Loads the track into memory and applies DOM UI updates
function loadTrack(index) {
  const track = playlist[index];
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  vinylImage.src = track.cover;
  playerAudio.src = track.file;
}

// Initial hydration
loadTrack(currentTrackIndex);
miniPlayer.classList.add('paused');

function playTrack() {
  isMusicPlaying = true;
  playerAudio.play().catch(e => { console.log('Wait for file:', e) });
  vinylRecord.classList.add('spinning');
  miniPlayer.classList.remove('paused');
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'block';
}

function pauseTrack() {
  isMusicPlaying = false;
  playerAudio.pause();
  vinylRecord.classList.remove('spinning');
  miniPlayer.classList.add('paused');
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrackIndex);
  if (isMusicPlaying) playTrack();
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex);
  if (isMusicPlaying) playTrack();
}

playPauseBtn.addEventListener('click', () => {
  if (isMusicPlaying) pauseTrack();
  else playTrack();
});

prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);

// Auto-advance song when track physically finishes
playerAudio.addEventListener('ended', nextTrack);

// Helper to format time compactly
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Calculate total time when media metadata loads
playerAudio.addEventListener('loadedmetadata', () => {
  totalTimeEl.textContent = formatTime(playerAudio.duration);
});

// Continuously update track knob progression
playerAudio.addEventListener('timeupdate', () => {
  currentTimeEl.textContent = formatTime(playerAudio.currentTime);
  if (playerAudio.duration) {
    const progressPercent = (playerAudio.currentTime / playerAudio.duration) * 100;
    trackProgress.style.width = `${progressPercent}%`;
  }
});

// Enable timeline seeking
trackLine.addEventListener('click', (e) => {
  const rect = trackLine.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = clickX / rect.width;
  if (playerAudio.duration) {
    playerAudio.currentTime = percent * playerAudio.duration;
  }
});

// ==== Navigation & Scrolling Logic ====
const navItems = document.querySelectorAll('.nav-item');
const containerRect = () => container.getBoundingClientRect();
const workSection = document.getElementById('work-section');
const aboutSection = document.getElementById('about-section');
const contactSection = document.getElementById('contact-section');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabName = item.querySelector('span').textContent.trim();
    const isMobile = window.innerWidth <= 1024;
    const scale = isMobile ? 1 : (containerRect().width / 1376 || 1);

    if (tabName === 'Work') {
      window.scrollTo({ top: workSection.offsetTop * scale, behavior: 'smooth' });
    } else if (tabName === 'About') {
      window.scrollTo({ top: aboutSection.offsetTop * scale, behavior: 'smooth' });
    } else if (tabName === 'Contact') {
      window.scrollTo({ top: contactSection.offsetTop * scale, behavior: 'smooth' });
    } else if (tabName === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

window.addEventListener('scroll', () => {
  // Use scale 1 for mobile/tablet fluid layout, and calculated scale for desktop
  const isMobile = window.innerWidth <= 1024;
  const scale = isMobile ? 1 : (containerRect().width / 1376 || 1);
  const scrollY = window.scrollY;

  // Calculate specific trigger positions mathematically scaled to viewport
  const workThreshold = (workSection.offsetTop * (isMobile ? 1 : scale)) - 300;
  const aboutThreshold = (aboutSection.offsetTop * (isMobile ? 1 : scale)) - 300;
  const contactThreshold = (contactSection.offsetTop * (isMobile ? 1 : scale)) - 300;

  let newActiveIndex = 0;
  let isWorkActive = false;
  let isAboutActive = false;
  let isContactActive = false;

  if (scrollY >= contactThreshold) {
    newActiveIndex = 3; // Activate 'Contact'
    isContactActive = true;
  } else if (scrollY >= aboutThreshold) {
    newActiveIndex = 2; // Activate 'About'
    isAboutActive = true;
  } else if (scrollY >= workThreshold) {
    newActiveIndex = 1; // Activate 'Work'
    isWorkActive = true;
  }

  // Update tabs only if needed to prevent DOM thrashing
  navItems.forEach((nav, index) => {
    if (index === newActiveIndex) {
      if (!nav.classList.contains('active')) nav.classList.add('active');
    } else {
      if (nav.classList.contains('active')) nav.classList.remove('active');
    }
  });

  // Update body classes safely
  if (isWorkActive && !document.body.classList.contains('work-active')) {
    document.body.classList.add('work-active');
  } else if (!isWorkActive && document.body.classList.contains('work-active')) {
    document.body.classList.remove('work-active');
  }

  if (isAboutActive && !document.body.classList.contains('about-active')) {
    document.body.classList.add('about-active');
  } else if (!isAboutActive && document.body.classList.contains('about-active')) {
    document.body.classList.remove('about-active');
  }

  if (isContactActive && !document.body.classList.contains('contact-active')) {
    document.body.classList.add('contact-active');
  } else if (!isContactActive && document.body.classList.contains('contact-active')) {
    document.body.classList.remove('contact-active');
  }
});

// ==== Virtual Cursors (Collaborative Mode) ====
const cursorYou = document.getElementById('cursor-you');
const cursorSurya = document.getElementById('cursor-surya');
const cursorDemogorgon = document.getElementById('cursor-demogorgon');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let suryaX = mouseX + 150;
let suryaY = mouseY + 150;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  // The You cursor instantly tracks the mouse
  if (cursorYou) {
    cursorYou.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  }
  // The Demogorgon cursor also instantly tracks BUT is centered (-50%, -50%)
  if (cursorDemogorgon) {
    cursorDemogorgon.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  }

  // ID Card Parallax
  const idPhysics = document.getElementById('hanging-id-physics');
  if (idPhysics && document.body.classList.contains('about-active')) {
    // Subtle tilt: +/- 2 degrees, slight pan +/- 4px
    const tiltX = (mouseX / window.innerWidth - 0.5) * 4; 
    const panX = (mouseX / window.innerWidth - 0.5) * -8;
    const panY = (mouseY / window.innerHeight - 0.5) * -8;
    idPhysics.style.transform = `rotate(${tiltX}deg) translate(${panX}px, ${panY}px)`;
  }
});

// ==== ID Card Flip Interaction ====
document.addEventListener('click', (e) => {
  const card = e.target.closest('#hanging-id-card');
  if (card) {
    const inner = card.querySelector('.flip-card-inner');
    if (inner) {
      inner.classList.toggle('is-flipped');
    }
  }
});

function animateCursors() {
  suryaX += (mouseX - suryaX) * 0.05;
  suryaY += (mouseY - suryaY) * 0.05;

  if (cursorSurya) {
    cursorSurya.style.transform = `translate(${suryaX + 40}px, ${suryaY + 40}px)`;
  }
  requestAnimationFrame(animateCursors);
}
animateCursors();

// Basic responsive fit behavior
function resizeContainer() {
  // ONLY scale for desktop/large-screen 'web' version as requested
  if (window.innerWidth > 1024) {
    const scale = Math.min(window.innerWidth / 1376, 1);
    container.style.transform = `scale(${scale})`;
    document.body.style.minHeight = `${container.offsetHeight * scale}px`;
  } else {
    // Reset for mobile/tablet to use native fluid CSS
    container.style.transform = 'none';
    document.body.style.minHeight = 'auto';
  }
}

window.addEventListener('resize', resizeContainer);
resizeContainer();

// ==== Stranger Things Alphabet Wall Mechanics ====
function buildStrangerWall() {
  const stWall = document.getElementById('st-wall');
  if (!stWall) return;

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const rows = [
    { start: 0, end: 8, yOffset: 120 },    // A-H
    { start: 8, end: 17, yOffset: 290 },   // I-Q
    { start: 17, end: 26, yOffset: 460 }   // R-Z
  ];

  // Authentic bulb image references and light colors
  const lightTypes = [
    { color: '#ff2a2a', img: 'red-light.png' },
    { color: '#2a75ff', img: 'blue-light.png' },
    { color: '#ffeb3b', img: 'yellow-light.png' },
    { color: '#4caf50', img: 'green-light.png' },
    { color: '#ff4081', img: 'pink-light.png' }
  ];

  const allBulbs = [];

  rows.forEach((rowConfig) => {
    // 1. Create Row Wrapper
    const rowEl = document.createElement('div');
    rowEl.className = 'st-row';
    rowEl.style.top = `${rowConfig.yOffset}px`;

    const rowLetters = alphabet.substring(rowConfig.start, rowConfig.end);
    let rowHTML = '';

    // Create each letter group
    for (let i = 0; i < rowLetters.length; i++) {
      const letter = rowLetters[i];
      const light = lightTypes[(rowConfig.start + i) % lightTypes.length];
      const verticalJitter = (Math.random() * 30) - 15; // Random up/down offset for organic look

      rowHTML += `
        <div class="st-letter-group" style="transform: translateY(${verticalJitter}px)">
          <div class="st-bulb-housing"></div>
          <img src="/assets/images/${light.img}" class="st-bulb" style="--st-color: ${light.color};" data-index="${rowConfig.start + i}" alt="" />
          <div class="st-letter">${letter}</div>
        </div>
      `;
    }

    rowEl.innerHTML = rowHTML;
    stWall.appendChild(rowEl);

    // 2. Add structural wiring (Draw SVG path behind the row)
    // We simply draw a loose bezier curve simulating a sagging wire across the row.
    const wireStr = `
      <svg class="st-wire-layer" width="100%" height="800" xmlns="http://www.w3.org/2000/svg">
        <path d="M 100,${rowConfig.yOffset + 10} Q 688,${rowConfig.yOffset + 120} 1276,${rowConfig.yOffset - 10}" 
              fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
    stWall.insertAdjacentHTML('afterbegin', wireStr);
  });

  // Collect all newly created bulbs for interaction handling
  const bulbNodes = document.querySelectorAll('.st-bulb');

  const singleFlickerSound = new Audio('/assets/sounds/light-flicker.mp3');
  singleFlickerSound.volume = 0.3;

  bulbNodes.forEach(b => {
    allBulbs.push(b);
    // Interaction 1: Direct light hover
    b.addEventListener('mouseenter', () => {
      b.classList.add('hovered');
      singleFlickerSound.currentTime = 0;
      singleFlickerSound.play().catch(e => { });
    });
    b.addEventListener('mouseleave', () => b.classList.remove('hovered'));
  });

  // Interaction 2 & 3: Email hover "Chaos" and Click "Burst"
  const mailToPill = document.querySelector('.mailto-pill');
  let chaosInterval;

  const rapidFlickerSound = new Audio('/assets/sounds/lights-flickering.mp3');
  rapidFlickerSound.volume = 0.4;
  rapidFlickerSound.loop = true; // Loops infinitely while hovering

  const demoSound = new Audio('/assets/sounds/demo-sound.mp3');
  demoSound.volume = 0.6;

  if (mailToPill) {
    // Chaos Hover
    mailToPill.addEventListener('mouseenter', () => {
      rapidFlickerSound.currentTime = 0;
      rapidFlickerSound.play().catch(e => { });

      // Fire a random sequence that chaotic flickers
      chaosInterval = setInterval(() => {
        // Pick random bulbs to flicker
        allBulbs.forEach(b => b.classList.remove('chaos')); // Clear previous

        const numBulbs = Math.floor(Math.random() * 6) + 3; // 3 to 8 simultaneous bulbs
        for (let i = 0; i < numBulbs; i++) {
          const randIdx = Math.floor(Math.random() * allBulbs.length);
          allBulbs[randIdx].classList.add('chaos');
        }
      }, 100);
    });

    mailToPill.addEventListener('mouseleave', () => {
      rapidFlickerSound.pause();
      rapidFlickerSound.currentTime = 0;

      clearInterval(chaosInterval);
      allBulbs.forEach(b => b.classList.remove('chaos'));
    });

    // Burst Click
    mailToPill.addEventListener('click', () => {
      demoSound.currentTime = 0;
      demoSound.play().catch(err => { });

      allBulbs.forEach(b => b.classList.add('burst'));

      // Remove burst after short sync flare
      setTimeout(() => {
        allBulbs.forEach(b => b.classList.remove('burst'));
      }, 600);
    });
  }
}

// Initialize
buildStrangerWall();

// ==== Mobile Splash Dismissal ====
const splash = document.getElementById('mobile-splash');
const dismissBtn = document.getElementById('dismiss-splash');

if (splash && dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
    }, 500);
  });
}
