/* ================================================================
   js/admin.js — Admin panel logic
   Depends on: config.js, Supabase SDK, EmailJS SDK
   ================================================================ */

// ── Init services ─────────────────────────────────────────────
const sb = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
emailjs.init(CONFIG.emailjs.publicKey);

// ── Auth (Supabase Auth — signInWithPassword) ─────────────────
const loginScreen = document.getElementById('loginScreen');
const adminPanel  = document.getElementById('adminPanel');
const loginError  = document.getElementById('loginError');

// Restore session automatically if already logged in
sb.auth.getSession().then(({ data: { session } }) => {
  if (session) showPanel();
});

// Listen for auth state changes (e.g. token refresh)
sb.auth.onAuthStateChange((_event, session) => {
  if (session) { showPanel(); }
  else { loginScreen.hidden = false; adminPanel.hidden = true; }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  loginError.hidden = true;
  document.getElementById('loginBtn').textContent = '登录中…';

  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  document.getElementById('loginBtn').textContent = '进入 →';

  if (error) {
    loginError.textContent = error.message === 'Invalid login credentials'
      ? '邮箱或密码错误' : error.message;
    loginError.hidden = false;
  }
  // showPanel() is triggered automatically via onAuthStateChange
});

document.getElementById('loginPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});
document.getElementById('loginEmail').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginPassword').focus();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

function showPanel() {
  loginScreen.hidden = true;
  adminPanel.hidden  = false;
  loadReview('pending');
  loadNotes();
}

// ── Tabs ──────────────────────────────────────────────────────
document.querySelectorAll('.side-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.hidden = true);
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).hidden = false;
    if (btn.dataset.tab === 'photos') loadMyPhotos();
  });
});

// ── Upload tab ────────────────────────────────────────────────
let selectedFile = null;

const dropZone  = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewImg = document.getElementById('previewImg');
const dropPrompt = document.getElementById('dropPrompt');

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  handleFile(e.dataTransfer.files[0]);
});
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  selectedFile = file;
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewImg.hidden = false;
  dropPrompt.hidden = true;
}

