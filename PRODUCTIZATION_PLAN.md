# PaperInsight 产品化与部署规划

## 1. 项目概述
PaperInsight 是一个基于 AI 的论文原子化解析与合成工具。为了将其开源并商业化部署（SaaS模式），需要进行以下改造：
- **开源版**：易于本地运行，配置简单。
- **部署版 (SaaS)**：多用户支持、权限管理、额度控制、Serverless 适配。

## 2. 核心任务规划

### Phase 1: 基础设施适配 (Vercel Ready)
由于 Vercel 是 Serverless 环境，不支持持久化文件系统和长驻进程：
1. **移除本地文件存储**：
   - 将 `api/routes/upload.ts` 的本地 `uploads/` 改为 **Supabase Storage**。
   - 更新 Inngest 函数以从 URL 读取 PDF，而非本地路径。
2. **Python 服务 Serverless 化**：
   - 将 `api/parse-pdf.py` 改造为 Vercel Python Function (`api/index.py` 或独立服务)。
   - 或者（推荐）为了部署简单，提供 Node.js 版的 PDF 解析 fallback（使用 `pdf-parse`），减少对 Python Runtime 的强依赖，除非 PyMuPDF 效果显著更好（目前看 PyMuPDF 更好，尝试在 Vercel 上部署 Python Runtime）。
3. **API 路由适配**：
   - 确保 Express App 可以通过 `vercel.json` 正确代理。

### Phase 2: 用户体系与权限 (Supabase)
1. **数据库 Schema 更新**：
   - 新增 `profiles` 表：存储 `role` (admin/user), `subscription_tier`, `synthesis_count`。
   - 新增 `crawler_logs` 表（可选）：记录爬虫操作。
2. **权限控制 (RLS & Middleware)**：
   - **Admin Only**: 爬虫触发接口 (`/api/crawler/*`)。
   - **User Limits**: 限制每日/总共的合成 (`/api/synthesize`) 次数。
   - **Storage Policies**: 用户只能上传/读取自己的 PDF。

### Phase 3: 开源文档与配置
1. **README.md**:
   - 项目介绍、技术栈。
   - 本地开发指南 (Env setup)。
   - 部署指南 (One-click Vercel deploy)。
2. **环境隔离**:
   - 明确 `.env.example`，确保敏感 Key 不泄露。

## 3. 部署架构 (Vercel)

```mermaid
graph TD
    User[用户] --> Frontend[Vercel Frontend (Vite/React)]
    Frontend --> API[Vercel Serverless Functions (Node.js/Express)]
    API --> Auth[Supabase Auth]
    API --> DB[Supabase DB (Postgres)]
    API --> Storage[Supabase Storage (PDFs)]
    API --> Inngest[Inngest (Background Jobs)]
    Inngest --> LLM[OpenAI / LLM API]
    API -- "Trigger" --> Inngest
```

## 4. 维护与管理
- **开源维护**：主要维护 `main` 分支，保持通用性。
- **商业部署**：建议维护一个 `deploy/vercel` 分支或使用环境变量区分功能（如 `ENABLE_SAAS_LIMITS=true`）。

## 5. 详细执行步骤
1. [x] 功能开发完成 (Core Features Done)
2. [ ] 编写 `MAINTENANCE_GUIDE_CN.md` (维护文档)
3. [ ] 编写 `README.md` (开源文档)
4. [ ] 改造 Upload -> Supabase Storage
5. [ ] 添加 `profiles` 表和 RLS 策略
6. [ ] 部署测试
