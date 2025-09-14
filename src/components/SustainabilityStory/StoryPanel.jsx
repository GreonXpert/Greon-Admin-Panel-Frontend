// src/components/SustainabilityStory/StoryPanel.jsx - COMPLETE VERSION WITH ACCORDION HEADER

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardActionArea, CardContent, CardMedia,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Alert, InputAdornment,
  Avatar, Accordion, AccordionSummary, AccordionDetails, LinearProgress,
  FormControlLabel, Switch, FormControl, FormLabel, Paper, CardActions
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import io from 'socket.io-client';
import axios from 'axios';

// Rich Text Editor imports
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// HTML parsing and sanitization
import YouTube from 'react-youtube';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api/stories`;

// Rich Text Editor Configuration
const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
    ],
  },
};

const quillFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image',
  'color', 'background',
  'align',
  'code-block'
];

// YouTube Helper Functions
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Content Sanitizer
const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'ol', 'ul', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'a', 'img', 'span', 'div',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'caption', 'colgroup', 'col'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'id',
      'colspan', 'rowspan', 'scope', 'border', 'cellpadding', 'cellspacing',
      'width', 'height', 'align', 'valign'
    ]
  });
};

// Rich Content Display Component
const RichContentDisplay = ({ content }) => {
  const sanitizedContent = sanitizeHtml(content);
  return (
    <Box sx={{ '& *': { maxWidth: '100%' } }}>
      {parse(sanitizedContent)}
    </Box>
  );
};

// Video Player Component
const VideoPlayer = ({ videoUrl, title }) => {
  const videoId = getYouTubeVideoId(videoUrl);

  if (videoId) {
    return (
      <YouTube
        videoId={videoId}
        opts={{
          height: '315',
          width: '100%',
          playerVars: {
            autoplay: 0,
          },
        }}
      />
    );
  }

  return (
    <Button
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant="contained"
      color="primary"
    >
      Watch Video: {title}
    </Button>
  );
};

// Featured Badge Component
const FeaturedBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  left: 12,
  zIndex: 2,
  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
  color: '#333',
  fontWeight: 700,
  borderRadius: 12,
  fontSize: '0.75rem',
  '& .MuiChip-icon': { color: '#333' }
}));

const CategoryBadge = styled(Chip)(({ theme, categoryColor }) => ({
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 2,
  background: `linear-gradient(135deg, ${categoryColor || '#1AC99F'}, ${alpha(categoryColor || '#1AC99F', 0.8)})`,
  color: 'white',
  fontWeight: 600,
  borderRadius: 12,
  '& .MuiChip-icon': { color: 'white' }
}));

// Featured Switch Component
const FeaturedSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#FFD700',
    '&:hover': {
      backgroundColor: alpha('#FFD700', 0.1),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: '#FFD700',
  },
  '& .MuiSwitch-track': {
    borderRadius: 20,
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
  },
}));

// Quill Container Styling
const QuillContainer = styled(Box)({
  '& .ql-toolbar': {
    borderBottom: '1px solid #ddd',
    '& .ql-formats': {
      marginRight: '15px',
    },
  },
  '& .ql-container': {
    minHeight: '250px',
    fontSize: '14px'
  }
});

// Constants
const CATEGORY_COLORS = {
  'Blog': '#1AC99F',
  'Video': '#3498DB',
  'Resources': '#2E8B8B'
};

const CATEGORY_ICONS = {
  'Blog': ArticleIcon,
  'Video': OndemandVideoIcon,
  'Resources': LibraryBooksIcon
};

const emptyForm = {
  title: '',
  description: '',
  content: '',
  category: 'Blog',
  author: '',
  readTime: '',
  duration: '',
  videoUrl: '',
  fileType: 'PDF',
  fileSize: '',
  pages: '',
  includes: [],
  includesInput: '',
  tags: [],
  tagsInput: '',
  featured: false,
  link: '',
  imageFile: null,
  authorImageFile: null,
  resourceFile: null,
  imagePreview: null,
  authorImagePreview: null,
  resourceFilePreview: null,
};

// Main Component
const StoryPanel = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [openDialog, setOpenDialog] = useState(false);
  const [editStory, setEditStory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewStory, setViewStory] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [headerExpanded, setHeaderExpanded] = useState(true); // New state for accordion

  const quillRef = useRef(null);
  const socketRef = useRef(null);

  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  const toast = useCallback((message, type = 'success') => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: 'success', message: '' }), 4000);
  }, []);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_URL, {
        params: {
          search,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
        }
      });
      if (data?.success) {
        setStories(data.data.stories || []);
      }
    } catch (e) {
      console.error(e);
      toast('Failed to fetch stories', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, toast]);

  useEffect(() => {
    fetchStories();

    console.log('🔌 Connecting to Sustainability Stories Socket.IO...');
    const socket = io(API_BASE, {
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Stories Socket Connected:', socket.id);
      socket.emit('join-story-room', 'sustainabilityStories-admin');
    });

    socket.on('story-created', (payload) => {
      if (payload?.success) {
        fetchStories();
        toast(`New story "${payload.data?.title}" created`, 'success');
      }
    });

    socket.on('story-updated', (payload) => {
      if (payload?.success) {
        fetchStories();
        toast(`Story "${payload.data?.title}" updated`, 'info');
      }
    });

    socket.on('story-deleted', (payload) => {
      fetchStories();
      toast(`Story "${payload.title}" deleted`, 'warning');
    });

    socket.on('story-engagement', (payload) => {
      if (payload.storyId) {
        setStories(prevStories =>
          prevStories.map(story =>
            story._id === payload.storyId
              ? {
                ...story,
                likes: payload.likes ?? story.likes,
                views: payload.views ?? story.views,
                downloadCount: payload.downloadCount ?? story.downloadCount,
              }
              : story
          )
        );
      }
    });

    socket.on('story-comment', (payload) => {
      toast(`New comment on "${payload.storyTitle}"`, 'info');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const filtered = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = !search ||
        story.title?.toLowerCase().includes(search.toLowerCase()) ||
        story.description?.toLowerCase().includes(search.toLowerCase()) ||
        story.author?.toLowerCase().includes(search.toLowerCase()) ||
        story.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = categoryFilter === 'All' || story.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [stories, search, categoryFilter]);

  const openAdd = () => {
    setEditStory(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const openEdit = (story) => {
    setEditStory(story);
    setForm({
      ...story,
      tags: story.tags || [],
      includes: story.includes || [],
      tagsInput: '',
      includesInput: '',
      featured: story.featured || false,
      imageFile: null,
      authorImageFile: null,
      resourceFile: null,
      imagePreview: story.image ? `${API_BASE}${story.image}` : null,
      authorImagePreview: story.authorImage ? `${API_BASE}${story.authorImage}` : null,
      resourceFilePreview: story.filePath ? story.filePath : null,
    });
    setOpenDialog(true);
  };

  const openView = (story) => {
    setViewStory(story);
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm(prev => ({
      ...prev,
      [`${type}File`]: file,
      [`${type}Preview`]: URL.createObjectURL(file),
    }));
  };

  const addTag = () => {
    const tag = form.tagsInput.trim();
    if (!tag) return;
    setForm(prev => ({
      ...prev,
      tags: [...new Set([...prev.tags, tag])],
      tagsInput: ''
    }));
  };

  const removeTag = (index) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const addInclude = () => {
    const include = form.includesInput.trim();
    if (!include) return;
    setForm(prev => ({
      ...prev,
      includes: [...new Set([...prev.includes, include])],
      includesInput: ''
    }));
  };

  const removeInclude = (index) => {
    setForm(prev => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index)
    }));
  };

  const submit = async () => {
    if (!form.title || !form.description || !form.content) {
      toast('Please fill in required fields', 'error');
      return;
    }

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (key.endsWith('File') || key.endsWith('Preview') || key.endsWith('Input')) return;
      if (key === 'content') {
        formData.append(key, sanitizeHtml(form[key]));
      } else if (Array.isArray(form[key])) {
        formData.append(key, JSON.stringify(form[key]));
      } else {
        formData.append(key, form[key]);
      }
    });

    if (form.imageFile) formData.append('image', form.imageFile);
    if (form.authorImageFile) formData.append('authorImage', form.authorImageFile);
    if (form.resourceFile) formData.append('file', form.resourceFile);

    try {
      setUploadProgress(0);
      const config = {
        ...authHeader,
        headers: {
          ...authHeader.headers,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      };

      if (editStory) {
        await axios.put(`${API_URL}/${editStory._id}`, formData, config);
        toast('Story updated successfully');
      } else {
        await axios.post(API_URL, formData, config);
        toast('Story created successfully');
      }

      setOpenDialog(false);
      setEditStory(null);
      setForm(emptyForm);
      setUploadProgress(0);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: Please login as admin/superadmin.'
        : (e?.response?.data?.message || 'Save failed');
      toast(msg, 'error');
      setUploadProgress(0);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`, authHeader);
      toast('Story deleted successfully');
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: Please login as admin/superadmin.'
        : (e?.response?.data?.message || 'Delete failed');
      toast(msg, 'error');
    }
  };

  const downloadFileFromUrl = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = downloadUrl;
      tempLink.download = filename || 'download';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(downloadUrl);
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  };

  const handleDownload = async (story) => {
    try {
      toast('Starting download...', 'info');
      const fileUrl = `${API_BASE}${story.filePath}`;
      const fileExtension = story.filePath ? story.filePath.substring(story.filePath.lastIndexOf('.')) : '.pdf';
      const sanitizedTitle = story.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const filename = `${sanitizedTitle}${fileExtension}`;

      const downloadSuccess = await downloadFileFromUrl(fileUrl, filename);

      if (downloadSuccess) {
        try {
          await axios.post(`${API_URL}/${story._id}/engagement`, { action: 'download' });
          toast(`Downloaded: ${filename}`, 'success');
        } catch (trackError) {
          console.warn('Failed to track download:', trackError);
          toast(`Downloaded: ${filename}`, 'success');
        }
      } else {
        toast('Download failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast('Download failed. Please try again.', 'error');
    }
  };

  const getCategoryIcon = (category) => {
    const IconComponent = CATEGORY_ICONS[category] || ArticleIcon;
    return <IconComponent />;
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      overflow: 'hidden',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Alert - Fixed at top */}
      {alert.open && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            m: 2,
            borderRadius: 2
          }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header Accordion */}
      <Box sx={{ m: 2, flexShrink: 0 }}>
        <Accordion 
          expanded={headerExpanded} 
          onChange={() => setHeaderExpanded(!headerExpanded)}
          sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1AC99F 0%, #3498DB 100%)',
            color: 'white',
            '&::before': {
              display: 'none'
            },
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
            sx={{
              '& .MuiAccordionSummary-content': {
                margin: '12px 0'
              },
              '& .MuiAccordionSummary-expandIconWrapper': {
                color: 'white'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)', mb: 1 }}>
                  <ArticleIcon sx={{ mr: 2, fontSize: '2rem' }} />
                  Sustainability Stories
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage blog posts, videos, and resources for sustainability insights
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openAdd}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    },
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    transition: 'all 0.3s ease'
                  }}
                >
                  Create Story
                </Button>
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ pt: 0 }}>
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search stories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255,255,255,0.8)' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid rgba(255,255,255,0.8)',
                    },
                    '& input': {
                      color: 'white',
                      '&::placeholder': {
                        color: 'rgba(255,255,255,0.7)',
                        opacity: 1
                      }
                    }
                  }
                }}
                sx={{ flexGrow: 1, maxWidth: '400px' }}
              />
              
              <TextField
                select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                sx={{
                  minWidth: 150,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    '& fieldset': {
                      border: '1px solid rgba(255,255,255,0.3)',
                    },
                    '&:hover fieldset': {
                      border: '1px solid rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      border: '2px solid rgba(255,255,255,0.8)',
                    },
                    '& .MuiSelect-select': {
                      color: 'white'
                    }
                  }
                }}
              >
                <MenuItem value="All">All Categories</MenuItem>
                <MenuItem value="Blog">Blog</MenuItem>
                <MenuItem value="Video">Video</MenuItem>
                <MenuItem value="Resources">Resources</MenuItem>
              </TextField>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Scrollable Content Area with Custom Scrollbar */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          px: 2,
          pb: 2,
          // Custom Scrollbar Styling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '10px',
            margin: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #1AC99F, #3498DB)',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            transition: 'all 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(135deg, #3498DB, #1AC99F)',
            transform: 'scale(1.1)',
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          // Firefox scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: '#1AC99F rgba(0,0,0,0.05)',
        }}
      >
        {/* Stories Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                Loading amazing stories...
              </Typography>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%',
                border: '4px solid #f0f0f0',
                borderTop: '4px solid #1AC99F',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </Box>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((story) => {
              const categoryColor = CATEGORY_COLORS[story.category];
              const IconComponent = CATEGORY_ICONS[story.category];

              return (
                <Grid item xs={12} sm={6} md={4} key={story._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: `2px solid ${alpha(categoryColor, 0.2)}`,
                      borderLeft: `6px solid ${categoryColor}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${categoryColor}, ${alpha(categoryColor, 0.7)})`,
                        zIndex: 1
                      },
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 12px 40px ${alpha(categoryColor, 0.15)}`,
                        '& .card-actions': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                  >
                    <CardActionArea
                      onClick={() => openView(story)}
                      sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        pt: 1
                      }}
                    >
                      {/* Image Container */}
                      <CardMedia
                        component="img"
                        height="180"
                        image={story.image ? `${API_BASE}${story.image}` : '/placeholder-image.jpg'}
                        alt={story.title}
                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                        sx={{ objectFit: 'cover' }}
                      />

                      {/* Category Badge */}
                      <CategoryBadge
                        icon={<IconComponent />}
                        label={story.category}
                        categoryColor={categoryColor}
                      />

                      {/* Featured Badge */}
                      {story.featured && (
                        <FeaturedBadge
                          icon={<StarIcon />}
                          label="FEATURED"
                        />
                      )}

                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        {/* Author Section */}
                        {story.author && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: categoryColor }}>
                              {story.author?.charAt(0)}
                            </Avatar>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {story.author}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                              • {new Date(story.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}

                        {/* Title & Description */}
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            fontWeight: 700,
                            color: '#2c3e50',
                            fontSize: '1.1rem',
                            lineHeight: 1.3,
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {story.title}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#546e7a',
                            mb: 2,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {story.description}
                        </Typography>

                        {/* Tags */}
                        <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                          {story.tags?.slice(0, 2).map((tag, index) => (
                            <Chip 
                              key={index} 
                              label={tag} 
                              size="small"
                              sx={{
                                backgroundColor: alpha(categoryColor, 0.1),
                                color: categoryColor,
                                fontSize: '0.7rem'
                              }}
                            />
                          ))}
                          {story.tags?.length > 2 && (
                            <Chip 
                              label={`+${story.tags.length - 2}`} 
                              size="small"
                              sx={{
                                backgroundColor: alpha(categoryColor, 0.1),
                                color: categoryColor,
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                        </Stack>

                        {/* Metrics */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          {story.category === 'Blog' && story.readTime && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: 16, color: '#666' }} />
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {story.readTime}
                              </Typography>
                            </Box>
                          )}
                          {story.category === 'Video' && story.views && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <VisibilityIcon sx={{ fontSize: 16, color: '#666' }} />
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {story.views}
                              </Typography>
                            </Box>
                          )}
                          {story.category === 'Resources' && story.downloadCount && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <DownloadIcon sx={{ fontSize: 16, color: '#666' }} />
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {story.downloadCount}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FavoriteIcon sx={{ fontSize: 16, color: '#666' }} />
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {story.likes || 0}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </CardActionArea>

                    {/* Action Buttons */}
                    <CardActions 
                      className="card-actions"
                      sx={{ 
                        p: 2, 
                        pt: 0, 
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 1,
                        opacity: 0.7,
                        transform: 'translateY(4px)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Button
                        onClick={(e) => { e.stopPropagation(); openEdit(story); }}
                        sx={{
                          borderColor: categoryColor,
                          color: categoryColor,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: alpha(categoryColor, 0.1),
                            borderColor: categoryColor,
                            transform: 'scale(1.05)'
                          }
                        }}
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>

                      {story.category === 'Resources' && story.filePath && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleDownload(story); }}
                          startIcon={<DownloadIcon />}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: categoryColor,
                            color: categoryColor,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: alpha(categoryColor, 0.1),
                              borderColor: categoryColor,
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          Download
                        </Button>
                      )}

                      <Button
                        onClick={(e) => { e.stopPropagation(); remove(story._id); }}
                        sx={{
                          color: '#e74c3c',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: alpha('#e74c3c', 0.1),
                            transform: 'scale(1.05)'
                          }
                        }}
                        size="small"
                        startIcon={<DeleteIcon />}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {!loading && filtered.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'linear-gradient(135deg, rgba(26, 201, 159, 0.05), rgba(52, 152, 219, 0.05))',
            borderRadius: 4,
            border: '2px dashed rgba(26, 201, 159, 0.2)',
            margin: 2
          }}>
            <Box sx={{ mb: 3 }}>
              <ArticleIcon sx={{ fontSize: 64, color: 'rgba(26, 201, 159, 0.4)' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              No stories found
            </Typography>
            <Typography variant="body1" sx={{ color: '#546e7a', mb: 3 }}>
              {search || categoryFilter !== 'All' ? 'Try adjusting your search or filters' : 'Start by creating your first sustainability story'}
            </Typography>
            {(!search && categoryFilter === 'All') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAdd}
                sx={{
                  background: 'linear-gradient(135deg, #1AC99F, #3498DB)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0E9A78, #2980B9)',
                    transform: 'translateY(-2px)'
                  },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600
                }}
              >
                Create Your First Story
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #E3F2FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <ArticleIcon sx={{ mr: 1 }} />
          {editStory ? 'Edit Story' : 'Create New Story'}
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, overflow: 'auto' }}>
          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ borderRadius: 1 }}
              />
            </Box>
          )}

          {/* Basic Information */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Basic Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="Title *"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description *"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
                fullWidth
                sx={{ mb: 2 }}
              />
              
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                Content * (Rich text editor)
              </FormLabel>
              <QuillContainer>
                <ReactQuill
                  ref={quillRef}
                  value={form.content}
                  onChange={content => setForm(prev => ({ ...prev, content }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Start writing your story content..."
                />
              </QuillContainer>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Category"
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="Blog">Blog</MenuItem>
                    <MenuItem value="Video">Video</MenuItem>
                    <MenuItem value="Resources">Resources</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="URL Slug"
                    value={form.link}
                    onChange={e => setForm(prev => ({ ...prev, link: e.target.value }))}
                    fullWidth
                    helperText="URL slug for the story"
                  />
                </Grid>
              </Grid>

              {/* Featured Toggle */}
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormLabel component="legend">Featured Story</FormLabel>
                <FormControlLabel
                  control={
                    <FeaturedSwitch
                      checked={form.featured}
                      onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {form.featured ? 'Featured' : 'Not Featured'}
                      </Typography>
                      {form.featured ? <StarIcon sx={{ color: '#FFD700' }} /> : <StarBorderIcon />}
                    </Box>
                  }
                />
              </FormControl>
            </AccordionDetails>
          </Accordion>

          {/* Category Specific Fields */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Category Specific</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {form.category === 'Blog' && (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Author"
                        value={form.author}
                        onChange={e => setForm(prev => ({ ...prev, author: e.target.value }))}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Read Time"
                        value={form.readTime}
                        onChange={e => setForm(prev => ({ ...prev, readTime: e.target.value }))}
                        fullWidth
                        placeholder="e.g., 5 min read"
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              {form.category === 'Video' && (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Duration"
                        value={form.duration}
                        onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
                        fullWidth
                        placeholder="e.g., 15:30"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Video URL"
                        value={form.videoUrl}
                        onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                        fullWidth
                        helperText="YouTube URLs will be embedded as players"
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              {form.category === 'Resources' && (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="File Type"
                        value={form.fileType}
                        onChange={e => setForm(prev => ({ ...prev, fileType: e.target.value }))}
                        fullWidth
                      >
                        <MenuItem value="PDF">PDF</MenuItem>
                        <MenuItem value="Excel">Excel</MenuItem>
                        <MenuItem value="Word">Word</MenuItem>
                        <MenuItem value="PowerPoint">PowerPoint</MenuItem>
                      </TextField>
                    </Grid>
                    {form.fileType === 'PDF' && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Pages"
                          value={form.pages}
                          onChange={e => setForm(prev => ({ ...prev, pages: e.target.value }))}
                          fullWidth
                        />
                      </Grid>
                    )}
                  </Grid>

                  {/* Includes */}
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label="What's Included"
                      value={form.includesInput}
                      onChange={e => setForm(prev => ({ ...prev, includesInput: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInclude())}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button onClick={addInclude}>
                              Add
                            </Button>
                          </InputAdornment>
                        )
                      }}
                      sx={{ mb: 1 }}
                    />
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {form.includes.map((include, index) => (
                        <Chip 
                          key={index} 
                          label={include} 
                          onDelete={() => removeInclude(index)}
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                </>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Tags & Media */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Tags & Media</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Tags */}
              <TextField
                label="Tags"
                value={form.tagsInput}
                onChange={e => setForm(prev => ({ ...prev, tagsInput: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button onClick={addTag}>
                        Add
                      </Button>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {form.tags.map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    onDelete={() => removeTag(index)}
                    size="small"
                    color="primary"
                  />
                ))}
              </Stack>

              {/* File Uploads */}
              <Grid container spacing={2}>
                {/* Main Image */}
                <Grid item xs={12} sm={6}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="main-image-upload"
                    type="file"
                    onChange={e => handleImageUpload(e, 'image')}
                  />
                  <label htmlFor="main-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                      sx={{ height: 56, mb: 2 }}
                    >
                      Main Image
                    </Button>
                  </label>
                  {form.imagePreview && (
                    <Box
                      component="img"
                      src={form.imagePreview}
                      alt="Preview"
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0'
                      }}
                    />
                  )}
                </Grid>

                {/* Author Image */}
                {form.category === 'Blog' && (
                  <Grid item xs={12} sm={6}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="author-image-upload"
                      type="file"
                      onChange={e => handleImageUpload(e, 'authorImage')}
                    />
                    <label htmlFor="author-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        sx={{ height: 56, mb: 2 }}
                      >
                        Author Image
                      </Button>
                    </label>
                    {form.authorImagePreview && (
                      <Box
                        component="img"
                        src={form.authorImagePreview}
                        alt="Author Preview"
                        sx={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '1px solid #e0e0e0'
                        }}
                      />
                    )}
                  </Grid>
                )}

                {/* Resource File */}
                {form.category === 'Resources' && (
                  <Grid item xs={12} sm={6}>
                    <input
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      style={{ display: 'none' }}
                      id="resource-file-upload"
                      type="file"
                      onChange={e => handleImageUpload(e, 'resource')}
                    />
                    <label htmlFor="resource-file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<InsertDriveFileIcon />}
                        fullWidth
                        sx={{ height: 56, mb: 2 }}
                      >
                        Resource File
                      </Button>
                    </label>
                    {form.resourceFilePreview && (
                      <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
                        File selected: {form.resourceFile?.name}
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={submit}
            variant="contained"
            disabled={uploadProgress > 0}
            sx={{
              background: 'linear-gradient(135deg, #1AC99F, #3498DB)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0E9A78, #2980B9)',
              }
            }}
          >
            {editStory ? 'Update Story' : 'Create Story'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog 
        open={Boolean(viewStory)} 
        onClose={() => setViewStory(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #E3F2FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <ArticleIcon sx={{ mr: 1 }} />
          {viewStory?.title}
          <IconButton
            onClick={() => setViewStory(null)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, overflow: 'auto' }}>
          {viewStory?.image && (
            <Box
              component="img"
              src={`${API_BASE}${viewStory.image}`}
              alt={viewStory.title}
              sx={{
                width: '100%',
                height: 250,
                objectFit: 'cover',
                borderRadius: 2,
                mb: 2
              }}
            />
          )}

          {/* Featured indicator in view dialog */}
          {viewStory?.featured && (
            <Chip
              icon={<StarIcon />}
              label="FEATURED STORY"
              sx={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: '#333',
                fontWeight: 700,
                mb: 2
              }}
            />
          )}

          {viewStory?.author && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: CATEGORY_COLORS[viewStory.category] }}>
                {viewStory.author?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {viewStory.author}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {new Date(viewStory.date).toLocaleDateString()} • {viewStory.readTime}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Enhanced Video Display */}
          {viewStory?.category === 'Video' && viewStory?.videoUrl && (
            <Box sx={{ mb: 2 }}>
              <VideoPlayer videoUrl={viewStory.videoUrl} title={viewStory.title} />
            </Box>
          )}

          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            {viewStory?.description}
          </Typography>

          {/* Rich Content Display */}
          <RichContentDisplay content={viewStory?.content} />

          {viewStory?.tags && viewStory.tags.length > 0 && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Tags
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {viewStory.tags.map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    size="small"
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {viewStory?.includes && viewStory.includes.length > 0 && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Includes
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {viewStory.includes.map((include, index) => (
                  <Chip 
                    key={index} 
                    label={include} 
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
            {viewStory?.views && (
              <Typography variant="body2" sx={{ color: '#666' }}>
                <VisibilityIcon sx={{ fontSize: 16, mr: 0.5 }} />
                {viewStory.views} views
              </Typography>
            )}
            {viewStory?.downloadCount && (
              <Typography variant="body2" sx={{ color: '#666' }}>
                <DownloadIcon sx={{ fontSize: 16, mr: 0.5 }} />
                {viewStory.downloadCount} downloads
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: '#666' }}>
              <FavoriteIcon sx={{ fontSize: 16, mr: 0.5 }} />
              {viewStory?.likes || 0} likes
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          {viewStory?.category === 'Resources' && viewStory?.filePath && (
            <Button
              onClick={() => handleDownload(viewStory)}
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{
                background: `linear-gradient(135deg, ${CATEGORY_COLORS[viewStory.category]}, ${alpha(CATEGORY_COLORS[viewStory.category], 0.8)})`,
              }}
            >
              Download File
            </Button>
          )}
          <Button onClick={() => setViewStory(null)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoryPanel;
