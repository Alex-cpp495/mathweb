const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Document = require('../models/Document');
const KnowledgeGraph = require('../models/KnowledgeGraph');

const router = express.Router();

// 获取用户统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 并行获取各种统计数据
    const [
      documentsCount,
      knowledgeGraphsCount,
      documentsProcessing,
      recentDocuments,
      popularGraphs
    ] = await Promise.all([
      Document.countDocuments({ userId }),
      KnowledgeGraph.countDocuments({ userId }),
      Document.countDocuments({ userId, 'processing.status': 'processing' }),
      Document.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt processing.status'),
      KnowledgeGraph.find({ userId })
        .sort({ 'analytics.views': -1 })
        .limit(3)
        .select('title analytics.views createdAt')
    ]);

    // 计算本月上传的文档数
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthDocuments = await Document.countDocuments({
      userId,
      createdAt: { $gte: thisMonth }
    });

    res.json({
      overview: {
        totalDocuments: documentsCount,
        totalKnowledgeGraphs: knowledgeGraphsCount,
        documentsProcessing: documentsProcessing,
        thisMonthDocuments
      },
      recentActivity: {
        recentDocuments,
        popularGraphs
      }
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ message: '获取统计信息失败' });
  }
});

// 获取用户偏好设置
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      preferences: user.preferences
    });
  } catch (error) {
    console.error('获取用户偏好失败:', error);
    res.status(500).json({ message: '获取用户偏好失败' });
  }
});

// 更新用户偏好设置
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { language, theme, notifications } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 更新偏好设置
    if (language) user.preferences.language = language;
    if (theme) user.preferences.theme = theme;
    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications
      };
    }

    await user.save();

    res.json({
      message: '偏好设置更新成功',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('更新用户偏好失败:', error);
    res.status(500).json({ message: '更新偏好设置失败' });
  }
});

// 获取用户订阅信息
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      subscription: user.subscription
    });
  } catch (error) {
    console.error('获取订阅信息失败:', error);
    res.status(500).json({ message: '获取订阅信息失败' });
  }
});

// 更新用户订阅
router.put('/subscription', authenticateToken, async (req, res) => {
  try {
    const { plan, duration = 1 } = req.body;

    const validPlans = ['free', 'basic', 'premium', 'professional'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: '无效的订阅计划' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 更新订阅信息
    const now = new Date();
    user.subscription.plan = plan;
    user.subscription.startDate = now;
    user.subscription.endDate = new Date(now.getTime() + duration * 30 * 24 * 60 * 60 * 1000); // duration以月为单位
    user.subscription.isActive = true;

    await user.save();

    res.json({
      message: '订阅更新成功',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('更新订阅失败:', error);
    res.status(500).json({ message: '更新订阅失败' });
  }
});

// 获取用户活动记录
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    // 获取最近的文档和知识图谱活动
    const [recentDocuments, recentGraphs] = await Promise.all([
      Document.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(limit / 2)
        .select('title createdAt updatedAt processing.status'),
      KnowledgeGraph.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(limit / 2)
        .select('title createdAt updatedAt analytics.views')
    ]);

    // 合并和排序活动
    const activities = [
      ...recentDocuments.map(doc => ({
        type: 'document',
        action: doc.createdAt.getTime() === doc.updatedAt.getTime() ? 'created' : 'updated',
        item: {
          id: doc._id,
          title: doc.title,
          status: doc.processing.status
        },
        timestamp: doc.updatedAt
      })),
      ...recentGraphs.map(graph => ({
        type: 'knowledge_graph',
        action: graph.createdAt.getTime() === graph.updatedAt.getTime() ? 'created' : 'updated',
        item: {
          id: graph._id,
          title: graph.title,
          views: graph.analytics.views
        },
        timestamp: graph.updatedAt
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

    res.json({
      activities,
      hasMore: activities.length === limit
    });
  } catch (error) {
    console.error('获取用户活动失败:', error);
    res.status(500).json({ message: '获取活动记录失败' });
  }
});

// 搜索用户内容
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q: query, type = 'all', page = 1, limit = 10 } = req.query;
    
    if (!query?.trim()) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    const userId = req.user.userId;
    const searchRegex = new RegExp(query, 'i');
    
    let results = [];

    if (type === 'all' || type === 'documents') {
      const documents = await Document.find({
        userId,
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { 'metadata.tags': searchRegex },
          { 'content.keywords.word': searchRegex }
        ]
      })
      .select('title description metadata createdAt processing.status')
      .limit(type === 'documents' ? limit : limit / 2);

      results.push(...documents.map(doc => ({
        type: 'document',
        id: doc._id,
        title: doc.title,
        description: doc.description,
        createdAt: doc.createdAt,
        status: doc.processing.status
      })));
    }

    if (type === 'all' || type === 'knowledge_graphs') {
      const graphs = await KnowledgeGraph.find({
        userId,
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { 'metadata.tags': searchRegex },
          { 'graph.nodes.label': searchRegex }
        ]
      })
      .select('title description metadata createdAt analytics.views')
      .limit(type === 'knowledge_graphs' ? limit : limit / 2);

      results.push(...graphs.map(graph => ({
        type: 'knowledge_graph',
        id: graph._id,
        title: graph.title,
        description: graph.description,
        createdAt: graph.createdAt,
        views: graph.analytics.views
      })));
    }

    // 按创建时间排序
    results.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      query,
      results: results.slice(0, limit),
      total: results.length
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ message: '搜索失败' });
  }
});

// 导出用户数据
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [user, documents, knowledgeGraphs] = await Promise.all([
      User.findById(userId).select('-password'),
      Document.find({ userId }).select('-content.raw'),
      KnowledgeGraph.find({ userId })
    ]);

    const exportData = {
      user: user.toObject(),
      documents: documents.map(doc => doc.toObject()),
      knowledgeGraphs: knowledgeGraphs.map(kg => kg.toObject()),
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Disposition', 'attachment; filename="user-data-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (error) {
    console.error('导出用户数据失败:', error);
    res.status(500).json({ message: '导出数据失败' });
  }
});

// 删除用户账户
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: '请输入密码确认删除' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证密码
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '密码错误' });
    }

    // 删除用户相关数据
    await Promise.all([
      Document.deleteMany({ userId: req.user.userId }),
      KnowledgeGraph.deleteMany({ userId: req.user.userId }),
      User.findByIdAndDelete(req.user.userId)
    ]);

    res.json({ message: '账户删除成功' });
  } catch (error) {
    console.error('删除账户失败:', error);
    res.status(500).json({ message: '删除账户失败' });
  }
});

module.exports = router; 