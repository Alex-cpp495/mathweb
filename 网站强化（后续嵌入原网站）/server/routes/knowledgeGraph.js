const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const KnowledgeGraph = require('../models/KnowledgeGraph');
const Document = require('../models/Document');
const knowledgeGraphService = require('../services/knowledgeGraphService');

const router = express.Router();

// 创建知识图谱
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, documentIds, metadata } = req.body;

    if (!documentIds || documentIds.length === 0) {
      return res.status(400).json({ message: '请选择至少一个文档' });
    }

    // 验证文档所有权
    const documents = await Document.find({
      _id: { $in: documentIds },
      userId: req.user.userId
    });

    if (documents.length !== documentIds.length) {
      return res.status(403).json({ message: '包含无权访问的文档' });
    }

    // 合并文档内容
    const combinedContent = documents
      .map(doc => doc.content.processed || doc.content.raw || '')
      .join('\n\n');

    if (!combinedContent.trim()) {
      return res.status(400).json({ message: '选择的文档内容为空' });
    }

    // 构建知识图谱
    console.log('开始构建知识图谱...');
    const graph = await knowledgeGraphService.buildKnowledgeGraph(combinedContent, {
      title,
      userId: req.user.userId,
      maxNodes: 50
    });

    // 创建知识图谱记录
    const knowledgeGraph = new KnowledgeGraph({
      title: title || '知识图谱',
      description: description || '',
      userId: req.user.userId,
      documentIds,
      graph,
      metadata: {
        subject: metadata?.subject || '',
        course: metadata?.course || '',
        tags: metadata?.tags || [],
        difficulty: metadata?.difficulty || 'intermediate'
      }
    });

    await knowledgeGraph.save();
    await knowledgeGraph.updateStatistics();

    res.status(201).json({
      message: '知识图谱创建成功',
      knowledgeGraph: knowledgeGraph.getPublicInfo()
    });
  } catch (error) {
    console.error('创建知识图谱失败:', error);
    res.status(500).json({ message: '创建知识图谱失败', error: error.message });
  }
});

// 获取用户的知识图谱列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, difficulty } = req.query;
    
    const query = { userId: req.user.userId };
    if (subject) query['metadata.subject'] = subject;
    if (difficulty) query['metadata.difficulty'] = difficulty;

    const knowledgeGraphs = await KnowledgeGraph.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('documentIds', 'title createdAt');

    const total = await KnowledgeGraph.countDocuments(query);

    res.json({
      knowledgeGraphs: knowledgeGraphs.map(kg => ({
        ...kg.getPublicInfo(),
        documents: kg.documentIds
      })),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('获取知识图谱列表失败:', error);
    res.status(500).json({ message: '获取知识图谱列表失败' });
  }
});

// 获取单个知识图谱详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const knowledgeGraph = await KnowledgeGraph.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).populate('documentIds', 'title description metadata createdAt');

    if (!knowledgeGraph) {
      return res.status(404).json({ message: '知识图谱不存在' });
    }

    // 增加浏览次数
    await knowledgeGraph.addView();

    res.json({
      knowledgeGraph: {
        ...knowledgeGraph.toObject(),
        documents: knowledgeGraph.documentIds
      }
    });
  } catch (error) {
    console.error('获取知识图谱详情失败:', error);
    res.status(500).json({ message: '获取知识图谱详情失败' });
  }
});

// 更新知识图谱
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, metadata, sharing } = req.body;

    const knowledgeGraph = await KnowledgeGraph.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!knowledgeGraph) {
      return res.status(404).json({ message: '知识图谱不存在' });
    }

    // 更新基本信息
    if (title) knowledgeGraph.title = title;
    if (description) knowledgeGraph.description = description;
    
    if (metadata) {
      knowledgeGraph.metadata = { ...knowledgeGraph.metadata, ...metadata };
    }
    
    if (sharing) {
      knowledgeGraph.sharing = { ...knowledgeGraph.sharing, ...sharing };
    }

    await knowledgeGraph.save();

    res.json({
      message: '知识图谱更新成功',
      knowledgeGraph: knowledgeGraph.getPublicInfo()
    });
  } catch (error) {
    console.error('更新知识图谱失败:', error);
    res.status(500).json({ message: '更新知识图谱失败' });
  }
});

// 删除知识图谱
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const knowledgeGraph = await KnowledgeGraph.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!knowledgeGraph) {
      return res.status(404).json({ message: '知识图谱不存在' });
    }

    await KnowledgeGraph.findByIdAndDelete(req.params.id);

    res.json({ message: '知识图谱删除成功' });
  } catch (error) {
    console.error('删除知识图谱失败:', error);
    res.status(500).json({ message: '删除知识图谱失败' });
  }
});

