/* ================================================================
   main.js — Shared across all pages
   ================================================================ */

// ── Nav behavior ──────────────────────────────────────────────
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
  document.querySelectorAll('.mobile-link').forEach(l => {
    l.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });
}

// ── Active nav link from current page ────────────────────────
(function markActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (
      (path === '' || path === 'index.html') && (href === 'index.html' || href === './') ||
      href === path
    ) {
      a.classList.add('active');
    }
  });
})();

// ── Scroll animations (IntersectionObserver) ──────────────────
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    // stagger siblings
    const parent = entry.target.closest('[data-stagger]') || entry.target.parentElement;
    const siblings = parent ? parent.querySelectorAll('.fade-in') : [];
    let delay = 0;
    siblings.forEach((el, i) => { if (el === entry.target) delay = i * 70; });
    setTimeout(() => entry.target.classList.add('visible'), delay);
    io.unobserve(entry.target);
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
