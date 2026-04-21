/* ================================================================
   js/gallery.js — Photography page
   Loads from Supabase (owner_photos) if config.js is present,
   falls back to static PHOTOS from data/photos.js
   ================================================================ */

let currentFilter = 'all';
let visiblePhotos  = [];
let currentIndex   = 0;

const grid      = document.getElementById('editorialGrid');
const filterBar = document.getElementById('filterBar');
const lightbox  = document.getElementById('lightbox');
const lbOverlay = document.getElementById('lbOverlay');
const lbImg     = document.getElementById('lbImg');
const lbTitle   = document.getElementById('lbTitle');
const lbLoc     = document.getElementById('lbLoc');
const lbClose   = document.getElementById('lbClose');
const lbPrev    = document.getElementById('lbPrev');
const lbNext    = document.getElementById('lbNext');

// ── Lazy-load observer for images ────────────────────────────
const imgIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const img = e.target;
    if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
    imgIO.unobserve(img);
  });
}, { rootMargin: '300px' });

// Card fade-in observer — sets inline styles to override card's inline opacity:0
const cardIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'none';
      cardIO.unobserve(e.target);
    }
  });
}, { threshold: 0.06 });

// ── Load data ─────────────────────────────────────────────────
async function loadPhotos() {
  let photos = [];

  // Try Supabase first
  if (typeof CONFIG !== 'undefined' && CONFIG.supabase?.url && CONFIG.supabase.url !== 'https://xxxxxxxxxxxx.supabase.co') {
    try {
      const sb = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
      const { data } = await sb.from('owner_photos').select('*').eq('is_public', true).order('created_at', { ascending: false });
      if (data?.length) {
        photos = data.map(r => ({
          src: r.photo_url, title: r.title, titleEn: r.title_en,
          location: r.location, date: r.date, description: r.description,
          category: r.category, featured: r.featured, orientation: r.orientation,
        }));
      }
    } catch (_) {}
  }

  // Fallback to static file
  if (!photos.length && typeof PHOTOS !== 'undefined') photos = PHOTOS;

  return photos;
}

// ── Build editorial grid ──────────────────────────────────────
function buildGrid(photos, filter) {
  currentFilter = filter;
  visiblePhotos = filter === 'all' ? photos : photos.filter(p => p.category === filter);
  grid.innerHTML = '';

  if (!visiblePhotos.length) {
    grid.innerHTML = '<p class="no-results">— 暂无照片 —</p>'; return;
  }

  visiblePhotos.forEach((photo, idx) => {
    const card = document.createElement('article');
    card.className = 'photo-card' + (photo.featured ? ' feat' : '');
    card.dataset.orientation = photo.orientation || 'landscape';

    const [y, m] = (photo.date || '').split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateStr = m ? `${y} · ${months[parseInt(m,10)-1]}` : (y || '');

    card.innerHTML = `
      <div class="photo-card__img">
        <img data-src="${photo.src}" src="" alt="${photo.title}" loading="lazy"/>
      </div>
      <div class="photo-card__caption">
        <div class="photo-card__meta">
          <span class="photo-card__date">${dateStr}</span>
          <span class="photo-card__cat">${photo.category || ''}</span>
        </div>
        <h2 class="photo-card__title">${photo.title}</h2>
        ${photo.titleEn ? `<span class="photo-card__title-en">${photo.titleEn}</span>` : ''}
        <p class="photo-card__location">📍 ${photo.location || ''}</p>
        <p class="photo-card__desc">${photo.description || ''}</p>
      </div>
    `;

    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    card.style.transition = 'opacity .55s ease, transform .55s ease';
    card.addEventListener('click', () => openLightbox(idx));
    grid.appendChild(card);

    imgIO.observe(card.querySelector('img'));
    cardIO.observe(card);
  });
}

// ── Filters ───────────────────────────────────────────────────
let allPhotos = [];

if (filterBar) {
  filterBar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildGrid(allPhotos, btn.dataset.filter);
    });
  });
}

// ── Lightbox ──────────────────────────────────────────────────
function openLightbox(idx) {
  currentIndex = idx; showPhoto(idx);
  lightbox.classList.add('open'); lbOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open'); lbOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
function showPhoto(idx) {
  const p = visiblePhotos[idx];
  lbImg.style.opacity = '0';
  setTimeout(() => {
    lbImg.src = p.src; lbImg.alt = p.title;
    lbTitle.textContent = `${p.title}${p.titleEn ? '  ·  ' + p.titleEn : ''}`;
    lbLoc.textContent   = `📍 ${p.location || ''}`;
    lbImg.style.opacity = '1';
  }, 160);
  [-1,1].forEach(d => { const n = visiblePhotos[idx+d]; if (n) { const pre = new Image(); pre.src = n.src; } });
}
function prev() { currentIndex = (currentIndex - 1 + visiblePhotos.length) % visiblePhotos.length; showPhoto(currentIndex); }
function next() { currentIndex = (currentIndex + 1) % visiblePhotos.length; showPhoto(currentIndex); }

lbClose?.addEventListener('click', closeLightbox);
lbOverlay?.addEventListener('click', closeLightbox);
lbPrev?.addEventListener('click', e => { e.stopPropagation(); prev(); });
lbNext?.addEventListener('click', e => { e.stopPropagation(); next(); });

document.addEventListener('keydown', e => {
  if (!lightbox?.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'ArrowRight') next();
});

let tx = 0;
lightbox?.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lightbox?.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 48) dx < 0 ? next() : prev();
});

// ── Init ──────────────────────────────────────────────────────
if (grid) {
  loadPhotos().then(photos => {
    allPhotos = photos;
    buildGrid(photos, 'all');
  });
}
