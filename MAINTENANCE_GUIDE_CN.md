# PaperInsight 维护与部署指南

本文档旨在指导如何维护 PaperInsight 的开源版本以及如何将其部署为商业化（SaaS）服务。

## 1. 项目结构说明

- `src/`: 前端 React 代码 (Vite)。
- `api/`: 后端 Express 代码 & Inngest 函数。
- `supabase/`: 数据库 Migration 文件。
- `scripts/`: 维护脚本（如测试 DB）。

## 2. 环境变量管理 (Key Security)

**严禁**将 `.env` 文件提交到 Git 仓库。
请复制 `.env.example` 为 `.env` 并填入你的真实 Key。

| 变量名 | 说明 | 部署设置位置 |
|--------|------|--------------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | Vercel Environment Variables |
| `VITE_SUPABASE_ANON_KEY` | Supabase 公钥 (可公开) | Vercel Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 私钥 (**绝对保密**) | Vercel Environment Variables |
| `OPENAI_API_KEY` | LLM 调用 Key | Vercel Environment Variables |
| `INNGEST_EVENT_KEY` | Inngest 连接 Key | Vercel Environment Variables |
| `INNGEST_SIGNING_KEY` | Inngest 签名 Key | Vercel Environment Variables |

## 3. 部署到 Vercel (SaaS 模式)

### 3.1 前置准备
1. **Supabase 项目**:
   - 创建新项目。
   - 在 SQL Editor 中运行 `supabase/migrations/` 下的所有 SQL 文件以初始化表结构。
   - **关键**: 确保启用 Storage，并创建一个名为 `papers` 的 Public Bucket（或 Private 但配置好 Signed URL）。
2. **Inngest 账号**:
   - 注册 Inngest 并连接 Vercel 项目。

### 3.2 部署步骤
1. **Fork/Clone** 本项目到你的 GitHub。
2. 在 Vercel 中 **Import Project**。
3. **配置环境变量** (参考第2节)。
4. **Deploy**。

### 3.3 权限与管理功能
为了实现“管理员可控，用户受限”的功能，本项目采用了 Supabase RLS (Row Level Security) 和自定义业务逻辑。

- **管理员账号**:
  - 在 `profiles` 表中，将你的用户 ID 对应的 `role` 字段设置为 `admin`。
  - 前端 `/admin` 页面会自动检查此权限（需配合后端 Middleware 增强安全性）。

- **用户限制**:
  - 普通用户无法触发 Arxiv 爬虫。
  - 普通用户上传论文仅对自己可见（通过 RLS `user_id = auth.uid()` 实现）。

## 4. 如何维护开源项目 vs 部署项目

建议采用 **“上游优先” (Upstream First)** 的策略：

1. **GitHub 仓库管理**:
   - `main` 分支：保持纯净的开源版本，功能通用，不含特定商业逻辑限制。
   - `deploy` 分支（可选）：包含特定的商业化配置（如支付集成、复杂的额度限制代码）。

2. **日常开发**:
   - 所有通用 Bug 修复和新功能（如“更好的 PDF 解析”）都在 `main` 分支进行。
   - 定期将 `main` 合并到 `deploy` 分支。

3. **用户反馈**:
   - 如果用户在开源社区提 Issue，优先在 `main` 修复。
   - 如果是部署环境特有的问题（如 Vercel 具体的超时问题），可在 `deploy` 分支通过 `vercel.json` 配置解决。

## 5. 常见问题 (FAQ)

**Q: 为什么 Vercel 上爬虫任务没执行？**
A: Vercel Serverless 函数有执行时长限制（默认 10s-60s）。如果爬虫任务很长，Inngest 会自动将其拆分为后台任务，但请确保 Inngest 的 Production URL 配置正确。

**Q: PDF 解析失败？**
A: 本地开发使用了 Python 服务。在 Vercel 上，建议使用 Node.js 的 `pdf-parse` 作为 Fallback，或者部署一个独立的 Python 微服务（如 Flask/FastAPI on Railway/Render）来处理重型 PDF 解析。

**Q: 数据库权限报错？**
A: 检查 Supabase 的 RLS Policy。特别是 `user_candidates` 表，确保 `insert` 和 `select` 策略包含 `auth.uid() = user_id`。
