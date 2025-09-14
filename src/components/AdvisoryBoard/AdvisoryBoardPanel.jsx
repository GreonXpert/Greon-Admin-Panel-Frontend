// src/components/AdvisoryBoard/AdvisoryBoardPanel.jsx

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardActionArea, CardContent, CardMedia,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Tooltip, Alert, Divider, InputAdornment, 
  Avatar, Badge, CircularProgress, FormControl, InputLabel, Select, CardActions
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  CloudUpload as CloudUploadIcon, Close as CloseIcon, LinkedIn as LinkedInIcon,
  Visibility as VisibilityIcon, Group as GroupIcon, Business as BusinessIcon
} from '@mui/icons-material';

// Icons
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

import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE } from '../../utils/api';


const API_URL = `${API_BASE}/api/advisory-board`;

const ICON_OPTIONS = [
  { value: 'Dashboard', label: 'Dashboard', Component: DashboardIcon, color: '#1AC99F' },
  { value: 'Settings', label: 'Settings', Component: SettingsIcon, color: '#2E8B8B' },
  { value: 'TrendingUp', label: 'Trending Up', Component: TrendingUpIcon, color: '#3498DB' },
  { value: 'AutoAwesome', label: 'Auto Awesome', Component: AutoAwesomeIcon, color: '#F39C12' },
  { value: 'Insights', label: 'Insights', Component: InsightsIcon, color: '#E74C3C' },
  { value: 'Assessment', label: 'Assessment', Component: AssessmentIcon, color: '#9B59B6' },
  { value: 'Security', label: 'Security', Component: SecurityIcon, color: '#2ECC71' },
  { value: 'Science', label: 'Science', Component: ScienceIcon, color: '#34495E' },
  { value: 'Public', label: 'Public / Globe', Component: PublicIcon, color: '#16A085' },
  { value: 'Verified', label: 'Verified', Component: VerifiedIcon, color: '#27AE60' },
  { value: 'Language', label: 'Language', Component: LanguageIcon, color: '#8E44AD' },
  { value: 'Nature', label: 'Nature', Component: NatureIcon, color: '#2E8B57' },
];

const PRESET_COLORS = [
  '#1AC99F', '#2E8B8B', '#3498DB', '#F39C12',
  '#E74C3C', '#9B59B6', '#2ECC71', '#34495E'
];

const iconComponentFromName = (name) => {
  const found = ICON_OPTIONS.find(o => o.value === name);
  return (found && found.Component) || DashboardIcon;
};

// Helper function to convert hex to rgba
const hexToRgba = (hex, a = 1) => {
  if (!hex) return `rgba(26, 201, 159, ${a})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  if (Number.isNaN(n)) return `rgba(26, 201, 159, ${a})`;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const emptyForm = {
  name: '',
  title: '',
  company: '',
  yearsExperience: '',
  expertise: [],
  expertiseInput: '',
  bio: '',
  icon: 'Dashboard',
  color: '#1AC99F',
  linkedinUrl: '',
  imageFile: null,
  imagePreview: null,
};

// Enhanced expertise cleaner
const cleanExpertiseItem = (item) => {
  if (!item) return '';
  let cleaned = String(item).trim();
  cleaned = cleaned.replace(/^\[+|\]+$/g, '');
  cleaned = cleaned.replace(/["']/g, '');
  cleaned = cleaned.replace(/\\/g, '');
  cleaned = cleaned.replace(/^,+|,+$/g, '').trim();
  return cleaned;
};

const normalizeExpertise = (raw) => {
  if (!raw) return [];
  let result = [];
  if (Array.isArray(raw)) {
    result = raw.map(cleanExpertiseItem).filter(Boolean);
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          result = parsed.map(cleanExpertiseItem).filter(Boolean);
        } else {
          result = [cleanExpertiseItem(parsed)].filter(Boolean);
        }
      } catch {
        result = trimmed
          .slice(1, -1)
          .split(',')
          .map(cleanExpertiseItem)
          .filter(Boolean);
      }
    } else if (trimmed.includes(',')) {
      result = trimmed.split(',').map(cleanExpertiseItem).filter(Boolean);
    } else {
      result = [cleanExpertiseItem(trimmed)].filter(Boolean);
    }
  }
  return [...new Set(result.filter(Boolean))];
};

const isValidHex = (val) => /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(val || '');

const normalizeHex = (val) => {
  if (!val) return '';
  const v = val.startsWith('#') ? val : `#${val}`;
  return v.toUpperCase();
};

