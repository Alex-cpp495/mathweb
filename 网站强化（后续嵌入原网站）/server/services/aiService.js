const axios = require('axios');
const { NlpManager } = require('node-nlp');
require('dotenv').config();

class AIService {
  constructor() {
    this.nlpManager = new NlpManager({ languages: ['zh'], forceNER: true });
    this.initializeNLP();
  }

  async initializeNLP() {
    // 添加中文实体识别
    this.nlpManager.addNamedEntityText('person', '人物', ['zh'], ['人', '教授', '学者', '作者']);
    this.nlpManager.addNamedEntityText('concept', '概念', ['zh'], ['概念', '理论', '定义', '原理']);
    this.nlpManager.addNamedEntityText('method', '方法', ['zh'], ['方法', '技术', '算法', '策略']);
    
    await this.nlpManager.train();
  }

  /**
   * 提取文档关键词
   */
  async extractKeywords(text, maxKeywords = 20) {
    try {
      // 使用node-nlp进行关键词提取
      const result = await this.nlpManager.process('zh', text);
      
      // 简单的TF-IDF实现
      const words = this.segmentText(text);
      const wordFreq = this.calculateWordFrequency(words);
      const keywords = this.calculateTFIDF(wordFreq, text);
      
      return keywords
        .slice(0, maxKeywords)
        .map(item => ({
          word: item.word,
          weight: item.score,
          frequency: item.frequency
        }));
    } catch (error) {
      console.error('关键词提取失败:', error);
      return [];
    }
  }

  /**
   * 实体识别
   */
  async extractEntities(text) {
    try {
      const result = await this.nlpManager.process('zh', text);
      
      const entities = [];
      
      // 使用正则表达式识别常见实体
      const patterns = {
        person: /(?:教授|博士|学者|作者)\s*([^\s，。！？]+)/g,
        concept: /(?:概念|理论|定义|原理)\s*[：:]\s*([^\s，。！？]+)/g,
        method: /(?:方法|技术|算法|策略)\s*[：:]\s*([^\s，。！？]+)/g,
        number: /\d+(?:\.\d+)?/g,
        formula: /[a-zA-Z]\s*=\s*[^，。！？\n]+/g
      };

      for (const [type, pattern] of Object.entries(patterns)) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          entities.push({
            text: match[1] || match[0],
            type: type,
            confidence: 0.8
          });
        }
      }

