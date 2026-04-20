# Railway 部署说明

这个仓库建议在 Railway 中拆成 3 个资源：

- `Frontend`
- `Backend`
- `Postgres`

两个应用服务都要指向仓库根目录，不要把 Railway 的根目录改成 `client` 或 `server` 子目录。因为 `client` 和 `server` 都依赖 workspace 包 `core`，如果直接切到子目录，workspace 依赖解析会失效。

## Frontend 服务

- Source root：仓库根目录
- Build Command：`npm ci && npm run build --workspace core && npm run build --workspace client`
- Start Command：`npm run start:prod --workspace client`
- Networking：为服务生成一个 Public Domain

环境变量：

```dotenv
VITE_API_BASE_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

## Backend 服务

- Source root：仓库根目录
- Build Command：`npm ci && npm run build --workspace core && npm run build --workspace server`
- Start Command：`npm run start --workspace server`
- Pre-deploy Command：`npm run prisma:migrate:deploy --workspace server`
- Networking：为服务生成一个 Public Domain

环境变量：

```dotenv
DATABASE_URL=${{Postgres.DATABASE_URL}}
CLIENT_ORIGIN=https://${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
BETTER_AUTH_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
BETTER_AUTH_SECRET=<长度至少 32 位的随机密钥>
ADMIN_EMAIL=<生产环境管理员邮箱>
ADMIN_PASSWORD=<生产环境管理员密码>
```

下面这些变量不是本次核心上线必须项，可以后续再补：

```dotenv
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
SENTRY_TRACES_SAMPLE_RATE=0
DEEPSEEK_API_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=
SENDGRID_REPLY_TO_EMAIL=
SENDGRID_REPLY_TO_NAME=
IMAP_HOST=
IMAP_PORT=
IMAP_USER=
IMAP_PASSWORD=
INBOUND_EMAIL_SECRET=
```

## Postgres

- 在 Railway 项目里新增一个 PostgreSQL 服务，名称设为 `Postgres`
- 在后端服务里通过 `DATABASE_URL=${{Postgres.DATABASE_URL}}` 引用数据库连接串
- 不要把生产数据库凭据写进仓库文件

## 首次部署后的检查项

1. 打开前端 Public Domain，确认页面能正常加载。
2. 打开 `https://<backend-domain>/api/health`，确认返回 `200`。
3. 使用配置好的管理员账号登录，确认鉴权流程正常。
4. 确认工单列表、工单详情等核心读写流程可以正常访问 Railway Postgres。
