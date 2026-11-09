// ===== التكوين =====
// المسار النسبي يعمل تلقائياً على Vercel
const API_ENDPOINT = '/api/proxy';

// ===== العناصر =====
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

// ===== التحقق من الرابط =====
function isValidTikTokUrl(url) {
  return /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(url);
}

// ===== الحالة =====
function showStatus(msg, isError = false, showSpinner = false) {
  statusEl.innerHTML = showSpinner
    ? `<span class="spinner"></span>${msg}`
    : msg;
  statusEl.className = isError ? 'error' : '';
  statusEl.classList.remove('hidden');
}

function hideStatus() {
  statusEl.classList.add('hidden');
}

// ===== اللصق =====
pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      urlInput.value = text.trim();
      urlInput.focus();
    }
  } catch {
    showStatus('تعذّر الوصول إلى الحافظة، الصق يدوياً', true);
    setTimeout(hideStatus, 2500);
  }
});

// ===== التنزيل =====
downloadBtn.addEventListener('click', handleDownload);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleDownload();
});

async function handleDownload() {
  const url = urlInput.value.trim();

  if (!url) {
    showStatus('الرجاء إدخال رابط', true);
    return;
  }

  if (!isValidTikTokUrl(url)) {
    showStatus('الرابط ليس رابط TikTok صالح', true);
    return;
  }

  resultEl.classList.add('hidden');
  downloadBtn.disabled = true;
  showStatus('جاري تحليل الفيديو...', false, true);

  try {
    const res = await fetch(`${API_ENDPOINT}?url=${encodeURIComponent(url)}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل الاتصال بالخادم');
    }

    const json = await res.json();

    if (json.code !== 0 || !json.data) {
      throw new Error(json.msg || 'تعذّر تحليل الرابط. تأكد أن الحساب عام.');
    }

    renderResult(json.data);
    hideStatus();
  } catch (err) {
    showStatus('❌ ' + err.message, true);
    // اقتراح للمستخدم عند فشل الروابط القصيرة
    if (err.message.includes('تحليل')) {
      setTimeout(() => {
        showStatus('💡 جرب الانتظار 3 ثوانٍ ثم إعادة المحاولة');
      }, 2000);
    }
  } finally {
    downloadBtn.disabled = false;
  }
}

// ===== العرض =====
function renderResult(data) {
  const {
    title = 'فيديو TikTok',
    cover = '',
    play = '',
    music = '',
    author = {},
    play_count = 0,
    digg_count = 0,
    comment_count = 0,
  } = data;

  const formatNum = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  };

  const fixUrl = (u) => (u.startsWith('http') ? u : `https://www.tikwm.com${u}`);

  const videoUrl = fixUrl(play);
  const coverUrl = fixUrl(cover);
  const avatarUrl = author.avatar ? fixUrl(author.avatar) : '';

  resultEl.innerHTML = `
    <div class="result-card">
      <video
        class="video-preview"
        src="${videoUrl}"
        poster="${coverUrl}"
        controls
        playsinline
        preload="metadata"
      ></video>

      <div class="author-info">
        ${avatarUrl ? `<img class="author-avatar" src="${avatarUrl}" alt="" onerror="this.style.display='none'">` : ''}
        <div>
          <div class="author-name">@${author.unique_id || 'unknown'}</div>
          <div class="author-role">${author.nickname || ''}</div>
        </div>
      </div>

      <div class="title-text">${escapeHtml(title)}</div>

      <div class="stats">
        <span>▶️ ${formatNum(play_count)}</span>
        <span>❤️ ${formatNum(digg_count)}</span>
        <span>💬 ${formatNum(comment_count)}</span>
      </div>

      <div class="download-options">
        <a class="dl-btn" href="${videoUrl}" download="tiktok-video.mp4" target="_blank" rel="noopener">
          <span class="icon">🎬</span>
          <span class="label">تحميل الفيديو (بدون علامة مائية)</span>
          <span class="arrow">⬇</span>
        </a>

        ${music ? `
        <a class="dl-btn" href="${fixUrl(music)}" download="tiktok-audio.mp3" target="_blank" rel="noopener">
          <span class="icon">🎵</span>
          <span class="label">تحميل الصوت (MP3)</span>
          <span class="arrow">⬇</span>
        </a>
        ` : ''}

        <a class="dl-btn" href="${coverUrl}" download="tiktok-cover.jpg" target="_blank" rel="noopener">
          <span class="icon">🖼️</span>
          <span class="label">تحميل صورة الغلاف</span>
          <span class="arrow">⬇</span>
        </a>
      </div>
    </div>
  `;

  resultEl.classList.remove('hidden');
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== حماية من XSS =====
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}