/* ================================================================
   js/guestbook.js — Guestbook page logic
   Depends on: config.js, Supabase SDK, EmailJS SDK
   ================================================================ */

const sb = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
emailjs.init(CONFIG.emailjs.publicKey);


// ── Load approved submissions ─────────────────────────────────
async function loadGuestbook() {
  const grid = document.getElementById('gbGrid');
  const empty = document.getElementById('gbEmpty');

  const { data, error } = await sb
    .from('guestbook')
    .select('id,author_name,message,photo_url,created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    empty.textContent = error ? '加载失败，请刷新重试。' : '还没有留言，来第一个吧！';
    return;
  }
  empty.remove();

  // IntersectionObserver lazy reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });

  data.forEach(row => {
    const card = document.createElement('div');
    card.className = 'gb-card';
    const dateStr = new Date(row.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    card.innerHTML = `
      ${row.photo_url ? `<div class="gb-card__img"><img data-src="${row.photo_url}" alt="${esc(row.author_name)}的照片" loading="lazy"/></div>` : ''}
      <div class="gb-card__body">
        <p class="gb-card__name">${esc(row.author_name)}</p>
        <p class="gb-card__msg">${esc(row.message)}</p>
        <span class="gb-card__date">${dateStr}</span>
      </div>
    `;
    grid.appendChild(card);
    io.observe(card);
  });

  // Lazy load images via data-src
  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const img = e.target;
        img.src = img.dataset.src;
        imgObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  grid.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
}

// ── File handling ─────────────────────────────────────────────
let gbFile = null;
const gbDrop = document.getElementById('gbDrop');
const gbFileInput = document.getElementById('gbFile');
const gbPreview = document.getElementById('gbPreview');
const gbPrompt = document.getElementById('gbDropPrompt');
const gbRemove = document.getElementById('gbRemoveFile');
const gbFileErr = document.getElementById('gbFileError');

gbDrop.addEventListener('dragover', e => { e.preventDefault(); gbDrop.classList.add('drag-over'); });
gbDrop.addEventListener('dragleave', () => gbDrop.classList.remove('drag-over'));
gbDrop.addEventListener('drop', e => { e.preventDefault(); gbDrop.classList.remove('drag-over'); handleGbFile(e.dataTransfer.files[0]); });
gbDrop.addEventListener('click', e => { if (e.target.tagName !== 'BUTTON') gbFileInput.click(); });
gbFileInput.addEventListener('change', () => handleGbFile(gbFileInput.files[0]));

function handleGbFile(file) {
  gbFileErr.hidden = true;
  if (!file) return;
  if (!file.type.startsWith('image/')) { showFileErr('请选择图片文件'); return; }
  gbFile = file;
  gbPreview.src = URL.createObjectURL(file);
  gbPreview.hidden = false;
  gbPrompt.hidden = true;
  gbRemove.hidden = false;
}
// ── Image compress (Canvas) ──────────────────────────────────
// 上传前压缩，owner 保留 2400px 宽，访客 1600px，大幅提升上传速度
function compressImage(file, maxWidth, quality = 0.88) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

gbRemove.addEventListener('click', e => {
  e.stopPropagation();
  gbFile = null; gbFileInput.value = '';
  gbPreview.hidden = true; gbPrompt.hidden = false; gbRemove.hidden = true;
  gbPreview.src = '';
});

// Char counter
document.getElementById('gbMsg').addEventListener('input', function () {
  document.getElementById('charCount').textContent = `${this.value.length} / 500`;
});

// ── Submit guestbook form ─────────────────────────────────────
document.getElementById('gbForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('gbName').value.trim();
  const email = document.getElementById('gbEmail').value.trim();
  const msg = document.getElementById('gbMsg').value.trim();
  const btn = document.getElementById('gbSubmitBtn');
  const result = document.getElementById('submitResult');

  if (!name || !email || !msg) { showResult('请填写所有必填项', 'err'); return; }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) { showResult('邮箱格式不合规，请重新填写', 'err'); return; }

  btn.disabled = true; btn.textContent = '压缩中…';

  let photoUrl = null;
  if (gbFile) {
    btn.textContent = '上传中…';
    const compressed = await compressImage(gbFile, 1600, 0.84);
    const fd = new FormData();
    fd.append('file', compressed);
    fd.append('upload_preset', CONFIG.cloudinary.guestUploadPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.secure_url) throw new Error(json.error?.message || '上传失败');
      photoUrl = json.secure_url;
    } catch (err) {
      showResult('图片上传失败：' + err.message, 'err');
      btn.disabled = false; btn.textContent = '提交投稿 →';
      return;
    }
  }

  const { error: dbErr } = await sb.from('guestbook').insert([{
    author_name: name,
    author_email: email,
    message: msg,
    photo_url: photoUrl,
    status: 'pending',
  }]);

  if (dbErr) { showResult('提交失败：' + dbErr.message, 'err'); btn.disabled = false; btn.textContent = '提交投稿 →'; return; }

  // Notify admin
  emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateAdminNotify, {
    author_name: name,
    author_email: email,
    message: msg,
    photo_url: photoUrl || '（无图片）',
    admin_url: window.location.origin + '/admin.html',
  }).catch(() => { });

  showResult('✓ 已提交！审核通过后将收到邮件通知，感谢你的留言 🙏', 'ok');
  document.getElementById('gbForm').reset();
  gbFile = null; gbPreview.hidden = true; gbPrompt.hidden = false; gbRemove.hidden = true;
  btn.disabled = false; btn.textContent = '提交投稿 →';
});

function showResult(msg, type) {
  const el = document.getElementById('submitResult');
  el.textContent = msg; el.className = 'submit-result ' + type; el.hidden = false;
}

// ── Private note form ─────────────────────────────────────────
document.getElementById('noteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('noteName').value.trim() || '匿名';
  const note = document.getElementById('noteText').value.trim();
  const res = document.getElementById('noteResult');
  if (!note) return;
  const { error } = await sb.from('private_notes').insert([{ author_name: name, note }]);
  res.hidden = false;
  if (error) { res.textContent = '发送失败：' + error.message; res.className = 'submit-result err'; }
  else { res.textContent = '✓ 小纸条已悄悄送出～'; res.className = 'submit-result ok'; document.getElementById('noteForm').reset(); }
});

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────────────
loadGuestbook();
