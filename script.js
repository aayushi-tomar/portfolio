// ---------- mobile nav ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', false);
  });
});

// ---------- GSAP: hero entrance + icon stagger ----------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const curveSwipe = document.getElementById('curveSwipe');
const curvePath = document.getElementById('curvePath');

// safety net: if GSAP fails to load (blocked, offline, slow network) or
// something errors mid-animation, force-remove the overlay so the page is
// never stuck hidden behind it.
if(curveSwipe){
  setTimeout(() => { if(curveSwipe.isConnected) curveSwipe.remove(); }, 3000);
}

if(typeof gsap !== 'undefined'){
  gsap.registerPlugin(ScrollTrigger);

  // curve-swipe intro reveal — plays once on load, then removes itself
  if(curveSwipe){
    if(prefersReducedMotion){
      curveSwipe.remove();
    } else {
      const tl = gsap.timeline({
        onComplete: () => curveSwipe.remove()
      });

      // curved bottom edge morphs from flat to a wave shape, then the whole
      // panel sweeps upward off-screen — built with plain GSAP core (no MorphSVG needed)
      tl.set(curvePath, {
        attr: { d: 'M0,0 L1440,0 L1440,900 C1080,900 360,900 0,900 Z' }
      })
      .to(curvePath, {
        duration: 0.55,
        attr: { d: 'M0,0 L1440,0 L1440,650 C1080,780 360,520 0,650 Z' },
        ease: 'power2.inOut'
      })
      .to(curveSwipe, {
        duration: 0.65,
        yPercent: -100,
        ease: 'power4.inOut'
      }, '-=0.1');
    }
  }

  if(!prefersReducedMotion){
    // hero entrance, staggered — timed to start as the curve swipe clears
    gsap.from('.eyes, .photo-frame, .intro-line, .intro-grid', {
      opacity: 0,
      y: 18,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power2.out',
      delay: curveSwipe ? 0.95 : 0
    });

    // icon grid: pop in one by one as the section scrolls into view
    gsap.from('.icon-item', {
      opacity: 0,
      y: 14,
      scale: 0.9,
      duration: 0.45,
      stagger: 0.04,
      ease: 'back.out(1.6)',
      scrollTrigger: {
        trigger: '.icon-grid',
        start: 'top 85%',
        once: true
      }
    });
  }
}

// ---------- nav underline glide ----------
const navUnderline = document.getElementById('navUnderline');
const navAnchors = document.querySelectorAll('.nav-links a');

navAnchors.forEach(link => {
  link.addEventListener('mouseenter', () => {
    navUnderline.style.width = link.offsetWidth + 'px';
    navUnderline.style.transform = `translateX(${link.offsetLeft}px)`;
    navUnderline.style.opacity = '1';
  });
});

navLinks.addEventListener('mouseleave', () => {
  navUnderline.style.opacity = '0';
});

// ---------- scroll progress bar ----------
const scrollProgress = document.getElementById('scrollProgress');

function updateScrollProgress(){
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = pct + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// ---------- eyes: follow cursor + toggle theme on click ----------
const eyes = document.querySelectorAll('[data-eye]');
const root = document.documentElement;

// restore saved theme
const savedTheme = localStorage.getItem('theme');
if(savedTheme === 'dark'){ root.setAttribute('data-theme', 'dark'); }

document.addEventListener('mousemove', (e) => {
  eyes.forEach(eye => {
    const pupil = eye.querySelector('.pupil');
    const rect = eye.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const radius = 8; // how far the pupil can travel inside the eye
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    pupil.style.transform = `translate(${px}px, ${py}px)`;
  });
});

eyes.forEach(eye => {
  eye.addEventListener('click', () => {
    eye.classList.add('blink');
    setTimeout(() => eye.classList.remove('blink'), 320);

    const isDark = root.getAttribute('data-theme') === 'dark';
    if(isDark){
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });
});

// ---------- gentle scroll reveal ----------
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if(!prefersReduced){
  const rows = document.querySelectorAll('.list-row, .exp-card');
  rows.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  rows.forEach(el => observer.observe(el));
}

// ---------- decode-in text effect ----------
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01#$%_/';

function decodeText(el){
  const original = el.textContent;
  const len = original.length;
  let frame = 0;
  const totalFrames = 18;

  const interval = setInterval(() => {
    let out = '';
    for(let i = 0; i < len; i++){
      const char = original[i];
      if(char === ' '){ out += ' '; continue; }
      // reveal progressively left to right
      const revealAt = (i / len) * totalFrames;
      if(frame >= revealAt + 4){
        out += char;
      } else {
        out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
    }
    el.textContent = out;
    frame++;
    if(frame > totalFrames + 4){
      el.textContent = original;
      clearInterval(interval);
    }
  }, 35);
}

if(!prefersReduced){
  const decodeEls = document.querySelectorAll('.decode');
  const decodeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        decodeText(entry.target);
        decodeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  decodeEls.forEach(el => decodeObserver.observe(el));
}

// ---------- magnetic tilt on project rows ----------
if(!prefersReduced && window.matchMedia('(hover: hover)').matches){
  document.querySelectorAll('.list-row-link').forEach(row => {
    row.addEventListener('mousemove', (e) => {
      const rect = row.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 .. 0.5
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      const shiftX = relX * 10;
      const shiftY = relY * 6;
      row.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
    });
    row.addEventListener('mouseleave', () => {
      row.style.transform = 'translate(0, 0)';
    });
  });
}

// ---------- custom cursor trail ----------
if(!prefersReduced && window.matchMedia('(hover: hover)').matches){
  const trail = document.getElementById('cursorTrail');
  let trailX = 0, trailY = 0, mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    trail.classList.add('active');
  });
  document.addEventListener('mouseleave', () => trail.classList.remove('active'));

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => trail.classList.add('hover'));
    el.addEventListener('mouseleave', () => trail.classList.remove('hover'));
  });

  function animateTrail(){
    trailX += (mouseX - trailX) * 0.18;
    trailY += (mouseY - trailY) * 0.18;
    trail.style.left = trailX + 'px';
    trail.style.top = trailY + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
}
