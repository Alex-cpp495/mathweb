const express = require('express');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const Document = require('../models/Document');
const KnowledgeGraph = require('../models/KnowledgeGraph');
const aiService = require('../services/aiService');

const router = express.Router();

// 智能问答
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { question, documentId, knowledgeGraphId, context = [] } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ message: '请输入问题' });
    }

    let contextContent = '';
    let sourceInfo = {};

    // 如果指定了文档ID，使用文档内容作为上下文
    if (documentId) {
      const document = await Document.findOne({
        _id: documentId,
        userId: req.user.userId
      });

      if (!document) {
        return res.status(404).json({ message: '文档不存在' });
      }

      contextContent = document.content.processed || document.content.raw || '';
      sourceInfo = {
        type: 'document',
        id: documentId,
        title: document.title
      };
    }

    // 如果指定了知识图谱ID，使用相关内容作为上下文
    if (knowledgeGraphId) {
      const knowledgeGraph = await KnowledgeGraph.findOne({
        _id: knowledgeGraphId,
        userId: req.user.userId
      });

      if (!knowledgeGraph) {
        return res.status(404).json({ message: '知识图谱不存在' });
      }

      // 从知识图谱中提取相关信息
      const relevantNodes = findRelevantNodes(knowledgeGraph.graph.nodes, question);
      contextContent = relevantNodes.map(node => 
        `${node.label}: ${node.properties.description || ''}`
      ).join('\n');

      sourceInfo = {
        type: 'knowledge_graph',
        id: knowledgeGraphId,
        title: knowledgeGraph.title,
        relevantNodes: relevantNodes.map(n => n.label)
      };
    }

    // 构建对话上下文
    const conversationHistory = context.slice(-5); // 保留最近5轮对话
    
    // 生成回答
    const response = await generateAnswer(question, contextContent, conversationHistory);

    res.json({
      answer: response.answer,
      confidence: response.confidence,
      source: sourceInfo,
      suggestions: response.suggestions || []
    });
  } catch (error) {
    console.error('智能问答失败:', error);
    res.status(500).json({ message: '智能问答失败', error: error.message });
  }
});

// 生成学习问题
router.post('/generate-questions', authenticateToken, checkPermission('ai_summary'), async (req, res) => {
  try {
    const { documentId, difficulty = 'medium', count = 5 } = req.body;

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user.userId
    });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    if (!document.isProcessed) {
      return res.status(400).json({ message: '文档尚未处理完成' });
    }

    const content = document.content.processed || document.content.raw;
    if (!content.trim()) {
      return res.status(400).json({ message: '文档内容为空' });
    }

    // 生成学习问题
    const questions = await generateLearningQuestions(content, difficulty, count);

    // 更新文档统计
    document.analytics.questionsGenerated += questions.length;
    await document.save();

    res.json({
      questions,
      document: {
        id: document._id,
        title: document.title
      }
    });
  } catch (error) {
    console.error('生成学习问题失败:', error);
    res.status(500).json({ message: '生成学习问题失败', error: error.message });
  }
});

// 分析文档内容
router.post('/analyze-document', authenticateToken, async (req, res) => {
  try {
    const { documentId, analysisType = 'comprehensive' } = req.body;

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user.userId
    });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    if (!document.isProcessed) {
      return res.status(400).json({ message: '文档尚未处理完成' });
    }

    const content = document.content.processed || document.content.raw;
    const analysis = await analyzeDocument(content, analysisType);

    res.json({
      analysis,
      document: {
        id: document._id,
        title: document.title
      }
    });
  } catch (error) {
    console.error('文档分析失败:', error);
    res.status(500).json({ message: '文档分析失败', error: error.message });
  }
});

// 智能摘要生成
router.post('/generate-summary', authenticateToken, async (req, res) => {
  try {
    const { documentId, length = 'medium' } = req.body;

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user.userId
    });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    const content = document.content.processed || document.content.raw;
    if (!content.trim()) {
      return res.status(400).json({ message: '文档内容为空' });
    }

    // 根据长度设置最大字数
    const maxLength = {
      short: 150,
      medium: 300,
      long: 500
    }[length] || 300;

    const summary = await aiService.generateSummary(content, maxLength);

    res.json({
      summary,
      length,
      document: {
        id: document._id,
        title: document.title
      }
    });
  } catch (error) {
    console.error('生成摘要失败:', error);
    res.status(500).json({ message: '生成摘要失败', error: error.message });
  }
});

