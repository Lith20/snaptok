# SnapTok — TikTok Downloader

موقع بسيط لتنزيل فيديوهات TikTok بدون علامة مائية، يعمل على الهاتف والحاسوب.

## البنية

- `api/proxy.js` — دالة خادمية على Vercel تخفي مفتاح TikWM
- `public/` — الواجهة الأمامية (HTML/CSS/JS نقية)
- `vercel.json` — إعدادات النشر

## النشر على Vercel

1. ارفع المشروع إلى GitHub
2. اذهب إلى vercel.com → Add New Project → استورد المستودع
3. في Settings → Environment Variables أضف:
   - `TIKWM_KEY` = مفتاحك
4. اضغط Deploy

## التطوير المحلي

```bash
npm install -g vercel
vercel dev
