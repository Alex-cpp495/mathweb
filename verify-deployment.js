#!/usr/bin/env node
/**
 * 部署验证脚本
 * 检查项目是否准备好进行Zeabur部署
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证项目部署准备情况...\n');

const checks = [];

// 检查必需文件
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  checks.push({
    name: description,
    status: exists ? 'pass' : 'fail',
    message: exists ? '✅ 文件存在' : '❌ 文件缺失',
    path: filePath
  });
  return exists;
}

// 检查目录
function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  checks.push({
    name: description,
    status: exists ? 'pass' : 'fail',
    message: exists ? '✅ 目录存在' : '❌ 目录缺失',
    path: dirPath
  });
  return exists;
}

// 检查JSON文件内容
function checkJsonFile(filePath, description, requiredFields = []) {
  if (!checkFile(filePath, description)) return false;
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missingFields = requiredFields.filter(field => !content[field]);
    
    if (missingFields.length > 0) {
      checks.push({
        name: `${description} - 必需字段`,
        status: 'fail',
        message: `❌ 缺少字段: ${missingFields.join(', ')}`,
        path: filePath
      });
      return false;
    } else {
      checks.push({
        name: `${description} - 必需字段`,
        status: 'pass',
        message: '✅ 所有必需字段都存在',
        path: filePath
      });
      return true;
    }
  } catch (error) {
    checks.push({
      name: `${description} - JSON格式`,
      status: 'fail',
      message: `❌ JSON格式错误: ${error.message}`,
      path: filePath
    });
    return false;
  }
}

// 开始检查
console.log('📋 检查必需文件和目录...\n');

// 1. 检查React应用必需文件
checkFile('client/public/index.html', 'React应用入口文件');
checkFile('client/public/manifest.json', 'PWA配置文件');
checkJsonFile('client/package.json', 'React应用配置', ['name', 'scripts', 'dependencies']);

// 2. 检查后端必需文件
checkFile('server/index.js', '后端入口文件');
checkFile('server/config.js', '后端配置文件');
checkJsonFile('server/package.json', '后端配置', ['name', 'scripts', 'dependencies']);

// 3. 检查源码目录
checkDirectory('client/src', 'React源码目录');
checkDirectory('server/routes', '后端路由目录');
checkDirectory('server/services', '后端服务目录');
checkDirectory('server/models', '后端模型目录');

// 4. 检查部署文件
checkFile('zeabur.yaml', 'Zeabur部署配置');
checkFile('.gitignore', 'Git忽略配置');

// 5. 检查环境配置
const hasConfig = checkFile('server/config.js', '服务器配置文件');
const hasExample = checkFile('server/config.example.js', '配置示例文件');

if (hasConfig) {
  try {
    const config = require('./server/config.js');
    const hasGeminiKey = config.ai?.gemini?.apiKey && config.ai.gemini.apiKey !== 'your-gemini-api-key-here';
    const hasDeepSeekKey = config.ai?.deepseek?.apiKey && config.ai.deepseek.apiKey !== 'your-deepseek-api-key-here';
    
    checks.push({
      name: 'Gemini API密钥配置',
      status: hasGeminiKey ? 'pass' : 'fail',
      message: hasGeminiKey ? '✅ 已配置' : '❌ 未配置或使用默认值',
      path: 'server/config.js'
    });
    
    checks.push({
      name: 'DeepSeek API密钥配置',
      status: hasDeepSeekKey ? 'pass' : 'fail',
      message: hasDeepSeekKey ? '✅ 已配置' : '❌ 未配置或使用默认值',
      path: 'server/config.js'
    });
  } catch (error) {
    checks.push({
      name: 'API密钥配置验证',
      status: 'fail',
      message: `❌ 配置文件加载错误: ${error.message}`,
      path: 'server/config.js'
    });
  }
}

// 显示检查结果
console.log('📊 检查结果:\n');
console.log('=' .repeat(80));

let passCount = 0;
let failCount = 0;

checks.forEach((check, index) => {
  const status = check.status === 'pass' ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  console.log(`   ${check.message}`);
  if (check.path) {
    console.log(`   📁 ${check.path}`);
  }
  console.log('');
  
  if (check.status === 'pass') passCount++;
  else failCount++;
});

console.log('=' .repeat(80));
console.log(`总计: ${checks.length} 项检查`);
console.log(`✅ 通过: ${passCount} 项`);
console.log(`❌ 失败: ${failCount} 项`);

// 给出建议
if (failCount === 0) {
  console.log('\n🎉 恭喜！项目已准备好部署到Zeabur！');
  console.log('\n📋 部署步骤:');
  console.log('1. 将项目上传到Zeabur');
  console.log('2. 设置环境变量（如果使用环境变量而不是配置文件）');
  console.log('3. 启动部署');
  console.log('\n🔗 有用链接:');
  console.log('- 查看部署指南: DEPLOYMENT_GUIDE.md');
  console.log('- 查看API设置: API_KEYS_SETUP.md');
  console.log('- 快速开始: QUICK_START.md');
} else {
  console.log('\n⚠️  发现问题，请修复以下内容后再部署:');
  
  const failedChecks = checks.filter(check => check.status === 'fail');
  failedChecks.forEach((check, index) => {
    console.log(`${index + 1}. ${check.name}: ${check.message}`);
  });
  
  console.log('\n💡 修复建议:');
  console.log('- 运行 `npm install` 安装依赖');
  console.log('- 检查文件路径是否正确');
  console.log('- 确保API密钥已正确配置');
  console.log('- 查看 DEPLOYMENT_FIX.md 获取详细解决方案');
}

console.log('\n🆘 需要帮助？查看以下文档:');
console.log('- DEPLOYMENT_FIX.md - 部署问题解决方案');
console.log('- API_KEYS_SETUP.md - API密钥配置指南');
console.log('- QUICK_START.md - 快速启动指南');

process.exit(failCount === 0 ? 0 : 1); 