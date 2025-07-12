import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Description as DocumentIcon,
  AccountTree as KnowledgeGraphIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Psychology as AIIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import axios from 'axios';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, filterStatus]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      showError('获取文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => {
        switch (filterStatus) {
          case 'processed':
            return doc.isProcessed;
          case 'processing':
            return !doc.isProcessed;
          default:
            return true;
        }
      });
    }

    setFilteredDocuments(filtered);
  };

  const handleMenuOpen = (event, document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleDocumentClick = (documentId) => {
    navigate(`/documents/${documentId}`);
  };

  const handleUploadClick = () => {
    navigate('/documents/upload');
  };

  const handleKnowledgeGraphClick = (documentId) => {
    navigate(`/documents/${documentId}/knowledge-graph`);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/documents/${selectedDocument._id}`);
      showSuccess('文档删除成功');
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      showError('删除文档失败');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await axios.get(`/api/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', selectedDocument.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess('文档下载成功');
    } catch (error) {
      console.error('Failed to download document:', error);
      showError('下载文档失败');
    }
    handleMenuClose();
  };

  const getStatusColor = (isProcessed) => {
    return isProcessed ? 'success' : 'warning';
  };

  const getStatusText = (isProcessed) => {
    return isProcessed ? '已处理' : '处理中';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          文档管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleUploadClick}
          size="large"
        >
          上传文档
        </Button>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="搜索文档..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>状态筛选</InputLabel>
              <Select
                value={filterStatus}
                label="状态筛选"
                onChange={(e) => setFilterStatus(e.target.value)}
                startAdornment={<FilterIcon sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">全部状态</MenuItem>
                <MenuItem value="processed">已处理</MenuItem>
                <MenuItem value="processing">处理中</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              共 {filteredDocuments.length} 个文档
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm || filterStatus !== 'all' ? '没有找到匹配的文档' : '还没有上传任何文档'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchTerm || filterStatus !== 'all' 
              ? '尝试修改搜索条件或筛选器' 
              : '上传您的第一个学习材料开始使用AI学习助手'
            }
          </Typography>
          {(!searchTerm && filterStatus === 'all') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleUploadClick}
            >
              上传文档
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredDocuments.map((document) => (
            <Grid item xs={12} sm={6} md={4} key={document._id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleDocumentClick(document._id)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <DocumentIcon />
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, document);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                    {document.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 2
                    }}
                  >
                    {document.description || '暂无描述'}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip
                      label={getStatusText(document.isProcessed)}
                      color={getStatusColor(document.isProcessed)}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1}>
                    {document.isProcessed && (
                      <Tooltip title="查看知识图谱">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKnowledgeGraphClick(document._id);
                          }}
                        >
                          <KnowledgeGraphIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="AI问答">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement AI chat functionality
                        }}
                      >
                        <AIIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDocumentClick(selectedDocument?._id)}>
          <EditIcon sx={{ mr: 1 }} />
          查看详情
        </MenuItem>
        {selectedDocument?.isProcessed && (
          <MenuItem onClick={() => handleKnowledgeGraphClick(selectedDocument._id)}>
            <KnowledgeGraphIcon sx={{ mr: 1 }} />
            知识图谱
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDownload(selectedDocument?._id)}>
          <DownloadIcon sx={{ mr: 1 }} />
          下载文档
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          删除文档
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除文档 "{selectedDocument?.title}" 吗？此操作无法撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleting}
          >
            {deleting ? '删除中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentList; 