const neo4j = require('neo4j-driver');
const aiService = require('./aiService');
require('dotenv').config();

class KnowledgeGraphService {
  constructor() {
    this.driver = null;
    this.initializeNeo4j();
  }

  async initializeNeo4j() {
    try {
      if (process.env.NEO4J_URI) {
        this.driver = neo4j.driver(
          process.env.NEO4J_URI,
          neo4j.auth.basic(
            process.env.NEO4J_USERNAME || 'neo4j',
            process.env.NEO4J_PASSWORD || 'password'
          )
        );
        console.log('✅ Neo4j连接成功');
      } else {
        console.log('⚠️  Neo4j未配置，将使用内存图结构');
      }
    } catch (error) {
      console.error('❌ Neo4j连接失败:', error.message);
      this.driver = null;
    }
  }

  /**
   * 从文档内容构建知识图谱
   */
  async buildKnowledgeGraph(documentContent, options = {}) {
    try {
      const {
        title = '未命名文档',
        userId,
        documentId,
        maxNodes = 50,
        minConfidence = 0.6
      } = options;

      console.log('开始构建知识图谱...');

      // 1. 提取关键概念
      const concepts = await this.extractConcepts(documentContent);
      console.log(`提取到 ${concepts.length} 个概念`);

      // 2. 识别关系
      const relations = await this.extractRelations(documentContent, concepts);
      console.log(`识别到 ${relations.length} 个关系`);

      // 3. 构建图结构
      const graph = await this.constructGraph(concepts, relations, {
        maxNodes,
        minConfidence
      });

      // 4. 优化图结构
      const optimizedGraph = this.optimizeGraph(graph);

      // 5. 保存到Neo4j（如果配置了）
      if (this.driver && documentId) {
        await this.saveToNeo4j(optimizedGraph, { documentId, userId });
      }

      return optimizedGraph;
    } catch (error) {
      console.error('知识图谱构建失败:', error);
      throw error;
    }
  }

  /**
   * 提取概念节点
   */
  async extractConcepts(text) {
    const concepts = new Map();

    // 1. 使用AI服务提取关键词
    const keywords = await aiService.extractKeywords(text, 30);
    
    // 2. 使用实体识别
    const entities = await aiService.extractEntities(text);

    // 3. 处理关键词
    keywords.forEach((keyword, index) => {
      if (keyword.weight > 0.3) {
        const conceptId = this.generateId(keyword.word);
        concepts.set(conceptId, {
          id: conceptId,
          label: keyword.word,
          type: this.classifyConceptType(keyword.word, text),
          properties: {
            importance: keyword.weight,
            frequency: keyword.frequency,
            description: this.extractDescription(keyword.word, text),
            sourceDocuments: [text.substring(0, 100)],
            difficulty: this.estimateDifficulty(keyword.word, text)
          },
          position: this.calculatePosition(index, keywords.length),
          style: this.getNodeStyle(keyword.weight)
        });
      }
    });

    // 4. 处理实体
    entities.forEach(entity => {
      if (entity.confidence > 0.7) {
        const conceptId = this.generateId(entity.text);
        if (!concepts.has(conceptId)) {
          concepts.set(conceptId, {
            id: conceptId,
            label: entity.text,
            type: entity.type,
            properties: {
              importance: entity.confidence,
              frequency: 1,
              description: this.extractDescription(entity.text, text),
              sourceDocuments: [text.substring(0, 100)],
              difficulty: 'medium'
            },
            position: this.calculatePosition(concepts.size, 30),
            style: this.getNodeStyle(entity.confidence)
          });
        }
      }
    });

    return Array.from(concepts.values());
  }

  /**
   * 提取概念间关系
   */
  async extractRelations(text, concepts) {
    const relations = [];
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 10);

    // 1. 基于共现的关系发现
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const concept1 = concepts[i];
        const concept2 = concepts[j];
        
        const cooccurrence = this.calculateCooccurrence(
          concept1.label, 
          concept2.label, 
          sentences
        );

