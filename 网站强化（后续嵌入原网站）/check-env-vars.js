#!/usr/bin/env node

/**
 * 环境变量检查脚本
 * 用于验证Zeabur部署所需的环境变量是否正确配置
 */

console.log('🔍 AI学习平台环境变量检查');
console.log('============================\n');

// 必需的环境变量
const requiredVars = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'GEMINI_API_KEY',
  'DEEPSEEK_API_KEY'
];

// MongoDB相关环境变量（至少需要其中一种）
const mongoVars = [
  'MONGO_CONNECTION_STRING',
  'MONGO_URI',
  'MONGODB_URI'
];

// 可选的环境变量
const optionalVars = [
  'NEO4J_URI',
  'NEO4J_USERNAME',
  'NEO4J_PASSWORD',
  'CLIENT_URL',
  'REACT_APP_API_URL'
];

let errorCount = 0;
let warningCount = 0;

console.log('📋 检查必需环境变量:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${maskSensitive(varName, value)}`);
  } else {
    console.log(`❌ ${varName}: 未设置`);
    errorCount++;
  }
});

console.log('\n🗄️  检查MongoDB配置:');
const mongoConfigured = mongoVars.some(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${maskSensitive(varName, value)}`);
    return true;
  }
  return false;
});

if (!mongoConfigured) {
  console.log('❌ MongoDB: 未配置任何MongoDB连接变量');
  console.log('   需要设置以下变量之一:');
  mongoVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  errorCount++;
}

// 检查MongoDB详细配置
const mongoDetailVars = ['MONGO_HOST', 'MONGO_USERNAME', 'MONGO_PASSWORD', 'MONGO_PORT'];
console.log('\n📊 MongoDB详细配置:');
mongoDetailVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${maskSensitive(varName, value)}`);
  } else {
    console.log(`⚠️  ${varName}: 未设置`);
  }
});

console.log('\n🔧 检查可选环境变量:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${maskSensitive(varName, value)}`);
  } else {
    console.log(`⚠️  ${varName}: 未设置`);
    warningCount++;
  }
});

// 特殊检查
console.log('\n🔍 特殊检查:');

// 检查端口配置
const port = process.env.PORT || '5000';
if (port === '5000' || port === '8080') {
  console.log(`✅ PORT: ${port} (推荐)`);
} else {
  console.log(`⚠️  PORT: ${port} (建议使用5000或8080)`);
  warningCount++;
}

// 检查生产环境
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === 'production') {
  console.log('✅ NODE_ENV: production');
} else {
  console.log(`⚠️  NODE_ENV: ${nodeEnv} (生产环境建议设置为production)`);
  warningCount++;
}

// 检查API密钥格式
const geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey && geminiKey.startsWith('AIza')) {
  console.log('✅ GEMINI_API_KEY: 格式正确');
} else if (geminiKey) {
  console.log('⚠️  GEMINI_API_KEY: 格式可能不正确');
  warningCount++;
}

const deepseekKey = process.env.DEEPSEEK_API_KEY;
if (deepseekKey && deepseekKey.startsWith('sk-')) {
  console.log('✅ DEEPSEEK_API_KEY: 格式正确');
} else if (deepseekKey) {
  console.log('⚠️  DEEPSEEK_API_KEY: 格式可能不正确');
  warningCount++;
}

// 总结
console.log('\n📋 检查总结:');
console.log(`✅ 成功: ${requiredVars.length + (mongoConfigured ? 1 : 0) - errorCount}`);
console.log(`❌ 错误: ${errorCount}`);
console.log(`⚠️  警告: ${warningCount}`);

if (errorCount === 0) {
  console.log('\n🎉 恭喜！所有必需的环境变量都已正确配置！');
  console.log('现在可以部署到Zeabur了。');
} else {
  console.log('\n❌ 发现配置错误，请修复后重试。');
  console.log('参考: ZEABUR_ENV_SETUP.md');
  process.exit(1);
}

/**
 * 敏感信息掩码函数
 */
function maskSensitive(varName, value) {
  const sensitiveVars = [
    'JWT_SECRET', 'GEMINI_API_KEY', 'DEEPSEEK_API_KEY', 
    'MONGO_PASSWORD', 'NEO4J_PASSWORD', 'PASSWORD'
  ];
  
  const isSensitive = sensitiveVars.some(sensitive => 
    varName.includes(sensitive) || varName.includes('SECRET')
  );
  
  if (isSensitive) {
    if (value.length <= 8) {
      return '****';
    }
    return value.substring(0, 4) + '****' + value.substring(value.length - 4);
  }
  
  // 对于连接字符串，隐藏密码部分
  if (varName.includes('CONNECTION_STRING') || varName.includes('URI')) {
    return value.replace(/:[^:@]*@/, ':****@');
  }
  
  return value;
}

// 如果作为模块导入，导出检查函数
if (require.main !== module) {
  module.exports = {
    checkEnvironmentVariables: () => {
      // 返回检查结果
      return {
        errors: errorCount,
        warnings: warningCount,
        success: errorCount === 0
      };
    }
  };
} 