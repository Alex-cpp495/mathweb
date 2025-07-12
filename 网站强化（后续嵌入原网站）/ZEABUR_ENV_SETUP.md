# 🔧 Zeabur环境变量配置指南

## 📋 必需的环境变量

根据您的Zeabur控制台截图，需要在**后端服务**的环境变量中配置以下变量：

### 1. MongoDB 连接配置

从您的截图中可以看到，Zeabur已经自动生成了MongoDB相关的环境变量。在您的**后端服务**中，需要设置：

```bash
# 方式1: 使用完整连接字符串（推荐）
MONGO_CONNECTION_STRING=mongodb://mongo:${PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/ai-learning-platform?authSource=admin

# 方式2: 使用分离的配置
MONGO_HOST=${MONGO_HOST}
MONGO_PORT=${MONGO_PORT}
MONGO_USERNAME=${MONGO_USERNAME}
MONGO_PASSWORD=${MONGO_PASSWORD}
MONGO_DATABASE=ai-learning-platform
```

### 2. JWT 安全配置

```bash
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

### 3. AI API 配置

```bash
GEMINI_API_KEY=AIzaSyB8efFb5CEsbcUZ9UIEg3_sxfOuiPc9Z5U
DEEPSEEK_API_KEY=sk-8db95c8f28f74a2296504f7114fcdf28
```

### 4. 应用配置

```bash
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.zeabur.app
REACT_APP_API_URL=https://your-backend-domain.zeabur.app
```

### 5. 可选：Neo4j 配置

```bash
NEO4J_URI=bolt://your-neo4j-host:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password
```

## 🚀 在Zeabur控制台中配置

### 步骤1: 访问后端服务设置
1. 登录Zeabur控制台
2. 进入您的项目
3. 找到后端服务（通常名为`app`或`server`）
4. 点击"环境变量"标签页

### 步骤2: 添加环境变量

根据您的截图，MongoDB环境变量已经自动生成，您只需要添加：

```bash
# 必需的环境变量
NODE_ENV=production
PORT=5000
JWT_SECRET=ai-learning-platform-super-secret-key-2024
GEMINI_API_KEY=AIzaSyB8efFb5CEsbcUZ9UIEg3_sxfOuiPc9Z5U
DEEPSEEK_API_KEY=sk-8db95c8f28f74a2296504f7114fcdf28
```

### 步骤3: 设置前端环境变量

在**前端服务**的环境变量中添加：

```bash
REACT_APP_API_URL=https://your-backend-domain.zeabur.app
```

## 🔍 验证配置

### 方式1: 检查部署日志
部署后，在Zeabur控制台查看后端服务的日志，应该看到：

```
✅ MongoDB连接成功
📊 数据库名称: ai-learning-platform
🏠 数据库主机: your-mongo-host
```

### 方式2: 访问健康检查端点
访问: `https://your-backend-domain.zeabur.app/api/health`

应该返回：
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "database": "connected"
}
```

## 🔧 常见问题解决

### 问题1: MongoDB连接失败
```
❌ MongoDB连接失败: connect ECONNREFUSED
```

**解决方案：**
1. 确保MongoDB服务正在运行
2. 检查MONGO_CONNECTION_STRING是否正确
3. 验证MongoDB服务的网络连接

### 问题2: 环境变量未生效
```
❌ 未配置 MONGO_URI
```

**解决方案：**
1. 在Zeabur控制台重新保存环境变量
2. 重启后端服务
3. 检查变量名是否正确

### 问题3: API请求失败
```
Failed to fetch
```

**解决方案：**
1. 检查REACT_APP_API_URL是否指向正确的后端域名
2. 确保后端服务正在运行
3. 检查CORS配置

## 📋 配置检查清单

- [ ] MongoDB环境变量已设置
- [ ] JWT_SECRET已设置
- [ ] AI API密钥已设置
- [ ] NODE_ENV设置为production
- [ ] 前端API_URL指向正确的后端域名
- [ ] 后端服务可以正常启动
- [ ] 健康检查端点返回正常
- [ ] 可以成功注册/登录用户

## 🎯 下一步

配置完成后：
1. 重新部署服务
2. 测试用户注册功能
3. 验证文档上传功能
4. 检查AI功能是否正常

如果仍有问题，请查看部署日志或联系技术支持。 