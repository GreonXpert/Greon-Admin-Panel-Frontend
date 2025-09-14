// src/components/ClimateIntelligence/ClimateIntelligencePanel.jsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardActionArea, CardContent, CardMedia,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Tooltip, Alert, Divider, InputAdornment,
  Container, Paper, CardActions, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import io from 'socket.io-client';
import axios from 'axios';

// Icons list (dropdown)
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import ScienceIcon from '@mui/icons-material/Science';
import PublicIcon from '@mui/icons-material/Public';
import VerifiedIcon from '@mui/icons-material/Verified';
import LanguageIcon from '@mui/icons-material/Language';
import NatureIcon from '@mui/icons-material/Nature';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;

// ----- helpers -----
const ICON_OPTIONS = [
  { value: 'Dashboard', label: 'Dashboard', Component: DashboardIcon },
  { value: 'Settings', label: 'Settings', Component: SettingsIcon },
  { value: 'TrendingUp', label: 'Trending Up', Component: TrendingUpIcon },
  { value: 'AutoAwesome', label: 'Auto Awesome', Component: AutoAwesomeIcon },
  { value: 'Insights', label: 'Insights', Component: InsightsIcon },
  { value: 'Assessment', label: 'Assessment', Component: AssessmentIcon },
  { value: 'Security', label: 'Security', Component: SecurityIcon },
  { value: 'Science', label: 'Science', Component: ScienceIcon },
  { value: 'Public', label: 'Public / Globe', Component: PublicIcon },
  { value: 'Verified', label: 'Verified', Component: VerifiedIcon },
  { value: 'Language', label: 'Language', Component: LanguageIcon },
  { value: 'Nature', label: 'Nature', Component: NatureIcon },
];

const SHAPE_OPTIONS = ['Automate', 'Decarbonize', 'Disclose'];

const iconComponentFromName = (name) => {
  const found = ICON_OPTIONS.find(o => o.value === name);
  return (found && found.Component) || DashboardIcon;
};

