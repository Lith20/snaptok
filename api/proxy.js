// api/proxy.js
// وسيط آمن يخفي مفتاح TikWM عن المتصفح

export default async function handler(req, res) {
  // ===== CORS =====
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ===== قراءة الرابط =====
  const url = req.method === 'GET' ? req.query.url : req.body?.url;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'الرجاء إرسال رابط TikTok' });
  }

  // ===== التحقق من صحة الرابط =====
  if (!/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(url)) {
    return res.status(400).json({ error: 'الرابط ليس رابط TikTok صالح' });
  }

  // ===== قراءة المفتاح من متغيرات البيئة =====
  const API_KEY = process.env.TIKWM_KEY;

  if (!API_KEY) {
    console.error('TIKWM_KEY غير مُعرّف في متغيرات البيئة');
    return res.status(500).json({ error: 'خطأ في تكوين الخادم' });
  }

  // ===== استدعاء TikWM =====
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&key=${API_KEY}`;

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SnapTok/1.0)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: 'فشل الاتصال بخادم TikWM' });
    }

    const data = await response.json();

    // ===== تمرير الاستجابة كما هي =====
    return res.status(200).json(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'انتهت مهلة الاتصال' });
    }
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: 'خطأ غير متوقع في الخادم' });
  }
}
