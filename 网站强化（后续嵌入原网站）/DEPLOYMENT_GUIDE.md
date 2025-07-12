# AI学习平台部署指南

## 🚀 快速开始

本指南将帮助您在Zeabur平台上部署AI驱动的学习材料整合平台。

## 📋 前置要求

### 必需服务
- **MongoDB** - 主数据库
- **Neo4j** - 图数据库（可选，用于高级知识图谱功能）
- **AI服务密钥**：
  - Google Gemini API密钥（推荐）
  - 或DeepSeek API密钥

### 账户准备
1. Zeabur账户
2. GitHub账户（用于代码仓库）
3. AI服务提供商账户

## 🔧 环境变量配置

在部署前，请准备以下环境变量：

### 必需环境变量
```bash
# 数据库配置
MONGO_PASSWORD=your_mongodb_password
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/ai-learning-platform?authSource=admin

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 客户端配置
CLIENT_URL=https://your-domain.com
API_URL=https://api.your-domain.com
```

### AI服务配置（推荐配置两个以实现智能路由）
```bash
# Google Gemini配置（推荐）
GEMINI_API_KEY=your_gemini_api_key

# DeepSeek配置（作为备选）
DEEPSEEK_API_KEY=your_deepseek_api_key

# AI功能开关
ENABLE_AI_FEATURES=true
```

### 可选环境变量
```bash
# Neo4j配置（可选）
NEO4J_PASSWORD=your_neo4j_password
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j

# 其他配置
NODE_ENV=production
PORT=5000
```

## 📦 Zeabur部署步骤

### 1. 代码仓库准备
```bash
# 1. Fork或克隆项目到您的GitHub
git clone <your-repo-url>
cd ai-learning-platform

# 2. 确保所有文件都已提交
git add .
git commit -m "Initial deployment setup"
git push origin main
```

### 2. Zeabur项目创建
1. 登录 [Zeabur控制台](https://zeabur.com)
2. 创建新项目
3. 选择从GitHub导入
4. 选择您的AI学习平台仓库

### 3. 服务部署顺序

#### 步骤1：部署MongoDB
1. 在Zeabur项目中添加服务
2. 选择"Prebuilt Service" → "MongoDB"
3. 设置环境变量：
   ```
   MONGO_INITDB_ROOT_USERNAME=admin
   MONGO_INITDB_ROOT_PASSWORD=<生成强密码>
   ```

#### 步骤2：部署Neo4j（可选）
1. 添加服务 → "Prebuilt Service" → "Neo4j"
2. 设置环境变量：
   ```
   NEO4J_AUTH=neo4j/<生成强密码>
   ```

#### 步骤3：部署后端API
1. 添加服务 → "Git Service"
2. 选择您的仓库
3. 设置根目录为 `server`
4. 配置所有环境变量（参考上方列表）
5. 自定义构建命令：
   ```bash
   npm install && npm run build
   ```
6. 启动命令：
   ```bash
   npm start
   ```

#### 步骤4：部署前端
1. 添加服务 → "Git Service" 
2. 选择相同仓库
3. 设置根目录为 `client`
4. 设置环境变量：
   ```
   REACT_APP_API_URL=<后端API地址>
   ```
5. 构建命令：
   ```bash
   npm install && npm run build
   ```

### 4. 域名配置
1. 在Zeabur中为前端服务配置自定义域名
2. 为后端API配置子域名（如 api.yourdomain.com）
3. 更新前端的 `REACT_APP_API_URL` 环境变量

## 🔍 部署验证

### 健康检查
1. **API健康检查**：访问 `https://api.yourdomain.com/api/health`
2. **前端访问**：访问 `https://yourdomain.com`
3. **数据库连接**：查看后端日志确认MongoDB连接成功

### 功能测试
1. 用户注册/登录
2. 文档上传
3. 知识图谱生成
4. AI问答功能

## ⚡ 性能优化建议

### 1. 缓存配置
```bash
# 添加Redis缓存（可选）
REDIS_URL=redis://redis:6379
```

### 2. 文件存储优化
- 考虑使用对象存储服务（如AWS S3、阿里云OSS）
- 配置CDN加速静态资源

### 3. 数据库优化
- 启用MongoDB副本集
- 配置适当的索引
- 定期备份数据

## 🛠️ 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查MongoDB连接字符串
MONGODB_URI=mongodb://admin:password@mongodb:27017/ai-learning-platform?authSource=admin
```

#### 2. AI服务调用失败
- 验证Gemini和DeepSeek API密钥是否正确
- 检查网络连接（确保可以访问Google和DeepSeek服务）
- 查看API调用限制和配额
- 验证ENABLE_AI_FEATURES=true已设置
- 检查系统是否正确在两个AI服务间切换

#### 3. 文件上传失败
- 检查文件大小限制（默认50MB）
- 确认上传目录权限
- 验证支持的文件格式

#### 4. 知识图谱生成失败
- 确认文档内容已成功提取
- 检查AI服务配置
- 验证文档内容长度

### 日志查看
在Zeabur控制台中查看各服务的日志：
1. 后端API日志：查看请求处理和错误信息
2. 前端构建日志：检查构建过程中的问题
3. 数据库日志：监控连接和查询状态

## 📊 监控与维护

### 1. 性能监控
- 监控API响应时间
- 跟踪数据库查询性能
- 观察内存和CPU使用率

### 2. 定期维护
- 数据库备份（建议每日）
- 日志清理
- 依赖包更新

### 3. 扩展计划
- 根据用户增长调整资源配置
- 考虑微服务架构
- 实施负载均衡

## 🔐 安全建议

1. **定期更新密钥**：定期轮换JWT密钥和数据库密码
2. **HTTPS强制**：确保所有通信都使用HTTPS
3. **API限流**：已内置，可根据需要调整
4. **数据备份**：设置自动化备份策略
5. **访问控制**：限制数据库和服务的网络访问

## 📞 支持与帮助

如果在部署过程中遇到问题：

1. 查看Zeabur官方文档
2. 检查项目GitHub Issues
3. 查看服务日志获取详细错误信息

## 🎉 部署完成

恭喜！您的AI学习平台现在已经成功部署。用户可以通过以下功能开始使用：

- 📚 上传学习文档
- 🧠 生成知识图谱  
- 💬 AI智能问答
- 📊 学习进度跟踪

享受智能化的学习体验吧！ 