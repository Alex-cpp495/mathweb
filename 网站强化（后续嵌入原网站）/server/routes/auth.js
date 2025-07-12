const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 用户注册
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30字符之间')
    .matches(/^[a-zA-Z0-9\u4e00-\u9fa5_]+$/)
    .withMessage('用户名只能包含字母、数字、中文和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6位')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, email, password, profile = {} } = req.body;

    // 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: '邮箱已被注册' });
      }
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      profile: {
        displayName: profile.displayName || username,
        major: profile.major || '',
        year: profile.year || null,
        university: profile.university || ''
      }
    });

    await user.save();

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败', error: error.message });
  }
});

// 用户登录
router.post('/login', [
  body('login')
    .notEmpty()
    .withMessage('请输入用户名或邮箱'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { login, password } = req.body;

    // 查找用户（支持用户名或邮箱登录）
    const user = await User.findOne({
      $or: [
        { username: login },
        { email: login }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 更新最后活跃时间
    await user.updateLastActive();

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', authenticateToken, [
  body('profile.displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('显示名称长度必须在1-50字符之间'),
  body('profile.major')
    .optional()
    .isLength({ max: 100 })
    .withMessage('专业名称长度不能超过100字符'),
  body('profile.university')
    .optional()
    .isLength({ max: 100 })
    .withMessage('大学名称长度不能超过100字符')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { profile, preferences } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 更新用户信息
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      message: '用户信息更新成功',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '更新用户信息失败' });
  }
});

// 修改密码
router.post('/change-password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码长度至少6位')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证当前密码
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: '当前密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ message: '修改密码失败' });
  }
});

// 刷新token
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 生成新的JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Token刷新成功',
      token
    });
  } catch (error) {
    console.error('Token刷新失败:', error);
    res.status(500).json({ message: 'Token刷新失败' });
  }
});

// 登出
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 在实际应用中，可以将token加入黑名单
    // 这里简单返回成功消息
    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({ message: '登出失败' });
  }
});

module.exports = router; 