const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件配置
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 数据库连接 - 构建正确的MongoDB连接字符串
let mongoUri;

if (process.env.MONGO_CONNECTION_STRING) {
  // 优先使用Zeabur提供的完整连接字符串
  mongoUri = process.env.MONGO_CONNECTION_STRING;
} else if (process.env.MONGO_URI) {
  // 使用MONGO_URI
  mongoUri = process.env.MONGO_URI;
} else if (process.env.MONGODB_URI) {
  // 使用MONGODB_URI
  mongoUri = process.env.MONGODB_URI;
} else if (process.env.MONGO_HOST && process.env.MONGO_USERNAME && process.env.MONGO_PASSWORD) {
  // 使用分别的环境变量构建连接字符串
  const host = process.env.MONGO_HOST;
  const port = process.env.MONGO_PORT || 27017;
  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;
  const database = process.env.MONGO_DATABASE || 'ai-learning-platform';
  
  mongoUri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
} else {
  // 开发环境默认值
  mongoUri = 'mongodb://localhost:27017/ai-learning-platform';
}

console.log('🔗 尝试连接MongoDB...');
console.log('📋 连接信息:');
console.log('  - Host:', process.env.MONGO_HOST || 'localhost');
console.log('  - Port:', process.env.MONGO_PORT || '27017');
console.log('  - Username:', process.env.MONGO_USERNAME || 'none');
console.log('  - Connection String:', mongoUri.replace(/:[^:@]*@/, ':****@')); // 隐藏密码

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5秒超时
  socketTimeoutMS: 45000, // 45秒socket超时
})
.then(() => {
  console.log('✅ MongoDB连接成功');
  console.log('📊 数据库名称:', mongoose.connection.name);
  console.log('🏠 数据库主机:', mongoose.connection.host);
})
.catch(err => {
  console.error('❌ MongoDB连接失败:', err.message);
  console.error('🔍 请检查以下环境变量:');
  console.error('  - MONGO_CONNECTION_STRING:', process.env.MONGO_CONNECTION_STRING ? '✅ 已设置' : '❌ 未设置');
  console.error('  - MONGO_HOST:', process.env.MONGO_HOST ? '✅ 已设置' : '❌ 未设置');
  console.error('  - MONGO_USERNAME:', process.env.MONGO_USERNAME ? '✅ 已设置' : '❌ 未设置');
  console.error('  - MONGO_PASSWORD:', process.env.MONGO_PASSWORD ? '✅ 已设置' : '❌ 未设置');
});

// 路由配置
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/knowledge-graph', require('./routes/knowledgeGraph'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/users', require('./routes/users'));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '内部错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`🌍 API访问地址: http://localhost:${PORT}/api`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  
  // 输出配置信息以便调试
  console.log('📋 配置信息:');
  console.log('  - MongoDB URI:', process.env.MONGO_CONNECTION_STRING ? '✅ 已配置' : '❌ 未配置');
  console.log('  - Neo4j URI:', process.env.NEO4J_URI ? '✅ 已配置' : '⚠️ 未配置 (将使用内存图结构)');
  console.log('  - Gemini API:', process.env.GEMINI_API_KEY ? '✅ 已配置' : '❌ 未配置');
  console.log('  - DeepSeek API:', process.env.DEEPSEEK_API_KEY ? '✅ 已配置' : '❌ 未配置');
}); 