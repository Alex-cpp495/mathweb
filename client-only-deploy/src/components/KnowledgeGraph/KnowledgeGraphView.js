import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Tooltip,
  Slider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  AccountTree as GraphIcon,
  Circle as NodeIcon
} from '@mui/icons-material';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data/standalone';
import { useNotification } from '../../contexts/NotificationContext';
import axios from 'axios';

const KnowledgeGraphView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const networkRef = useRef(null);
  const networkInstance = useRef(null);
  
  const [document, setDocument] = useState(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Visualization settings
  const [settings, setSettings] = useState({
    physics: true,
    nodeSize: 20,
    edgeWidth: 2,
    layout: 'hierarchical'
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (knowledgeGraph && networkRef.current) {
      initializeNetwork();
    }
  }, [knowledgeGraph, settings]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docResponse, graphResponse] = await Promise.all([
        axios.get(`/api/documents/${id}`),
        axios.get(`/api/knowledge-graphs/document/${id}`)
      ]);
      
      setDocument(docResponse.data.document);
      setKnowledgeGraph(graphResponse.data.knowledgeGraph);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showError('获取知识图谱失败');
      navigate(`/documents/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeNetwork = () => {
    if (!knowledgeGraph?.graph) return;

    // Prepare nodes data
    const nodes = new DataSet(
      knowledgeGraph.graph.nodes.map(node => ({
        id: node.id,
        label: node.label,
        title: node.properties?.description || node.label,
        color: getNodeColor(node.type),
        size: settings.nodeSize + (node.properties?.importance || 0) * 10,
        font: { size: 12 },
        ...node.properties
      }))
    );

    // Prepare edges data
    const edges = new DataSet(
      knowledgeGraph.graph.edges.map(edge => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        title: edge.properties?.description || edge.label,
        width: settings.edgeWidth * (edge.properties?.strength || 1),
        color: { color: '#848484', hover: '#2196f3' },
        ...edge.properties
      }))
    );

    // Network options
    const options = {
      nodes: {
        shape: 'dot',
        font: {
          size: 14,
          face: 'Arial'
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        font: {
          size: 12,
          align: 'middle'
        },
        arrows: {
          to: { enabled: true, scaleFactor: 1, type: 'arrow' }
        },
        smooth: {
          type: 'continuous'
        }
      },
      physics: {
        enabled: settings.physics,
        stabilization: { iterations: 100 },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09
        }
      },
      layout: getLayoutOptions(),
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: true
      }
    };

    // Initialize network
    if (networkInstance.current) {
      networkInstance.current.destroy();
    }

    networkInstance.current = new Network(
      networkRef.current,
      { nodes, edges },
      options
    );

    // Event handlers
    networkInstance.current.on('selectNode', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = knowledgeGraph.graph.nodes.find(n => n.id === nodeId);
        setSelectedNode(node);
      }
    });

    networkInstance.current.on('deselectNode', () => {
      setSelectedNode(null);
    });
  };

  const getNodeColor = (type) => {
    const colors = {
      concept: '#2196f3',
      person: '#4caf50',
      method: '#ff9800',
      entity: '#9c27b0',
      keyword: '#f44336',
      default: '#607d8b'
    };
    return colors[type] || colors.default;
  };

  const getLayoutOptions = () => {
    switch (settings.layout) {
      case 'hierarchical':
        return {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            shakeTowards: 'leaves'
          }
        };
      case 'force':
        return { randomSeed: 2 };
      default:
        return {};
    }
  };

  const handleZoomIn = () => {
    if (networkInstance.current) {
      const scale = networkInstance.current.getScale();
      networkInstance.current.moveTo({ scale: scale * 1.2 });
    }
  };

  const handleZoomOut = () => {
    if (networkInstance.current) {
      const scale = networkInstance.current.getScale();
      networkInstance.current.moveTo({ scale: scale * 0.8 });
    }
  };

  const handleCenter = () => {
    if (networkInstance.current) {
      networkInstance.current.fit();
    }
  };

  const handleSearch = (searchValue) => {
    if (!networkInstance.current || !searchValue) return;

    const matchingNodes = knowledgeGraph.graph.nodes.filter(node =>
      node.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    if (matchingNodes.length > 0) {
      const nodeIds = matchingNodes.map(node => node.id);
      networkInstance.current.selectNodes(nodeIds);
      networkInstance.current.focus(nodeIds[0], {
        scale: 1.5,
        animation: true
      });
    }
  };

  const filteredNodes = knowledgeGraph?.graph?.nodes?.filter(node => {
    if (filterType === 'all') return true;
    return node.type === filterType;
  }) || [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!knowledgeGraph) {
    return (
      <Alert severity="info">
        该文档的知识图谱尚未生成，请稍后再试。
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate(`/documents/${id}`)}>
              <BackIcon />
            </IconButton>
            <GraphIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {document?.title} - 知识图谱
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {knowledgeGraph.graph.nodes.length} 个节点, {knowledgeGraph.graph.edges.length} 个连接
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {/* Search */}
            <TextField
              size="small"
              placeholder="搜索节点..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchTerm);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 200 }}
            />
            
            {/* Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>筛选类型</InputLabel>
              <Select
                value={filterType}
                label="筛选类型"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">全部类型</MenuItem>
                <MenuItem value="concept">概念</MenuItem>
                <MenuItem value="person">人物</MenuItem>
                <MenuItem value="method">方法</MenuItem>
                <MenuItem value="entity">实体</MenuItem>
              </Select>
            </FormControl>

            {/* Controls */}
            <Tooltip title="放大">
              <IconButton onClick={handleZoomIn}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="缩小">
              <IconButton onClick={handleZoomOut}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="居中">
              <IconButton onClick={handleCenter}>
                <CenterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="设置">
              <IconButton onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Network Visualization */}
        <Box
          ref={networkRef}
          sx={{
            flex: 1,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'divider'
          }}
        />

        {/* Node Info Panel */}
        {selectedNode && (
          <Paper
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 300,
              maxHeight: 400,
              overflow: 'auto',
              p: 2,
              zIndex: 1000
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <NodeIcon sx={{ color: getNodeColor(selectedNode.type) }} />
              <Typography variant="h6">{selectedNode.label}</Typography>
              <Chip label={selectedNode.type} size="small" />
            </Box>
            
            {selectedNode.properties?.description && (
              <Typography variant="body2" paragraph>
                {selectedNode.properties.description}
              </Typography>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="caption" color="text.secondary">
              节点属性
            </Typography>
            <List dense>
              {Object.entries(selectedNode.properties || {}).map(([key, value]) => (
                <ListItem key={key} disableGutters>
                  <ListItemText
                    primary={key}
                    secondary={String(value)}
                    primaryTypographyProps={{ variant: 'caption' }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            可视化设置
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>布局算法</InputLabel>
            <Select
              value={settings.layout}
              label="布局算法"
              onChange={(e) => setSettings(prev => ({ ...prev, layout: e.target.value }))}
            >
              <MenuItem value="hierarchical">分层布局</MenuItem>
              <MenuItem value="force">力导向布局</MenuItem>
              <MenuItem value="random">随机布局</MenuItem>
            </Select>
          </FormControl>

          <Typography gutterBottom>节点大小</Typography>
          <Slider
            value={settings.nodeSize}
            onChange={(e, value) => setSettings(prev => ({ ...prev, nodeSize: value }))}
            min={10}
            max={50}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>连线宽度</Typography>
          <Slider
            value={settings.edgeWidth}
            onChange={(e, value) => setSettings(prev => ({ ...prev, edgeWidth: value }))}
            min={1}
            max={10}
            valueLabelDisplay="auto"
          />

          <FormControl fullWidth margin="normal">
            <Button
              variant="outlined"
              onClick={() => setSettings(prev => ({ ...prev, physics: !prev.physics }))}
            >
              {settings.physics ? '禁用' : '启用'} 物理引擎
            </Button>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            图谱统计
          </Typography>
          <Typography variant="body2" color="text.secondary">
            节点总数: {knowledgeGraph.graph.nodes.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            连接总数: {knowledgeGraph.graph.edges.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            当前筛选: {filteredNodes.length} 个节点
          </Typography>
        </Box>
      </Drawer>
    </Box>
  );
};

export default KnowledgeGraphView; 