      return entities;
    } catch (error) {
      console.error('实体识别失败:', error);
      return [];
    }
  }

  /**
   * 生成文档摘要
   */
  async generateSummary(text, maxLength = 300) {
    try {
      // 分句
      const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 10);
      
      if (sentences.length <= 3) {
        return text.substring(0, maxLength);
      }

      // 计算句子重要性分数
      const sentenceScores = sentences.map(sentence => {
        const score = this.calculateSentenceScore(sentence, text);
        return { sentence, score };
      });

      // 选择分数最高的句子
      const topSentences = sentenceScores
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(3, sentences.length))
        .map(item => item.sentence);

      return topSentences.join('。') + '。';
    } catch (error) {
      console.error('摘要生成失败:', error);
      return text.substring(0, maxLength);
    }
  }

  /**
   * 使用Google Gemini API进行高级处理
   */
  async processWithGemini(text, task = 'extract_concepts') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API Key未配置');
    }

    try {
      const prompts = {
        extract_concepts: `请从以下文本中提取主要概念和知识点，以JSON格式返回：
        格式：{"concepts": [{"name": "概念名", "description": "描述", "importance": 0.8}]}
        
        文本：${text}`,
        
        extract_relations: `请分析以下文本中概念之间的关系，以JSON格式返回：
        格式：{"relations": [{"from": "概念A", "to": "概念B", "relation": "关系类型", "strength": 0.7}]}
        
        文本：${text}`,
        
        generate_questions: `基于以下文本生成5个学习问题，以JSON格式返回：
        格式：{"questions": [{"question": "问题", "type": "选择题", "difficulty": "中等"}]}
        
        文本：${text}`,
        
        generate_summary: `请为以下文本生成简洁摘要：${text}`
      };

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompts[task] || prompts.extract_concepts
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.candidates[0].content.parts[0].text;
      
      // 尝试解析JSON，如果失败则返回原始文本
      try {
        return JSON.parse(result);
      } catch (parseError) {
        return { result: result };
      }
    } catch (error) {
      console.error('Gemini API调用失败:', error);
      throw error;
    }
  }

  /**
   * 使用DeepSeek API进行处理
   */
  async processWithDeepSeek(text, task = 'extract_concepts') {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API Key未配置');
    }

    try {
      const prompts = {
        extract_concepts: `请从以下文本中提取主要概念和知识点，以JSON格式返回：
        格式：{"concepts": [{"name": "概念名", "description": "描述", "importance": 0.8}]}
        
        文本：${text}`,
        
        extract_relations: `请分析以下文本中概念之间的关系，以JSON格式返回：
        格式：{"relations": [{"from": "概念A", "to": "概念B", "relation": "关系类型", "strength": 0.7}]}
        
        文本：${text}`,
        
        generate_questions: `基于以下文本生成5个学习问题，以JSON格式返回：
        格式：{"questions": [{"question": "问题", "type": "选择题", "difficulty": "中等"}]}
        
        文本：${text}`,
        
        generate_summary: `请为以下文本生成简洁摘要：${text}`
      };

      const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompts[task] || prompts.extract_concepts
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data.choices[0].message.content;
      
      // 尝试解析JSON，如果失败则返回原始文本
      try {
        return JSON.parse(result);
      } catch (parseError) {
        return { result: result };
      }
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      throw error;
    }
  }

  /**
   * 智能路由：根据任务类型选择最适合的AI模型
   */
  async processWithAI(text, task = 'extract_concepts', preferredModel = 'auto') {
    try {
      let result;
      
      if (preferredModel === 'gemini' || (preferredModel === 'auto' && Math.random() > 0.5)) {
        // 优先使用Gemini，适合知识提取和概念分析
        try {
          result = await this.processWithGemini(text, task);
        } catch (error) {
          console.warn('Gemini API失败，切换到DeepSeek:', error.message);
          result = await this.processWithDeepSeek(text, task);
        }
      } else {
        // 使用DeepSeek，适合推理和问题生成
        try {
          result = await this.processWithDeepSeek(text, task);
        } catch (error) {
          console.warn('DeepSeek API失败，切换到Gemini:', error.message);
          result = await this.processWithGemini(text, task);
        }
      }
      
      return result;
    } catch (error) {
      console.error('所有AI模型都失败了:', error);
      // 返回本地处理结果作为后备
      return this.fallbackProcessing(text, task);
    }
  }

  /**
   * 后备处理方法（当AI API都失败时使用）
   */
  async fallbackProcessing(text, task) {
    switch (task) {
      case 'extract_concepts':
        const keywords = await this.extractKeywords(text);
        return {
          concepts: keywords.slice(0, 10).map(kw => ({
            name: kw.word,
            description: `关键概念：${kw.word}`,
            importance: kw.weight
          }))
        };
      
      case 'generate_summary':
        const summary = await this.generateSummary(text);
        return { result: summary };
      
      case 'extract_relations':
        const entities = await this.extractEntities(text);
        const relations = [];
        for (let i = 0; i < entities.length - 1; i++) {
          for (let j = i + 1; j < entities.length; j++) {
            if (entities[i].type === entities[j].type) {
              relations.push({
                from: entities[i].text,
                to: entities[j].text,
                relation: '相关概念',
                strength: 0.6
              });
            }
          }
        }
        return { relations: relations.slice(0, 5) };
      
      default:
        return { result: '本地处理完成，但功能有限' };
    }
  }

  /**
   * 文本分词（简单实现）
   */
  segmentText(text) {
    // 移除标点符号和特殊字符
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');
    
    // 简单分词（实际项目中建议使用jieba分词）
    const words = cleanText.split(/\s+/).filter(word => 
      word.length > 1 && !this.isStopWord(word)
    );
    
    return words;
  }

  /**
   * 计算词频
   */
  calculateWordFrequency(words) {
    const freq = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    return freq;
  }

  /**
   * 计算TF-IDF分数
   */
  calculateTFIDF(wordFreq, text) {
    const totalWords = Object.values(wordFreq).reduce((sum, freq) => sum + freq, 0);
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    
    const tfidf = [];
    
    for (const [word, freq] of Object.entries(wordFreq)) {
      const tf = freq / totalWords;
      
      // 计算包含该词的句子数
      const docsWithWord = sentences.filter(sentence => 
        sentence.includes(word)
      ).length;
      
      const idf = Math.log(sentences.length / (docsWithWord + 1));
      const score = tf * idf;
      
      tfidf.push({
        word,
        frequency: freq,
        score
      });
    }
    
    return tfidf.sort((a, b) => b.score - a.score);
  }

  /**
   * 计算句子重要性分数
   */
  calculateSentenceScore(sentence, fullText) {
    // 基于句子长度、位置和关键词密度计算分数
    const length = sentence.length;
    const words = this.segmentText(sentence);
    const keywordDensity = words.length / length;
    
    let score = keywordDensity * 0.4;
    
    // 位置权重（开头和结尾的句子更重要）
    const position = fullText.indexOf(sentence) / fullText.length;
    if (position < 0.2 || position > 0.8) {
      score += 0.3;
    }
    
    // 长度权重（中等长度的句子更好）
    if (length > 20 && length < 100) {
      score += 0.3;
    }
    
    return score;
  }

  /**
   * 判断是否为停用词
   */
  isStopWord(word) {
    const stopWords = [
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
      '自己', '这', '那', '它', '他', '她', '们', '个', '中', '而', '之', '与', '或'
    ];
    return stopWords.includes(word);
  }
}

module.exports = new AIService(); 