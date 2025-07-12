import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Grid,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as ThemeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'student'
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: false,
    darkMode: false,
    language: 'zh'
  });
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileEdit = () => {
    setEditing(true);
  };

  const handleProfileCancel = () => {
    setEditing(false);
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'student'
    });
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      const result = await updateProfile(profileData);
      
      if (result.success) {
        showSuccess('个人资料更新成功');
        setEditing(false);
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showError('请填写完整的密码信息');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('新密码和确认密码不一致');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('新密码至少需要6个字符');
      return;
    }

    try {
      setPasswordLoading(true);
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        showSuccess('密码修改成功');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('密码修改失败，请稍后重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    // TODO: Save settings to backend
    showSuccess('设置已保存');
  };

  const getUserStats = () => {
    // Mock statistics - in real app, this would come from API
    return {
      documentsUploaded: user?.documentsCount || 0,
      knowledgeGraphsCreated: user?.knowledgeGraphsCount || 0,
      aiQuestions: user?.aiQuestionsCount || 0,
      joinedDate: user?.createdAt || new Date().toISOString()
    };
  };

  const stats = getUserStats();

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        个人资料
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                  <PersonIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user?.name || '用户'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Chip 
                    label={user?.role || 'student'} 
                    size="small" 
                    color="primary" 
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {editing ? (
                <Box>
                  <TextField
                    fullWidth
                    label="姓名"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="邮箱"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    margin="normal"
                    type="email"
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel>身份</InputLabel>
                    <Select
                      value={profileData.role}
                      label="身份"
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        role: e.target.value
                      }))}
                    >
                      <MenuItem value="student">学生</MenuItem>
                      <MenuItem value="teacher">教师</MenuItem>
                      <MenuItem value="researcher">研究员</MenuItem>
                      <MenuItem value="other">其他</MenuItem>
                    </Select>
                  </FormControl>

                  <Box display="flex" gap={2} mt={3}>
                    <Button
                      variant="contained"
                      onClick={handleProfileSave}
                      disabled={loading}
                      startIcon={<SaveIcon />}
                    >
                      {loading ? '保存中...' : '保存'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleProfileCancel}
                      startIcon={<CancelIcon />}
                    >
                      取消
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="姓名"
                        secondary={user?.name || '未设置'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="邮箱"
                        secondary={user?.email}
                      />
                    </ListItem>
                  </List>

                  <Button
                    variant="outlined"
                    onClick={handleProfileEdit}
                    startIcon={<EditIcon />}
                    sx={{ mt: 2 }}
                  >
                    编辑资料
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                使用统计
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {stats.documentsUploaded}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      上传文档
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary.main">
                      {stats.knowledgeGraphsCreated}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      知识图谱
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {stats.aiQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI问答
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.primary">
                      {new Date(stats.joinedDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      加入日期
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings */}
        <Grid item xs={12} md={6}>
          {/* Password Change */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <SecurityIcon />
                <Typography variant="h6">
                  修改密码
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="当前密码"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
                margin="normal"
              />

              <TextField
                fullWidth
                label="新密码"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                margin="normal"
              />

              <TextField
                fullWidth
                label="确认新密码"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                margin="normal"
              />

              <Button
                variant="contained"
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                sx={{ mt: 2 }}
              >
                {passwordLoading ? '修改中...' : '修改密码'}
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <SettingsIcon />
                <Typography variant="h6">
                  系统设置
                </Typography>
              </Box>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="桌面通知"
                    secondary="接收浏览器通知"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications}
                        onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      />
                    }
                    label=""
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="邮件通知"
                    secondary="接收邮件提醒"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      />
                    }
                    label=""
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <ThemeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="深色模式"
                    secondary="使用深色主题"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.darkMode}
                        onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                      />
                    }
                    label=""
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="语言"
                    secondary="界面语言设置"
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                    >
                      <MenuItem value="zh">中文</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Alert severity="info" sx={{ mt: 3 }}>
            如需删除账户或有其他问题，请联系客服支持。
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 