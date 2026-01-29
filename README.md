# PaperInsight

**PaperInsight** 是一个智能论文阅读助手，它将论文拆解为“原子”（Motivation, Idea, Method），帮助研究人员快速筛选、组合和综合新的研究思路。

![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 核心功能

- **原子化解析**: 自动从 PDF 中提取 Motivation, Idea, Method 三类核心信息。
- **Arxiv 爬虫**: 支持按分类（如 `cs.AI`）自动或手动抓取最新论文。
- **智能合成**: 基于选中的论文原子，利用 LLM 生成新的研究思路报告。
- **知识库管理**: 个人收藏夹与全局原子库。
- **多模态支持**: (开发中) 支持图表解析。

## 🛠️ 技术栈

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Express.js, Inngest (Background Jobs)
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI API (GPT-4/3.5)
- **PDF Parsing**: Python (PyMuPDF) / Node.js

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/PaperInsight.git
cd PaperInsight
```

### 2. 环境配置

复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

**必填配置项** (`.env`):

```ini
# Supabase 配置 (必须)
# 为什么需要 Supabase? 
# PaperInsight 使用 pgvector 存储论文向量和原子数据，以及 Supabase Auth 进行用户管理。
# 个人使用可直接申请免费的 Supabase Cloud 账号。
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI 模型配置 (必须)
# 支持 OpenAI 官方或任何兼容 OpenAI 协议的服务商 (如 DeepSeek, OpenRouter)
OPENAI_API_KEY=sk-xxxx
OPENAI_BASE_URL=https://api.openai.com/v1

# 模型选择
EXTRACTOR_MODEL_NAME=gpt-3.5-turbo   # 用于论文解析 (速度快)
SYNTHESIZER_MODEL_NAME=gpt-4o        # 用于合成报告 (质量高)

# Inngest 配置 (后台任务)
# 本地开发默认值即可
INNGEST_EVENT_KEY=local_dev_key
INNGEST_SIGNING_KEY=local_dev_key
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发环境

我们使用 `concurrently` 同时启动前端、后端和 Inngest：

```bash
npm run dev
```

访问:
- Web UI: `http://localhost:5173`
- Inngest Dashboard: `http://localhost:8288`

## 🐳 部署 (Vercel)

本项目支持一键部署到 Vercel。

1. **Fork** 本仓库。
2. 在 Vercel 中导入项目。
3. 在 Vercel 后台配置环境变量 (参考 `.env.example`)。
4. 确保连接了 Supabase 数据库。
5. 部署！

## 📚 维护指南

关于如何维护本项目以及商业化部署的详细说明，请参考 [MAINTENANCE_GUIDE_CN.md](./MAINTENANCE_GUIDE_CN.md)。

## 📄 License

MIT