const isValidLinkedInUrl = (url) => {
  if (!url) return true;
  const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9\-]+\/?$/;
  return linkedinRegex.test(url);
};

const AdvisoryBoardPanel = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewMember, setViewMember] = useState(null);
  const [colorText, setColorText] = useState(emptyForm.color);

  const colorTextValid = isValidHex(colorText);
  const socketRef = useRef(null);

  // Auth headers
  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const authHeaderMultipart = token
    ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    : { headers: { 'Content-Type': 'multipart/form-data' } };

  const toast = useCallback((message, type = 'success') => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: 'success', message: '' }), 4000);
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_URL);
      if (data?.success) {
        const cleaned = (data.data || []).map(m => ({
          ...m,
          expertise: normalizeExpertise(m.expertise),
        }));
        setMembers(cleaned);
      }
    } catch (e) {
      console.error(e);
      toast('Failed to fetch advisory members', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Socket.IO setup
  useEffect(() => {
    fetchMembers();

    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-advisory-room', 'advisoryBoard-admin');
    });

    socket.on('advisory-members-updated', (payload) => {
      if (payload?.success && Array.isArray(payload.data)) {
        const cleaned = payload.data.map(m => ({
          ...m,
          expertise: normalizeExpertise(m.expertise),
        }));
        setMembers(cleaned);

        const actionMessages = {
          'created': '✅ New member added successfully!',
          'updated': '✅ Member updated successfully!',
          'deleted': '✅ Member deleted successfully!'
        };
        const message = actionMessages[payload.action] || 'Advisory board updated';
        toast(message);
      }
    });

    socket.on('advisory-error', (error) => {
      toast('Real-time update error', 'error');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchMembers, toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.title || '').toLowerCase().includes(q) ||
      (m.company || '').toLowerCase().includes(q) ||
      (m.bio || '').toLowerCase().includes(q) ||
      (m.icon || '').toLowerCase().includes(q) ||
      (m.yearsExperience || '').toLowerCase().includes(q) ||
      (m.expertise || []).some(x => (x || '').toLowerCase().includes(q))
    );
  }, [members, search]);

  // Dialog handlers
  const openAdd = () => {
    setEditMember(null);
    setForm(emptyForm);
    setColorText(emptyForm.color);
    setOpenDialog(true);
  };

  const openEdit = (m) => {
    const normalizedExp = normalizeExpertise(m.expertise);
    setEditMember(m);
    setForm({
      name: m.name || '',
      title: m.title || '',
      company: m.company || '',
      yearsExperience: m.yearsExperience || '',
      expertise: normalizedExp,
      expertiseInput: '',
      bio: m.bio || '',
      icon: m.icon || 'Dashboard',
      color: m.color || '#1AC99F',
      linkedinUrl: m.linkedinUrl || '',
      imageFile: null,
      imagePreview: m.imageUrl ? `${API_BASE}${m.imageUrl}` : null,
    });
    setColorText(m.color || '#1AC99F');
    setOpenDialog(true);
  };

  const openView = (m) => {
    setViewMember(m);
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

  // Expertise helpers
  const addExpertise = () => {
    const raw = form.expertiseInput.trim();
    if (!raw) return;

    const parts = raw
      .split(/\r?\n|,/)
      .map(s => cleanExpertiseItem(s))
      .filter(Boolean);

    setForm(prev => ({
      ...prev,
      expertise: [...new Set([...prev.expertise, ...parts])],
      expertiseInput: ''
    }));
  };

  const handleExpertiseKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExpertise();
    }
  };

  const removeExpertise = (idx) => {
    setForm(prev => ({ ...prev, expertise: prev.expertise.filter((_, i) => i !== idx) }));
  };

  // Color handlers
  const onColorPickerChange = (e) => {
    const v = e.target.value;
    setForm(prev => ({ ...prev, color: v }));
    setColorText(v);
  };

  const onColorTextChange = (e) => {
    const v = e.target.value;
    setColorText(v);
    if (isValidHex(v)) {
      setForm(prev => ({ ...prev, color: normalizeHex(v) }));
    }
  };

  const choosePreset = (hex) => {
    setForm(prev => ({ ...prev, color: hex }));
    setColorText(hex);
  };

  // Submit form
  const submit = async () => {
    if (submitting) return;
    
    if (!form.name || !form.title || !form.bio || !form.yearsExperience) {
      toast('Please complete the required fields', 'error');
      return;
    }

    if (!isValidHex(form.color)) {
      toast('Please enter a valid color (e.g., #1AC99F)', 'error');
      return;
    }

    if (form.linkedinUrl && !isValidLinkedInUrl(form.linkedinUrl)) {
      toast('Please enter a valid LinkedIn URL', 'error');
      return;
    }

    if (!editMember && !form.imageFile) {
      toast('Please upload an image', 'error');
      return;
    }

    setSubmitting(true);
    
    const expertiseClean = (form.expertise || []).map(cleanExpertiseItem).filter(Boolean);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('title', form.title);
    fd.append('company', form.company);
    fd.append('bio', form.bio);
    fd.append('icon', form.icon);
    fd.append('color', normalizeHex(form.color));
    fd.append('yearsExperience', form.yearsExperience);
    fd.append('linkedinUrl', form.linkedinUrl);
    fd.append('expertise', expertiseClean.join(','));
    if (form.imageFile) fd.append('image', form.imageFile);

    try {
      if (editMember) {
        await axios.put(`${API_URL}/${editMember._id}`, fd, authHeaderMultipart);
        toast('Member updated');
      } else {
        await axios.post(API_URL, fd, authHeaderMultipart);
        toast('Member added');
      }

      setOpenDialog(false);
      setEditMember(null);
      setForm(emptyForm);
      setColorText(emptyForm.color);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: log in with admin/superadmin.'
        : (e?.response?.data?.message || 'Save failed');
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`, authHeader);
      toast('Member deleted');
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: log in with admin/superadmin.'
        : (e?.response?.data?.message || 'Delete failed');
      toast(msg, 'error');
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #F3E9DC 0%, #E8F8F4 100%)',
      overflow: 'hidden'
    }}>
      {/* Alert */}
      {alert.open && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{
            mx: 3,
            mt: 2,
            mb: 1,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Fixed Header Section */}
      <Box sx={{ 
        flexShrink: 0,
        px: 3, 
        py: 2,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(26,201,159,0.1)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <GroupIcon sx={{ color: '#1AC99F', fontSize: 36 }} />
            Advisory Board
          </Typography>
          
          <Button
            startIcon={<AddIcon />}
            onClick={openAdd}
            disabled={submitting}
            sx={{
              background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
              },
              borderRadius: 4,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(26,201,159,0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            New Member
          </Button>
        </Stack>

        {/* Enhanced Search */}
        <TextField
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            minWidth: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              background: 'rgba(255,255,255,0.9)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              },
              '&.Mui-focused': {
                boxShadow: '0 4px 20px rgba(26,201,159,0.2)'
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#1AC99F' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* ✅ FIXED: Scrollable Content Area with Better Card Layout */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        px: 3,
        py: 2,
        '&::-webkit-scrollbar': {
          width: 8,
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
        },
      }}>
        {/* ✅ ENHANCED: Better Grid Layout for Cards - 2 per row */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress sx={{ color: '#1AC99F' }} size={60} />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
            {filtered.map((m) => {
              const Icon = iconComponentFromName(m.icon);
              const accent = m.color || '#1AC99F';
              const expertise = normalizeExpertise(m.expertise);

              return (
                <Grid item xs={12} sm={6} key={m._id}>
                  {/* ✅ FIXED: Even-sized Cards with Centered Content */}
                  <Card sx={{ 
                    height: 420, // Fixed height for consistency
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${hexToRgba(accent, 0.1)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${hexToRgba(accent, 0.2)}`,
                      border: `2px solid ${hexToRgba(accent, 0.3)}`
                    }
                  }}>
                    <CardActionArea onClick={() => openView(m)} sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}>
                      {/* ✅ FIXED: Image Zone - Fixed Height and Better Styling */}
                      <Box sx={{ 
                        height: 160, 
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.7)})`
                      }}>
                        {m.imageUrl ? (
                          <Avatar
                            src={`${API_BASE}${m.imageUrl}`}
                            alt={m.name}
                            sx={{
                              width: 100,
                              height: 100,
                              border: '4px solid rgba(255,255,255,0.9)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                            }}
                          />
                        ) : (
                          <Avatar
                            sx={{
                              width: 100,
                              height: 100,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              color: accent,
                              fontSize: '2.5rem',
                              fontWeight: 700,
                              border: '4px solid rgba(255,255,255,0.5)'
                            }}
                          >
                            {m.name?.charAt(0) || 'A'}
                          </Avatar>
                        )}

                        {/* LinkedIn Indicator */}
                        {m.linkedinUrl && (
                          <Chip
                            icon={<LinkedInIcon />}
                            label="LinkedIn"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              bgcolor: '#0077b5',
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 24
                            }}
                          />
                        )}

                        {/* Icon Badge */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -15,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: accent,
                            borderRadius: '50%',
                            p: 1,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            border: '3px solid white'
                          }}
                        >
                          <Icon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                      </Box>

                      {/* ✅ FIXED: Content Zone - Centered and Properly Sized */}
                      <CardContent sx={{ 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        px: 2,
                        py: 2,
                        pt: 3
                      }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700,
                          color: accent,
                          mb: 0.5,
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {m.name}
                        </Typography>

                        <Typography variant="subtitle2" sx={{ 
                          color: 'text.secondary',
                          mb: 1,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {m.title}{m.company ? ` • ${m.company}` : ''}
                        </Typography>

                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary',
                          mb: 2,
                          fontSize: '0.75rem'
                        }}>
                          {m.yearsExperience} Experience
                        </Typography>

                        {/* ✅ FIXED: Expertise Tags - Compact and Limited */}
                        <Stack direction="row" spacing={0.5} sx={{ 
                          flexWrap: 'wrap', 
                          gap: 0.5,
                          justifyContent: 'center',
                          mb: 1,
                          maxHeight: 60,
                          overflow: 'hidden'
                        }}>
                          {expertise.slice(0, 3).map((x, i) => (
                            <Chip
                              key={i}
                              label={x}
                              size="small"
                              sx={{
                                bgcolor: hexToRgba(accent, 0.1),
                                color: accent,
                                fontSize: '0.6rem',
                                height: 20,
                                fontWeight: 500
                              }}
                            />
                          ))}
                          {expertise.length > 3 && (
                            <Chip
                              label={`+${expertise.length - 3}`}
                              size="small"
                              sx={{
                                bgcolor: hexToRgba(accent, 0.2),
                                color: accent,
                                fontSize: '0.6rem',
                                height: 20,
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Stack>
                      </CardContent>
                    </CardActionArea>

                    {/* ✅ FIXED: Actions Zone - Fixed Height and Centered */}
                    <CardActions sx={{ 
                      height: 56,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      px: 2,
                      borderTop: `1px solid ${hexToRgba(accent, 0.1)}`,
                      background: hexToRgba(accent, 0.05)
                    }}>
                      <IconButton
                        onClick={() => openView(m)}
                        size="small"
                        sx={{
                          color: accent,
                          '&:hover': {
                            bgcolor: hexToRgba(accent, 0.1),
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>

                      {m.linkedinUrl && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(m.linkedinUrl, '_blank');
                          }}
                          size="small"
                          sx={{
                            color: '#0077b5',
                            '&:hover': {
                              bgcolor: 'rgba(0,119,181,0.1)',
                              transform: 'translateY(-1px)'
                            }
                          }}
                        >
                          <LinkedInIcon fontSize="small" />
                        </IconButton>
                      )}

                      <IconButton
                        onClick={() => openEdit(m)}
                        size="small"
                        sx={{
                          color: '#2196F3',
                          '&:hover': {
                            bgcolor: 'rgba(33,150,243,0.1)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        onClick={() => remove(m._id)}
                        size="small"
                        sx={{
                          color: '#F44336',
                          '&:hover': {
                            bgcolor: 'rgba(244,67,54,0.1)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GroupIcon sx={{ fontSize: 80, color: '#1AC99F', mb: 3 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
              No members found
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
              {search 
                ? 'Try a different search or add a new member.'
                : 'Start by adding your first advisory board member.'}
            </Typography>
            {!search && (
              <Button
                startIcon={<AddIcon />}
                onClick={openAdd}
                sx={{
                  background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
                    boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
                  },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  textTransform: 'none'
                }}
              >
                Add First Member
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => !submitting && setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            maxHeight: '95vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.5rem'
        }}>
          {editMember ? 'Edit Advisory Member' : 'Add Advisory Member'}
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <TextField
              label="Name *"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              disabled={submitting}
            />

            <TextField
              label="Title *"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              disabled={submitting}
            />

            <TextField
              label="Company"
              value={form.company}
              onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
              fullWidth
              disabled={submitting}
            />

            <TextField
              label="Years of Experience *"
              value={form.yearsExperience}
              onChange={(e) => setForm(prev => ({ ...prev, yearsExperience: e.target.value }))}
              fullWidth
              disabled={submitting}
              placeholder="e.g., 15+ years"
            />

            {/* LinkedIn URL Field */}
            <TextField
              label="LinkedIn URL"
              value={form.linkedinUrl}
              onChange={(e) => setForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
              fullWidth
              disabled={submitting}
              placeholder="https://linkedin.com/in/username"
              error={form.linkedinUrl && !isValidLinkedInUrl(form.linkedinUrl)}
              helperText={
                form.linkedinUrl && !isValidLinkedInUrl(form.linkedinUrl)
                  ? 'Please enter a valid LinkedIn URL'
                  : "Optional: Add member's LinkedIn profile"
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkedInIcon sx={{ color: '#0077b5' }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Icon Selection */}
            <FormControl fullWidth>
              <InputLabel>Icon</InputLabel>
              <Select
                value={form.icon}
                onChange={(e) => setForm(prev => ({ ...prev, icon: e.target.value }))}
                label="Icon"
                disabled={submitting}
              >
                {ICON_OPTIONS.map(opt => {
                  const Ico = opt.Component;
                  return (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Ico />
                        {opt.label}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* Color Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Color Theme
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  label="Color Code"
                  value={colorText}
                  onChange={onColorTextChange}
                  size="small"
                  error={!colorTextValid}
                  helperText={!colorTextValid ? 'Invalid hex color' : ''}
                  sx={{ width: 150 }}
                />
                <input
                  type="color"
                  value={form.color}
                  onChange={onColorPickerChange}
                  style={{
                    width: 50,
                    height: 40,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
              </Stack>

              {/* Preset Colors */}
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {PRESET_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => choosePreset(c)}
                    sx={{
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%',
                      bgcolor: c, 
                      cursor: 'pointer',
                      border: c.toUpperCase() === (form.color || '').toUpperCase() 
                        ? '3px solid #000' 
                        : '2px solid #fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  />
                ))}
              </Stack>

              {/* Color Preview */}
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: hexToRgba(form.color, 0.1) }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {(() => {
                    const Ico = iconComponentFromName(form.icon);
                    return <Ico sx={{ color: form.color }} />;
                  })()}
                  <Typography sx={{ color: form.color, fontWeight: 600 }}>
                    Icon & badges will use this color.
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Expertise */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Expertise (press Enter to add)
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  placeholder="e.g., Carbon Markets, ESG, Policy"
                  value={form.expertiseInput}
                  onChange={(e) => setForm(prev => ({ ...prev, expertiseInput: e.target.value }))}
                  onKeyDown={handleExpertiseKeyDown}
                  fullWidth
                  size="small"
                  disabled={submitting}
                />
                <Button
                  onClick={addExpertise}
                  variant="contained"
                  size="small"
                  disabled={submitting}
                  sx={{ px: 3 }}
                >
                  Add
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {form.expertise.map((b, idx) => (
                  <Chip
                    key={idx}
                    label={b}
                    onDelete={() => !submitting && removeExpertise(idx)}
                    size="small"
                    sx={{ 
                      bgcolor: hexToRgba(form.color, 0.1),
                      color: form.color,
                      mb: 0.5 
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Bio */}
            <TextField
              label="Bio *"
              value={form.bio}
              onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
              disabled={submitting}
            />

            {/* Image Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Profile Image {!editMember && '*'}
              </Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ width: '100%', py: 2 }}
                disabled={submitting}
              >
                {form.imagePreview ? 'Change Image' : 'Upload Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={onPickImage}
                />
              </Button>

              {form.imagePreview ? (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Avatar
                    src={form.imagePreview}
                    sx={{ width: 100, height: 100, mx: 'auto', mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Preview
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No image selected
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={submitting}
            sx={{ borderRadius: 3, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : (editMember ? <EditIcon /> : <AddIcon />)}
            sx={{
              background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
                boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
              },
              borderRadius: 3,
              px: 4,
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            {editMember ? (submitting ? 'Updating...' : 'Update') : (submitting ? 'Saving...' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog 
        open={Boolean(viewMember)} 
        onClose={() => setViewMember(null)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(45deg, ${viewMember?.color || '#1AC99F'}, ${hexToRgba(viewMember?.color || '#1AC99F', 0.8)})`,
          color: 'white',
          fontWeight: 700,
          textAlign: 'center'
        }}>
          {viewMember?.name}
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          {viewMember?.imageUrl && (
            <Avatar
              src={`${API_BASE}${viewMember.imageUrl}`}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {(() => {
              const Ico = iconComponentFromName(viewMember?.icon);
              return (
                <Box
                  sx={{
                    bgcolor: viewMember?.color || '#1AC99F',
                    borderRadius: '50%',
                    p: 1,
                    display: 'inline-flex'
                  }}
                >
                  <Ico sx={{ color: 'white', fontSize: 24 }} />
                </Box>
              );
            })()}
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {viewMember?.title}
            {viewMember?.company ? ` • ${viewMember.company}` : ''} • {viewMember?.yearsExperience}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
            {viewMember?.bio}
          </Typography>

          {/* LinkedIn Link */}
          {viewMember?.linkedinUrl && (
            <Button
              onClick={() => window.open(viewMember.linkedinUrl, '_blank')}
              startIcon={<LinkedInIcon />}
              sx={{
                color: '#0077b5',
                mb: 3,
                '&:hover': { backgroundColor: 'rgba(0, 119, 181, 0.04)' }
              }}
            >
              View LinkedIn Profile
            </Button>
          )}

          {/* Expertise */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Expertise
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {normalizeExpertise(viewMember?.expertise || []).map((b, i) => (
              <Chip
                key={i}
                label={b}
                sx={{
                  bgcolor: hexToRgba(viewMember?.color || '#1AC99F', 0.1),
                  color: viewMember?.color || '#1AC99F',
                  fontWeight: 500
                }}
              />
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button onClick={() => setViewMember(null)}>Close</Button>
          <Button 
            onClick={() => {
              const member = viewMember;
              setViewMember(null);
              openEdit(member);
            }}
            variant="contained"
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvisoryBoardPanel;
