# KURO - 个人学术与摄影主页 (Minimalist Portfolio)

这是一个极简、黑白为主辅以森林绿点缀的个人学术与摄影展示网站。项目采用纯前端架构，通过无服务器 (Serverless) 的方式集成了数据库、图片存储和邮件通知功能。

## 🌟 核心功能

*   **极简响应式设计**：Editorial 杂志排版风格，全端（PC/移动端）适配。
*   **个人照片库**：展示个人摄影作品，瀑布流列表，支持点击查看大图。
*   **访客留言板**：访客可以提交留言及上传附图（客户端自动压缩）。
*   **管理后台**：通过 SHA-256 哈希校验安全登录，支持照片管理（增删改、公开状态控制）、投稿审核、查看私密小纸条。
*   **邮件通知**：整合 EmailJS，当访客提交留言时提醒管理员，当管理员审核通过/拒绝时邮件通知访客。
*   **客户端图片压缩**：前端使用 Canvas 技术，无论上传多大的原图均能在客户端秒级压缩并上传至图床，保证流畅体验。

## 🛠 技术栈

*   **前端**：原生 HTML5 + CSS3 (CSS Variables, Grid/Flexbox) + Vanilla JavaScript
*   **数据库**：[Supabase](https://supabase.com/) (PostgreSQL) - 存储照片元数据、留言记录等
*   **图床**：[Cloudinary](https://cloudinary.com/) - 存储优化后的照片文件
*   **通知**：[EmailJS](https://www.emailjs.com/) - 触发邮件通知
*   **图标与字体**：Google Fonts (Inter, JetBrains Mono)

## 📂 目录结构

```text
llf_web/
├── index.html           # 首页 (个人简介、经历等)
├── about.html           # 关于页面
├── photography.html     # 摄影作品展示页
├── guestbook.html       # 访客留言板
├── admin.html           # 隐藏的管理后台
├── config.js            # API 密钥及环境配置文件
├── config.example.js    # config.js 的配置模板
├── setup.md             # 数据库表结构、EmailJS模板搭建等配置指南
├── css/                 # 样式文件目录
│   ├── style.css        # 全局与前台样式
│   ├── guestbook.css    # 留言板专属样式
│   └── admin.css        # 管理后台样式
├── js/                  # 逻辑控制目录
│   ├── main.js          # 导航栏交互、移动端菜单等通用逻辑
│   ├── gallery.js       # 摄影页瀑布流与数据获取
│   ├── guestbook.js     # 留言提交、客户端压缩与上传逻辑
│   └── admin.js         # 后台登录、照片增删改查、审核、权限管理
└── data/                # 静态数据备用目录
    └── photos.js        # 照片数据的静态 fallback，若 Supabase 未配置可使用
```

## 🚀 部署与运行指南

### 1. 本地运行开发服务

由于项目使用了 ES6 Modules 和 Fetch API，必须通过 HTTP Server 运行（不能直接双击打开 HTML）。

**常用命令 (Python 3)**:
```bash
# 在项目根目录执行，启动本地测试服务器
python3 -m http.server 8080
```
启动后在浏览器访问：
*   前台：`http://localhost:8080`
*   后台：`http://localhost:8080/admin.html`

### 2. 环境配置

项目中所有的私密配置均存放在 `config.js` 中。请参考 `config.example.js`，在 `config.js` 填入你自己的 API Key：
*   **Supabase**：`url` 和 `anonKey`
*   **Cloudinary**：`cloudName` 和两个 Upload Presets（一个给你自己，一个给访客）
*   **EmailJS**：`publicKey`, `serviceId`, 以及对应模板 ID
*   **后台密码**：填写通过 SHA-256 计算出的哈希值（例如 `kuro2025` 对应的 hash）

> 详细的数据库建表 SQL 语句和 EmailJS 模板变量设置，请参阅 `setup.md` 文件。

### 3. 生产环境部署

本项目完全由静态文件构成（无需 Node.js 后端），可以零成本部署到各大静态托管平台：
*   **GitHub Pages** (推荐)
*   **Vercel**
*   **Netlify**
*   **Cloudflare Pages**

只需将整个仓库 push 上去并将其设为静态网站根目录即可。

## 🔐 后台管理系统使用说明

管理后台入口为 `/admin.html`。
*   **登录**：输入在 `config.js` 中配置好的密码即可进入。
*   **📷 上传照片**：你可以填写摄影地点、描述、分类等，勾选“精选大图”会在前台跨两列全宽显示。勾选“访客可见”即可立即在前台展示。
*   **🖼 照片库**：列出你已上传的所有照片。你可以一键开启/隐藏图片的访客可见状态，可以点击“✏ 编辑”修改所有文字信息并保留修改历史，或者彻底“🗑 删除”。
*   **⏳ 审核投稿**：在此查看所有访客留言。可选择“✓ 通过”或“✕ 拒绝”。操作时会自动发邮件给对方。同时带有删除按钮管理脏数据。
*   **✉ 小纸条**：查看不希望公开，仅发送给你的私人留言。

## 🎨 样式定制

全站主题色、间距和字体等统一定义在 `css/style.css` 开头的 `:root` CSS 变量中。
若需修改主色调（目前为黑白+森林绿），只需修改此处变量：
```css
:root {
  --green: #3A6B48;      /* 核心绿色 */
  --green-lt: #E8F5E9;   /* 浅绿背景 */
  --bg: #FAFAFA;         /* 全局背景色 */
  --text: #111111;       /* 主要文字色 */
}
```
