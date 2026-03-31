FROM node:18-alpine

WORKDIR /app

# 安装 pnpm 9，和锁文件版本保持一致
RUN corepack enable && corepack prepare pnpm@9 --activate

# 安装依赖
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host"]
