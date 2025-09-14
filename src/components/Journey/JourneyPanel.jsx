// src/components/Journey/JourneyPanel.jsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardActionArea, CardContent, CardMedia,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Tooltip, Alert, Divider, InputAdornment,
  FormControl, InputLabel, Select, OutlinedInput, CircularProgress,
  Avatar, Paper, CardActions, Accordion, AccordionSummary, AccordionDetails,
  Fade, Slide, Zoom, Container
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  CloudUpload as CloudUploadIcon, Timeline as TimelineIcon, ExpandMore as ExpandMoreIcon,
  Image as ImageIcon, Visibility as VisibilityIcon, Reorder as ReorderIcon,
  CheckCircle as CheckCircleIcon, Star as StarIcon, Business as BusinessIcon,
  Close as CloseIcon, ArrowBackIos as ArrowBackIcon, ArrowForwardIos as ArrowForwardIcon,
  FiberManualRecord as DotIcon, PhotoCamera as PhotoCameraIcon, AddAPhoto as AddAPhotoIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import {
  Rocket, Handshake, VerifiedUser, DeveloperMode, Public, Lightbulb,
  CloudQueue, DeviceHub, Business, TrendingUp, Launch, Science,
  AutoAwesome, Assessment, Security, Nature, CardHeader
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;

// ✅ ENHANCED: Custom Image Carousel Component
const ImageCarousel = ({ images, height = 300 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index) => {
    setCurrentIndex(index);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height, borderRadius: 3, overflow: 'hidden' }}>
      {/* Main Image Display */}
      <Box
        component="img"
        src={images[currentIndex].url}
        alt={images[currentIndex].caption || `Image ${currentIndex + 1}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'all 0.3s ease'
        }}
      />

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <IconButton
            onClick={prevImage}
            sx={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton
            onClick={nextImage}
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </>
      )}

      {/* Indicators */}
      {images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1
          }}
        >
          {images.map((_, index) => (
            <IconButton
              key={index}
              onClick={() => goToImage(index)}
              sx={{
                p: 0,
                minWidth: 'auto',
                width: 12,
                height: 12,
                color: index === currentIndex ? '#1AC99F' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#1AC99F',
                  transform: 'scale(1.2)'
                }
              }}
            >
              <DotIcon sx={{ fontSize: 12 }} />
            </IconButton>
          ))}
        </Box>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.8rem'
          }}
        >
          {currentIndex + 1} / {images.length}
        </Box>
      )}
    </Box>
  );
};

// Icon options for journey milestones
const ICON_OPTIONS = [
  { value: 'Rocket', label: 'Rocket', Component: Rocket },
  { value: 'Handshake', label: 'Handshake', Component: Handshake },
  { value: 'VerifiedUser', label: 'Verified User', Component: VerifiedUser },
  { value: 'DeveloperMode', label: 'Developer Mode', Component: DeveloperMode },
  { value: 'Public', label: 'Public/Global', Component: Public },
  { value: 'Lightbulb', label: 'Lightbulb', Component: Lightbulb },
  { value: 'CloudQueue', label: 'Cloud', Component: CloudQueue },
  { value: 'DeviceHub', label: 'Device Hub', Component: DeviceHub },
  { value: 'Business', label: 'Business', Component: Business },
  { value: 'TrendingUp', label: 'Trending Up', Component: TrendingUp },
  { value: 'Launch', label: 'Launch', Component: Launch },
  { value: 'Science', label: 'Science', Component: Science },
  { value: 'AutoAwesome', label: 'Auto Awesome', Component: AutoAwesome },
  { value: 'Assessment', label: 'Assessment', Component: Assessment },
  { value: 'Security', label: 'Security', Component: Security },
  { value: 'Nature', label: 'Nature', Component: Nature },
];

const SIDE_OPTIONS = [
  { value: 'left', label: 'Right' },
  { value: 'right', label: 'Left' }
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

// Helper functions
const iconComponentFromName = (name) => {
  const found = ICON_OPTIONS.find(o => o.value === name);
  return (found && found.Component) || Rocket;
};

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
  year: '',
  title: '',
  subtitle: '',
  bio: '',
  summary: '',
  description: '',
  achievements: [],
  achievementInput: '',
  highlights: [],
  highlightInput: '',
  badges: [],
  badgeInput: '',
  partners: [],
  partnerInput: '',
  platforms: [],
  platformInput: '',
  products: [],
  productInput: '',
  sectors: [],
  sectorInput: '',
  logos: [],
  logoInput: '',
  images: [],
  imagePreviews: [],
  logoImages: [],
  logoPreviews: [],
  existingImagePreviews: [],
  existingLogoPreviews: [],
  removedImages: [],
  removedLogoImages: [],
  color: '#1AC99F',
  secondaryColor: '#E8F8F4',
  icon: 'Rocket',
  side: 'right',
  status: 'published',
  displayOrder: 0
};

const JourneyPanel = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [headerExpanded, setHeaderExpanded] = useState(true); // New state for accordion

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editMilestone, setEditMilestone] = useState(null);
  const [viewMilestone, setViewMilestone] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Auth headers
  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const authHeaderMultipart = token
    ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    : { headers: { 'Content-Type': 'multipart/form-data' } };

  const toast = (message, type = 'success') => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: 'success', message: '' }), 4000);
  };

  // Fetch data and setup Socket.IO
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/journey?status=all`, authHeader);
        if (res.data?.success) setMilestones(res.data.data || []);
      } catch (e) {
        toast('Failed to fetch journey milestones', 'error');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();

    const socket = io(API_BASE);
    socket.emit('join-journey-room', 'journey-admin');

    socket.on('journey-admin-updated', (payload) => {
      if (payload?.success && Array.isArray(payload.data)) {
        setMilestones(payload.data);
        if (payload.action === 'created') {
          toast('✅ New milestone added successfully!');
        } else if (payload.action === 'updated') {
          toast('✅ Milestone updated successfully!');
        } else if (payload.action === 'deleted') {
          toast('✅ Milestone deleted successfully!');
        } else if (payload.action === 'reordered') {
          toast('✅ Milestones reordered successfully!');
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  // Filter milestones
  const filtered = useMemo(() => {
    let result = milestones;
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(m =>
        (m.year || '').toLowerCase().includes(q) ||
        (m.title || '').toLowerCase().includes(q) ||
        (m.subtitle || '').toLowerCase().includes(q) ||
        (m.bio || '').toLowerCase().includes(q) ||
        (m.summary || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q) ||
        (m.achievements || []).some(a => (a || '').toLowerCase().includes(q)) ||
        (m.highlights || []).some(h => (h || '').toLowerCase().includes(q))
      );
    }

    return result;
  }, [milestones, search, statusFilter]);

  // Dialog handlers
  const openAdd = () => {
    setEditMilestone(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const openEdit = (milestone) => {
    setEditMilestone(milestone);
    setForm({
      year: milestone.year || '',
      title: milestone.title || '',
      subtitle: milestone.subtitle || '',
      bio: milestone.bio || '',
      summary: milestone.summary || '',
      description: milestone.description || '',
      achievements: Array.isArray(milestone.achievements) ? milestone.achievements : [],
      achievementInput: '',
      highlights: Array.isArray(milestone.highlights) ? milestone.highlights : [],
      highlightInput: '',
      badges: Array.isArray(milestone.badges) ? milestone.badges : [],
      badgeInput: '',
      partners: Array.isArray(milestone.partners) ? milestone.partners : [],
      partnerInput: '',
      platforms: Array.isArray(milestone.platforms) ? milestone.platforms : [],
      platformInput: '',
      products: Array.isArray(milestone.products) ? milestone.products : [],
      productInput: '',
      sectors: Array.isArray(milestone.sectors) ? milestone.sectors : [],
      sectorInput: '',
      logos: Array.isArray(milestone.logos) ? milestone.logos : [],
      logoInput: '',
      images: [],
      imagePreviews: [],
      logoImages: [],
      logoPreviews: [],
      existingImagePreviews: milestone.images?.map(img => ({
        url: `${API_BASE}${img.url}`,
        serverUrl: img.url,
        caption: img.caption || '',
        isPrimary: img.isPrimary || false
      })) || [],
      existingLogoPreviews: milestone.logoImages?.map(img => ({
        url: `${API_BASE}${img.url}`,
        serverUrl: img.url,
        caption: img.caption || '',
        altText: img.altText || ''
      })) || [],
      removedImages: [],
      removedLogoImages: [],
      color: milestone.color || '#1AC99F',
      secondaryColor: milestone.secondaryColor || '#E8F8F4',
      icon: milestone.icon || 'Rocket',
      side: milestone.side || 'right',
      status: milestone.status || 'published',
      displayOrder: milestone.displayOrder || 0
    });
    setOpenDialog(true);
  };

  const openView = (milestone) => {
    setViewMilestone(milestone);
    setViewDialog(true);
  };

  // ✅ NEW: Add single image function
  const onAddSingleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if we already have max images
    const totalImages = form.existingImagePreviews.length + form.images.length;
    if (totalImages >= 4) {
      toast('Maximum 4 images allowed', 'warning');
      return;
    }

    const preview = URL.createObjectURL(file);
    setForm(prev => ({
      ...prev,
      images: [...prev.images, file],
      imagePreviews: [...prev.imagePreviews, preview]
    }));

    toast('Image added successfully!', 'success');
    // Reset file input
    e.target.value = '';
  };

  // ✅ NEW: Add single logo image function
  const onAddSingleLogoImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if we already have max logo images
    const totalLogos = form.existingLogoPreviews.length + form.logoImages.length;
    if (totalLogos >= 10) {
      toast('Maximum 10 logo images allowed', 'warning');
      return;
    }

    const preview = URL.createObjectURL(file);
    setForm(prev => ({
      ...prev,
      logoImages: [...prev.logoImages, file],
      logoPreviews: [...prev.logoPreviews, preview]
    }));

    toast('Logo image added successfully!', 'success');
    // Reset file input
    e.target.value = '';
  };

  // ✅ ENHANCED: Better image removal functions with confirmation
  const removeExistingImage = (index) => {
    if (window.confirm('Are you sure you want to remove this image? This action cannot be undone.')) {
      const imageToRemove = form.existingImagePreviews[index];
      setForm(prev => ({
        ...prev,
        existingImagePreviews: prev.existingImagePreviews.filter((_, i) => i !== index),
        removedImages: [...prev.removedImages, imageToRemove.serverUrl]
      }));
      toast('Image marked for removal. Save to confirm changes.', 'info');
    }
  };

  const removeExistingLogo = (index) => {
    if (window.confirm('Are you sure you want to remove this logo? This action cannot be undone.')) {
      const logoToRemove = form.existingLogoPreviews[index];
      setForm(prev => ({
        ...prev,
        existingLogoPreviews: prev.existingLogoPreviews.filter((_, i) => i !== index),
        removedLogoImages: [...prev.removedLogoImages, logoToRemove.serverUrl]
      }));
      toast('Logo marked for removal. Save to confirm changes.', 'info');
    }
  };

  const removeNewImage = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(form.imagePreviews[index]);
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
    toast('New image removed from upload queue.', 'success');
  };

  const removeNewLogo = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(form.logoPreviews[index]);
    setForm(prev => ({
      ...prev,
      logoImages: prev.logoImages.filter((_, i) => i !== index),
      logoPreviews: prev.logoPreviews.filter((_, i) => i !== index)
    }));
    toast('New logo removed from upload queue.', 'success');
  };

  // Array field helpers
  const addArrayItem = (field, inputField) => {
    const value = form[inputField].trim();
    if (!value) return;
    const items = value.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], ...items],
      [inputField]: ''
    }));
  };

  const removeArrayItem = (field, index) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleKeyDown = (field, inputField) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addArrayItem(field, inputField);
    }
  };

  // Submit form
  const submit = async () => {
    if (!form.year || !form.title || !form.subtitle || !form.bio || !form.summary || !form.description) {
      toast('Please fill all required fields', 'error');
      return;
    }

    // Check if we have at least one image (either existing or new)
    const totalImages = form.existingImagePreviews.length + form.images.length;
    if (!editMilestone && totalImages === 0) {
      toast('Please upload at least one main image', 'error');
      return;
    }

    if (editMilestone && totalImages === 0) {
      toast('At least one main image is required', 'error');
      return;
    }

    const fd = new FormData();

    // Add text fields
    fd.append('year', form.year);
    fd.append('title', form.title);
    fd.append('subtitle', form.subtitle);
    fd.append('bio', form.bio);
    fd.append('summary', form.summary);
    fd.append('description', form.description);
    fd.append('color', form.color);
    fd.append('secondaryColor', form.secondaryColor);
    fd.append('icon', form.icon);
    fd.append('side', form.side);
    fd.append('status', form.status);
    fd.append('displayOrder', form.displayOrder);

    // Add array fields
    fd.append('achievements', JSON.stringify(form.achievements));
    fd.append('highlights', JSON.stringify(form.highlights));
    fd.append('badges', JSON.stringify(form.badges));
    fd.append('partners', JSON.stringify(form.partners));
    fd.append('platforms', JSON.stringify(form.platforms));
    fd.append('products', JSON.stringify(form.products));
    fd.append('sectors', JSON.stringify(form.sectors));
    fd.append('logos', JSON.stringify(form.logos));

    // ✅ UPDATED: Handle file deletion and updates for edit mode
    if (editMilestone) {
      // Track removed images for deletion
      if (form.removedImages.length > 0) {
        fd.append('removedImages', JSON.stringify(form.removedImages));
      }

      if (form.removedLogoImages.length > 0) {
        fd.append('removedLogoImages', JSON.stringify(form.removedLogoImages));
      }

      // Keep existing images that weren't removed
      if (form.existingImagePreviews.length > 0) {
        const keepExisting = form.existingImagePreviews.map((img, index) => ({
          url: img.serverUrl,
          caption: img.caption,
          isPrimary: index === 0 // First existing image becomes primary
        }));
        fd.append('keepExistingImages', JSON.stringify(keepExisting));
      }

      // Keep existing logo images that weren't removed
      const keepExistingLogos = form.existingLogoPreviews.map(img => ({
        url: img.serverUrl,
        caption: img.caption,
        altText: img.altText
      }));
      fd.append('keepExistingLogoImages', JSON.stringify(keepExistingLogos));
    }

    // Add new main images
    form.images.forEach((image, index) => {
      fd.append('images', image);
      fd.append(`imageCaption${index}`, '');
    });

    // Add new logo images
    form.logoImages.forEach((image, index) => {
      fd.append('logoImages', image);
      fd.append(`logoCaption${index}`, '');
      fd.append(`logoAltText${index}`, '');
    });

    try {
      if (editMilestone) {
        await axios.put(`${API_URL}/journey/${editMilestone._id}`, fd, authHeaderMultipart);
        toast('Journey milestone updated successfully!');
      } else {
        await axios.post(`${API_URL}/journey`, fd, authHeaderMultipart);
        toast('Journey milestone added successfully!');
      }

      setOpenDialog(false);
      setEditMilestone(null);
      setForm(emptyForm);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: please log in as admin/superadmin.'
        : (e?.response?.data?.message || 'Save failed');
      toast(msg, 'error');
    }
  };

  const deleteMilestone = async (id) => {
    if (!window.confirm('Delete this journey milestone? This will also delete all associated files.')) return;
    try {
      await axios.delete(`${API_URL}/journey/${id}`, authHeader);
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
      height: '100%', 
      overflow: 'hidden',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column'
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

      {/* Header Accordion */}
      <Box sx={{ mx: 3, mt: 2, flexShrink: 0 }}>
        <Accordion 
          expanded={headerExpanded} 
          onChange={() => setHeaderExpanded(!headerExpanded)}
          sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
            color: 'white',
            '&::before': {
              display: 'none'
            },
            boxShadow: '0 4px 20px rgba(26,201,159,0.3)'
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
                  <TimelineIcon sx={{ mr: 2, fontSize: '2rem' }} />
                  Journey Management
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage milestones, achievements, and company journey timeline
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openAdd}
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
                    boxShadow: '0 4px 20px rgba(26,201,159,0.3)',
                    transition: 'all 0.3s ease',
                    color: 'white'
                  }}
                >
                  Add Milestone
                </Button>
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ pt: 0 }}>
            {/* Enhanced Filters */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search milestones..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
                      <SearchIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  label="Status Filter"
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* ✅ FIXED: Scrollable Content Area with Better Card Layout */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          px: 3,
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
            background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            transition: 'all 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
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
        {/* ✅ ENHANCED: Better Grid Layout for Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                Loading journey milestones...
              </Typography>
              <CircularProgress sx={{ color: '#1AC99F' }} />
            </Box>
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {filtered.map((milestone, index) => {
              const IconComp = iconComponentFromName(milestone.icon);
              const primaryColor = milestone.color || '#1AC99F';
              const secondaryColor = milestone.secondaryColor || '#E8F8F4';

              return (
                <Grid item xs={12} sm={6} md={4} key={milestone._id}>
                  {/* ✅ FIXED: Even-sized Cards with Centered Content */}
                  <Card
                    sx={{
                      height: 420,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      border: `2px solid ${hexToRgba(primaryColor, 0.2)}`,
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.03)}, ${hexToRgba(secondaryColor, 0.8)})`,
                      '&:hover': {
                        transform: 'translateY(-12px) rotateX(5deg)',
                        boxShadow: `0 20px 60px ${hexToRgba(primaryColor, 0.25)}`,
                        '& .milestone-image': {
                          transform: 'scale(1.08)'
                        }
                      }
                    }}
                  >
                    <CardActionArea onClick={() => openView(milestone)} sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}>
                      {/* ✅ FIXED: Image Zone - Fixed Height */}
                      <Box
                        sx={{
                          height: 180,
                          position: 'relative',
                          overflow: 'hidden',
                          background: `linear-gradient(135deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.8)})`
                        }}
                      >
                        {milestone.imageUrl ? (
                          <CardMedia
                            component="img"
                            className="milestone-image"
                            image={`${API_BASE}${milestone.imageUrl}`}
                            alt={milestone.title}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.4s ease'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: `linear-gradient(135deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.8)})`,
                              color: 'white'
                            }}
                          >
                            <IconComp sx={{ fontSize: 64, opacity: 0.8 }} />
                          </Box>
                        )}

                        {/* Gradient overlay */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '50%',
                            background: `linear-gradient(transparent, ${hexToRgba(primaryColor, 0.6)})`
                          }}
                        />

                        {/* Year Badge */}
                        <Chip
                          label={milestone.year}
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            bgcolor: 'rgba(255,255,255,0.95)',
                            color: primaryColor,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                        />
                      </Box>

                      {/* ✅ FIXED: Content Zone - Centered and Properly Sized */}
                      <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
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
                            {milestone.title}
                          </Typography>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: primaryColor, 
                              fontWeight: 600, 
                              fontSize: '0.9rem', 
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {milestone.subtitle}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#546e7a', 
                              lineHeight: 1.4, 
                              fontSize: '0.85rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {milestone.bio}
                          </Typography>
                        </Box>

                        {/* ✅ FIXED: Stats Row - Compact and Centered */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {milestone.achievements?.length > 0 && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label={`${milestone.achievements.length}`}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: primaryColor,
                                color: primaryColor,
                                fontSize: '0.65rem',
                                height: 22,
                                '& .MuiChip-icon': { color: primaryColor, fontSize: 12 }
                              }}
                            />
                          )}
                          {milestone.highlights?.length > 0 && (
                            <Chip
                              icon={<StarIcon />}
                              label={`${milestone.highlights.length}`}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: primaryColor,
                                color: primaryColor,
                                fontSize: '0.65rem',
                                height: 22,
                                '& .MuiChip-icon': { color: primaryColor, fontSize: 12 }
                              }}
                            />
                          )}
                          {milestone.logoImages?.length > 0 && (
                            <Chip
                              icon={<BusinessIcon />}
                              label={`${milestone.logoImages.length}`}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: primaryColor,
                                color: primaryColor,
                                fontSize: '0.65rem',
                                height: 22,
                                '& .MuiChip-icon': { color: primaryColor, fontSize: 12 }
                              }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>

                    {/* ✅ FIXED: Actions Zone - Fixed Height and Centered */}
                    <CardActions sx={{ p: 2, justifyContent: 'center', borderTop: `1px solid ${hexToRgba(primaryColor, 0.1)}` }}>
                      <Button
                        onClick={() => openView(milestone)}
                        size="small"
                        sx={{
                          color: primaryColor,
                          '&:hover': {
                            bgcolor: hexToRgba(primaryColor, 0.1),
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <VisibilityIcon sx={{ mr: 0.5, fontSize: 16 }} />
                        View
                      </Button>
                      <Button
                        onClick={() => openEdit(milestone)}
                        size="small"
                        sx={{
                          color: '#2196F3',
                          '&:hover': {
                            bgcolor: 'rgba(33,150,243,0.1)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <EditIcon sx={{ mr: 0.5, fontSize: 16 }} />
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteMilestone(milestone._id)}
                        size="small"
                        sx={{
                          color: '#F44336',
                          '&:hover': {
                            bgcolor: 'rgba(244,67,54,0.1)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <DeleteIcon sx={{ mr: 0.5, fontSize: 16 }} />
                        Delete
                      </Button>
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
            background: 'linear-gradient(135deg, rgba(26, 201, 159, 0.05), rgba(14, 154, 120, 0.05))',
            borderRadius: 4,
            border: '2px dashed rgba(26, 201, 159, 0.2)',
            margin: 2
          }}>
            <Box sx={{ mb: 3 }}>
              <TimelineIcon sx={{ fontSize: 64, color: 'rgba(26, 201, 159, 0.4)' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              No journey milestones found
            </Typography>
            <Typography variant="body1" sx={{ color: '#546e7a', mb: 3 }}>
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first milestone'}
            </Typography>
            {(!search && statusFilter === 'all') && (
              <Button
                variant="contained"
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
                Add First Milestone
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* ✅ ENHANCED Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xl"
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
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #E6F7F1, #E3F2FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <TimelineIcon sx={{ mr: 1 }} />
          {editMilestone ? 'Edit Journey Milestone' : 'Add Journey Milestone'}
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, overflow: 'auto' }}>
          {/* ✅ FIXED: Basic Information — clean alignment & full-width large fields */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">📝 Basic Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Row 1 — better proportional widths */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Year *"
                    value={form.year}
                    onChange={e => setForm((p) => ({ ...p, year: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={form.status}
                      onChange={e => setForm((p) => ({ ...p, status: e.target.value }))}
                      label="Status"
                      sx={{ borderRadius: 3 }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Display Order"
                    type="number"
                    value={form.displayOrder}
                    onChange={e => setForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Title *"
                value={form.title}
                onChange={e => setForm((p) => ({ ...p, title: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Subtitle *"
                value={form.subtitle}
                onChange={e => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />

              {/* Row 2 — Bio full width */}
              <TextField
                label="Bio * (Card Description)"
                value={form.bio}
                onChange={e => setForm((p) => ({ ...p, bio: e.target.value }))}
                fullWidth
                multiline
                minRows={4}
                helperText="Brief description for the card view (will be displayed in the milestone card)"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />

              {/* Row 3 — Summary full width */}
              <TextField
                label="Summary *"
                value={form.summary}
                onChange={e => setForm((p) => ({ ...p, summary: e.target.value }))}
                fullWidth
                multiline
                minRows={3}
                helperText="One-line summary or key highlight"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />

              {/* Row 4 — Description full width */}
              <TextField
                label="Description *"
                value={form.description}
                onChange={e => setForm((p) => ({ ...p, description: e.target.value }))}
                fullWidth
                multiline
                minRows={6}
                helperText="Detailed description for the full view (supports long content)"
                InputLabelProps={{ shrink: true }}
              />
            </AccordionDetails>
          </Accordion>

          {/* ✅ ENHANCED: Visual Configuration */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">🎨 Visual Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Icon</InputLabel>
                    <Select
                      value={form.icon}
                      onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))}
                      label="Icon"
                      sx={{ borderRadius: 3 }}
                    >
                      {ICON_OPTIONS.map(option => {
                        const IconComponent = option.Component;
                        return (
                          <MenuItem key={option.value} value={option.value}>
                            <IconComponent sx={{ mr: 1 }} />
                            {option.label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Side</InputLabel>
                    <Select
                      value={form.side}
                      onChange={e => setForm(prev => ({ ...prev, side: e.target.value }))}
                      label="Side"
                      sx={{ borderRadius: 3 }}
                    >
                      {SIDE_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      label="Primary Color"
                      value={form.color}
                      onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                      size="small"
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                    <input
                      type="color"
                      value={form.color}
                      onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                      style={{ width: 40, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      label="Secondary Color"
                      value={form.secondaryColor}
                      onChange={e => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      size="small"
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={e => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      style={{ width: 40, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ✅ NEW: Main Images Section - Add One by One */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">📸 Main Images - {form.existingImagePreviews.length + form.images.length}/4</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* ✅ NEW: Add Image Button */}
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="single-image-upload"
                type="file"
                onChange={onAddSingleImage}
              />
              <label htmlFor="single-image-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<AddAPhotoIcon />}
                  disabled={form.existingImagePreviews.length + form.images.length >= 4}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
                      boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
                    },
                    '&.Mui-disabled': {
                      opacity: 0.6,
                      cursor: 'not-allowed'
                    }
                  }}
                >
                  {form.existingImagePreviews.length + form.images.length >= 4
                    ? 'Maximum 4 images reached'
                    : 'Add Image (One at a Time)'}
                </Button>
              </label>

              {/* Current Images (for edit mode) */}
              {form.existingImagePreviews.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    📂 Current Images ({form.existingImagePreviews.length}):
                  </Typography>
                  <Grid container spacing={2}>
                    {form.existingImagePreviews.map((image, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                          <Box
                            component="img"
                            src={image.url}
                            alt={`Current ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 120,
                              objectFit: 'cover',
                              borderRadius: 2
                            }}
                          />
                          {/* Primary badge */}
                          {index === 0 && (
                            <Chip
                              label="PRIMARY"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                bgcolor: '#4CAF50',
                                color: 'white',
                                fontSize: '0.6rem',
                                fontWeight: 600
                              }}
                            />
                          )}
                          {/* Delete button */}
                          <IconButton
                            onClick={() => removeExistingImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(244,67,54,0.9)',
                              color: 'white',
                              width: 32,
                              height: 32,
                              '&:hover': {
                                bgcolor: 'rgba(244,67,54,1)',
                                transform: 'scale(1.1)'
                              },
                              boxShadow: '0 2px 8px rgba(244,67,54,0.4)'
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* New Images */}
              {form.imagePreviews.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    ✨ New Images to Upload ({form.imagePreviews.length}):
                  </Typography>
                  <Grid container spacing={2}>
                    {form.imagePreviews.map((preview, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                          <Box
                            component="img"
                            src={preview}
                            alt={`New ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 120,
                              objectFit: 'cover',
                              borderRadius: 2
                            }}
                          />
                          {/* New badge */}
                          <Chip
                            label="NEW"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: '#FF9800',
                              color: 'white',
                              fontSize: '0.6rem',
                              fontWeight: 600
                            }}
                          />
                          {/* Delete button */}
                          <IconButton
                            onClick={() => removeNewImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(244,67,54,0.9)',
                              color: 'white',
                              width: 32,
                              height: 32,
                              '&:hover': {
                                bgcolor: 'rgba(244,67,54,1)',
                                transform: 'scale(1.1)'
                              },
                              boxShadow: '0 2px 8px rgba(244,67,54,0.4)'
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* No images state */}
              {form.existingImagePreviews.length === 0 && form.imagePreviews.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No images selected. Please upload at least one main image.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          {/* ✅ NEW: Logo Images Section - Add One by One */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">🏢 Logo Images - {form.existingLogoPreviews.length + form.logoImages.length}/10</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* ✅ NEW: Add Logo Button */}
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="single-logo-upload"
                type="file"
                onChange={onAddSingleLogoImage}
              />
              <label htmlFor="single-logo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AddAPhotoIcon />}
                  disabled={form.existingLogoPreviews.length + form.logoImages.length >= 10}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    '&.Mui-disabled': {
                      opacity: 0.6,
                      cursor: 'not-allowed'
                    }
                  }}
                >
                  {form.existingLogoPreviews.length + form.logoImages.length >= 10
                    ? 'Maximum 10 logos reached'
                    : 'Add Logo Image (One at a Time)'}
                </Button>
              </label>

              {/* Current Logo Images */}
              {form.existingLogoPreviews.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    📂 Current Logos ({form.existingLogoPreviews.length}):
                  </Typography>
                  <Grid container spacing={1}>
                    {form.existingLogoPreviews.map((logo, index) => (
                      <Grid item xs={6} sm={4} md={2} key={index}>
                        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                          <Box
                            component="img"
                            src={logo.url}
                            alt={`Logo ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 80,
                              objectFit: 'contain',
                              bgcolor: '#f5f5f5',
                              borderRadius: 2
                            }}
                          />
                          {/* Delete button */}
                          <IconButton
                            onClick={() => removeExistingLogo(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(244,67,54,0.9)',
                              color: 'white',
                              width: 24,
                              height: 24,
                              '&:hover': {
                                bgcolor: 'rgba(244,67,54,1)',
                                transform: 'scale(1.1)'
                              },
                              boxShadow: '0 2px 8px rgba(244,67,54,0.4)'
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* New Logo Images */}
              {form.logoPreviews.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    ✨ New Logo Images ({form.logoPreviews.length}):
                  </Typography>
                  <Grid container spacing={1}>
                    {form.logoPreviews.map((preview, index) => (
                      <Grid item xs={6} sm={4} md={2} key={index}>
                        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                          <Box
                            component="img"
                            src={preview}
                            alt={`New Logo ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 80,
                              objectFit: 'contain',
                              bgcolor: '#f5f5f5',
                              borderRadius: 2
                            }}
                          />
                          {/* New badge */}
                          <Chip
                            label="NEW"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              left: 4,
                              bgcolor: '#FF9800',
                              color: 'white',
                              fontSize: '0.5rem',
                              fontWeight: 600,
                              height: 16
                            }}
                          />
                          {/* Delete button */}
                          <IconButton
                            onClick={() => removeNewLogo(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(244,67,54,0.9)',
                              color: 'white',
                              width: 24,
                              height: 24,
                              '&:hover': {
                                bgcolor: 'rgba(244,67,54,1)',
                                transform: 'scale(1.1)'
                              },
                              boxShadow: '0 2px 8px rgba(244,67,54,0.4)'
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* No logos state */}
              {form.existingLogoPreviews.length === 0 && form.logoPreviews.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No logo images selected
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Array Fields - Enhanced */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">📝 Additional Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {[
                { field: 'achievements', inputField: 'achievementInput', label: 'Achievements', icon: CheckCircleIcon, color: '#4CAF50' },
                { field: 'highlights', inputField: 'highlightInput', label: 'Key Highlights', icon: StarIcon, color: '#FF9800' },
                { field: 'badges', inputField: 'badgeInput', label: 'Badges', icon: VerifiedUser, color: '#2196F3' },
                { field: 'partners', inputField: 'partnerInput', label: 'Partners', icon: Handshake, color: '#9C27B0' },
                { field: 'platforms', inputField: 'platformInput', label: 'Platforms', icon: DeveloperMode, color: '#607D8B' },
                { field: 'products', inputField: 'productInput', label: 'Products', icon: DeviceHub, color: '#795548' },
                { field: 'sectors', inputField: 'sectorInput', label: 'Sectors', icon: Business, color: '#FF5722' },
                { field: 'logos', inputField: 'logoInput', label: 'Logo Names/Text', icon: Public, color: '#009688' }
              ].map(({ field, inputField, label, icon: FieldIcon, color }) => (
                <Box key={field} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color }}>
                    <FieldIcon sx={{ mr: 1, fontSize: 20 }} />
                    {label}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      value={form[inputField]}
                      onChange={e => setForm(prev => ({ ...prev, [inputField]: e.target.value }))}
                      onKeyDown={handleKeyDown(field, inputField)}
                      fullWidth
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.9)'
                          }
                        }
                      }}
                    />
                    <Button
                      onClick={() => addArrayItem(field, inputField)}
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: color,
                        '&:hover': {
                          bgcolor: color,
                          filter: 'brightness(0.9)',
                          transform: 'translateY(-1px)'
                        },
                        borderRadius: 2,
                        px: 3,
                        boxShadow: `0 4px 12px ${hexToRgba(color, 0.3)}`
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {form[field].map((item, index) => (
                      <Chip 
                        key={index} 
                        label={item} 
                        onDelete={() => removeArrayItem(field, index)}
                        size="small"
                        sx={{
                          bgcolor: hexToRgba(color, 0.1),
                          color: color,
                          fontWeight: 500,
                          '& .MuiChip-deleteIcon': {
                            color: color,
                            '&:hover': {
                              color: color,
                              filter: 'brightness(0.8)'
                            }
                          },
                          boxShadow: `0 2px 8px ${hexToRgba(color, 0.2)}`
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            color="inherit"
            sx={{
              borderRadius: 3,
              px: 3,
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={submit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
                boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
              },
              borderRadius: 3,
              px: 4,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 20px rgba(26,201,159,0.3)'
            }}
          >
            {editMilestone ? 'Update' : 'Create'} Milestone
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ ENHANCED: View Dialog with Image Carousel */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            maxHeight: '90vh'
          }
        }}
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #E6F7F1, #E3F2FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          {viewMilestone && (() => {
            const IconComp = iconComponentFromName(viewMilestone.icon);
            return (
              <>
                <IconComp sx={{ mr: 1 }} />
                {viewMilestone.title} ({viewMilestone.year})
                <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                  {viewMilestone.subtitle}
                </Typography>
              </>
            );
          })()}
          <IconButton
            onClick={() => setViewDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, overflow: 'auto' }}>
          {viewMilestone && (
            <>
              {/* ✅ NEW: Image Carousel for Multiple Main Images */}
              {viewMilestone.images && viewMilestone.images.length > 0 && (
                <ImageCarousel 
                  images={viewMilestone.images.map(img => ({
                    url: `${API_BASE}${img.url}`,
                    caption: img.caption
                  }))}
                  height={300}
                />
              )}

              {/* Fallback for single image */}
              {(!viewMilestone.images || viewMilestone.images.length === 0) && viewMilestone.imageUrl && (
                <Box
                  component="img"
                  src={`${API_BASE}${viewMilestone.imageUrl}`}
                  alt={viewMilestone.title}
                  sx={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover',
                    borderRadius: 3,
                    mb: 3
                  }}
                />
              )}

              {/* Enhanced Basic Info */}
              <Typography variant="h6" sx={{ mb: 2, color: '#666' }}>
                {viewMilestone.subtitle}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {viewMilestone.description}
              </Typography>

              {/* Enhanced Details Grid */}
              <Grid container spacing={3}>
                {/* Achievements */}
                {viewMilestone.achievements?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      🏆 Achievements
                    </Typography>
                    <Stack spacing={1}>
                      {viewMilestone.achievements.map((achievement, index) => (
                        <Chip 
                          key={index} 
                          icon={<CheckCircleIcon />}
                          label={achievement}
                          sx={{
                            justifyContent: 'flex-start',
                            bgcolor: hexToRgba('#4CAF50', 0.1),
                            color: '#4CAF50',
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </Stack>
                  </Grid>
                )}

                {/* Highlights */}
                {viewMilestone.highlights?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      ⭐ Key Highlights
                    </Typography>
                    <Stack spacing={1}>
                      {viewMilestone.highlights.map((highlight, index) => (
                        <Chip 
                          key={index} 
                          icon={<StarIcon />}
                          label={highlight}
                          sx={{
                            justifyContent: 'flex-start',
                            bgcolor: hexToRgba('#FF9800', 0.1),
                            color: '#FF9800',
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>

              {/* ✅ ENHANCED: Logo Images Section with Better Design */}
              {viewMilestone.logoImages?.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    🤝 Partner Logos ({viewMilestone.logoImages.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {viewMilestone.logoImages.map((logo, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            borderRadius: 3,
                            border: '1px solid #e0e0e0',
                            '&:hover': {
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Box
                            component="img"
                            src={`${API_BASE}${logo.url}`}
                            alt={logo.altText || `Logo ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 60,
                              objectFit: 'contain',
                              borderRadius: 1
                            }}
                          />
                          {logo.caption && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#666' }}>
                              {logo.caption}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Enhanced Tags Section */}
              {[
                { field: 'badges', label: 'Badges', color: '#2196F3' },
                { field: 'partners', label: 'Partners', color: '#9C27B0' },
                { field: 'platforms', label: 'Platforms', color: '#607D8B' },
                { field: 'products', label: 'Products', color: '#795548' },
                { field: 'sectors', label: 'Sectors', color: '#FF5722' },
                { field: 'logos', label: 'Logo Names', color: '#009688' }
              ].map(({ field, label, color }) => (
                viewMilestone[field]?.length > 0 && (
                  <Box key={field} sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      {label}:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {viewMilestone[field].map((item, index) => (
                        <Chip 
                          key={index} 
                          label={item} 
                          size="small"
                          sx={{
                            bgcolor: hexToRgba(color, 0.1),
                            color: color,
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )
              ))}

              {/* Enhanced Metadata */}
              <Box sx={{ mt: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Side:</Typography>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{viewMilestone.side}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Status:</Typography>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{viewMilestone.status}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Order:</Typography>
                    <Typography variant="body2">{viewMilestone.displayOrder}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Created:</Typography>
                    <Typography variant="body2">{new Date(viewMilestone.createdAt).toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setViewDialog(false)}
            color="inherit"
            sx={{
              borderRadius: 3,
              px: 3,
              fontWeight: 500
            }}
          >
            Close
          </Button>
          <Button
      onClick={() => {
       setViewDialog(false);
       openEdit(viewMilestone);
      }}
      variant="contained"
      startIcon={<EditIcon />}
      sx={{
       background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
       '&:hover': {
        background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
        boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
       },
       borderRadius: 3,
       px: 4,
       fontWeight: 600,
       textTransform: 'none',
       boxShadow: '0 4px 20px rgba(26,201,159,0.3)'
      }}
     >
      Edit
     </Button>
    </DialogActions>
   </Dialog>
  </Box>
 );
};


export default JourneyPanel;