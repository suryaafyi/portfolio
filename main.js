import './style.css'
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject({ mode: import.meta.env.MODE === 'development' ? 'development' : 'production' });

// ==== Analytics Tracking Events ====
let lastTrackedSection = 'Home';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Resume Click Tracking
  const resumeLink = document.querySelector('a.social-link img[alt="Resume"]')?.closest('a');
  if (resumeLink) {
    resumeLink.addEventListener('click', (e) => {
      e.preventDefault();
      const url = resumeLink.href;
      
      // Google Analytics 4 Event
      if (typeof gtag === 'function') {
        gtag('event', 'resume_download', {
          'event_category': 'Engagement',
          'event_label': 'Resume Clicked'
        });
      }

      setTimeout(() => {
        window.open(url, '_blank');
      }, 150);
    });
  }

  // 2. Case Study Click Tracking
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const url = card.href;
      const projectName = card.querySelector('h4')?.textContent || 'Unknown Project';
      
      // Google Analytics 4 Event
      if (typeof gtag === 'function') {
        gtag('event', 'case_study_view', {
          'project_name': projectName,
          'event_category': 'Portfolio'
        });
      }
      
      setTimeout(() => {
        window.open(url, '_blank');
      }, 150);
    });
  });
});


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

  // GA4 Virtual Page View Tracking
  const sections = ['Home', 'Work', 'About', 'Contact'];
  const currentSection = sections[newActiveIndex];
  if (currentSection !== lastTrackedSection) {
    lastTrackedSection = currentSection;
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: currentSection,
        page_location: window.location.href,
        page_path: window.location.pathname + '#' + currentSection.toLowerCase()
      });
    }
  }
});


// ==== Hybrid Cursor System (Collaborative vs. Minimalist) ====
const cursorYou = document.getElementById('cursor-you');
const cursorSurya = document.getElementById('cursor-surya');
const customDot = document.getElementById('custom-cursor-dot');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let suryaX = mouseX + 150;
let suryaY = mouseY + 150;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  // 1. Update Dot Cursor (Home, About, Contact) - Centered (22px / 2 = 11)
  if (customDot) {
    customDot.style.transform = `translate(${mouseX - 11}px, ${mouseY - 11}px)`;
  }

  // 2. Update 'You' Cursor (Work Section Only)
  if (cursorYou) {
    cursorYou.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  }

  // ID Card Parallax (About Section)
  const idPhysics = document.getElementById('hanging-id-physics');
  if (idPhysics && document.body.classList.contains('about-active')) {
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

// ==== Contact Interaction Handlers ====
function initContactInteraction() {
  const characterLayer = document.getElementById('contact-character-group');
  const catLayer = document.getElementById('cat-interaction-group');
  
  // Character (Boy/Resume) Hover
  if (characterLayer) {
    characterLayer.addEventListener('mouseenter', () => characterLayer.classList.add('active-hover'));
    characterLayer.addEventListener('mouseleave', () => characterLayer.classList.remove('active-hover'));
  }

  // Cat (Say Hello) Hover
  if (catLayer) {
    catLayer.addEventListener('mouseenter', () => catLayer.classList.add('active-hover'));
    catLayer.addEventListener('mouseleave', () => catLayer.classList.remove('active-hover'));
  }
}


// ==== Resume Illustration Sync ====
function initResumeInteraction() {
  const resumeGroup = document.getElementById('resume-hover-trigger');
  if (!resumeGroup) return;

  resumeGroup.addEventListener('mouseenter', () => {
    resumeGroup.classList.add('active-resume-hover');
  });

  resumeGroup.addEventListener('mouseleave', () => {
    resumeGroup.classList.remove('active-resume-hover');
  });
}

// Initialize
initContactInteraction();
initResumeInteraction();



// ==== Mobile Banner Dismissal ====
const banner = document.getElementById('mobile-banner');
const dismissBannerBtn = document.getElementById('dismiss-banner');

if (banner && dismissBannerBtn) {
  dismissBannerBtn.addEventListener('click', () => {
    banner.classList.add('dismissed');
    setTimeout(() => {
      banner.style.display = 'none';
    }, 400);
  });
}

/* ==== Click Burst Effect ==== */
const particleColors = ["#e8445a", "#f4a8b5", "#ffb347", "#a78bfa", "#67e8f9", "#fbbf24", "#f9a8d4"];

function createClickBurst(x, y) {
  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const isHeart = i % 2 === 0;
    const color = particleColors[Math.floor(Math.random() * particleColors.length)];
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const distance = 40 + Math.random() * 50;
    const size = 8 + Math.random() * 6;

    const p = document.createElement('div');
    p.className = 'click-burst-particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
    p.style.setProperty('--burst-y', `${Math.sin(angle) * distance - 30}px`);

    const svg = isHeart
      ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
      : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 0l3 9h9l-7.5 5.5L19.5 24 12 18l-7.5 6 3-9.5L0 9h9z"/></svg>`;

    p.innerHTML = svg;
    document.body.appendChild(p);

    setTimeout(() => {
      p.remove();
    }, 800);
  }
}

document.addEventListener('mousedown', (e) => {
  createClickBurst(e.clientX, e.clientY);
});

/* ==== Cursor Hint Logic ==== */
function initCursorHint() {
  const homeSection = document.getElementById('home-section');
  const hint = document.getElementById('cursor-hint');
  if (!homeSection || !hint) return;

  let posReady = false;
  let isVisibleWindow = false;
  let hasShown = false;
  const delay = 4000;
  const duration = 3000;

  // Track cursor within Home Section
  homeSection.addEventListener('mousemove', (e) => {
    // For fixed positioning, we use clientX/Y
    const x = e.clientX + 10;
    const y = e.clientY + 10;
    
    hint.style.left = `${x}px`;
    hint.style.top = `${y}px`;
    posReady = true;

    // Trigger if we are in the window and haven't shown yet
    if (isVisibleWindow && !hasShown) {
      hint.classList.add('show');
      hasShown = true;
      
      // Auto-hide after duration
      setTimeout(() => {
        hint.classList.remove('show');
      }, duration);
    }
  });

  // Handle Visibility Window Start
  setTimeout(() => {
    isVisibleWindow = true;
    
    // If the mouse was already moving, show immediately
    if (posReady && !hasShown) {
      hint.classList.add('show');
      hasShown = true;
      
      setTimeout(() => {
        hint.classList.remove('show');
      }, duration);
    }
  }, delay);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initCursorHint();
});
