# 🚀 快速部署指南

## 📋 问题总结

根据您的错误日志，核心问题是：
- ❌ MongoDB连接失败：`connect ECONNREFUSED ::1:27017`
- ❌ 后端尝试连接localhost而非Zeabur的MongoDB服务

## ✅ 已修复的内容

1. **优化了MongoDB连接逻辑**
2. **修复了环境变量配置**
3. **创建了详细的配置指南**
4. **添加了环境变量检查脚本**

## 🔧 立即行动步骤

### 步骤1: 在Zeabur控制台配置环境变量

登录Zeabur控制台，进入您的**后端服务**，在"环境变量"标签页添加：

```bash
# 基础配置
NODE_ENV=production
PORT=5000
JWT_SECRET=ai-learning-platform-super-secret-key-2024

# AI API配置
GEMINI_API_KEY=AIzaSyB8efFb5CEsbcUZ9UIEg3_sxfOuiPc9Z5U
DEEPSEEK_API_KEY=sk-8db95c8f28f74a2296504f7114fcdf28
```

**注意：** MongoDB相关环境变量（如`MONGO_CONNECTION_STRING`、`MONGO_HOST`等）应该已经由Zeabur自动生成，无需手动添加。

### 步骤2: 部署更新

提交并推送修复：

```bash
git add .
git commit -m "fix: 修复MongoDB连接和环境变量配置"
git push
```

### 步骤3: 验证部署

部署完成后，访问健康检查端点：

```
https://your-backend-domain.zeabur.app/api/health
```

应该返回：
```json
{
  "status": "OK",
  "database": "connected"
}
```

### 步骤4: 检查日志

在Zeabur控制台查看后端服务日志，应该看到：

```
✅ MongoDB连接成功
📊 数据库名称: ai-learning-platform
🏠 数据库主机: your-mongo-host
```

## 🎯 成功指标

- [ ] 后端服务正常启动
- [ ] MongoDB连接成功
- [ ] 健康检查端点返回OK
- [ ] 可以访问前端界面
- [ ] 用户注册/登录功能正常

## 🔍 如果仍有问题

### 1. 检查环境变量

运行检查脚本：
```bash
npm run check-env
```

### 2. 查看详细配置

参考 `ZEABUR_ENV_SETUP.md` 文档

### 3. 检查MongoDB服务

确保Zeabur项目中的MongoDB服务正在运行

### 4. 验证连接字符串

检查`MONGO_CONNECTION_STRING`环境变量是否正确设置

## 📞 需要帮助？

如果按照上述步骤仍有问题，请提供：
1. Zeabur后端服务的部署日志
2. 环境变量截图
3. 健康检查端点的响应

---

## 🎉 预期结果

完成配置后，您的AI学习平台应该能够：
- ✅ 正常连接MongoDB数据库
- ✅ 用户注册和登录功能
- ✅ 文档上传和处理
- ✅ AI问答功能
- ✅ 知识图谱构建

立即开始第一步，配置环境变量！ 