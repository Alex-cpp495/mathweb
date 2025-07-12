// 配置示例文件 - 复制为 config.js 并填入真实值

module.exports = {
  // 服务器配置
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-learning-platform',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // AI服务配置
  ai: {
    // Google Gemini API配置
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || 'your-gemini-api-key-here',
      model: 'gemini-1.5-flash-latest',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    
    // DeepSeek API配置
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || 'your-deepseek-api-key-here',
      model: 'deepseek-chat',
      endpoint: 'https://api.deepseek.com/chat/completions'
    },
    
    // 默认使用的模型
    defaultModel: 'auto', // 'auto', 'gemini', 'deepseek'
    
    // 回退策略
    fallbackEnabled: true
  },
  
  // 文件上传配置
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx']
  },
  
  // 安全配置
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15分钟
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
  },
  
  // 可选服务配置
  optional: {
    // 向量数据库
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || '',
      indexName: process.env.PINECONE_INDEX_NAME || 'ai-learning-vectors'
    },
    
    // 图数据库
    neo4j: {
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || ''
    },
    
    // 邮件服务
    email: {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASS || ''
    }
  },
  
  // 功能开关
  features: {
    aiEnabled: process.env.ENABLE_AI_FEATURES === 'true',
    knowledgeGraphEnabled: process.env.ENABLE_KNOWLEDGE_GRAPH === 'true',
    vectorSearchEnabled: process.env.ENABLE_VECTOR_SEARCH === 'true'
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  }
}; 