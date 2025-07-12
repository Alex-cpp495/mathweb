# 多阶段构建：前端 + 后端
FROM node:18-alpine AS frontend-builder

# 构建前端
WORKDIR /app/client

# 复制前端package.json
COPY client/package*.json ./

# 安装前端依赖
RUN npm ci

# 复制前端源码（包括public目录）
COPY client/ ./

# 验证public目录存在
RUN echo "Checking public directory:" && ls -la ./public/

# 构建前端
RUN npm run build

# 验证构建结果
RUN echo "Build output:" && ls -la ./build/

# 后端构建阶段
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# 复制后端package.json
COPY server/package*.json ./

# 安装后端依赖
RUN npm ci --only=production

# 复制后端源码
COPY server/ ./

# 生产阶段
FROM nginx:alpine

# 安装Node.js（用于运行后端）
RUN apk add --no-cache nodejs npm

# 创建应用目录
WORKDIR /app

# 复制后端代码和依赖
COPY --from=backend-builder /app/server ./server

# 复制前端构建结果
COPY --from=frontend-builder /app/client/build ./client/build

# 复制nginx配置
COPY client/nginx.conf /etc/nginx/nginx.conf

# 设置nginx静态文件目录
RUN ln -sf /app/client/build /usr/share/nginx/html

# 创建启动脚本
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app/server && node index.js &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# 暴露端口
EXPOSE 3000 5000

# 启动应用
CMD ["/start.sh"] 