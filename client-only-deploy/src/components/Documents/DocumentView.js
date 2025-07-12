import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Tab,
  Tabs,
  TabPanel
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AccountTree as KnowledgeGraphIcon,
  Psychology as AIIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
  QuestionAnswer as ChatIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import axios from 'axios';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);

  useEffect(() => {
    if (id) {
      fetchDocument();
      fetchKnowledgeGraph();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/documents/${id}`);
      setDocument(response.data.document);
    } catch (error) {
      console.error('Failed to fetch document:', error);
      showError('获取文档详情失败');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeGraph = async () => {
    try {
      const response = await axios.get(`/api/knowledge-graphs/document/${id}`);
      setKnowledgeGraph(response.data.knowledgeGraph);
    } catch (error) {
      console.log('Knowledge graph not found or not ready');
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentQuestion.trim() || loadingChat) return;

    const question = currentQuestion.trim();
    setCurrentQuestion('');
    setLoadingChat(true);

    // Add user question to chat history
    const newChatHistory = [
      ...chatHistory,
      { type: 'user', content: question, timestamp: new Date() }
    ];
    setChatHistory(newChatHistory);

    try {
      const response = await axios.post('/api/ai/chat', {
        question,
        documentId: id,
        context: chatHistory.slice(-5) // Send last 5 messages as context
      });

      // Add AI response to chat history
      setChatHistory(prev => [
        ...prev,
        {
          type: 'ai',
          content: response.data.answer,
          confidence: response.data.confidence,
          suggestions: response.data.suggestions,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Chat failed:', error);
      showError('AI问答失败，请稍后重试');
      
      // Add error message to chat
      setChatHistory(prev => [
        ...prev,
        {
          type: 'error',
          content: '抱歉，AI助手暂时无法回答您的问题，请稍后重试。',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleKnowledgeGraphClick = () => {
    navigate(`/documents/${id}/knowledge-graph`);
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/documents/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.originalName || document.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess('文档下载成功');
    } catch (error) {
      console.error('Failed to download document:', error);
      showError('下载文档失败');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!document) {
    return (
      <Alert severity="error">
        文档不存在或已被删除
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/documents')}>
          <BackIcon />
        </IconButton>
        <Box flexGrow={1}>
          <Typography variant="h4" fontWeight="bold">
            {document.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            上传于 {new Date(document.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {document.isProcessed && knowledgeGraph && (
            <Button
              variant="outlined"
              startIcon={<KnowledgeGraphIcon />}
              onClick={handleKnowledgeGraphClick}
            >
              知识图谱
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            下载
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Document Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <DocumentIcon />
                </Avatar>
                <Typography variant="h6">文档信息</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  状态
                </Typography>
                <Chip
                  label={document.isProcessed ? '已处理' : '处理中'}
                  color={document.isProcessed ? 'success' : 'warning'}
                  size="small"
                />
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  文件名
                </Typography>
                <Typography variant="body1">
                  {document.originalName}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  文件大小
                </Typography>
                <Typography variant="body1">
                  {formatFileSize(document.fileSize)}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  文件类型
                </Typography>
                <Typography variant="body1">
                  {document.mimeType}
                </Typography>
              </Box>

              {document.description && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    描述
                  </Typography>
                  <Typography variant="body1">
                    {document.description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  处理统计
                </Typography>
                <Typography variant="body1">
                  关键词: {document.analytics?.keywordsExtracted || 0}
                </Typography>
                <Typography variant="body1">
                  实体: {document.analytics?.entitiesExtracted || 0}
                </Typography>
                <Typography variant="body1">
                  问答次数: {document.analytics?.questionsGenerated || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="文档内容" icon={<DocumentIcon />} />
                <Tab label="AI问答" icon={<ChatIcon />} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {/* Document Content */}
              <Typography variant="h6" gutterBottom>
                文档内容预览
              </Typography>
              
              {document.content?.processed ? (
                <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {document.content.processed.substring(0, 2000)}
                    {document.content.processed.length > 2000 && '...'}
                  </Typography>
                </Paper>
              ) : (
                <Alert severity="info">
                  文档正在处理中，内容预览暂不可用
                </Alert>
              )}

              {document.isProcessed && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    提取的关键词
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {document.keywords?.slice(0, 10).map((keyword, index) => (
                      <Chip
                        key={index}
                        label={keyword.word}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* AI Chat */}
              <Typography variant="h6" gutterBottom>
                AI智能问答
              </Typography>
              
              {!document.isProcessed ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  文档还在处理中，AI问答功能暂不可用
                </Alert>
              ) : (
                <>
                  {/* Chat History */}
                  <Paper sx={{ height: 300, overflow: 'auto', p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    {chatHistory.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>
                        开始与AI助手对话，了解文档内容
                      </Typography>
                    ) : (
                      <List>
                        {chatHistory.map((message, index) => (
                          <ListItem key={index} alignItems="flex-start">
                            <Box width="100%">
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Avatar
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main'
                                  }}
                                >
                                  {message.type === 'user' ? '我' : 'AI'}
                                </Avatar>
                                <Typography variant="caption" color="text.secondary">
                                  {message.timestamp.toLocaleTimeString()}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ ml: 4 }}>
                                {message.content}
                              </Typography>
                              {message.suggestions && (
                                <Box sx={{ ml: 4, mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    建议问题：
                                  </Typography>
                                  {message.suggestions.map((suggestion, idx) => (
                                    <Chip
                                      key={idx}
                                      label={suggestion}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mr: 1, mt: 0.5 }}
                                      onClick={() => setCurrentQuestion(suggestion)}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>

                  {/* Chat Input */}
                  <Box component="form" onSubmit={handleChatSubmit}>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        placeholder="输入您的问题..."
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        disabled={loadingChat}
                        multiline
                        maxRows={3}
                      />
                      <IconButton
                        type="submit"
                        disabled={!currentQuestion.trim() || loadingChat}
                        color="primary"
                      >
                        {loadingChat ? <CircularProgress size={24} /> : <SendIcon />}
                      </IconButton>
                    </Box>
                  </Box>
                </>
              )}
            </TabPanel>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentView; 