// ── Client-side compression ──────────────────────────────────
function compressImage(file, maxWidth = 2400, quality = 0.88) {
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

document.getElementById('submitUpload').addEventListener('click', async () => {
  const title = document.getElementById('u-title').value.trim();
  const location = document.getElementById('u-location').value.trim();
  if (!selectedFile) { setMsg('⚠ 请先选择图片', 'warn'); return; }
  if (!title || !location) { setMsg('⚠ 标题和地点为必填', 'warn'); return; }

  setMsg('压缩中…', '');
  showProgress(10);

  // Compress before upload (client-side)
  const toUpload = await compressImage(selectedFile, 2400, 0.88);
  showProgress(30);

  // Upload to Cloudinary
  const fd = new FormData();
  fd.append('file', toUpload);
  fd.append('upload_preset', CONFIG.cloudinary.ownerUploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`, { method: 'POST', body: fd });
  showProgress(70);
  const { secure_url, error: cErr } = await res.json();
  if (cErr || !secure_url) { setMsg('❌ 图片上传失败：' + (cErr?.message || ''), 'err'); showProgress(0); return; }

  // Save to Supabase
  const { error: dbErr } = await sb.from('owner_photos').insert([{
    photo_url:   secure_url,
    title:       title,
    title_en:    document.getElementById('u-titleEn').value.trim() || null,
    location:    location,
    date:        document.getElementById('u-date').value.trim() || null,
    description: document.getElementById('u-desc').value.trim() || null,
    category:    document.getElementById('u-cat').value,
    orientation: document.getElementById('u-orient').value,
    featured:    document.getElementById('u-featured').checked,
    is_public:   document.getElementById('u-public').checked,
  }]);

  showProgress(100);
  if (dbErr) { setMsg('❌ 保存失败：' + dbErr.message, 'err'); return; }
  setMsg('✓ 照片已上传并保存！', 'ok');
  setTimeout(() => showProgress(0), 1000);
});

function showProgress(pct) {
  const bar = document.getElementById('uploadProgress');
  bar.hidden = pct === 0;
  document.getElementById('progressFill').style.width = pct + '%';
}
function setMsg(text, type) {
  const el = document.getElementById('uploadMsg');
  el.textContent = text;
  el.style.color = type === 'ok' ? '#4ADE80' : type === 'err' || type === 'warn' ? '#F87171' : '#888';
}

// ── Review tab ────────────────────────────────────────────────
let rejectTargetId = null;

document.querySelectorAll('.ftab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadReview(btn.dataset.status);
  });
});

async function loadReview(status) {
  const list = document.getElementById('reviewList');
  list.innerHTML = '<p class="empty-hint">加载中…</p>';

  // Admin can see all statuses (bypass RLS via service auth)
  const { data, error } = await sb.from('guestbook')
    .select('*').eq('status', status).order('created_at', { ascending: false });

  if (error || !data?.length) {
    list.innerHTML = `<p class="empty-hint">${error ? '加载失败' : '暂无记录'}</p>`;
    return;
  }
  list.innerHTML = '';
  data.forEach(row => list.appendChild(buildReviewCard(row)));
}

function buildReviewCard(row) {
  const d = document.createElement('div');
  d.className = 'review-card';
  d.dataset.id = row.id;

  const dateStr = new Date(row.created_at).toLocaleString('zh-CN');
  const imgHtml = row.photo_url
    ? `<img class="review-thumb" src="${row.photo_url}" alt=""/>`
    : `<div class="review-thumb-empty">无图片</div>`;

  const actionsHtml = row.status === 'pending' ? `
    <button class="btn-approve" data-id="${row.id}">✓ 通过</button>
    <button class="btn-reject"  data-id="${row.id}">✕ 拒绝</button>
    <button class="btn-delete"  data-id="${row.id}">🗑 删除</button>
  ` : `
    <span class="status-badge ${row.status}">${row.status}</span>
    <button class="btn-delete" data-id="${row.id}">🗑 删除</button>
  `;

  d.innerHTML = `
    ${imgHtml}
    <div class="review-body">
      <span class="review-name">${esc(row.author_name)}</span>
      <span class="review-email">${esc(row.author_email)}</span>
      <p class="review-msg">${esc(row.message)}</p>
      <span class="review-date">${dateStr}</span>
    </div>
    <div class="review-actions">${actionsHtml}</div>
  `;

  d.querySelector('.btn-approve')?.addEventListener('click', () => approveEntry(row));
  d.querySelector('.btn-reject')?.addEventListener('click', () => openRejectModal(row.id, row.author_email, row.author_name));
  d.querySelector('.btn-delete')?.addEventListener('click', async () => {
    if (!confirm(`确认删除 ${row.author_name} 的投稿记录？`)) return;
    const { error } = await sb.from('guestbook').delete().eq('id', row.id);
    if (error) return alert('删除失败：' + error.message);
    d.remove();
  });
  return d;
}

async function approveEntry(row) {
  const { error } = await sb.from('guestbook').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', row.id);
  if (error) return alert('操作失败：' + error.message);
  // Email visitor (approved)
  emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateVisitorResult, {
    to_email:      row.author_email,
    result_subject: '✓ 你的投稿已展示在 KURO 的留言板',
    result_body:   `Hi ${row.author_name}，\n\n你的投稿已经通过审核，现在可以在留言板看到啊！\n\n感谢你留下的足迹 🙏\n— KURO`,
  }).catch(() => {});
  loadReview(document.querySelector('.ftab.active').dataset.status);
}

// Reject modal
document.getElementById('confirmReject').addEventListener('click', async () => {
  const reason = document.getElementById('rejectReason').value.trim();
  if (!reason) { alert('请填写拒绝原因'); return; }
  const row = window._rejectRow;
  const { error } = await sb.from('guestbook').update({ status: 'rejected', reject_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', row.id);
  if (error) return alert('操作失败：' + error.message);
  emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateVisitorResult, {
    to_email:      row.author_email,
    result_subject: '关于你的投稿申请',
    result_body:   `Hi ${row.author_name}，\n\n很遗憾，你的投稿这次未能通过审核。\n\n管理员留言：${reason}\n\n欢迎再次投稿，谢谢你的理解。\n— KURO`,
  }).catch(() => {});
  closeRejectModal();
  loadReview(document.querySelector('.ftab.active').dataset.status);
});

function openRejectModal(id, email, name) {
  window._rejectRow = { id, author_email: email, author_name: name };
  document.getElementById('rejectReason').value = '';
  document.getElementById('rejectModal').hidden = false;
}
function closeRejectModal() { document.getElementById('rejectModal').hidden = true; }
document.getElementById('cancelReject').addEventListener('click', closeRejectModal);

// ── Notes tab ─────────────────────────────────────────────────
async function loadNotes() {
  const list = document.getElementById('notesList');
  list.innerHTML = '<p class="empty-hint">加载中…</p>';
  const { data, error } = await sb.from('private_notes').select('*').order('created_at', { ascending: false });
  if (error || !data?.length) {
    list.innerHTML = `<p class="empty-hint">${error ? '加载失败' : '暂无小纸条'}</p>`;
    return;
  }
  const unread = data.filter(n => !n.is_read).length;
  const badge = document.getElementById('unreadBadge');
  if (unread > 0) { badge.textContent = unread; badge.hidden = false; }
  list.innerHTML = '';
  data.forEach(note => {
    const d = document.createElement('div');
    d.className = 'note-card' + (note.is_read ? '' : ' unread');
    d.innerHTML = `
      <div>
        <p class="note-from">来自 ${esc(note.author_name)} · ${new Date(note.created_at).toLocaleString('zh-CN')}</p>
        <p class="note-text">${esc(note.note)}</p>
      </div>
      <span class="note-date">${note.is_read ? '已读' : '未读'}</span>
    `;
    if (!note.is_read) {
      d.addEventListener('click', async () => {
        await sb.from('private_notes').update({ is_read: true }).eq('id', note.id);
        d.classList.remove('unread');
        d.querySelector('.note-date').textContent = '已读';
      });
    }
    list.appendChild(d);
  });
}

function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Photo library tab ─────────────────────────────────────────
const FIELD_LABELS = {
  title:'中文标题', title_en:'英文标题', location:'地点',
  date:'日期', description:'描述', category:'分类',
  orientation:'方向', featured:'精选', is_public:'访客可见'
};
const CAT_OPTS = ['nature','animals','people','other'];
const ORIENT_OPTS = ['landscape','portrait'];

async function loadMyPhotos() {
  const list    = document.getElementById('photosList');
  const countEl = document.getElementById('photoCount');
  list.innerHTML = '<p class="empty-hint">加载中…</p>';

  const { data, error } = await sb.from('owner_photos')
    .select('id,photo_url,title,title_en,location,date,description,category,orientation,featured,is_public,edit_history')
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback: retry without edit_history column (if not yet created)
    if (error.message?.includes('edit_history')) {
      const { data: d2, error: e2 } = await sb.from('owner_photos')
        .select('id,photo_url,title,title_en,location,date,description,category,orientation,featured')
        .order('created_at', { ascending: false });
      if (e2 || !d2?.length) {
        list.innerHTML = `<p class="empty-hint">${e2 ? '加载失败：'+e2.message : '暂无照片'}</p>`;
        return;
      }
      if (countEl) countEl.textContent = `(${d2.length})`;
      list.innerHTML = '';
      d2.forEach(p => list.appendChild(buildPhotoItem({ ...p, edit_history: [], is_public: true }, list, countEl)));
      return;
    }
    list.innerHTML = `<p class="empty-hint">加载失败：${error.message}</p>`;
    return;
  }
  if (countEl) countEl.textContent = `(${data.length})`;
  list.innerHTML = '';
  data.forEach(photo => list.appendChild(buildPhotoItem(photo, list, countEl)));
}

function buildPhotoItem(photo, list, countEl) {
  const wrap = document.createElement('div');
  wrap.className = 'photo-item';

  const history = Array.isArray(photo.edit_history) ? photo.edit_history : [];
  const meta = [photo.category, photo.location, photo.date].filter(Boolean).join(' · ');

  wrap.innerHTML = `
    <div class="photo-row">
      ${photo.photo_url
        ? `<img class="photo-row__thumb" src="${photo.photo_url}" alt="${esc(photo.title)}"/>`
        : `<div class="photo-row__thumb-empty">无图</div>`}
      <div class="photo-row__info">
        <span class="photo-row__title">${esc(photo.title)}${photo.title_en?' · '+esc(photo.title_en):''}${photo.featured?' ★':''}</span>
        <span class="photo-row__meta">${esc(meta)} <span class="vis-badge ${photo.is_public===false?'hidden-badge':'public-badge'}">${photo.is_public===false?'🔒 仅自己':'🌐 公开'}</span></span>
        <div class="photo-edit-form" hidden>
          <div class="edit-grid">
            <div class="ef"><label>中文标题 *</label><input name="title" value="${esc(photo.title)}"/></div>
            <div class="ef"><label>英文标题</label><input name="title_en" value="${esc(photo.title_en||'')}"/></div>
            <div class="ef"><label>地点</label><input name="location" value="${esc(photo.location||'')}"/></div>
            <div class="ef"><label>日期 (YYYY-MM)</label><input name="date" value="${esc(photo.date||'')}"/></div>
            <div class="ef full"><label>描述</label><textarea name="description" rows="2">${esc(photo.description||'')}</textarea></div>
            <div class="ef"><label>分类</label>
              <select name="category">${CAT_OPTS.map(o=>`<option value="${o}"${photo.category===o?' selected':''}>${o}</option>`).join('')}</select>
            </div>
            <div class="ef"><label>方向</label>
              <select name="orientation">${ORIENT_OPTS.map(o=>`<option value="${o}"${photo.orientation===o?' selected':''}>${o}</option>`).join('')}</select>
            </div>
            <div class="ef"><label>精选大图</label>
              <label class="toggle"><input type="checkbox" name="featured"${photo.featured?' checked':''}/><span>全宽展示</span></label>
            </div>
            <div class="ef"><label>访客可见</label>
              <label class="toggle"><input type="checkbox" name="is_public"${photo.is_public===false?'':' checked'}/><span>公开显示</span></label>
            </div>
          </div>
          <div class="edit-actions">
            <button class="action-btn btn-save-edit">💾 保存</button>
            <button class="modal-cancel btn-cancel-edit">取消</button>
            <span class="save-status"></span>
          </div>
        </div>
      </div>
      <div class="photo-row__actions">
        <button class="btn-edit-toggle">✏ 编辑</button>
        <button class="btn-vis-toggle">${photo.is_public === false ? '🔒 隐藏中' : '🌐 公开中'}</button>
        <button class="btn-delete">🗑 删除</button>
      </div>
    </div>
    <details class="photo-history"${!history.length?' hidden':''}>
      <summary>修改历史 (${history.length})</summary>
      <ul class="history-list">${renderHistory(history)}</ul>
    </details>
  `;

  // Toggle edit form
  const form    = wrap.querySelector('.photo-edit-form');
  const editBtn = wrap.querySelector('.btn-edit-toggle');
  editBtn.addEventListener('click', () => {
    const open = !form.hidden;
    form.hidden = open;
    editBtn.textContent = open ? '✏ 编辑' : '✕ 收起';
  });
  wrap.querySelector('.btn-cancel-edit').addEventListener('click', () => {
    form.hidden = true; editBtn.textContent = '✏ 编辑';
  });

  // Quick visibility toggle
  const visBtn = wrap.querySelector('.btn-vis-toggle');
  visBtn.addEventListener('click', async () => {
    const nowPublic = !(photo.is_public === false); // current state
    const next = !nowPublic;
    visBtn.disabled = true;
    const { error } = await sb.from('owner_photos').update({ is_public: next }).eq('id', photo.id);
    visBtn.disabled = false;
    if (error) { alert('切换失败：' + error.message); return; }
    photo.is_public = next;
    visBtn.textContent = next ? '🌐 公开中' : '🔒 隐藏中';
    visBtn.className = 'btn-vis-toggle ' + (next ? 'vis-on' : 'vis-off');
    // Update meta badge
    const metaSpan = wrap.querySelector('.photo-row__meta');
    const badge = metaSpan.querySelector('.vis-badge');
    if (badge) {
      badge.className = 'vis-badge ' + (next ? 'public-badge' : 'hidden-badge');
      badge.textContent = next ? '🌐 公开' : '🔒 仅自己';
    }
  });

  // Save edit
  wrap.querySelector('.btn-save-edit').addEventListener('click', async () => {
    const statusEl = wrap.querySelector('.save-status');
    const newData = {
      title:       form.querySelector('[name=title]').value.trim(),
      title_en:    form.querySelector('[name=title_en]').value.trim() || null,
      location:    form.querySelector('[name=location]').value.trim() || null,
      date:        form.querySelector('[name=date]').value.trim() || null,
      description: form.querySelector('[name=description]').value.trim() || null,
      category:    form.querySelector('[name=category]').value,
      orientation: form.querySelector('[name=orientation]').value,
      featured:    form.querySelector('[name=featured]').checked,
      is_public:   form.querySelector('[name=is_public]').checked,
    };
    if (!newData.title) { statusEl.textContent = '⚠ 标题不能为空'; return; }

    // Compute diff
    const fields = ['title','title_en','location','date','description','category','orientation','featured','is_public'];
    const changes = fields.flatMap(f => {
      const oldVal = photo[f] ?? null;
      const newVal = newData[f] ?? null;
      return String(oldVal) !== String(newVal)
        ? [{ field: FIELD_LABELS[f]||f, from: oldVal, to: newVal }]
        : [];
    });

    const updatedHistory = [...(Array.isArray(photo.edit_history)?photo.edit_history:[]),
      ...(changes.length ? [{ at: new Date().toISOString(), changes }] : [])
    ];

    statusEl.textContent = '保存中…';
    const { error } = await sb.from('owner_photos')
      .update({ ...newData, edit_history: updatedHistory })
      .eq('id', photo.id);

    if (error) { statusEl.textContent = '❌ ' + error.message; return; }

    // Update local data
    Object.assign(photo, newData, { edit_history: updatedHistory });
    statusEl.textContent = '✓ 已保存';
    form.hidden = true; editBtn.textContent = '✏ 编辑';

    // Refresh display
    wrap.querySelector('.photo-row__title').textContent =
      photo.title + (photo.title_en ? ' · '+photo.title_en : '') + (photo.featured ? ' ★' : '');
    const metaSpan = wrap.querySelector('.photo-row__meta');
    metaSpan.innerHTML = esc([photo.category, photo.location, photo.date].filter(Boolean).join(' · ')) +
      ` <span class="vis-badge ${photo.is_public===false?'hidden-badge':'public-badge'}">${photo.is_public===false?'🔒 仅自己':'🌐 公开'}</span>`;

    // Update history panel
    const det = wrap.querySelector('.photo-history');
    if (updatedHistory.length) {
      det.hidden = false;
      det.querySelector('summary').textContent = `修改历史 (${updatedHistory.length})`;
      det.querySelector('.history-list').innerHTML = renderHistory(updatedHistory);
    }
  });

  // Delete
  wrap.querySelector('.btn-delete').addEventListener('click', async () => {
    if (!confirm(`确认删除「${photo.title}」？此操作不可恢复。`)) return;
    const { error } = await sb.from('owner_photos').delete().eq('id', photo.id);
    if (error) return alert('删除失败：' + error.message);
    wrap.remove();
    const countEl2 = document.getElementById('photoCount');
    const rem = document.getElementById('photosList').querySelectorAll('.photo-item').length;
    if (countEl2) countEl2.textContent = `(${rem})`;
  });

  return wrap;
}

function renderHistory(history) {
  if (!history.length) return '';
  return [...history].reverse().map(entry => {
    const dt = new Date(entry.at).toLocaleString('zh-CN');
    const desc = entry.changes.map(c =>
      `<em>${c.field}</em>: ${c.from ?? '(空)'} → ${c.to ?? '(空)'}`
    ).join('；');
    return `<li class="history-entry"><span class="history-time">${dt}</span><span class="history-desc">${desc}</span></li>`;
  }).join('');
}