// 概念解释
router.post('/explain-concept', authenticateToken, async (req, res) => {
  try {
    const { concept, documentId, knowledgeGraphId } = req.body;

    if (!concept?.trim()) {
      return res.status(400).json({ message: '请输入需要解释的概念' });
    }

    let context = '';
    let sourceInfo = {};

    if (documentId) {
      const document = await Document.findOne({
        _id: documentId,
        userId: req.user.userId
      });

      if (document) {
        context = document.content.processed || document.content.raw || '';
        sourceInfo = {
          type: 'document',
          id: documentId,
          title: document.title
        };
      }
    }

    if (knowledgeGraphId) {
      const knowledgeGraph = await KnowledgeGraph.findOne({
        _id: knowledgeGraphId,
        userId: req.user.userId
      });

      if (knowledgeGraph) {
        const relatedNode = knowledgeGraph.graph.nodes.find(node =>
          node.label.toLowerCase().includes(concept.toLowerCase())
        );

        if (relatedNode) {
          context = relatedNode.properties.description || '';
          sourceInfo = {
            type: 'knowledge_graph',
            id: knowledgeGraphId,
            title: knowledgeGraph.title,
            nodeId: relatedNode.id
          };
        }
      }
    }

    const explanation = await explainConcept(concept, context);

    res.json({
      concept,
      explanation,
      source: sourceInfo
    });
  } catch (error) {
    console.error('概念解释失败:', error);
    res.status(500).json({ message: '概念解释失败', error: error.message });
  }
});

// 辅助函数：查找相关节点
function findRelevantNodes(nodes, question) {
  const questionLower = question.toLowerCase();
  const keywords = questionLower.split(/\s+/).filter(word => word.length > 2);
  
  return nodes.filter(node => {
    const labelLower = node.label.toLowerCase();
    const descLower = (node.properties.description || '').toLowerCase();
    
    return keywords.some(keyword => 
      labelLower.includes(keyword) || descLower.includes(keyword)
    );
  }).slice(0, 5); // 最多返回5个相关节点
}

// 辅助函数：生成回答
async function generateAnswer(question, context, conversationHistory) {
  try {
    // 构建提示词
    let prompt = `基于以下上下文信息回答问题：

上下文：
${context}

`;

    if (conversationHistory.length > 0) {
      prompt += `对话历史：
${conversationHistory.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')}

`;
    }

    prompt += `问题：${question}

请提供准确、有用的回答。如果上下文中没有相关信息，请说明"根据提供的材料无法回答此问题"。`;

    // 尝试使用AI服务
    let answer = '';
    let confidence = 0.5;

    try {
      // 使用新的混合AI服务
      if (process.env.GEMINI_API_KEY || process.env.DEEPSEEK_API_KEY) {
        const result = await aiService.processWithAI(prompt, 'generate_summary');
        answer = result.result || result.answer || result;
        confidence = 0.8;
      } else {
        // 简单的关键词匹配回答
        answer = generateSimpleAnswer(question, context);
        confidence = 0.4;
      }
    } catch (error) {
      console.error('AI服务调用失败，使用简单回答:', error);
      answer = generateSimpleAnswer(question, context);
      confidence = 0.3;
    }

    // 生成建议问题
    const suggestions = generateSuggestions(question, context);

    return {
      answer: answer || '抱歉，无法根据提供的信息回答此问题。',
      confidence,
      suggestions
    };
  } catch (error) {
    console.error('生成回答失败:', error);
    return {
      answer: '抱歉，处理您的问题时遇到了错误。',
      confidence: 0,
      suggestions: []
    };
  }
}

