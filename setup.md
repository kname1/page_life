# Setup Guide — 服务注册 & 配置指南

## 总览

你需要注册三个免费服务，每个大约 5 分钟：

| 服务 | 用途 | 网址 |
|------|------|------|
| Cloudinary | 图片存储 & CDN | cloudinary.com |
| Supabase | 数据库（元数据 + 留言） | supabase.com |
| EmailJS | 发送通知邮件 | emailjs.com |

---

## Step 1 — Cloudinary

1. 注册 → Dashboard → 右上角找到 `Cloud Name`，填入 `config.js`
2. 左侧菜单 → **Settings → Upload**
3. 滚到 **Upload presets** → **Add upload preset**
   - **Owner preset**（你自己上传用）：
     - Signing mode: `Unsigned`
     - 名字填 `owner_uploads`（或任意）
   - **Guest preset**（访客用）：
     - Signing mode: `Unsigned`  
     - Max file size: `5000000`（5MB）
     - 名字填 `guest_uploads`
4. 把两个 preset 名字填入 `config.js`

---

## Step 2 — Supabase

1. 注册 → **New project**（选离你最近的区域，推荐 Singapore）
2. **Project Settings → API** → 复制 `URL` 和 `anon public key` 填入 `config.js`
3. 左侧 **SQL Editor** → 运行以下 SQL 建表（如果表已存在，只需跑后半段 RLS 部分）：

```sql
-- ── 建表（首次运行）──────────────────────────────────────────────
create table if not exists owner_photos (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  photo_url text not null,
  title text not null,
  title_en text,
  location text,
  date text,
  description text,
  category text default 'nature',
  featured boolean default false,
  orientation text default 'landscape',
  is_public boolean default true,
  edit_history jsonb default '[]'::jsonb
);

create table if not exists guestbook (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  author_name text not null,
  author_email text not null,
  message text not null,
  photo_url text,
  status text default 'pending',
  reject_reason text,
  reviewed_at timestamptz
);

create table if not exists private_notes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  author_name text not null,
  note text not null,
  is_read boolean default false
);

-- ── 开启 RLS ────────────────────────────────────────────────────
alter table owner_photos   enable row level security;
alter table guestbook      enable row level security;
alter table private_notes  enable row level security;

-- ── 删除旧的全开放策略（升级用）────────────────────────────────
DROP POLICY IF EXISTS "all_owner_photos"  ON owner_photos;
DROP POLICY IF EXISTS "all_guestbook"     ON guestbook;
DROP POLICY IF EXISTS "all_private_notes" ON private_notes;

-- ── 新的严格安全策略 ────────────────────────────────────────────

-- owner_photos：访客只能看 is_public=true 的，管理员登录后可做任何操作
CREATE POLICY "Public photos viewable by everyone" ON owner_photos
  FOR SELECT USING (is_public = true);
CREATE POLICY "Admin full access to photos" ON owner_photos
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- guestbook：任何人可以投稿(INSERT)；访客可看 approved 的；管理员可做任何操作
CREATE POLICY "Anyone can submit guestbook" ON guestbook
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Approved entries viewable by everyone" ON guestbook
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Admin full access to guestbook" ON guestbook
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- private_notes：任何人可投递；只有管理员可读取和管理
CREATE POLICY "Anyone can insert private notes" ON private_notes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admin can manage private notes" ON private_notes
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

4. 左侧 **Authentication → Users** → **Add user → Create new user**
   - 填入你的邮箱（如 `kurobalt26@gmail.com`）和一个强密码
   - 这就是你登录管理后台的凭证
   - （可选）**Authentication → Settings** → 关闭 "Enable email confirmations" 让账号立即生效

> **说明**：无需在代码里存储密码或哈希值。Supabase Auth 负责安全验证，RLS 策略确保即使访客拿到 `anonKey` 也无法执行增删改操作。


---

## Step 3 — EmailJS

1. 注册 → **Add New Service** → 选 Gmail → 连接 `kurobalt26@gmail.com`
2. 记下 **Service ID** 填入 `config.js`
3. **Email Templates** → 创建 3 个模板：

### 模板 1: `template_admin_notify`（新投稿通知你）
- To: `kurobalt26@gmail.com`
- Subject: `📸 新的访客投稿申请 — {{author_name}}`
- Body:
```
收到新的访客留言板投稿，待你审核：

姓名：{{author_name}}
邮箱：{{author_email}}
留言：{{message}}
{{#photo_url}}图片：{{photo_url}}{{/photo_url}}

前往管理页面审核：{{admin_url}}
```

### 模板 2: `template_visitor_result`（通知访客审核结果，通过/拒绝复用同一个）
- **To**: `{{to_email}}`
- **Subject**: `{{result_subject}}`
- **Body**: `{{result_body}}`

> 内容由代码动态生成传入，模板本身只需这三个变量占位即可。

4. **Account → General** → 复制 **Public Key** 填入 `config.js`

---

## Step 4 — 配置 config.js

```bash
cp config.example.js config.js
# 编辑 config.js，填入上面收集的所有值
```

确保 `.gitignore` 包含：
```
config.js
```

---

## Step 5 — 本地测试

```bash
cd /Users/kuro/code/llf_web
python3 -m http.server 8080
# 打开 http://localhost:8080/admin.html
```
