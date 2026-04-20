# Docker 本地运行说明

这个仓库本地 Docker 运行采用 2 个应用容器 + 1 个数据库容器：

- `backend`
- `db`

其中 `backend` 容器会同时提供 API 和前端静态资源，对外只暴露一个 Web 端口。

## 前置条件

- 已安装 Docker Desktop
- `docker` 和 `docker compose` 命令可用

## 启动

在仓库根目录执行：

```bash
docker compose up --build
```

或者使用项目脚本：

```bash
npm run docker:up
```

启动后默认地址：

- 前端 + 后端：`http://localhost:4000`
- PostgreSQL：`localhost:5432`

## 默认本地账号

后端容器启动时会自动执行：

- `prisma migrate deploy`
- `prisma db seed`

默认管理员账号：

- 邮箱：`admin@example.com`
- 密码：`qwerdf66`

## 停止

```bash
docker compose down
```

如果还想删除数据库卷：

```bash
docker compose down -v
```

## 说明

- 前端构建产物会被打进后端镜像，并由后端统一提供静态资源与 `/api/*`
- 后端使用 Compose 内部网络连接数据库：`postgresql://helpdesk:helpdesk@db:5432/helpdesk?schema=public`
- 这套本地 Docker 配置只覆盖核心应用能力，不要求配置 AI、SendGrid、IMAP 等生产能力
