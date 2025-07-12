# AI API配置指南

## 🤖 概述

本系统采用混合AI架构，结合Google Gemini和DeepSeek两大AI模型，提供高质量的学习材料处理和智能问答服务。

## 🔑 获取API密钥

### Google Gemini API

#### 1. 创建Google Cloud项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 "Generative Language API"

#### 2. 获取API密钥
1. 在Google Cloud Console中，导航到 "APIs & Services" → "Credentials"
2. 点击 "Create Credentials" → "API Key"
3. 复制生成的API密钥
4. **重要**：为安全起见，建议为API密钥设置限制

#### 3. 配置使用限制（推荐）
```bash
# API限制设置
- 应用程序限制：HTTP引用器（网站）
- API限制：Generative Language API
```

#### 4. 定价信息
- Gemini 1.5 Flash：免费额度每分钟15个请求
- 超出免费额度后按使用量计费
- 查看最新定价：[Google AI Pricing](https://ai.google.dev/pricing)

### DeepSeek API

#### 1. 注册DeepSeek账户
1. 访问 [DeepSeek官网](https://www.deepseek.com/)
2. 创建账户并完成验证
3. 进入API管理页面

#### 2. 获取API密钥
1. 在控制台中找到"API密钥"或"开发者设置"
2. 创建新的API密钥
3. 复制并安全保存密钥

#### 3. 定价信息
- DeepSeek提供一定的免费额度
- 超出后按token使用量计费
- 查看最新定价信息在DeepSeek官网

## ⚙️ 配置环境变量

### 基础配置
```bash
# Google Gemini配置
GEMINI_API_KEY=your_gemini_api_key_here

# DeepSeek配置  
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 启用AI功能
ENABLE_AI_FEATURES=true
```

### 高级配置选项
```bash
# AI模型偏好设置
AI_DEFAULT_MODEL=auto  # auto, gemini, deepseek

# 超时设置
AI_TIMEOUT=30000  # 30秒

# 重试配置
AI_MAX_RETRIES=3
AI_RETRY_DELAY=1000  # 1秒
```

## 🔀 智能路由机制

系统会根据以下策略自动选择最适合的AI模型：

### 任务分配策略
- **Gemini优势任务**：
  - 知识提取和概念分析
  - 复杂的语义理解
  - 多语言处理
  
- **DeepSeek优势任务**：
  - 逻辑推理
  - 代码分析
  - 数学计算

### 自动切换机制
```javascript
// 系统会自动处理以下情况：
1. 主要模型不可用时切换到备用模型
2. 根据任务类型智能选择最适合的模型
3. 在API限制达到时自动切换
4. 当所有AI服务都失败时，使用本地算法兜底
```

## 🛡️ 安全最佳实践

### API密钥管理
1. **永远不要在代码中硬编码API密钥**
2. 使用环境变量或安全的密钥管理服务
3. 定期轮换API密钥
4. 监控API使用情况

### 访问控制
```bash
# 建议的安全配置
RATE_LIMIT_AI_REQUESTS=100  # 每小时限制
API_KEY_ROTATION_DAYS=90    # 90天轮换密钥
ENABLE_API_MONITORING=true  # 启用监控
```

## 📊 监控和优化

### 使用情况监控
- 跟踪API调用次数和成本
- 监控响应时间和错误率
- 分析不同模型的表现

### 成本优化建议
1. **缓存策略**：对相似查询启用缓存
2. **批处理**：合并小的请求
3. **智能路由**：根据任务复杂度选择模型
4. **用户限制**：设置合理的使用配额

## 🔧 测试配置

### API连通性测试
```bash
# 使用curl测试Gemini API
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello"}]
    }]
  }'

# 测试DeepSeek API
curl -X POST \
  "https://api.deepseek.com/chat/completions" \
  -H "Authorization: Bearer ${DEEPSEEK_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 系统内测试
访问系统健康检查端点：
```
GET /api/health/ai
```

## ❓ 常见问题

### Q: 可以只使用一个AI服务吗？
A: 可以，但建议配置两个以提高可靠性。系统会在主要服务不可用时自动切换。

### Q: 如何控制AI服务的成本？
A: 
1. 设置合理的用户配额
2. 启用缓存机制
3. 监控使用情况
4. 使用更经济的模型版本

### Q: API密钥泄露了怎么办？
A: 
1. 立即在对应平台上撤销密钥
2. 生成新的API密钥
3. 更新环境变量
4. 重新部署应用

### Q: 遇到API限制怎么办？
A: 
1. 系统会自动切换到备用AI服务
2. 检查是否需要升级API计划
3. 优化请求频率
4. 考虑使用缓存

## 📞 技术支持

如果遇到AI配置问题：
1. 检查API密钥格式是否正确
2. 验证网络连接
3. 查看系统日志中的错误信息
4. 参考各AI服务提供商的官方文档 