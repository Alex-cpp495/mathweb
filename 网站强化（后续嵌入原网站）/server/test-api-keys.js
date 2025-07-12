#!/usr/bin/env node
/**
 * API密钥测试脚本
 * 用于验证Gemini和DeepSeek API密钥是否配置正确
 */

require('dotenv').config();
const config = require('./config');

// 测试Gemini API
async function testGeminiAPI() {
  console.log('🧪 测试Gemini API...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.ai.gemini.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: '请简单回复"Hello"来测试API连接'
            }]
          }]
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini API 测试成功!');
      console.log('📝 响应:', data.candidates?.[0]?.content?.parts?.[0]?.text || '无响应内容');
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Gemini API 测试失败:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API 连接错误:', error.message);
    return false;
  }
}

// 测试DeepSeek API
async function testDeepSeekAPI() {
  console.log('🧪 测试DeepSeek API...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.deepseek.apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: '请简单回复"Hello"来测试API连接'
          }
        ],
        max_tokens: 100
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DeepSeek API 测试成功!');
      console.log('📝 响应:', data.choices?.[0]?.message?.content || '无响应内容');
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ DeepSeek API 测试失败:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ DeepSeek API 连接错误:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试API密钥配置...\n');
  
  // 检查配置
  console.log('📋 配置信息:');
  console.log(`- Gemini API Key: ${config.ai.gemini.apiKey.substring(0, 10)}...`);
  console.log(`- DeepSeek API Key: ${config.ai.deepseek.apiKey.substring(0, 10)}...\n`);
  
  const results = [];
  
  // 测试Gemini
  const geminiResult = await testGeminiAPI();
  results.push({ service: 'Gemini', success: geminiResult });
  
  console.log(''); // 空行分隔
  
  // 测试DeepSeek  
  const deepseekResult = await testDeepSeekAPI();
  results.push({ service: 'DeepSeek', success: deepseekResult });
  
  // 总结结果
  console.log('\n📊 测试结果总结:');
  console.log('================================');
  
  let allSuccess = true;
  results.forEach(result => {
    const status = result.success ? '✅ 成功' : '❌ 失败';
    console.log(`${result.service}: ${status}`);
    if (!result.success) allSuccess = false;
  });
  
  console.log('================================');
  
  if (allSuccess) {
    console.log('🎉 所有API测试通过！您的配置完全正确。');
    console.log('💡 现在可以启动项目了：');
    console.log('   cd server && npm run dev');
  } else {
    console.log('⚠️  部分API测试失败，请检查：');
    console.log('1. API密钥是否正确');
    console.log('2. 网络连接是否正常');
    console.log('3. API服务是否可用');
  }
  
  process.exit(allSuccess ? 0 : 1);
}

// 运行测试
runTests().catch(error => {
  console.error('💥 测试过程中出现错误:', error);
  process.exit(1);
}); 