        if (cooccurrence.strength > 0.3) {
          relations.push({
            id: this.generateId(`${concept1.id}-${concept2.id}`),
            from: concept1.id,
            to: concept2.id,
            label: cooccurrence.relationType,
            type: cooccurrence.relationType,
            weight: cooccurrence.strength,
            properties: {
              strength: cooccurrence.strength,
              sourceDocuments: cooccurrence.sources,
              evidence: cooccurrence.evidence,
              bidirectional: cooccurrence.bidirectional
            },
            style: this.getEdgeStyle(cooccurrence.strength)
          });
        }
      }
    }

    // 2. 基于语义模式的关系识别
    const patternRelations = this.extractPatternBasedRelations(text, concepts);
    relations.push(...patternRelations);

    return relations;
  }

  /**
   * 计算概念共现关系
   */
  calculateCooccurrence(concept1, concept2, sentences) {
    let cooccurrenceCount = 0;
    const sources = [];
    let evidence = '';

    sentences.forEach((sentence, index) => {
      if (sentence.includes(concept1) && sentence.includes(concept2)) {
        cooccurrenceCount++;
        sources.push(`sentence_${index}`);
        if (!evidence) evidence = sentence.substring(0, 100);
      }
    });

    const strength = Math.min(cooccurrenceCount / sentences.length * 10, 1);
    
    // 基于共现模式推断关系类型
    let relationType = 'related_to';
    if (evidence.includes('属于') || evidence.includes('是一种')) {
      relationType = 'part_of';
    } else if (evidence.includes('导致') || evidence.includes('引起')) {
      relationType = 'leads_to';
    } else if (evidence.includes('依赖') || evidence.includes('需要')) {
      relationType = 'depends_on';
    } else if (evidence.includes('相似') || evidence.includes('类似')) {
      relationType = 'similar_to';
    }

    return {
      strength,
      relationType,
      sources,
      evidence,
      bidirectional: relationType === 'related_to' || relationType === 'similar_to'
    };
  }

  /**
   * 基于模式的关系提取
   */
  extractPatternBasedRelations(text, concepts) {
    const relations = [];
    const patterns = [
      {
        regex: /([^，。！？]+)属于([^，。！？]+)/g,
        type: 'part_of'
      },
      {
        regex: /([^，。！？]+)是([^，。！？]+)的例子/g,
        type: 'example_of'
      },
      {
        regex: /([^，。！？]+)导致([^，。！？]+)/g,
        type: 'leads_to'
      },
      {
        regex: /([^，。！？]+)依赖于([^，。！？]+)/g,
        type: 'depends_on'
      }
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        const from = this.findConceptByLabel(match[1].trim(), concepts);
        const to = this.findConceptByLabel(match[2].trim(), concepts);

        if (from && to) {
          relations.push({
            id: this.generateId(`${from.id}-${to.id}-${pattern.type}`),
            from: from.id,
            to: to.id,
            label: pattern.type,
            type: pattern.type,
            weight: 0.8,
            properties: {
              strength: 0.8,
              sourceDocuments: [match[0]],
              evidence: match[0],
              bidirectional: false
            },
            style: this.getEdgeStyle(0.8)
          });
        }
      }
    });

    return relations;
  }

  /**
   * 构建图结构
   */
  async constructGraph(concepts, relations, options) {
    const { maxNodes, minConfidence } = options;

    // 过滤低置信度的节点
    const filteredConcepts = concepts
      .filter(concept => concept.properties.importance >= minConfidence)
      .slice(0, maxNodes);

    // 过滤无效关系
    const conceptIds = new Set(filteredConcepts.map(c => c.id));
    const filteredRelations = relations.filter(relation => 
      conceptIds.has(relation.from) && conceptIds.has(relation.to)
    );

    return {
      nodes: filteredConcepts,
      edges: filteredRelations
    };
  }

  /**
   * 优化图结构
   */
  optimizeGraph(graph) {
    // 1. 去除孤立节点
    const connectedNodeIds = new Set();
    graph.edges.forEach(edge => {
      connectedNodeIds.add(edge.from);
      connectedNodeIds.add(edge.to);
    });

    const optimizedNodes = graph.nodes.filter(node => 
      connectedNodeIds.has(node.id) || node.properties.importance > 0.8
    );

    // 2. 合并相似节点
    const mergedNodes = this.mergeSimilarNodes(optimizedNodes);

    // 3. 优化布局
    const layoutOptimizedNodes = this.optimizeLayout(mergedNodes);

    return {
      nodes: layoutOptimizedNodes,
      edges: graph.edges
    };
  }

  /**
   * 保存到Neo4j
   */
  async saveToNeo4j(graph, metadata) {
    if (!this.driver) return;

    const session = this.driver.session();
    
    try {
      await session.writeTransaction(async tx => {
        // 创建节点
        for (const node of graph.nodes) {
          await tx.run(
            `CREATE (n:Concept {
              id: $id, 
              label: $label, 
              type: $type,
              importance: $importance,
              documentId: $documentId,
              userId: $userId
            })`,
            {
              id: node.id,
              label: node.label,
              type: node.type,
              importance: node.properties.importance,
              documentId: metadata.documentId,
              userId: metadata.userId
            }
          );
        }

        // 创建关系
        for (const edge of graph.edges) {
          await tx.run(
            `MATCH (a:Concept {id: $fromId}), (b:Concept {id: $toId})
             CREATE (a)-[r:RELATES_TO {
               type: $type,
               weight: $weight,
               label: $label
             }]->(b)`,
            {
              fromId: edge.from,
              toId: edge.to,
              type: edge.type,
              weight: edge.weight,
              label: edge.label
            }
          );
        }
      });
    } finally {
      await session.close();
    }
  }

  /**
   * 工具方法
   */
  generateId(text) {
    return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '_');
  }

  classifyConceptType(word, context) {
    const typePatterns = {
      person: /人|教授|博士|学者|作者/,
      concept: /概念|理论|原理|定义/,
      method: /方法|技术|算法|策略/,
      formula: /公式|方程|定律/,
      example: /例子|案例|实例/
    };

    for (const [type, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(context.substring(context.indexOf(word) - 20, context.indexOf(word) + 20))) {
        return type;
      }
    }

    return 'concept';
  }

  extractDescription(concept, text) {
    const index = text.indexOf(concept);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + concept.length + 50);
    return text.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  estimateDifficulty(concept, text) {
    const context = this.extractDescription(concept, text);
    
    if (context.includes('基础') || context.includes('简单') || context.includes('入门')) {
      return 'easy';
    } else if (context.includes('复杂') || context.includes('高级') || context.includes('深入')) {
      return 'hard';
    }
    
    return 'medium';
  }

  calculatePosition(index, total) {
    const angle = (index / total) * 2 * Math.PI;
    const radius = 300;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }

  getNodeStyle(importance) {
    return {
      color: importance > 0.7 ? '#ff6b6b' : importance > 0.5 ? '#4ecdc4' : '#95a5a6',
      size: Math.max(10, importance * 30),
      shape: 'circle'
    };
  }

  getEdgeStyle(weight) {
    return {
      color: weight > 0.7 ? '#2c3e50' : '#7f8c8d',
      width: Math.max(1, weight * 3),
      dashes: weight < 0.4
    };
  }

  findConceptByLabel(label, concepts) {
    return concepts.find(concept => 
      concept.label.includes(label.trim()) || label.trim().includes(concept.label)
    );
  }

  mergeSimilarNodes(nodes) {
    // 简单的相似节点合并逻辑
    return nodes; // 暂时返回原节点，后续可以实现更复杂的合并逻辑
  }

  optimizeLayout(nodes) {
    // 力导向布局优化
    return nodes.map((node, index) => ({
      ...node,
      position: this.calculatePosition(index, nodes.length)
    }));
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
    }
  }
}

module.exports = new KnowledgeGraphService(); 