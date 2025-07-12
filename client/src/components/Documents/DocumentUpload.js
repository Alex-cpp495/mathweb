import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNotification } from '../../contexts/NotificationContext';
import axios from 'axios';

const DocumentUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadResults, setUploadResults] = useState([]);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt']
  };

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(file => {
        if (file.file.size > maxFileSize) {
          showError(`文件 ${file.file.name} 超过50MB大小限制`);
        } else {
          showError(`文件 ${file.file.name} 格式不支持`);
        }
      });
    }

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      description: '',
      status: 'pending' // pending, uploading, success, error
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [showError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const updateFileInfo = (fileId, field, value) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, [field]: value } : f
    ));
  };

  const uploadSingleFile = async (fileData) => {
    const formData = new FormData();
    formData.append('document', fileData.file);
    formData.append('title', fileData.title);
    formData.append('description', fileData.description);

    try {
      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: progress
          }));
        }
      });

      return { success: true, data: response.data, fileId: fileData.id };
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || '上传失败',
        fileId: fileData.id
      };
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showError('请选择要上传的文件');
      return;
    }

    // Validate file info
    const invalidFiles = files.filter(f => !f.title.trim());
    if (invalidFiles.length > 0) {
      showError('请为所有文件填写标题');
      return;
    }

    setUploading(true);
    setUploadResults([]);

    // Update file status to uploading
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

    const results = [];

    // Upload files sequentially to avoid overwhelming the server
    for (const fileData of files) {
      const result = await uploadSingleFile(fileData);
      results.push(result);

      // Update file status
      setFiles(prev => prev.map(f =>
        f.id === result.fileId
          ? { ...f, status: result.success ? 'success' : 'error' }
          : f
      ));
    }

    setUploadResults(results);
    setUploading(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      showSuccess(`成功上传 ${successCount} 个文件`);
    }
    if (failCount > 0) {
      showError(`${failCount} 个文件上传失败`);
    }

    // If all files uploaded successfully, navigate to documents page
    if (failCount === 0) {
      setTimeout(() => navigate('/documents'), 2000);
    }
  };

  const getFileIcon = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    return <FileIcon />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        上传文档
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        支持 PDF、Word、PowerPoint 和文本文件，单个文件最大50MB
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* Upload Area */}
          <Card>
            <CardContent>
              <Paper
                {...getRootProps()}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? '释放文件到这里' : '点击或拖拽文件到这里'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  支持 PDF、DOC、DOCX、PPT、PPTX、TXT 格式
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  单个文件最大 50MB
                </Typography>
              </Paper>

              {files.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    待上传文件 ({files.length})
                  </Typography>
                  <List>
                    {files.map((fileData) => (
                      <ListItem key={fileData.id} divider>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          {getFileIcon(fileData.file)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2">
                                {fileData.file.name}
                              </Typography>
                              <Chip
                                label={fileData.status}
                                size="small"
                                color={getStatusColor(fileData.status)}
                                icon={getStatusIcon(fileData.status)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                              {fileData.status === 'uploading' && uploadProgress[fileData.id] && (
                                <Box mt={1}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={uploadProgress[fileData.id]}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {uploadProgress[fileData.id]}%
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => removeFile(fileData.id)}
                            disabled={uploading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* File Information */}
          {files.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  文件信息
                </Typography>
                {files.map((fileData, index) => (
                  <Box key={fileData.id} mb={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      文件 {index + 1}: {fileData.file.name}
                    </Typography>
                    <TextField
                      fullWidth
                      label="文档标题"
                      value={fileData.title}
                      onChange={(e) => updateFileInfo(fileData.id, 'title', e.target.value)}
                      margin="normal"
                      required
                      disabled={uploading}
                    />
                    <TextField
                      fullWidth
                      label="文档描述（可选）"
                      value={fileData.description}
                      onChange={(e) => updateFileInfo(fileData.id, 'description', e.target.value)}
                      margin="normal"
                      multiline
                      rows={2}
                      disabled={uploading}
                    />
                    {index < files.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  上传结果
                </Typography>
                {uploadResults.map((result) => (
                  <Alert
                    key={result.fileId}
                    severity={result.success ? 'success' : 'error'}
                    sx={{ mb: 1 }}
                  >
                    {result.success
                      ? `文件上传成功：${result.data.document.title}`
                      : `上传失败：${result.error}`
                    }
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={() => navigate('/documents')}
          disabled={uploading}
        >
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          startIcon={uploading ? null : <UploadIcon />}
        >
          {uploading ? '上传中...' : `上传 ${files.length} 个文件`}
        </Button>
      </Box>
    </Box>
  );
};

export default DocumentUpload; 