// 搜索节点
router.get('/:id/search', authenticateToken, async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: '请提供搜索关键词' });
    }

    const knowledgeGraph = await KnowledgeGraph.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!knowledgeGraph) {
      return res.status(404).json({ message: '知识图谱不存在' });
    }

    // 搜索节点
    const matchingNodes = knowledgeGraph.graph.nodes.filter(node =>
      node.label.toLowerCase().includes(query.toLowerCase()) ||
      (node.properties.description && 
       node.properties.description.toLowerCase().includes(query.toLowerCase()))
    );

    res.json({
      results: matchingNodes,
      total: matchingNodes.length
    });
  } catch (error) {
    console.error('搜索节点失败:', error);
    res.status(500).json({ message: '搜索节点失败' });
  }
});

// 获取节点详情
router.get('/:id/nodes/:nodeId', authenticateToken, async (req, res) => {
  try {
    const knowledgeGraph = await KnowledgeGraph.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!knowledgeGraph) {
      return res.status(404).json({ message: '知识图谱不存在' });
    }

    const node = knowledgeGraph.graph.nodes.find(n => n.id === req.params.nodeId);
    if (!node) {
      return res.status(404).json({ message: '节点不存在' });
    }

    // 获取相关的边
    const relatedEdges = knowledgeGraph.graph.edges.filter(edge =>
      edge.from === node.id || edge.to === node.id
    );

    // 获取相关节点
    const relatedNodeIds = new Set();
    relatedEdges.forEach(edge => {
      relatedNodeIds.add(edge.from);
      relatedNodeIds.add(edge.to);
    });
    
    const relatedNodes = knowledgeGraph.graph.nodes.filter(n =>
      relatedNodeIds.has(n.id) && n.id !== node.id
    );

    res.json({
      node,
      relatedNodes,
      relatedEdges
    });
  } catch (error) {
    console.error('获取节点详情失败:', error);
    res.status(500).json({ message: '获取节点详情失败' });
  }
});

// 导出知识图谱
router.get('/:id/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const knowledgeGraph = await KnowledgeGraph.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).populate('documentIds', 'title description');

    if (!knowledgeGraph) {
      return res.status(404).json({ message: '知识图谱不存在' });
    }

    let exportData;
    let filename;
    let contentType;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(knowledgeGraph.toObject(), null, 2);
        filename = `${knowledgeGraph.title}-knowledge-graph.json`;
        contentType = 'application/json';
        break;
        
      case 'csv':
        // 导出节点和边为CSV格式
        const nodesCsv = convertNodesToCSV(knowledgeGraph.graph.nodes);
        const edgesCsv = convertEdgesToCSV(knowledgeGraph.graph.edges);
        exportData = `# Nodes\n${nodesCsv}\n\n# Edges\n${edgesCsv}`;
        filename = `${knowledgeGraph.title}-knowledge-graph.csv`;
        contentType = 'text/csv';
        break;
        
      default:
        return res.status(400).json({ message: '不支持的导出格式' });
    }

    // 增加导出次数
    knowledgeGraph.analytics.exports += 1;
    await knowledgeGraph.save();

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(exportData);
  } catch (error) {
    console.error('导出知识图谱失败:', error);
    res.status(500).json({ message: '导出知识图谱失败' });
  }
});

// 获取公开的知识图谱
router.get('/public/list', async (req, res) => {
  try {
    const { page = 1, limit = 10, subject } = req.query;
    
    const query = { 'sharing.isPublic': true };
    if (subject) query['metadata.subject'] = subject;

    const knowledgeGraphs = await KnowledgeGraph.find(query)
      .sort({ 'analytics.views': -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-graph'); // 不返回图数据以减少传输量

    const total = await KnowledgeGraph.countDocuments(query);

    res.json({
      knowledgeGraphs: knowledgeGraphs.map(kg => kg.getPublicInfo()),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('获取公开知识图谱失败:', error);
    res.status(500).json({ message: '获取公开知识图谱失败' });
  }
});

// 辅助函数：将节点转换为CSV
function convertNodesToCSV(nodes) {
  const headers = 'id,label,type,importance,description';
  const rows = nodes.map(node => {
    const description = (node.properties.description || '').replace(/"/g, '""');
    return `"${node.id}","${node.label}","${node.type}",${node.properties.importance},"${description}"`;
  });
  return [headers, ...rows].join('\n');
}

// 辅助函数：将边转换为CSV
function convertEdgesToCSV(edges) {
  const headers = 'from,to,type,weight,label';
  const rows = edges.map(edge => {
    return `"${edge.from}","${edge.to}","${edge.type}",${edge.weight},"${edge.label}"`;
  });
  return [headers, ...rows].join('\n');
}

module.exports = router; 