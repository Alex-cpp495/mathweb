# API密钥配置说明

## 📋 配置概览

您的API密钥已经成功配置到项目中：

### ✅ 已配置的API密钥
- **Gemini API**: AIzaSyB8efFb5CEsbcUZ9UIEg3_sxfOuiPc9Z5U
- **DeepSeek API**: sk-8db95c8f28f74a2296504f7114fcdf28

### 📁 配置文件位置
- `server/config.js` - 包含实际API密钥的配置文件
- `.gitignore` - 确保配置文件不被提交到git

## 🚀 启动项目

### 1. 安装依赖
```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 2. 启动后端服务
```bash
cd server
npm run dev  # 开发环境
# 或
npm start   # 生产环境
```

### 3. 启动前端服务
```bash
cd client
npm start
```

## 🧪 测试API密钥

### 测试Gemini API
您可以使用以下curl命令测试Gemini API：
```bash
curl -X POST "http://localhost:5000/api/ai/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Hello, please analyze this text",
    "type": "analysis",
    "model": "gemini"
  }'
```

### 测试DeepSeek API
```bash
curl -X POST "http://localhost:5000/api/ai/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Hello, please analyze this text",
    "type": "analysis",
    "model": "deepseek"
  }'
```

### 自动模型选择测试
```bash
curl -X POST "http://localhost:5000/api/ai/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Hello, please analyze this text",
    "type": "analysis"
  }'
```

## 🔧 配置说明

### 智能路由策略
系统会根据以下规则自动选择AI模型：
- **简短文本** (< 100字符): 优先使用Gemini
- **长文本** (> 1000字符): 优先使用DeepSeek
- **中等文本**: 自动均衡负载
- **故障恢复**: 当一个API不可用时，自动切换到另一个

### 功能开关
在`server/config.js`中，您可以控制以下功能：
```javascript
features: {
  aiEnabled: true,              // AI功能总开关
  knowledgeGraphEnabled: true,  // 知识图谱功能
  vectorSearchEnabled: true     // 向量搜索功能
}
```

## 🛡️ 安全注意事项

1. **API密钥保护**
   - ✅ 已将`server/config.js`添加到`.gitignore`
   - ✅ 已将`.env`文件添加到`.gitignore`
   - ⚠️ 请确保不要在代码中硬编码API密钥

2. **环境变量配置**
   如果您想使用环境变量而不是配置文件，可以创建`.env`文件：
   ```env
   GEMINI_API_KEY=AIzaSyB8efFb5CEsbcUZ9UIEg3_sxfOuiPc9Z5U
   DEEPSEEK_API_KEY=sk-8db95c8f28f74a2296504f7114fcdf28
   ```

3. **生产环境部署**
   在Zeabur等平台部署时，建议通过环境变量设置API密钥：
   - 在Zeabur控制台中设置环境变量
   - 不要在代码中包含实际的API密钥

## 📊 API使用监控

### Gemini API限制
- 每分钟请求数: 60次
- 每日请求数: 1500次
- 每次请求最大tokens: 30,720

### DeepSeek API限制
- 根据您的账户等级而定
- 建议查看DeepSeek官方文档获取最新限制信息

## 🐛 故障排除

### 常见问题

1. **API密钥无效**
   - 检查密钥是否正确复制
   - 确认API服务是否正常
   - 查看服务器日志获取详细错误信息

2. **请求超限**
   - 系统会自动在两个API之间切换
   - 可以在控制台查看详细的API使用情况

3. **网络连接问题**
   - 确认网络可以访问对应的API端点
   - 检查防火墙设置

### 查看日志
```bash
# 在server目录下
npm run dev
# 查看实时日志输出
```

## 🎯 下一步

您的AI学习平台现在已经完全配置好了！可以：

1. 启动项目并测试基本功能
2. 上传文档测试AI分析功能
3. 查看知识图谱生成效果
4. 准备部署到生产环境

如果遇到任何问题，请检查服务器日志或联系技术支持。 