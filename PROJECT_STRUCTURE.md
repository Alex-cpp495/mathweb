# AI学习平台项目结构

## 📁 项目概览

```
ai-learning-platform/
├── 📄 README.md                    # 项目介绍
├── 📄 business_plan_summary.md     # 商业计划摘要
├── 📄 user_feedback_analysis.md    # 用户反馈分析
├── 📄 DEPLOYMENT_GUIDE.md          # 部署指南
├── 📄 PROJECT_STRUCTURE.md         # 项目结构文档
├── 📄 package.json                 # 根项目配置
├── 📄 zeabur.yaml                  # Zeabur部署配置
├── 📁 server/                      # 后端服务
└── 📁 client/                      # 前端应用
```

## 🚀 后端服务 (server/)

### 核心架构
```
server/
├── 📄 index.js                     # 应用入口点
├── 📄 package.json                 # 依赖配置
├── 📄 Dockerfile                   # Docker构建文件
├── 📁 models/                      # 数据模型
│   ├── 📄 User.js                  # 用户模型
│   ├── 📄 Document.js              # 文档模型
│   └── 📄 KnowledgeGraph.js        # 知识图谱模型
├── 📁 routes/                      # API路由
│   ├── 📄 auth.js                  # 认证路由
│   ├── 📄 documents.js             # 文档管理路由
│   ├── 📄 knowledgeGraph.js        # 知识图谱路由
│   ├── 📄 ai.js                    # AI服务路由
│   └── 📄 users.js                 # 用户管理路由
├── 📁 services/                    # 业务服务
│   ├── 📄 aiService.js             # AI处理服务
│   └── 📄 knowledgeGraphService.js # 知识图谱服务
├── 📁 middleware/                  # 中间件
│   └── 📄 auth.js                  # 认证中间件
├── 📁 uploads/                     # 文件上传目录
└── 📁 vector_db/                   # 向量数据库
```

### 技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js 4.x
- **数据库**: MongoDB + Mongoose
- **图数据库**: Neo4j (可选)
- **AI服务**: OpenAI GPT / 百度文心一言
- **文件处理**: Multer, PDF-Parse, Mammoth
- **认证**: JWT + bcryptjs
- **安全**: Helmet, CORS, Rate Limiting

### API设计

#### 认证模块 (`/api/auth`)
```javascript
POST   /register         # 用户注册
POST   /login           # 用户登录
GET    /me              # 获取当前用户信息
PUT    /profile         # 更新用户资料
POST   /change-password # 修改密码
POST   /refresh-token   # 刷新令牌
POST   /logout          # 用户登出
```

#### 文档管理 (`/api/documents`)
```javascript
POST   /upload          # 上传文档
GET    /                # 获取文档列表
GET    /:id             # 获取文档详情
GET    /:id/knowledge-graph # 获取文档知识图谱
POST   /:id/reprocess   # 重新处理文档
DELETE /:id             # 删除文档
```

#### 知识图谱 (`/api/knowledge-graph`)
```javascript
POST   /                # 创建知识图谱
GET    /                # 获取图谱列表
GET    /:id             # 获取图谱详情
PUT    /:id             # 更新图谱
DELETE /:id             # 删除图谱
GET    /:id/search      # 搜索节点
GET    /:id/nodes/:nodeId # 获取节点详情
GET    /:id/export      # 导出图谱
```

#### AI服务 (`/api/ai`)
```javascript
POST   /chat            # 智能问答
POST   /generate-questions # 生成学习问题
POST   /analyze-document   # 分析文档
POST   /generate-summary   # 生成摘要
POST   /explain-concept    # 概念解释
```

## 🎨 前端应用 (client/)

### 应用架构
```
client/
├── 📄 package.json                 # 依赖配置
├── 📄 Dockerfile                   # Docker构建文件
├── 📄 nginx.conf                   # Nginx配置
├── 📁 public/                      # 静态资源
├── 📁 src/                         # 源代码
│   ├── 📄 App.js                   # 应用根组件
│   ├── 📄 index.js                 # 入口文件
│   ├── 📁 components/              # React组件
│   │   ├── 📁 Auth/                # 认证组件
│   │   ├── 📁 Dashboard/           # 仪表板组件
│   │   ├── 📁 Documents/           # 文档管理组件
│   │   ├── 📁 KnowledgeGraph/      # 知识图谱组件
│   │   ├── 📁 Layout/              # 布局组件
│   │   └── 📁 Profile/             # 用户资料组件
│   ├── 📁 contexts/                # React Context
│   │   ├── 📄 AuthContext.js       # 认证上下文
│   │   └── 📄 NotificationContext.js # 通知上下文
│   ├── 📁 hooks/                   # 自定义Hook
│   ├── 📁 services/                # API服务
│   ├── 📁 utils/                   # 工具函数
│   └── 📁 styles/                  # 样式文件
└── 📁 build/                       # 构建输出
```

### 技术栈
- **框架**: React 18 + React Router
- **UI库**: Material-UI (MUI)
- **状态管理**: React Query + Context API
- **图形可视化**: Vis.js Network / D3.js
- **HTTP客户端**: Axios
- **构建工具**: Create React App
- **样式**: Styled Components + MUI Theme

### 组件设计

#### 核心页面组件
```javascript
// 认证相关
<Login />           # 登录页面
<Register />        # 注册页面
<ProtectedRoute />  # 路由保护组件

// 主要功能页面
<Dashboard />       # 仪表板
<DocumentList />    # 文档列表
<DocumentUpload />  # 文档上传
<DocumentView />    # 文档查看
<KnowledgeGraphView /> # 知识图谱可视化
<Profile />         # 用户资料
```

