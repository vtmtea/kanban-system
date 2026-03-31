# AeroFlow - 看板工作流系统

一个类似 Trello 的看板工作流管理系统，支持看板、列表、卡片的管理和协作。

## 技术栈

### 后端
- Golang 1.21
- Gin (Web 框架)
- GORM (ORM)
- MySQL 8.0
- JWT 认证

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

## 项目结构

```
kanban-system/
├── .github/workflows/ # GitHub Actions CI/CD
├── backend/           # Golang 后端
│   ├── cmd/server/    # 入口文件
│   ├── internal/
│   │   ├── api/       # 生成的 API 类型
│   │   ├── config/    # 配置管理
│   │   ├── models/    # 数据模型
│   │   ├── handlers/  # HTTP 处理器
│   │   ├── middleware/# 中间件
│   │   ├── database/  # 数据库连接
│   │   └── routes/    # 路由定义
│   └── Dockerfile
├── frontend/          # React 前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/     # 生成的 API 类型
│   │   ├── context/
│   │   └── utils/
│   └── Dockerfile
├── deploy/            # 部署配置
│   ├── kanban-backend.service
│   └── nginx.conf
├── openapi.yaml       # API 规范 (API First)
└── docker-compose.yml # Docker 编排
```

## 快速开始

### 使用 Docker Compose (推荐)

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 本地开发

#### 后端

```bash
cd backend

# 复制环境变量配置
cp .env.example .env

# 安装依赖
go mod download

# 安装 Air (热重载工具)
go install github.com/air-verse/air@latest

# 使用热重载运行 (推荐)
air

# 或者普通运行
go run cmd/server/main.go
```

#### 前端

```bash
cd frontend

# 启用与仓库一致的 pnpm 9
corepack enable
corepack prepare pnpm@9 --activate

# 安装依赖
pnpm install

# 运行开发服务器
pnpm run dev
```

#### MySQL

```bash
# 使用 Docker 启动 MySQL
docker run -d \
  --name kanban-mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=kanban \
  -e MYSQL_USER=kanban \
  -e MYSQL_PASSWORD=kanban123 \
  -p 3306:3306 \
  mysql:8.0
```

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/user` - 获取当前用户
- `PUT /api/user` - 更新用户信息

### 看板
- `GET /api/boards` - 获取看板列表
- `GET /api/boards/:id` - 获取看板详情
- `POST /api/boards` - 创建看板
- `PUT /api/boards/:id` - 更新看板
- `DELETE /api/boards/:id` - 删除看板

### 列表
- `GET /api/boards/:board_id/lists` - 获取列表
- `POST /api/boards/:board_id/lists` - 创建列表
- `PUT /api/lists/:id` - 更新列表
- `DELETE /api/lists/:id` - 删除列表

### 卡片
- `GET /api/cards/:id` - 获取卡片详情
- `POST /api/lists/:list_id/cards` - 创建卡片
- `PUT /api/cards/:id` - 更新卡片
- `PUT /api/cards/:id/move` - 移动卡片
- `DELETE /api/cards/:id` - 删除卡片

### 评论
- `GET /api/cards/:card_id/comments` - 获取评论
- `POST /api/cards/:card_id/comments` - 创建评论
- `DELETE /api/comments/:id` - 删除评论

### 标签
- `GET /api/boards/:board_id/labels` - 获取标签
- `POST /api/boards/:board_id/labels` - 创建标签
- `DELETE /api/labels/:id` - 删除标签
- `POST /api/cards/:id/labels/:label_id` - 添加标签到卡片
- `DELETE /api/cards/:id/labels/:label_id` - 从卡片移除标签

## 环境变量

### 后端
| 变量 | 描述 | 默认值 |
|------|------|--------|
| DB_HOST | 数据库地址 | localhost |
| DB_PORT | 数据库端口 | 3306 |
| DB_USER | 数据库用户 | kanban |
| DB_PASSWORD | 数据库密码 | kanban123 |
| DB_NAME | 数据库名称 | kanban |
| SERVER_PORT | 服务端口 | 8080 |
| JWT_SECRET | JWT 密钥 | (生产环境需修改) |
| JWT_EXPIRY | JWT 有效期 | 24h |

## API First 开发

项目采用 API First 开发模式，所有 API 规范定义在 `openapi.yaml` 中。

### 生成代码

```bash
# 后端 - 生成 Go 类型
cd backend
~/go/bin/oapi-codegen -config oapi-codegen.yaml ../openapi.yaml

# 前端 - 生成 TypeScript 类型
cd frontend
corepack enable
corepack prepare pnpm@9 --activate
pnpm run generate:api
```

### 修改 API

1. 编辑 `openapi.yaml`
2. 重新生成后端和前端类型
3. 更新 handlers 和 API 服务代码

## CI/CD 部署

项目使用 GitHub Actions 实现自动化部署，前端后端分开部署。

详细部署指南请参考 [deploy/README.md](deploy/README.md)。

### 快速配置

在 GitHub 仓库 Settings -> Secrets 中添加：

- `SERVER_HOST` - 服务器地址
- `SERVER_USER` - SSH 用户名
- `SERVER_SSH_KEY` - SSH 私钥

## License

MIT
