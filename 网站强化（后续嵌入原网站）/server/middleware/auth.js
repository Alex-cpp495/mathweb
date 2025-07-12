const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token验证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: '访问令牌缺失',
        code: 'NO_TOKEN'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 检查用户是否存在
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: '无效的访问令牌',
        code: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: '访问令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      console.error('Token验证失败:', error);
      return res.status(500).json({ 
        message: '服务器内部错误',
        code: 'SERVER_ERROR'
      });
    }
  }
};

// 可选的token验证中间件（不会因为token无效而中断请求）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email
        };
      }
    }

    next();
  } catch (error) {
    // 忽略token验证错误，继续处理请求
    next();
  }
};

// 检查用户权限的中间件
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          message: '需要登录',
          code: 'LOGIN_REQUIRED'
        });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(401).json({ 
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      // 检查订阅状态和权限
      const hasPermission = checkUserPermission(user, requiredPermission);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: '权限不足',
          code: 'INSUFFICIENT_PERMISSION',
          required: requiredPermission,
          current: user.subscription.plan
        });
      }

      next();
    } catch (error) {
      console.error('权限检查失败:', error);
      res.status(500).json({ 
        message: '服务器内部错误',
        code: 'SERVER_ERROR'
      });
    }
  };
};

// 检查用户权限的辅助函数
const checkUserPermission = (user, requiredPermission) => {
  const planPermissions = {
    free: ['basic_upload', 'basic_graph'],
    basic: ['basic_upload', 'basic_graph', 'advanced_graph', 'ai_summary'],
    premium: ['basic_upload', 'basic_graph', 'advanced_graph', 'ai_summary', 'collaboration', 'export'],
    professional: ['basic_upload', 'basic_graph', 'advanced_graph', 'ai_summary', 'collaboration', 'export', 'api_access', 'priority_support']
  };

  const userPermissions = planPermissions[user.subscription.plan] || planPermissions.free;
  return userPermissions.includes(requiredPermission);
};

// 限制频率的中间件
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userLimit = userRequests.get(userId);
    
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: userLimit.resetTime
      });
    }

    userLimit.count++;
    next();
  };
};

// 验证资源所有权的中间件
const checkResourceOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          message: '资源不存在',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (resource.userId.toString() !== req.user.userId) {
        return res.status(403).json({
          message: '无权访问此资源',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('资源所有权检查失败:', error);
      res.status(500).json({
        message: '服务器内部错误',
        code: 'SERVER_ERROR'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkPermission,
  checkUserPermission,
  rateLimitByUser,
  checkResourceOwnership
}; 