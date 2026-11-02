# GoldList Vocab · 黄金列表法英语词汇长时记忆手账

基于语言学家 David James（Uncle Davey）的 **黄金列表法（Gold List Method）** 打造的深度词汇长时记忆 Web 系统。

专为将学过的 2,503 个单词在接下来的数周内通过潜意识沉淀与四象限层层蒸馏，转化为真正稳固的长时永久记忆。支持零成本部署于 **Cloudflare Pages**。

---

## 🌟 核心理念：为什么选择黄金列表法？

传统的死记硬背（Cramming）依靠高压力的**短时工作记忆**，数天内看似记住，但遗忘率呈断崖式下跌，且极易产生厌学情绪。

黄金列表法的科学哲学是：
1. **彻底摒弃背诵压力**：接触单词时只专注阅读、跟读真实原生发音与手写，不对大脑下达“必须记住”的强迫指令。
2. **强制休眠沉淀期（Cooldown Period）**：初始列表（Headlist）建立后，必须放置至少 **14 天（冲刺模式可设为 7 天）** 期间不接触该列表，让浅层的短时记忆完全代谢消散。
3. **四象限层层精炼（Distillation）**：
   - 📜 **象限 A · 原始列表 (Headlist)**：每页固定 20 词。
   - 🥉 **象限 B · 铜级蒸馏 (D1)**：休眠后测试，自然记住约 30% 词汇（直接沉淀至永久长时记忆），将未记住的 ~70%（约 14 词）誊写至象限 B。
   - 🥈 **象限 C · 银级蒸馏 (D2)**：再度休眠后测试，将剩余未记住的 70%（约 10 词）提炼至象限 C。
   - 🥇 **象限 D · 金级蒸馏 (D3)**：第三轮休眠测试，攻坚最后最具抗性的 ~7 词。
   - 💎 **长时记忆金库 (Mastered Vault)**：所有在各阶段自然吸收的词汇永久归档。

---

## 🚀 项目特性

- 📖 **仿真四象限黄金手账本**：完美复刻经典物理手账纸张质感、横线排版与四象限空间流转。
- 🎧 **原声真实发音**：无缝播放 `English.json` 中原生 Cloudfront 高品质真人音频（断网时智能回退至 Web Speech API）。
- ⚡ **沉浸式低焦虑蒸馏卡片**：支持盲测、发音、快速翻转释义，实时统计蒸馏比例，黄金比例心理反馈。
- 📊 **智能日程与学习进度追踪**：根据你设定的目标周数（如 4 周冲刺），智能计算每日推荐开启新页数与今日待蒸馏任务。
- 🔍 **2,503 词全库毫秒级检索**：随时查找单词、查看所属手账页码与当前蒸馏阶段。
- 💾 **无感持久化与安全备份**：利用浏览器高容量 IndexedDB 存储，支持一键导出/导入 JSON 备份文件。
- ☁️ **Cloudflare Pages 零成本极速部署**：纯前端 SPA 静态架构，免服务器运维，全球 CDN 节点秒开。

---

## 💻 本地运行与开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动本地开发服务
pnpm dev

# 3. 生产打包构建
pnpm build
```

---

## ☁️ 部署到 Cloudflare Pages 指南

本项目专为 Cloudflare Pages 量身设计，已包含 `wrangler.toml`、`public/_headers` 与安全配置。

### 方式 A：GitHub 自动集成部署（推荐）

1. 将本项目推送到你的 GitHub 仓库：
   ```bash
   git init
   git add .
   git commit -m "feat: goldlist vocab project"
   git remote add origin <你的GitHub仓库地址>
   git push -u origin main
   ```
2. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，在左侧导航栏点击 **Workers & Pages**。
3. 点击 **Create application** -> **Pages** -> **Connect to Git**。
4. 选中你的 GitHub 仓库，并在构建配置中填写：
   - **Framework preset**: `Vite`
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
5. 点击 **Save and Deploy**，1分钟内即可获得专属全球加速域名（如 `https://xxx.pages.dev`）！

### 方式 B：使用 Wrangler CLI 命令行一键部署

```bash
# 1. 构建打包静态资源
pnpm build

# 2. 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name goldlist-vocab
```

---

## 📅 接下来几周内彻底巩固 2,503 词的执行节奏建议

1. **设置调整**：点击右上角设置 ⚙️，将沉淀期设为 **7 天（快速巩固推荐）**，目标周数设为 **4 周**。
2. **每日节奏**：
   - 每天翻开手账本，新浏览并跟读 **4~5 页**（约 80~100 词）原始列表。
   - 打开看板，处理当天休眠期满的待蒸馏任务（每次只需 3~5 分钟）。
3. **保持放松心态**：遇到记不住的单词，坦然点击“✍️ 需继续蒸馏”；记住 30% 遗忘 70% 是大脑长时记忆成型的健康规律。4 周后，整本词库将扎实沉淀入潜意识！
