# codex 项目记忆文件 (Project Context Memory)

这是为 codex AI 助手的后续会话所保留的专属记忆与行为准则设置文件。在每次启动或深度开发时，应参考此处的信息。

## 1. 核心指令：始终获取最新文档 (Context7)
为了防止 AI 的历史数据幻觉或生成了旧版废弃框架的代码，本项目规定：
- 当涉及复杂或容易发生版本迭代的技术栈（如 React、Prisma、Tailwind UI 库或特定 API 接入）时，**必须优先使用 `context7` 工具去检索最新文档**。

### 如何通过 Antigravity 触发 Context7
虽然此界面不展示原生的 MCP Server 菜单，但可以通过静默终端调用完成查询：
1. **寻找精确的库资源 ID:** `npx -y ctx7 library <组件名>`
2. **获得最新文档和代码范例:** `npx -y ctx7 docs <libraryId> "<具体的疑问/查询>"`
*(例如: `npx ctx7 docs /prisma/prisma "how to map relations" `)*

---

## 2. 当前技术架构大纲
- **项目结构:** NPM Workspaces 驱动的 Monorepo (含 `/client` 和 `/server`)
- **前端系统:** React + Vite + TypeScript (端口: 5173) 
- **后端系统:** Node.js + Express + TypeScript + Prisma (端口: 4000)
- **数据库引擎:** PostgreSQL (包含 `pgvector` 设置以备后续的知识库检索使用)
- **UI 组件系统:** `shadcn/ui` 已接入到 `client`，使用默认 `radix-nova` 风格、`neutral` 基础色、CSS Variables 主题方案
- **前端别名配置:** `client` 已配置 `@/* -> src/*`，Vite 与 TypeScript 均已同步

## 2.1 身份验证实现细节
- **认证方案:** 当前使用 `Better Auth` 的邮箱密码登录，服务端主配置在 `server/src/lib/auth.ts`，通过 `server/src/auth.ts` 进行导出。
- **服务端挂载路径:** Better Auth 通过 `toNodeHandler(auth)` 挂载在 `server/src/index.ts` 的 `/api/auth/*` 路径上。
- **前端认证客户端:** `client/src/lib/auth-client.ts` 通过 `createAuthClient({ baseURL: apiBaseUrl })` 连接后端认证接口，默认后端地址来自 `client/src/lib/api.ts`。
- **会话与 Cookie:** 前端请求必须带上凭据。当前登录接口和健康检查都基于同一 `apiBaseUrl`；跨域时依赖 `cors({ credentials: true })` 和 Better Auth 的 cookie 会话。
- **受保护路由入口:** React Router 中 `/login` 为公开页，`/` 走 `client/src/components/ProtectionRount.tsx`。该组件调用 `authClient.useSession()` 判断登录态，未登录时重定向到 `/login`。
- **退出登录入口:** 顶部导航在 `client/src/components/Layout.tsx` 中调用 `authClient.signOut()`，成功后跳转回 `/login`。
- **登录页实现:** `client/src/pages/LoginPages.tsx` 使用 `react-hook-form + zod` 做前端校验，再调用 `authClient.signIn.email({ email, password })` 登录。
- **登录错误映射:** 当前仅对 `401` 或 `invalid email or password` 做了“邮箱或密码错误”的友好提示，其余错误直接显示 Better Auth 返回的 message。
- **服务端鉴权中间件:** `server/src/middleware/require-auth.ts` 使用 `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` 读取当前会话，成功后把 `req.session` 和 `req.user` 注入 Express Request。
- **受保护后端接口示例:** `GET /api/me` 已接入 `requireAuth`，返回当前 `user` 和 `session`。
- **Express 类型扩展:** `server/src/types/express.d.ts` 已为 `req.user`、`req.session` 做类型补充，新增受保护接口时可以直接使用。
- **注册限制:** Better Auth 当前配置了 `disabledPaths: ["/sign-up/email"]`，意味着邮箱密码注册入口被禁用；目前系统只支持已有账号登录，不支持前端自助注册。
- **用户角色字段:** Better Auth 用户模型额外包含 `role` 字段，可选值为 `admin` / `agent`，默认值为 `agent`，且 `input: false`，前端注册或登录时不应试图提交该字段。
- **关键环境变量:** 认证依赖 `BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`CLIENT_ORIGIN`。示例值在 `server/.env.example`，本地开发默认是 `http://localhost:4000` 和 `http://localhost:5173`。
- **Origin 白名单规则:** `server/src/config.ts` 会把 `CLIENT_ORIGIN` 拆分成 trusted origins，同时额外放行 `http://localhost:*` 与 `http://127.0.0.1:*` 的本地开发来源。
- **账号种子约定:** `server/.env.example` 中保留了 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`，说明项目预期存在默认管理员账号初始化流程；后续做 seed 或首次部署时应与该约定保持一致。
- **CLI 生成命令:** 如认证 schema 或 Better Auth 配置有变更，可使用 `server/package.json` 中的 `npm run auth:generate` 重新生成所需文件。

## 3. 进行中的上下文轨迹
- 项目前后台通讯健康路由 (`/api/health`) 已经成功确立。
- 登录页已经改造成 `shadcn/ui` 组件实现，主要使用 `Card`、`Input`、`Label`、`Alert`、`Button`，并保留现有 Better Auth 邮箱密码登录逻辑。
- 当前登录页不再保留左侧说明区，只保留居中的登录卡片。
- 顶部导航左侧仅显示 `Helpdesk`，头部已做紧凑化处理。
- 布局层 `client/src/components/Layout.tsx` 已从 `grid min-h-screen` 改为 `flex min-h-screen flex-col`，避免首屏头部被整行拉高；后续如调整导航高度，不要再改回整页 grid 轨道布局。
- 等待进入下一步的细化开发工作：**前端整体布局 UI 开发** 以及 **Prisma 数据库的表结构 (Schema) 设定**。
