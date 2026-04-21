/**
 * config.example.js
 *
 * 使用方法：
 *   1. 复制此文件，重命名为 config.js
 *   2. 填入你的真实凭证
 *   3. 在 .gitignore 中确保 config.js 被忽略（不上传 GitHub）
 *
 * 详细注册步骤见 setup.md
 */
const CONFIG = {

  // ── Cloudinary（图片存储 CDN）─────────────────────────────
  // 注册: https://cloudinary.com (免费)
  cloudinary: {
    cloudName:          'YOUR_CLOUD_NAME',       // Dashboard 右上角
    ownerUploadPreset:  'YOUR_OWNER_PRESET',     // 你上传照片用（不限大小）
    guestUploadPreset:  'YOUR_GUEST_PRESET',     // 访客上传用（5MB 限制，在 Cloudinary 后台设置）
  },

  // ── Supabase（数据库）────────────────────────────────────
  // 注册: https://supabase.com (免费)
  supabase: {
    url:     'https://xxxxxxxxxxxx.supabase.co', // Project Settings > API
    anonKey: 'YOUR_SUPABASE_ANON_KEY',           // Project Settings > API
  },

  // ── EmailJS（发送通知邮件）──────────────────────────────
  // 注册: https://emailjs.com (免费 200封/月)
  emailjs: {
    publicKey:                'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId:                'YOUR_SERVICE_ID',
    templateAdminNotify:      'template_admin_notify',   // 新投稿通知管理员
    templateVisitorAccepted:  'template_visitor_accepted', // 告知访客已通过
    templateVisitorRejected:  'template_visitor_rejected', // 告知访客已拒绝
  },

  // ── 管理员信息 ────────────────────────────────────────────
  admin: {
    email: 'kurobalt26@gmail.com',  // 收通知邮件 & Supabase Auth 登录邮箱
  },
};
