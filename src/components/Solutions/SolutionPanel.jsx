// src/components/Solutions/SolutionPanel.jsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardActionArea, CardContent, CardMedia,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, InputAdornment,
  FormControl, InputLabel, Select, CircularProgress,
  Switch, FormControlLabel, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  CloudUpload as CloudUploadIcon, ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon, Code as CodeIcon, Hardware as HardwareIcon,
  Business as BusinessIcon, ColorLens as ColorLensIcon,
  ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;

// Solution types
const KIND_OPTIONS = [
  { value: 'Service', label: 'Service', icon: <BusinessIcon /> },
  { value: 'Software', label: 'Software', icon: <CodeIcon /> },
  { value: 'Hardware', label: 'Hardware', icon: <HardwareIcon /> }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

// Predefined color palette
const PREDEFINED_COLORS = [
  '#1AC99F', '#4ECDC4', '#FF6B35', '#45B7D1', '#9C27B0',
  '#E91E63', '#FF5722', '#795548', '#607D8B', '#009688',
  '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107',
  '#FF9800', '#F44336', '#9E9E9E', '#3F51B5', '#2196F3'
];

const emptyForm = {
  key: '',
  kind: 'Software',
  tag: '',
  title: ['', ''],
  kicker: '',
  short: '',
  description: '',
  features: [],
  featureInput: '',
  bgWord: '',
  primaryColor: '#1AC99F',
  secondaryColor: '#E8F8F4',
  images: [],
  imagePreviews: [],
  existingImagePreviews: [],
  removedImages: [],
  bg: '',
  product: '',
  specs: [],
  specInput: '',
  status: 'draft',
  order: 0,
  featured: false
};

const CARD_SX = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 4,
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  border: '1px solid rgba(0,0,0,0.05)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
  }
};

// Responsive fixed heights for perfectly even cards
const CARD_FIXED_HEIGHT = {
  xs: 360,
  sm: 380,
  md: 400,
  lg: 420
};
const MEDIA_HEIGHT = 140; // fixed image header height

