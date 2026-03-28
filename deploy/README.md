# 部署指南

## GitHub Actions CI/CD

项目使用 GitHub Actions 实现持续集成和持续部署。前端和后端分开部署。

### 前置要求

1. 一台 Linux 服务器
2. 服务器上已安装：
   - MySQL 8.0
   - Nginx
   - systemd

### 配置 GitHub Secrets

在 GitHub 仓库的 Settings -> Secrets and variables -> Actions 中添加以下 secrets：

| Secret 名称 | 描述 | 示例 |
|------------|------|------|
| `SERVER_HOST` | 服务器 IP 或域名 | `192.168.1.100` 或 `api.example.com` |
| `SERVER_USER` | SSH 用户名 | `ubuntu` 或 `root` |
| `SERVER_SSH_KEY` | SSH 私钥 | `-----BEGIN RSA PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH 端口（可选） | `22`（默认） |
| `DEPLOY_PATH` | 后端部署路径（可选） | `/opt/kanban`（默认） |
| `FRONTEND_DEPLOY_PATH` | 前端部署路径（可选） | `/var/www/kanban`（默认） |

### 生成 SSH 密钥

```bash
# 在本地生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions" -f github-actions-key

# 将公钥添加到服务器
ssh-copy-id -i github-actions-key.pub user@your-server

# 将私钥内容添加到 GitHub Secrets 的 SERVER_SSH_KEY
cat github-actions-key
```

## 服务器配置

### 1. 创建目录结构

```bash
sudo mkdir -p /opt/kanban/backend
sudo mkdir -p /var/www/kanban
sudo chown -R $USER:$USER /opt/kanban
sudo chown -R $USER:$USER /var/www/kanban
```

### 2. 配置 MySQL

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE kanban CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kanban'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON kanban.* TO 'kanban'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 配置后端服务

```bash
# 复制 systemd 服务文件
sudo cp deploy/kanban-backend.service /etc/systemd/system/

# 复制环境变量配置
sudo cp backend/.env.example /opt/kanban/backend/.env

# 编辑环境变量
sudo nano /opt/kanban/backend/.env

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable kanban-backend
sudo systemctl start kanban-backend

# 查看状态
sudo systemctl status kanban-backend
```

### 4. 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp deploy/nginx.conf /etc/nginx/sites-available/kanban

# 创建软链接
sudo ln -s /etc/nginx/sites-available/kanban /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 5. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
```

## 手动部署

如果需要手动部署：

### 后端

```bash
cd backend

# 生成 API 类型
~/go/bin/oapi-codegen -config oapi-codegen.yaml ../openapi.yaml

# 构建
CGO_ENABLED=0 GOOS=linux go build -o kanban-backend ./cmd/server

# 上传到服务器
scp kanban-backend user@server:/opt/kanban/backend/

# 重启服务
ssh user@server "sudo systemctl restart kanban-backend"
```

### 前端

```bash
cd frontend

# 安装依赖
pnpm install

# 生成 API 类型
pnpm run generate:api

# 构建
pnpm run build

# 上传到服务器
scp -r dist/* user@server:/var/www/kanban/
```

## 查看日志

```bash
# 后端服务日志
sudo journalctl -u kanban-backend -f

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

## 故障排查

### 后端无法启动

1. 检查数据库连接配置
2. 检查端口是否被占用：`sudo netstat -tlnp | grep 8080`
3. 查看服务日志：`sudo journalctl -u kanban-backend -n 100`

### 前端无法访问

1. 检查 Nginx 配置：`sudo nginx -t`
2. 检查文件权限：`ls -la /var/www/kanban`
3. 查看 Nginx 错误日志

### API 请求失败

1. 检查后端服务是否运行
2. 检查 Nginx 代理配置
3. 检查防火墙设置