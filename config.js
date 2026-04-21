/**
 * config.js — 本地占位配置（填入真实凭证后删除此注释）
 * 详细注册步骤见 setup.md
 */
const CONFIG = {
  cloudinary: {
    cloudName: 'dsctfloeo',
    ownerUploadPreset: 'owner_uploads',
    guestUploadPreset: 'guest_uploads',
  },
  supabase: {
    url: 'https://hhygvfgfhtcsqqhichnt.supabase.co',
    anonKey: 'sb_publishable_5ErrEFOHV0hsny8N8LkDVA_DUUPCsga',
  },
  emailjs: {
    publicKey: 'xefcWQgg16zZ4FyBq',
    serviceId: 'service_b463bs7',
    templateAdminNotify: 'template_v3i9y79',
    templateVisitorResult: 'template_1fj9vuj',
  },
  admin: {
    email: 'kurobalt26@gmail.com',
    // 密码在 Supabase Authentication 后台设置，无需在此配置
  },
};
