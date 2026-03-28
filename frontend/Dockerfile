FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 安装依赖
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host"]