#### 可复用组件
```javascript
<Layout />          # 主布局
<Navigation />      # 导航栏
<SearchBox />       # 搜索组件
<FileUploader />    # 文件上传器
<ProgressBar />     # 进度条
<DataTable />       # 数据表格
<ConfirmDialog />   # 确认对话框
```

## 🗄️ 数据模型设计

### User模型
```javascript
{
  username: String,      # 用户名
  email: String,         # 邮箱
  password: String,      # 密码（加密）
  profile: {
    displayName: String, # 显示名称
    avatar: String,      # 头像URL
    major: String,       # 专业
    year: Number,        # 年级
    university: String   # 大学
  },
  subscription: {        # 订阅信息
    plan: String,        # 订阅计划
    startDate: Date,     # 开始日期
    endDate: Date,       # 结束日期
    isActive: Boolean    # 是否激活
  },
  statistics: {          # 统计信息
    documentsUploaded: Number,
    knowledgeGraphsCreated: Number,
    questionsAsked: Number,
    lastActive: Date
  }
}
```

### Document模型
```javascript
{
  title: String,         # 文档标题
  description: String,   # 描述
  userId: ObjectId,      # 用户ID
  file: {               # 文件信息
    originalName: String,
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  content: {            # 内容信息
    raw: String,        # 原始文本
    processed: String,  # 处理后文本
    keywords: Array,    # 关键词
    entities: Array,    # 实体
    summary: String     # 摘要
  },
  processing: {         # 处理状态
    status: String,     # pending|processing|completed|failed
    progress: Number,   # 0-100
    error: String,      # 错误信息
    startedAt: Date,
    completedAt: Date
  },
  knowledgeGraph: {     # 知识图谱
    nodes: Array,       # 节点
    edges: Array        # 边
  },
  metadata: {           # 元数据
    subject: String,    # 学科
    course: String,     # 课程
    tags: Array,        # 标签
    difficulty: String  # 难度
  }
}
```

### KnowledgeGraph模型
```javascript
{
  title: String,         # 图谱标题
  description: String,   # 描述
  userId: ObjectId,      # 用户ID
  documentIds: Array,    # 关联文档
  graph: {
    nodes: [{           # 节点
      id: String,
      label: String,
      type: String,
      properties: Object,
      position: Object,
      style: Object
    }],
    edges: [{           # 边
      id: String,
      from: String,
      to: String,
      type: String,
      weight: Number,
      properties: Object,
      style: Object
    }]
  },
  statistics: {         # 图谱统计
    nodeCount: Number,
    edgeCount: Number,
    density: Number,
    averageDegree: Number
  },
  analytics: {          # 分析数据
    views: Number,
    interactions: Number,
    queries: Number,
    exports: Number
  }
}
```

## 🔧 配置管理

### 环境变量
```bash
# 开发环境 (.env.development)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-learning-platform
JWT_SECRET=dev-secret-key
CLIENT_URL=http://localhost:3000

# 生产环境 (.env.production)
NODE_ENV=production
MONGODB_URI=mongodb://admin:password@mongodb:27017/ai-learning-platform
JWT_SECRET=production-secret-key
CLIENT_URL=https://yourdomain.com
```

### 构建配置
```dockerfile
# 后端Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]

# 前端Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

## 🚀 部署架构

### Zeabur部署结构
```yaml
services:
  mongodb:      # 数据库服务
    image: mongo:7
    
  neo4j:        # 图数据库（可选）
    image: neo4j:5
    
  api:          # 后端API服务
    build: ./server
    
  web:          # 前端Web服务
    build: ./client
```

### 服务间通信
```
Client (React) ←→ API (Express) ←→ MongoDB
                        ↓
                    Neo4j (可选)
                        ↓
                   AI Services (OpenAI/百度)
```

## 📊 性能优化

### 后端优化
- **数据库索引**: 关键字段建立索引
- **缓存策略**: Redis缓存热点数据
- **分页查询**: 避免大量数据加载
- **文件压缩**: Gzip压缩响应
- **连接池**: 数据库连接池管理

### 前端优化
- **代码分割**: React.lazy懒加载
- **图片优化**: WebP格式、压缩
- **缓存策略**: Service Worker缓存
- **CDN加速**: 静态资源CDN
- **Tree Shaking**: 移除未使用代码

## 🔒 安全措施

### 后端安全
- **输入验证**: express-validator验证
- **SQL注入防护**: Mongoose参数化查询
- **XSS防护**: Helmet安全头
- **CSRF防护**: SameSite Cookie
- **限流保护**: express-rate-limit

### 前端安全
- **CSP策略**: 内容安全策略
- **HTTPS强制**: 强制HTTPS连接
- **敏感信息**: 避免存储敏感数据
- **依赖扫描**: 定期更新依赖

## 📈 监控与日志

### 应用监控
- **性能监控**: 响应时间、吞吐量
- **错误监控**: 异常捕获和报告
- **业务监控**: 用户行为分析
- **资源监控**: CPU、内存使用率

### 日志管理
- **结构化日志**: JSON格式日志
- **日志级别**: ERROR、WARN、INFO、DEBUG
- **日志轮转**: 按大小和时间轮转
- **集中收集**: ELK或云日志服务

这个项目结构为AI学习平台提供了完整的技术架构基础，支持快速开发和扩展。 