const SolutionPanel = () => {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editSolution, setEditSolution] = useState(null);
  const [viewSolution, setViewSolution] = useState(null);
  const [viewIndex, setViewIndex] = useState(0); // ⭐ carousel index
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

  // Helper function to validate hex color
  const isValidHexColor = (hex) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  // Helper function to handle color change
  const handleColorChange = (field, value) => {
    if (value && !value.startsWith('#')) value = '#' + value;
    if (value === '' || isValidHexColor(value)) {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // Color picker component
  const ColorPicker = ({ label, field, value, onChange, disabled }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {label}
      </Typography>

      <TextField
        fullWidth
        label={`${label} (Hex Code)`}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        disabled={disabled}
        placeholder="#1AC99F"
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: isValidHexColor(value) ? value : '#ccc',
                  border: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!isValidHexColor(value) && <ColorLensIcon sx={{ fontSize: 12, color: '#999' }} />}
              </Box>
            </InputAdornment>
          ),
        }}
        helperText={
          value && !isValidHexColor(value)
            ? 'Please enter a valid hex color (e.g., #1AC99F)'
            : 'Enter hex code or use color picker/palette below'
        }
        error={value && !isValidHexColor(value)}
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          type="color"
          value={isValidHexColor(value) ? value : '#1AC99F'}
          onChange={(e) => onChange(field, e.target.value)}
          disabled={disabled}
          sx={{
            width: 80,
            '& input': { height: 40, cursor: 'pointer' }
          }}
          label="Picker"
        />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', pl: 2 }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Click to open color picker
          </Typography>
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#666' }}>
          Quick Colors:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {PREDEFINED_COLORS.map((color, index) => (
            <Box
              key={index}
              onClick={() => !disabled && onChange(field, color)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                backgroundColor: color,
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: value === color ? '3px solid #000' : '1px solid #ddd',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.5 : 1,
                '&:hover': {
                  transform: disabled ? 'none' : 'scale(1.1)',
                  boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.2)'
                }
              }}
              title={color}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );

  // Fetch data and setup Socket.IO
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/solutions?status=all`, authHeader);
        if (res.data?.success) setSolutions(res.data.data || []);
      } catch (e) {
        toast('Failed to fetch solutions', 'error');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();

    const socket = io(API_BASE);
    socket.emit('join-solutions-room', 'solutions-admin');

    socket.on('solutions-admin-updated', (payload) => {
      if (payload?.success && Array.isArray(payload.data)) {
        setSolutions(payload.data);
        if (payload.action === 'created') {
          toast('✅ New solution added successfully!');
        } else if (payload.action === 'updated') {
          toast('✅ Solution updated successfully!');
        } else if (payload.action === 'deleted') {
          toast('✅ Solution deleted successfully!');
        }
      }
    });

    return () => socket.disconnect();
  }, []); // eslint-disable-line

  // Filter solutions
  const filtered = useMemo(() => {
    let result = solutions;
    if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter);
    if (kindFilter !== 'all') result = result.filter(s => s.kind === kindFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(s =>
        (s.key || '').toLowerCase().includes(q) ||
        (s.tag || '').toLowerCase().includes(q) ||
        (s.short || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [solutions, search, statusFilter, kindFilter]);

  // Dialog handlers
  const openAdd = () => {
    setEditSolution(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const openEdit = (solution) => {
    setEditSolution(solution);
    setForm({
      ...emptyForm,
      key: solution.key || '',
      kind: solution.kind || 'Software',
      tag: solution.tag || '',
      title: Array.isArray(solution.title) ? solution.title : ['', ''],
      kicker: solution.kicker || '',
      short: solution.short || '',
      description: solution.description || '',
      features: Array.isArray(solution.features) ? solution.features : [],
      bgWord: solution.bgWord || '',
      primaryColor: solution.primaryColor || '#1AC99F',
      secondaryColor: solution.secondaryColor || '#E8F8F4',
      existingImagePreviews: solution.images?.map(img => ({
        url: `${API_BASE}${img.url}`,
        serverUrl: img.url,
        caption: img.caption || ''
      })) || [],
      bg: solution.bg || '',
      product: solution.product || '',
      specs: Array.isArray(solution.specs) ? solution.specs : [],
      status: solution.status || 'draft',
      order: solution.order || 0,
      featured: solution.featured || false
    });
    setOpenDialog(true);
  };

  const openView = (solution) => {
    setViewSolution(solution);
    setViewIndex(0); // ⭐ reset carousel to first image
    setViewDialog(true);
  };

  // Image handling
  const onAddSingleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const totalImages = form.existingImagePreviews.length + form.images.length;
    if (totalImages >= 10) {
      toast('Maximum 10 images allowed', 'warning');
      return;
    }

    const preview = URL.createObjectURL(file);
    setForm(prev => ({
      ...prev,
      images: [...prev.images, file],
      imagePreviews: [...prev.imagePreviews, preview]
    }));
    toast('Image added successfully!', 'success');
    e.target.value = '';
  };

  const removeExistingImage = (index) => {
    if (window.confirm('Are you sure you want to remove this image?')) {
      const imageToRemove = form.existingImagePreviews[index];
      setForm(prev => ({
        ...prev,
        existingImagePreviews: prev.existingImagePreviews.filter((_, i) => i !== index),
        removedImages: [...prev.removedImages, imageToRemove.serverUrl]
      }));
    }
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(form.imagePreviews[index]);
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
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

  // Submit form
  const submit = async () => {
    if (submitting) return;

    if (!form.key || !form.tag || !form.short || !form.description) {
      toast('Please fill all required fields (key, tag, short, description)', 'error');
      return;
    }

    if (form.primaryColor && !isValidHexColor(form.primaryColor)) {
      toast('Please enter a valid primary color hex code', 'error');
      return;
    }
    if (form.secondaryColor && !isValidHexColor(form.secondaryColor)) {
      toast('Please enter a valid secondary color hex code', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('key', form.key.trim());
      fd.append('kind', form.kind);
      fd.append('tag', form.tag.trim());
      fd.append('title', JSON.stringify(form.title));
      fd.append('kicker', form.kicker.trim());
      fd.append('short', form.short.trim());
      fd.append('description', form.description.trim());
      fd.append('features', JSON.stringify(form.features));
      fd.append('bgWord', form.bgWord.trim());
      fd.append('primaryColor', form.primaryColor);
      fd.append('secondaryColor', form.secondaryColor);
      fd.append('bg', form.bg.trim());
      fd.append('product', form.product.trim());
      fd.append('specs', JSON.stringify(form.specs));
      fd.append('status', form.status);
      fd.append('order', String(form.order));
      fd.append('featured', String(form.featured));

      if (editSolution) {
        if (form.removedImages.length > 0) {
          fd.append('removedImages', JSON.stringify(form.removedImages));
        }
        if (form.existingImagePreviews.length > 0) {
          const keepExisting = form.existingImagePreviews.map(img => ({
            url: img.serverUrl,
            caption: img.caption
          }));
          fd.append('keepExistingImages', JSON.stringify(keepExisting));
        }
      }

      form.images.forEach((image, index) => {
        fd.append('images', image);
        fd.append(`imageCaption${index}`, '');
      });

      if (editSolution) {
        await axios.put(`${API_URL}/solutions/${editSolution._id}`, fd, authHeaderMultipart);
        toast('Solution updated successfully!');
      } else {
        await axios.post(`${API_URL}/solutions`, fd, authHeaderMultipart);
        toast('Solution added successfully!');
      }

      setOpenDialog(false);
      setEditSolution(null);
      setForm(emptyForm);
    } catch (e) {
      console.error('Form submission error:', e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: please log in as admin/superadmin.'
        : (e?.response?.data?.message || e.message || 'Save failed');
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSolution = async (id) => {
    if (!window.confirm('Delete this solution? This will also delete all associated files.')) return;
    try {
      await axios.delete(`${API_URL}/solutions/${id}`, authHeader);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: please log in as admin/superadmin.'
        : (e?.response?.data?.message || 'Delete failed');
      toast(msg, 'error');
    }
  };

  // ⭐ Carousel helpers (View Dialog)
  const totalImages = viewSolution?.images?.length || 0;
  const normalizedImages = (viewSolution?.images || []).map(img => ({
    url: `${API_BASE}${img.url}`,
    caption: img.caption || ''
  }));

  const goPrev = () => {
    if (!totalImages) return;
    setViewIndex(i => (i - 1 + totalImages) % totalImages);
  };

  const goNext = () => {
    if (!totalImages) return;
    setViewIndex(i => (i + 1) % totalImages);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {alert.open && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{ mb: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Collapsible Header + Filters */}
      <Accordion
        defaultExpanded
        disableGutters
        sx={{
          mb: 2,
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1AC99F 0%, #2196F3 100%)',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1f2937' }}>
              Solutions Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
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
                  px: 3,
                  py: 1.25,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: '#ffffff',
                }}
              >
                Add Solution
              </Button>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search solutions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 260, md: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                {STATUS_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                {KIND_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Scrollable Grid region */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: { xs: 0.5, md: 1 },
          mb: 5
        }}
      >
        <Grid container spacing={2}>
          {loading ? (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Grid>
          ) : (
            filtered.map((solution) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={solution._id}>
                <Card
                  sx={{
                    ...CARD_SX,
                    height: {
                      xs: CARD_FIXED_HEIGHT.xs,
                      sm: CARD_FIXED_HEIGHT.sm,
                      md: CARD_FIXED_HEIGHT.md,
                      lg: CARD_FIXED_HEIGHT.lg
                    },
                    border: solution.featured ? '2px solid #1AC99F' : CARD_SX.border
                  }}
                >
                  {solution.featured && (
                    <Chip
                      label="Featured"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 2,
                        backgroundColor: '#1AC99F',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}

                  <CardActionArea
                    onClick={() => openView(solution)}
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', flexGrow: 1 }}
                  >
                    {solution.images?.length > 0 ? (
                      <CardMedia
                        component="img"
                        height={MEDIA_HEIGHT}
                        image={`${API_BASE}${solution.images[0].url}`}
                        alt={solution.tag}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: MEDIA_HEIGHT,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100'
                        }}
                      >
                        <BusinessIcon sx={{ opacity: 0.4, fontSize: 44 }} />
                      </Box>
                    )}

                    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 20 }}>
                        {KIND_OPTIONS.find(k => k.value === solution.kind)?.icon}
                        <Typography variant="caption" sx={{ color: solution.primaryColor, fontWeight: 600 }}>
                          {solution.kind}
                        </Typography>
                      </Box>

                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          lineHeight: 1.2,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '1.2em'
                        }}
                        title={solution.tag}
                      >
                        {solution.tag}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: '#6b7280',
                          fontSize: '0.86rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '3.6em'
                        }}
                        title={solution.short}
                      >
                        {solution.short}
                      </Typography>

                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={solution.status}
                          size="small"
                          sx={{
                            backgroundColor: solution.status === 'published' ? '#dcfce7' : solution.status === 'draft' ? '#f3f4f6' : '#fee2e2',
                            color: solution.status === 'published' ? '#166534' : solution.status === 'draft' ? '#374151' : '#991b1b',
                            fontWeight: 600
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                          Order: {solution.order}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>

                  <Box sx={{ p: 1.5, pt: 0, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => openEdit(solution)}
                      disabled={submitting}
                      sx={{ flex: 1, textTransform: 'none' }}
                    >
                      Edit
                    </Button>
                    <IconButton
                      color="error"
                      onClick={() => deleteSolution(solution._id)}
                      disabled={submitting}
                      sx={{ '&:hover': { backgroundColor: 'rgba(244,67,54,0.08)' } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {!loading && filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <BusinessIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No solutions found
            </Typography>
            <Typography variant="body2">
              {search || statusFilter !== 'all' || kindFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first solution'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '95vh'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
          {editSolution ? 'Edit Solution' : 'Add Solution'}
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: 'calc(95vh - 120px)' }}>
          <Box sx={{ pt: 1 }}>
            {/* Basic Information */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>📝 Basic Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Solution Key *"
                      value={form.key}
                      onChange={(e) => setForm(prev => ({ ...prev, key: e.target.value }))}
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={form.kind}
                        onChange={(e) => setForm(prev => ({ ...prev, kind: e.target.value }))}
                        label="Type"
                        disabled={submitting}
                      >
                        {KIND_OPTIONS.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {option.icon}
                              {option.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tag/Name *"
                      value={form.tag}
                      onChange={(e) => setForm(prev => ({ ...prev, tag: e.target.value }))}
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Title Line 1"
                      value={form.title[0] || ''}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        title: [e.target.value, prev.title[1] || '']
                      }))}
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Title Line 2"
                      value={form.title[1] || ''}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        title: [prev.title[0] || '', e.target.value]
                      }))}
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Kicker"
                      value={form.kicker}
                      onChange={(e) => setForm(prev => ({ ...prev, kicker: e.target.value }))}
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Short Description *"
                      multiline
                      rows={3}
                      value={form.short}
                      onChange={(e) => setForm(prev => ({ ...prev, short: e.target.value }))}
                      helperText="Brief description for cards"
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Detailed Description *"
                      multiline
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      helperText="Detailed description for dialog"
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Images */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>
                  📸 Images - {form.existingImagePreviews.length + form.images.length}/10
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Button
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={form.existingImagePreviews.length + form.images.length >= 10 || submitting}
                  sx={{ mb: 3, py: 1.5, px: 3, borderRadius: 3 }}
                >
                  {form.existingImagePreviews.length + form.images.length >= 10
                    ? 'Maximum 10 images reached'
                    : 'Add Image'}
                  <input type="file" hidden accept="image/*" onChange={onAddSingleImage} />
                </Button>

                {form.existingImagePreviews.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      📂 Current Images ({form.existingImagePreviews.length}):
                    </Typography>
                    <Grid container spacing={2}>
                      {form.existingImagePreviews.map((image, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                            <img
                              src={image.url}
                              alt={`Current ${index + 1}`}
                              style={{ width: '100%', height: 120, objectFit: 'cover' }}
                            />
                            <IconButton
                              onClick={() => removeExistingImage(index)}
                              disabled={submitting}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(244,67,54,0.9)',
                                color: 'white',
                                width: 24,
                                height: 24
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

                {form.imagePreviews.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      ✨ New Images ({form.imagePreviews.length}):
                    </Typography>
                    <Grid container spacing={2}>
                      {form.imagePreviews.map((preview, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                            <img
                              src={preview}
                              alt={`New ${index + 1}`}
                              style={{ width: '100%', height: 120, objectFit: 'cover' }}
                            />
                            <Chip
                              label="New"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                            <IconButton
                              onClick={() => removeNewImage(index)}
                              disabled={submitting}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(244,67,54,0.9)',
                                color: 'white',
                                width: 24,
                                height: 24
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
              </AccordionDetails>
            </Accordion>

            {/* Features */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>⭐ Features</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add features..."
                    value={form.featureInput}
                    onChange={(e) => setForm(prev => ({ ...prev, featureInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('features', 'featureInput');
                      }
                    }}
                    disabled={submitting}
                  />
                  <Button
                    onClick={() => addArrayItem('features', 'featureInput')}
                    variant="outlined"
                    size="small"
                    disabled={submitting}
                    sx={{ px: 3 }}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {form.features.map((item, idx) => (
                    <Chip
                      key={idx}
                      label={item}
                      onDelete={() => !submitting && removeArrayItem('features', idx)}
                      size="small"
                      sx={{ backgroundColor: '#f3f4f6' }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Enhanced Design & Colors Section */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>🎨 Design & Colors</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Background Word"
                      value={form.bgWord}
                      onChange={(e) => setForm(prev => ({ ...prev, bgWord: e.target.value }))}
                      disabled={submitting}
                      sx={{ mb: 3 }}
                      helperText="Word shown as background decoration"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ColorPicker
                      label="Primary Color"
                      field="primaryColor"
                      value={form.primaryColor}
                      onChange={handleColorChange}
                      disabled={submitting}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ColorPicker
                      label="Secondary Color"
                      field="secondaryColor"
                      value={form.secondaryColor}
                      onChange={handleColorChange}
                      disabled={submitting}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, p: 3, borderRadius: 2, border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Color Preview:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 40,
                        borderRadius: 1,
                        backgroundColor: isValidHexColor(form.primaryColor) ? form.primaryColor : '#ccc',
                        border: '1px solid #ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        P
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Primary: {form.primaryColor}
                    </Typography>
                    <Box
                      sx={{
                        width: 60,
                        height: 40,
                        borderRadius: 1,
                        backgroundColor: isValidHexColor(form.secondaryColor) ? form.secondaryColor : '#ccc',
                        border: '1px solid #ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#333', fontWeight: 600 }}>
                        S
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Secondary: {form.secondaryColor}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>⚙️ Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={form.status}
                        onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                        label="Status"
                        disabled={submitting}
                      >
                        {STATUS_OPTIONS.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Display Order"
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.featured}
                          onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                          disabled={submitting}
                        />
                      }
                      label="Featured Solution"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={submitting}
            sx={{ px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            variant="contained"
            disabled={submitting}
            sx={{
              px: 4,
              background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
              '&:hover': { background: 'linear-gradient(45deg, #0E9A78, #1AC99F)' }
            }}
          >
            {submitting ? <CircularProgress size={20} /> : (editSolution ? 'Update' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog with Carousel */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        {viewSolution && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
              {viewSolution.tag}
            </DialogTitle>
            <DialogContent dividers sx={{ maxHeight: '75vh' }}>
              {/* Carousel Row */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: 220, sm: 260, md: 300 },
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
                  }}
                >
                  {/* Main image */}
                  {totalImages > 0 ? (
                    <img
                      key={viewIndex}
                      src={normalizedImages[viewIndex].url}
                      alt={normalizedImages[viewIndex].caption || `Image ${viewIndex + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BusinessIcon sx={{ opacity: 0.3, fontSize: 72 }} />
                    </Box>
                  )}

                  {/* Left Arrow */}
                  {totalImages > 1 && (
                    <IconButton
                      onClick={goPrev}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: 8,
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0,0,0,0.35)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                      }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                  )}

                  {/* Right Arrow */}
                  {totalImages > 1 && (
                    <IconButton
                      onClick={goNext}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        right: 8,
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0,0,0,0.35)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  )}

                  {/* Dots */}
                  {totalImages > 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 1,
                        bgcolor: 'rgba(0,0,0,0.25)',
                        p: 0.5,
                        borderRadius: 999
                      }}
                    >
                      {normalizedImages.map((_, idx) => (
                        <Box
                          key={idx}
                          onClick={() => setViewIndex(idx)}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            bgcolor: idx === viewIndex ? 'white' : 'rgba(255,255,255,0.6)'
                          }}
                          title={`Image ${idx + 1}`}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Thumbnails */}
                {totalImages > 1 && (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
                    {normalizedImages.map((img, idx) => (
                      <Box
                        key={idx}
                        onClick={() => setViewIndex(idx)}
                        sx={{
                          flex: '0 0 auto',
                          width: 72,
                          height: 56,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: idx === viewIndex ? '2px solid #1AC99F' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          opacity: idx === viewIndex ? 1 : 0.85
                        }}
                        title={img.caption || `Image ${idx + 1}`}
                      >
                        <img
                          src={img.url}
                          alt={img.caption || `Image ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Text / details row (unchanged design) */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                    {viewSolution.description}
                  </Typography>

                  {viewSolution.features && viewSolution.features.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Key Features:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {viewSolution.features.map((feature, index) => (
                          <Chip
                            key={index}
                            label={feature}
                            size="small"
                            sx={{ backgroundColor: '#E6FFFA', color: '#0D9488' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={viewSolution.kind}
                      size="small"
                      sx={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                    />
                    <Chip
                      label={viewSolution.status}
                      size="small"
                      sx={{
                        backgroundColor: viewSolution.status === 'published' ? '#dcfce7' : '#fee2e2',
                        color: viewSolution.status === 'published' ? '#166534' : '#991b1b'
                      }}
                    />
                    {viewSolution.featured && (
                      <Chip
                        label="Featured"
                        size="small"
                        sx={{ backgroundColor: '#1AC99F', color: 'white' }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
              <Button onClick={() => { setViewDialog(false); openEdit(viewSolution); }} variant="contained">
                Edit
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SolutionPanel;
