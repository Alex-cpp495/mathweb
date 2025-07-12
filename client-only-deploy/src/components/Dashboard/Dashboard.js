import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  LinearProgress,
  Paper,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Description as DocumentIcon,
  AccountTree as KnowledgeGraphIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  QuestionAnswer as QuestionIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalKnowledgeGraphs: 0,
    totalQuestions: 0,
    recentActivities: []
  });
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, documentsResponse] = await Promise.all([
        axios.get('/api/users/stats'),
        axios.get('/api/documents?limit=5')
      ]);

      setStats(statsResponse.data);
      setRecentDocuments(documentsResponse.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showError('获取仪表板数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = (documentId) => {
    navigate(`/documents/${documentId}`);
  };

  const handleUploadClick = () => {
    navigate('/documents/upload');
  };

  const quickActions = [
    {
      title: '上传文档',
      description: '上传新的学习材料',
      icon: <AddIcon />,
      color: 'primary',
      action: handleUploadClick
    },
    {
      title: '查看文档',
      description: '管理已上传的文档',
      icon: <DocumentIcon />,
      color: 'secondary',
      action: () => navigate('/documents')
    },
    {
      title: 'AI问答',
      description: '与AI助手对话',
      icon: <QuestionIcon />,
      color: 'success',
      action: () => navigate('/documents') // Will be updated when AI chat is implemented
    }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          加载中...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          欢迎回来，{user?.name || '用户'}！
        </Typography>
        <Typography variant="body1" color="text.secondary">
          继续您的智能学习之旅
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalDocuments}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    总文档数
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <DocumentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalKnowledgeGraphs}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    知识图谱
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <KnowledgeGraphIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalQuestions}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    AI问答次数
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <AIIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round((stats.totalKnowledgeGraphs / Math.max(stats.totalDocuments, 1)) * 100)}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    处理率
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                快速操作
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={action.action}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: `${action.color}.main` }}>
                          {action.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {action.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  最近文档
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/documents')}
                  endIcon={<ViewIcon />}
                >
                  查看全部
                </Button>
              </Box>
              
              {recentDocuments.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <Typography variant="body2" color="text.secondary">
                    暂无文档，开始上传您的第一个文档吧！
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleUploadClick}
                    sx={{ mt: 2 }}
                  >
                    上传文档
                  </Button>
                </Box>
              ) : (
                <List dense>
                  {recentDocuments.map((doc) => (
                    <ListItem
                      key={doc._id}
                      button
                      onClick={() => handleDocumentClick(doc._id)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={doc.title}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </Typography>
                            <Box mt={0.5}>
                              <Chip
                                label={doc.isProcessed ? '已处理' : '处理中'}
                                size="small"
                                color={doc.isProcessed ? 'success' : 'warning'}
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentClick(doc._id);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Progress */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                学习进度
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="primary.main" fontWeight="bold">
                      {stats.totalDocuments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      已上传文档
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="secondary.main" fontWeight="bold">
                      {stats.totalKnowledgeGraphs}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      知识图谱构建
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="success.main" fontWeight="bold">
                      {stats.totalQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI互动次数
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 