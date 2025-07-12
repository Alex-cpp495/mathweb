# 🚀 快速启动指南

您的API密钥已配置完成！现在可以立即启动AI学习平台。

## ✅ 配置状态
- **Gemini API**: ✅ 已配置
- **DeepSeek API**: ✅ 已配置  
- **配置文件**: ✅ 已创建 (`server/config.js`)
- **安全设置**: ✅ 已添加到 `.gitignore`

## 🛠️ 快速启动

### 1️⃣ 安装依赖
```bash
# 后端依赖
cd server
npm install

# 前端依赖  
cd ../client
npm install
```

### 2️⃣ 测试API密钥（可选但推荐）
```bash
cd server
npm run test-api
```
这将验证您的Gemini和DeepSeek API密钥是否正常工作。

### 3️⃣ 启动项目
```bash
# 启动后端（新终端窗口）
cd server
npm run dev

# 启动前端（新终端窗口）
cd client  
npm start
```

### 4️⃣ 访问应用
- **前端**: http://localhost:3000
- **后端API**: http://localhost:5000/api

## 🎯 首次使用

1. **注册账户**: 在前端页面创建新用户账户
2. **上传文档**: 测试文档上传和AI分析功能  
3. **查看知识图谱**: 体验核心功能 - 知识图谱可视化
4. **AI对话**: 测试与文档的智能问答

## 🔧 配置详情

### AI模型自动选择
系统会智能选择最适合的AI模型：
- **Gemini**: 适合简短文本分析
- **DeepSeek**: 适合长文本处理
- **自动切换**: 故障时自动回退

### 支持的文件格式
- PDF (.pdf)
- Word文档 (.doc, .docx)  
- PowerPoint (.ppt, .pptx)
- 纯文本 (.txt)

## 🐛 问题排查

### API测试失败？
```bash
# 检查网络连接
ping google.com

# 查看详细错误日志
cd server
npm run dev
```

### 项目无法启动？
1. 确认Node.js版本 >= 16.0
2. 检查端口3000和5000是否被占用
3. 重新安装依赖：`rm -rf node_modules && npm install`

### 数据库连接问题？
默认使用本地MongoDB，如需修改：
```javascript
// server/config.js
mongodb: {
  uri: 'your-mongodb-uri-here'
}
```

## 📞 获取帮助

- 📖 查看完整文档: `API_KEYS_SETUP.md`
- 🏗️ 项目架构: `PROJECT_STRUCTURE.md`  
- 🚀 部署指南: `DEPLOYMENT_GUIDE.md`

---

**🎉 恭喜！您的AI学习平台已准备就绪！**

现在您可以为4000万中国大学生提供个性化的专属学习知识图谱服务了。 