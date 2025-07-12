const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { authenticateToken } = require('../middleware/auth');
const Document = require('../models/Document');
const aiService = require('../services/aiService');
const knowledgeGraphService = require('../services/knowledgeGraphService');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 上传文档
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择文件' });
    }

    const { title, description, subject, course, tags } = req.body;

    // 创建文档记录
    const document = new Document({
      title: title || req.file.originalname,
      description: description || '',
      userId: req.user.userId,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      metadata: {
        subject: subject || '',
        course: course || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      }
    });

    await document.save();

    // 异步处理文档
    processDocumentAsync(document._id);

    res.status(201).json({
      message: '文档上传成功',
      document: document.getPublicInfo()
    });
  } catch (error) {
    console.error('文档上传失败:', error);
    res.status(500).json({ message: '文档上传失败', error: error.message });
  }
});

// 获取用户的文档列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, subject } = req.query;
    
    const query = { userId: req.user.userId };
    if (status) query['processing.status'] = status;
    if (subject) query['metadata.subject'] = subject;

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content.raw'); // 不返回原始内容以减少数据量

    const total = await Document.countDocuments(query);

    res.json({
      documents: documents.map(doc => doc.getPublicInfo()),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('获取文档列表失败:', error);
    res.status(500).json({ message: '获取文档列表失败' });
  }
});

// 获取单个文档详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    // 增加浏览次数
    await document.addView();

    res.json({
      document: {
        ...document.toObject(),
        content: {
          ...document.content,
          raw: undefined // 不返回原始内容
        }
      }
    });
  } catch (error) {
    console.error('获取文档详情失败:', error);
    res.status(500).json({ message: '获取文档详情失败' });
  }
});

// 获取文档的知识图谱
router.get('/:id/knowledge-graph', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    if (!document.hasKnowledgeGraph) {
      return res.status(404).json({ message: '知识图谱尚未生成' });
    }

    res.json({
      knowledgeGraph: document.knowledgeGraph
    });
  } catch (error) {
    console.error('获取知识图谱失败:', error);
    res.status(500).json({ message: '获取知识图谱失败' });
  }
});

// 重新处理文档
router.post('/:id/reprocess', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    // 重置处理状态
    await document.updateProcessingStatus('pending', 0);

    // 异步重新处理
    processDocumentAsync(document._id);

    res.json({ message: '文档重新处理已开始' });
  } catch (error) {
    console.error('重新处理文档失败:', error);
    res.status(500).json({ message: '重新处理文档失败' });
  }
});

// 删除文档
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    // 删除文件
    try {
      await fs.unlink(document.file.path);
    } catch (error) {
      console.error('删除文件失败:', error);
    }

    // 删除数据库记录
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: '文档删除成功' });
  } catch (error) {
    console.error('删除文档失败:', error);
    res.status(500).json({ message: '删除文档失败' });
  }
});

// 异步处理文档
async function processDocumentAsync(documentId) {
  try {
    const document = await Document.findById(documentId);
    if (!document) return;

    console.log(`开始处理文档: ${document.title}`);
    
    // 更新状态
    await document.updateProcessingStatus('processing', 10);

    // 1. 提取文本内容
    const textContent = await extractTextFromFile(document.file);
    document.content.raw = textContent;
    await document.updateProcessingStatus('processing', 30);

    // 2. 提取关键词和实体
    const keywords = await aiService.extractKeywords(textContent);
    const entities = await aiService.extractEntities(textContent);
    document.content.keywords = keywords;
    document.content.entities = entities;
    await document.updateProcessingStatus('processing', 50);

    // 3. 生成摘要
    const summary = await aiService.generateSummary(textContent);
    document.content.summary = summary;
    document.content.processed = textContent.substring(0, 1000); // 存储部分处理后的内容
    await document.updateProcessingStatus('processing', 70);

    // 4. 构建知识图谱
    const knowledgeGraph = await knowledgeGraphService.buildKnowledgeGraph(textContent, {
      title: document.title,
      userId: document.userId,
      documentId: document._id,
      maxNodes: 30
    });
    document.knowledgeGraph = knowledgeGraph;
    await document.updateProcessingStatus('processing', 90);

    // 5. 完成处理
    await document.save();
    await document.updateProcessingStatus('completed', 100);
    
    console.log(`文档处理完成: ${document.title}`);
  } catch (error) {
    console.error('文档处理失败:', error);
    
    const document = await Document.findById(documentId);
    if (document) {
      await document.updateProcessingStatus('failed', 0, error.message);
    }
  }
}

// 提取文件文本内容
async function extractTextFromFile(fileInfo) {
  try {
    const buffer = await fs.readFile(fileInfo.path);
    
    switch (fileInfo.mimetype) {
      case 'application/pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;
        
      case 'application/msword':
        // 简单处理 .doc 文件
        return buffer.toString('utf8').replace(/[^\x20-\x7E\u4e00-\u9fa5]/g, '');
        
      case 'text/plain':
        return buffer.toString('utf8');
        
      default:
        throw new Error('不支持的文件类型');
    }
  } catch (error) {
    console.error('文本提取失败:', error);
    throw new Error('文本提取失败: ' + error.message);
  }
}

module.exports = router; 