const hexToRgba = (hex, a = 1) => {
  if (!hex) return `rgba(0,0,0,${a})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${a})`;
  // eslint-disable-next-line no-bitwise
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const emptyForm = {
  icon: 'Dashboard',
  title: '',
  description: '',
  benefits: [], // point-by-point list
  benefitInput: '', // input box content
  imageFile: null,
  imagePreview: null,
  colorHex: '#1AC99F',
  shape: ''
};

const ClimateIntelligencePanel = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editFeature, setEditFeature] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewFeature, setViewFeature] = useState(null);
  const [headerExpanded, setHeaderExpanded] = useState(true); // New state for accordion

  // === Auth headers ===
  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const authHeaderMultipart = token
    ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    : { headers: { 'Content-Type': 'multipart/form-data' } };

  const toast = (message, type = 'success') => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: 'success', message: '' }), 3500);
  };

  // --- Fetch + realtime
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // moved to /climate-intelligence/features to match backend
        const res = await axios.get(`${API_URL}/climate-intelligence/features`);
        if (res.data?.success) setFeatures(res.data.data || []);
      } catch (e) {
        toast('Failed to fetch features', 'error');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();

    const socket = io(API_BASE);
    socket.emit('join', 'climateIntelligence');
    socket.on('ci-features-updated', (payload) => {
      if (payload?.success && Array.isArray(payload.data)) {
        setFeatures(payload.data);
      }
    });
    return () => socket.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return features;
    return features.filter(f =>
      (f.title || '').toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      (f.icon || '').toLowerCase().includes(q) ||
      (f.shape || '').toLowerCase().includes(q) ||
      (f.colorHex || '').toLowerCase().includes(q) ||
      (f.benefits || []).some(b => (b || '').toLowerCase().includes(q))
    );
  }, [features, search]);

  const openAdd = () => {
    setEditFeature(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const openEdit = (f) => {
    setEditFeature(f);
    setForm({
      icon: f.icon || 'Dashboard',
      title: f.title || '',
      description: f.description || '',
      benefits: Array.isArray(f.benefits) ? f.benefits : [],
      benefitInput: '',
      imageFile: null,
      imagePreview: f.imageUrl ? `${API_BASE}${f.imageUrl}` : null,
      colorHex: f.colorHex || '#1AC99F',
      shape: f.shape || ''
    });
    setOpenDialog(true);
  };

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  // ---- Benefits helpers
  const addBenefit = () => {
    const raw = form.benefitInput.trim();
    if (!raw) return;
    const parts = raw.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
    setForm(prev => ({
      ...prev,
      benefits: [...prev.benefits, ...parts],
      benefitInput: ''
    }));
  };

  const handleBenefitKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBenefit();
    }
  };

  const removeBenefit = (idx) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== idx)
    }));
  };

  const submit = async () => {
    if (!form.title || !form.description) {
      toast('Please fill title and description', 'error');
      return;
    }

    if (!editFeature && !form.imageFile) {
      toast('Please upload an image', 'error');
      return;
    }

    const fd = new FormData();
    fd.append('icon', form.icon);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('benefits', JSON.stringify(form.benefits));
    if (form.colorHex) fd.append('colorHex', form.colorHex);
    if (form.shape) fd.append('shape', form.shape);
    if (form.imageFile) fd.append('image', form.imageFile);

    try {
      if (editFeature) {
        await axios.put(
          `${API_URL}/climate-intelligence/features/${editFeature._id}`,
          fd,
          authHeaderMultipart
        );
        toast('Feature updated!');
        setOpenDialog(false);
        setEditFeature(null);
        setForm(emptyForm);
      } else {
        await axios.post(`${API_URL}/climate-intelligence/features`, fd, authHeaderMultipart);
        toast('Feature added!');
        setOpenDialog(false);
        setForm(emptyForm);
      }
      // list refresh handled by socket
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: please log in as admin/superadmin.'
        : (e?.response?.data?.message || 'Save failed');
      toast(msg, 'error');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this feature?')) return;
    try {
      await axios.delete(`${API_URL}/climate-intelligence/features/${id}`, authHeader);
      toast('Feature deleted');
      setFeatures(prev => prev.filter(x => x._id !== id));
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: please log in as admin/superadmin.'
        : (e?.response?.data?.message || 'Delete failed');
      toast(msg, 'error');
    }
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
                  <DashboardIcon sx={{ mr: 2, fontSize: '2rem' }} />
                  Climate Intelligence - Feature Manager
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage and configure climate intelligence features for better environmental insights
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
                  New Feature
                </Button>
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ pt: 0 }}>
            {/* Search and Filters */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search features..."
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
                sx={{ maxWidth: '500px', flexGrow: 1 }}
              />
              
              <Chip 
                label={`${filtered.length} feature${filtered.length !== 1 ? 's' : ''}`}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 600
                }}
              />
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                Loading amazing features...
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
            {filtered.map((f) => {
              const IconComp = iconComponentFromName(f.icon);
              const tint06 = hexToRgba(f.colorHex || '#1AC99F', 0.06);
              const tint18 = hexToRgba(f.colorHex || '#1AC99F', 0.18);
              const borderCol = hexToRgba(f.colorHex || '#1AC99F', 0.27);

              return (
                <Grid item xs={12} sm={6} md={4} key={f._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: `2px solid ${borderCol}`,
                      borderLeft: `6px solid ${f.colorHex || '#1AC99F'}`,
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
                        background: `linear-gradient(90deg, ${f.colorHex || '#1AC99F'}, ${hexToRgba(f.colorHex || '#1AC99F', 0.7)})`,
                        zIndex: 1
                      },
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 12px 40px ${hexToRgba(f.colorHex || '#1AC99F', 0.15)}`,
                        '& .card-actions': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                  >
                    <CardActionArea
                      onClick={() => setViewFeature(f)}
                      sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        pt: 1
                      }}
                    >
                      {f.imageUrl ? (
                        <CardMedia
                          component="img"
                          height="160"
                          image={`${API_BASE}${f.imageUrl}`}
                          alt={f.title}
                          sx={{
                            objectFit: 'cover',
                            backgroundColor: tint06
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 160,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: tint06,
                            color: f.colorHex || '#1AC99F'
                          }}
                        >
                          <IconComp sx={{ fontSize: 64 }} />
                        </Box>
                      )}
                      
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            fontWeight: 700,
                            color: '#2c3e50',
                            fontSize: '1.1rem',
                            lineHeight: 1.3,
                            mb: 1
                          }}
                        >
                          <IconComp sx={{ mr: 1, fontSize: '1.2rem', color: f.colorHex || '#1AC99F' }} />
                          {f.title}
                        </Typography>
                        
                        {f.shape && (
                          <Chip 
                            label={f.shape} 
                            size="small" 
                            sx={{
                              mb: 1,
                              backgroundColor: tint18,
                              color: f.colorHex || '#1AC99F',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#546e7a',
                            mb: 2,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {f.description}
                        </Typography>
                        
                        <Stack spacing={0.5}>
                          {(f.benefits || []).slice(0, 2).map((b, i) => (
                            <Typography 
                              key={i} 
                              variant="caption" 
                              sx={{
                                color: '#666',
                                '&::before': {
                                  content: '"• "',
                                  color: f.colorHex || '#1AC99F',
                                  fontWeight: 'bold'
                                }
                              }}
                            >
                              {b}
                            </Typography>
                          ))}
                          {(f.benefits || []).length > 2 && (
                            <Typography 
                              variant="caption" 
                              sx={{ color: f.colorHex || '#1AC99F', fontWeight: 600 }}
                            >
                              +{(f.benefits || []).length - 2} more benefits
                            </Typography>
                          )}
                        </Stack>
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
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => { e.stopPropagation(); setViewFeature(f); }}
                        sx={{
                          color: f.colorHex || '#1AC99F',
                          borderColor: hexToRgba(f.colorHex || '#1AC99F', 0.4),
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: tint18,
                            borderColor: f.colorHex || '#1AC99F',
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        View
                      </Button>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={(e) => { e.stopPropagation(); openEdit(f); }}
                        sx={{
                          color: '#D96F32',
                          borderColor: 'rgba(217, 111, 50, 0.4)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#D96F32',
                            color: 'white',
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        Edit
                      </Button>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={(e) => { e.stopPropagation(); remove(f._id); }}
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
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
              <DashboardIcon sx={{ fontSize: 64, color: 'rgba(26, 201, 159, 0.4)' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              No features found
            </Typography>
            <Typography variant="body1" sx={{ color: '#546e7a', mb: 3 }}>
              {search ? 'Try a different search term' : 'Start by adding your first climate intelligence feature'}
            </Typography>
            {!search && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAdd}
                sx={{
                  backgroundColor: '#1AC99F',
                  '&:hover': { backgroundColor: '#0E9A78' },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600
                }}
              >
                Add Your First Feature
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Create / Edit dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #EBF3FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <DashboardIcon sx={{ mr: 1 }} />
          {editFeature ? 'Edit Feature' : 'Add Feature'}
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Title"
                fullWidth
                required
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Icon"
                fullWidth
                value={form.icon}
                onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))}
                helperText="Pick an icon (preview on the right)."
              >
                {ICON_OPTIONS.map(opt => {
                  const Ico = opt.Component;
                  return (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Ico sx={{ mr: 1 }} />
                      {opt.label}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                required
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Shape"
                fullWidth
                value={form.shape}
                onChange={e => setForm(prev => ({ ...prev, shape: e.target.value }))}
              >
                <MenuItem value="">None</MenuItem>
                {SHAPE_OPTIONS.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Accent Color (colorHex)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    value={form.colorHex}
                    onChange={e => setForm(prev => ({ ...prev, colorHex: e.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">#</InputAdornment>
                      )
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  <input
                    type="color"
                    value={form.colorHex}
                    onChange={e => setForm(prev => ({ ...prev, colorHex: e.target.value }))}
                    style={{ width: 46, height: 46, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                    aria-label="Pick color"
                  />
                </Box>
              </Box>
            </Grid>
            
            {/* Benefits input */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Benefits
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={form.benefitInput}
                  onChange={e => setForm(prev => ({ ...prev, benefitInput: e.target.value }))}
                  onKeyDown={handleBenefitKeyDown}
                  placeholder="Type a benefit and press Enter (or paste multiple lines)"
                />
                <Button variant="outlined" onClick={addBenefit}>
                  Add
                </Button>
              </Box>
              <Stack spacing={1}>
                {form.benefits.map((b, idx) => (
                  <Chip
                    key={idx}
                    label={b}
                    onDelete={() => removeBenefit(idx)}
                    size="small"
                  />
                ))}
              </Stack>
            </Grid>

            {/* Preview */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Preview
              </Typography>
              <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                {(() => {
                  const Ico = iconComponentFromName(form.icon);
                  return <Ico sx={{ fontSize: 48, color: form.colorHex }} />;
                })()}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {form.icon} icon • {form.shape || 'no shape'} • {form.colorHex}
                </Typography>
              </Paper>
            </Grid>

            {/* Image */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Image
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={onPickImage}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{ width: '100%', mb: 1 }}
                >
                  {form.imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
              </label>
              {form.imagePreview ? (
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
              ) : (
                <Paper sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  No image selected
                </Paper>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={submit}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1AC99F, #3498DB)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0E9A78, #2980B9)',
              }
            }}
          >
            {editFeature ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View dialog */}
      <Dialog 
        open={Boolean(viewFeature)} 
        onClose={() => setViewFeature(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #EBF3FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <DashboardIcon sx={{ mr: 1 }} />
          {viewFeature?.title}
          <IconButton
            onClick={() => setViewFeature(null)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {viewFeature?.imageUrl && (
            <Box
              component="img"
              src={`${API_BASE}${viewFeature.imageUrl}`}
              alt={viewFeature.title}
              sx={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                borderRadius: 2,
                mb: 2
              }}
            />
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {(() => {
              const Ico = iconComponentFromName(viewFeature?.icon);
              return <Ico sx={{ fontSize: 32, color: viewFeature?.colorHex || '#1AC99F' }} />;
            })()}
            
            {viewFeature?.shape && (
              <Chip 
                label={viewFeature.shape} 
                sx={{
                  backgroundColor: hexToRgba(viewFeature?.colorHex || '#1AC99F', 0.1),
                  color: viewFeature?.colorHex || '#1AC99F'
                }}
              />
            )}
            
            {viewFeature?.colorHex && (
              <Chip 
                label={viewFeature.colorHex} 
                sx={{
                  backgroundColor: viewFeature.colorHex,
                  color: 'white'
                }}
              />
            )}
          </Box>
          
          <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
            <strong>Icon:</strong> {viewFeature?.icon}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
            {viewFeature?.description}
          </Typography>
          
          {(viewFeature?.benefits || []).length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Benefits
              </Typography>
              <Stack spacing={1}>
                {(viewFeature?.benefits || []).map((b, i) => (
                  <Typography 
                    key={i} 
                    variant="body2"
                    sx={{
                      '&::before': {
                        content: '"• "',
                        color: viewFeature?.colorHex || '#1AC99F',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    {b}
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setViewFeature(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClimateIntelligencePanel;