// 辅助函数：生成简单回答
function generateSimpleAnswer(question, context) {
  const questionLower = question.toLowerCase();
  const sentences = context.split(/[。！？]/).filter(s => s.trim().length > 10);
  
  // 查找包含问题关键词的句子
  const keywords = questionLower.split(/\s+/).filter(word => word.length > 2);
  const relevantSentences = sentences.filter(sentence => {
    const sentenceLower = sentence.toLowerCase();
    return keywords.some(keyword => sentenceLower.includes(keyword));
  });

  if (relevantSentences.length > 0) {
    return relevantSentences.slice(0, 3).join('。') + '。';
  }

  return '根据提供的材料无法找到相关信息。';
}

// 辅助函数：生成建议问题
function generateSuggestions(question, context) {
  const suggestions = [
    '这个概念的具体定义是什么？',
    '能举个具体的例子吗？',
    '这与其他相关概念有什么区别？',
    '在实际应用中如何使用？'
  ];

  return suggestions.slice(0, 3);
}

// 辅助函数：生成学习问题
async function generateLearningQuestions(content, difficulty, count) {
  const defaultQuestions = [
    { question: '这段内容的主要观点是什么？', type: '理解题', difficulty },
    { question: '请解释其中的关键概念。', type: '解释题', difficulty },
    { question: '这些知识点在实际中如何应用？', type: '应用题', difficulty }
  ];

  try {
    // 使用新的AI服务生成问题
    if (process.env.GEMINI_API_KEY || process.env.DEEPSEEK_API_KEY) {
      const result = await aiService.processWithAI(content, 'generate_questions');
      if (result.questions && Array.isArray(result.questions)) {
        return result.questions.slice(0, count);
      }
    }
  } catch (error) {
    console.error('AI生成问题失败，使用默认问题:', error);
  }

  return defaultQuestions.slice(0, count);
}

// 辅助函数：分析文档
async function analyzeDocument(content, analysisType) {
  const basicAnalysis = {
    wordCount: content.length,
    readingTime: Math.ceil(content.length / 200), // 假设每分钟200字
    difficulty: estimateDifficulty(content),
    topics: extractTopics(content)
  };

  if (analysisType === 'basic') {
    return basicAnalysis;
  }

  // comprehensive分析
  try {
    const keywords = await aiService.extractKeywords(content, 10);
    const entities = await aiService.extractEntities(content);
    
    return {
      ...basicAnalysis,
      keywords: keywords.slice(0, 10),
      entities: entities.slice(0, 10),
      structure: analyzeStructure(content)
    };
  } catch (error) {
    console.error('文档分析失败:', error);
    return basicAnalysis;
  }
}

// 辅助函数：估算难度
function estimateDifficulty(content) {
  const avgSentenceLength = content.split(/[。！？]/).reduce((sum, sentence) => 
    sum + sentence.length, 0) / content.split(/[。！？]/).length;
  
  if (avgSentenceLength < 20) return 'easy';
  if (avgSentenceLength < 40) return 'medium';
  return 'hard';
}

// 辅助函数：提取主题
function extractTopics(content) {
  // 简单的主题提取逻辑
  const commonTopics = ['技术', '管理', '教育', '科学', '历史', '文学', '经济'];
  return commonTopics.filter(topic => 
    content.includes(topic)
  ).slice(0, 3);
}

// 辅助函数：分析结构
function analyzeStructure(content) {
  const sections = content.split(/\n\s*\n/).filter(s => s.trim().length > 0);
  const hasHeaders = /第[一二三四五六七八九十\d]+[章节部分]|[一二三四五六七八九十\d]+[、\.]/m.test(content);
  
  return {
    sectionCount: sections.length,
    hasHeaders,
    avgSectionLength: sections.reduce((sum, section) => sum + section.length, 0) / sections.length
  };
}

// 辅助函数：解释概念
async function explainConcept(concept, context) {
  if (context && context.includes(concept)) {
    const sentences = context.split(/[。！？]/).filter(s => s.includes(concept));
    if (sentences.length > 0) {
      return sentences[0] + '。';
    }
  }

  return `${concept}是一个重要的概念，需要结合具体的学习材料来理解其含义和应用。`;
}

module.exports = router; 