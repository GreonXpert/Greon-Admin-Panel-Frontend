// src/components/Projects/ProjectPanel.jsx
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
  ColorLens as ColorLensIcon, Place as PlaceIcon, CalendarToday as CalendarIcon,
  Business as BusinessIcon, Architecture as ArchitectureIcon, Image as ImageIcon,
  ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Category as CategoryIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;

/* ----------------------------- Options ----------------------------- */

const CATEGORY_OPTIONS = [
  'Carbon Project',
  'ESG Project',
  'BRSR Project',
  'Reduction Project',
  'Other'
];

// Backend status values
const PROJECT_STATUS_OPTIONS = ['Completed', 'In Progress', 'Planned'];

/* ----------------------------- Helpers ----------------------------- */

// normalize any URL (supports `/uploads/...`, `uploads/...`, full http url)
const resolveImageUrl = (u) => {
  if (!u) return null;
  if (/^http?:\/\//i.test(u)) return u;
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${API_BASE}${path}`;
};

const isValidHex = (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);

const ColorSwatch = ({ value, selected, onClick, title }) => (
  <Box
    onClick={onClick}
    title={title || value}
    sx={{
      width: 28, height: 28, borderRadius: '6px',
      backgroundColor: value, cursor: 'pointer',
      border: selected ? '3px solid #000' : '1px solid #ddd',
      transition: 'all .2s', '&:hover': { transform: 'scale(1.08)' }
    }}
  />
);

const PREDEFINED_COLORS = [
  '#1AC99F','#4ECDC4','#2196F3','#9C27B0','#FF6B35','#45B7D1',
  '#E91E63','#FF5722','#607D8B','#009688','#4CAF50','#8BC34A',
  '#CDDC39','#FFEB3B','#FFC107','#FF9800','#F44336','#9E9E9E',
  '#3F51B5','#2DD4BF'
];

/* ----------------------------- Empty Form ----------------------------- */
/** NOTE: This form matches the backend model fields (project.js). */
const emptyForm = {
  // core
  title: '',
  category: CATEGORY_OPTIONS[0],
  status: 'Planned',           // Completed | In Progress | Planned

  // meta
  completedYear: '',
  area: '',
  client: '',
  architect: '',
  location: '',
  lng: '',
  lat: '',

  // text
  about: '',
  description: '',

  // style (mapped to backend "style" field)
  color: '#1976D2',           // style.color (primary)
  accent: '#1AC99F',          // style.accent
  bg: '#E3F2FD',              // style.bg
  gradientFrom: '#667eea',    // style.gradient.from
  gradientTo: '#764ba2',      // style.gradient.to

  // images
  coverFile: null,            // maps to mainImage (file)
  images: [],                 // new gallery files
  imagePreviews: [],
  existingGallery: [],        // [{url, serverUrl, caption}]
  removeImageUrls: [],        // urls to remove on update

  // admin/order
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
  transition: 'all .3s',
  border: '1px solid rgba(0,0,0,0.05)',
  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }
};
const CARD_FIXED_HEIGHT = { xs: 380, sm: 400, md: 420, lg: 440 };
const MEDIA_HEIGHT = 160;

/* ==================================================================== */

const ProjectPanel = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dialogs & form
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [form, setForm] = useState(emptyForm);

  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const authHeaderMultipart = token
    ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    : { headers: { 'Content-Type': 'multipart/form-data' } };

  const toast = (message, type = 'success') => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: 'success', message: '' }), 4000);
  };

  /* ----------------------------- Load + Socket ----------------------------- */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/projects?status=all&sort=order`, authHeader);
        if (res.data?.success) setProjects(res.data.data || []);
      } catch (e) {
        console.error(e);
        toast('Failed to fetch projects', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();

    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    socket.emit('join-projects-room', 'projects-admin');
    socket.on('projects-admin-updated', (payload) => {
      if (payload?.success && Array.isArray(payload.data)) {
        setProjects(payload.data);
        if (payload.action === 'created') toast('✅ New project added!');
        if (payload.action === 'updated') toast('✅ Project updated!');
        if (payload.action === 'deleted') toast('✅ Project deleted!');
        if (payload.action === 'reordered') toast('✅ Projects reordered!');
      }
    });

    return () => socket.disconnect();
  }, []); // eslint-disable-line

  /* ----------------------------- Filters ----------------------------- */

  const filtered = useMemo(() => {
    let list = projects;

    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (categoryFilter !== 'all') list = list.filter(p => p.category === categoryFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.client || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, search, statusFilter, categoryFilter]);

  /* ----------------------------- Dialog handlers ----------------------------- */

  const openAdd = () => {
    setEditProject(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const openEdit = (p) => {
    setEditProject(p);
    setForm({
      ...emptyForm,
      title: p.title || '',
      category: p.category || CATEGORY_OPTIONS[0],
      status: p.status || 'Planned',
      completedYear: p.completedYear ?? '',
      area: p.area || '',
      client: p.client || '',
      architect: p.architect || '',
      location: p.location || '',
      lng: Array.isArray(p.coordinates) ? String(p.coordinates[0] ?? '') : '',
      lat: Array.isArray(p.coordinates) ? String(p.coordinates[1] ?? '') : '',
      about: p.about || '',
      description: p.description || '',
      color: p.style?.color || '#1976D2',
      accent: p.style?.accent || '#1AC99F',
      bg: p.style?.bg || '#E3F2FD',
      gradientFrom: p.style?.gradient?.from || '#667eea',
      gradientTo: p.style?.gradient?.to || '#764ba2',
      existingGallery: (p.images || []).map(img => ({
        url: resolveImageUrl(img.url),
        serverUrl: img.url,
        caption: img.caption || ''
      })),
      order: p.order || 0,
      featured: !!p.featured
    });
    setOpenDialog(true);
  };

  const openView = (p) => {
    setViewProject(p);
    setViewIndex(0);
    setViewDialog(true);
  };

  /* ----------------------------- Images ----------------------------- */

  const onPickCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(prev => ({ ...prev, coverFile: file }));
    e.target.value = '';
  };

  const onAddGalleryImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const total = form.existingGallery.length + form.images.length;
    if (total >= 12) {
      toast('Maximum 12 images allowed', 'warning');
      return;
    }
    const preview = URL.createObjectURL(file);
    setForm(prev => ({
      ...prev,
      images: [...prev.images, file],
      imagePreviews: [...prev.imagePreviews, preview]
    }));
    e.target.value = '';
  };

  const removeExistingImage = (index) => {
    if (!window.confirm('Remove this image from gallery?')) return;
    const img = form.existingGallery[index];
    setForm(prev => ({
      ...prev,
      existingGallery: prev.existingGallery.filter((_, i) => i !== index),
      removeImageUrls: [...prev.removeImageUrls, img.serverUrl]
    }));
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(form.imagePreviews[index]);
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  /* ----------------------------- Submit ----------------------------- */

  const submit = async () => {
    if (submitting) return;

    if (!form.title || !form.category || !form.status || !form.description) {
      toast('Please fill required fields: title, category, status, description', 'error');
      return;
    }

    const okHex = (...vals) => vals.every(v => !v || isValidHex(v));
    if (!okHex(form.color, form.accent, form.bg, form.gradientFrom, form.gradientTo)) {
      toast('One or more theme colors are invalid hex codes', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      // core
      fd.append('title', form.title.trim());
      fd.append('category', form.category);
      fd.append('status', form.status);

      // meta
      if (form.completedYear !== '') fd.append('completedYear', String(form.completedYear));
      fd.append('area', String(form.area || ''));
      fd.append('client', form.client.trim());
      fd.append('architect', form.architect.trim());
      fd.append('location', form.location.trim());

      // coordinates [lng, lat]
      const lng = form.lng === '' ? null : Number(form.lng);
      const lat = form.lat === '' ? null : Number(form.lat);
      if (lng !== null && lat !== null && !Number.isNaN(lng) && !Number.isNaN(lat)) {
        fd.append('coordinates', JSON.stringify([lng, lat]));
      }

      // text
      fd.append('about', form.about);
      fd.append('description', form.description);

      // style -> backend "style"
      fd.append('style', JSON.stringify({
        color: form.color,
        accent: form.accent,
        bg: form.bg,
        gradient: { from: form.gradientFrom, to: form.gradientTo, angle: 135 }
      }));

      // admin/order
      fd.append('order', String(form.order || 0));
      fd.append('featured', String(!!form.featured));

      // media
      if (form.coverFile) fd.append('mainImage', form.coverFile);
      form.images.forEach((file) => fd.append('images', file));

      if (editProject) {
        if (form.removeImageUrls.length) fd.append('removeImageUrls', JSON.stringify(form.removeImageUrls));
        await axios.put(`${API_URL}/projects/${editProject._id}`, fd, authHeaderMultipart);
        toast('Project updated!');
      } else {
        await axios.post(`${API_URL}/projects`, fd, authHeaderMultipart);
        toast('Project added!');
      }

      setOpenDialog(false);
      setEditProject(null);
      setForm(emptyForm);
      // Socket pushes the refreshed list
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: please log in as admin/superadmin.'
        : (e?.response?.data?.message || e.message || 'Save failed');
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project? This will also delete all associated images.')) return;
    try {
      await axios.delete(`${API_URL}/projects/${id}`, authHeader);
      // socket will refresh
    } catch (e) {
      console.error(e);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: please log in as admin/superadmin.'
        : (e?.response?.data?.message || 'Delete failed');
      toast(msg, 'error');
    }
  };

  /* ----------------------------- View dialog helpers ----------------------------- */

  const gallery = (viewProject?.images || []).map(img => ({
    url: resolveImageUrl(img.url),
    caption: img.caption || ''
  }));

  // Build a flat array for the viewer (cover first, then gallery, dedup)
  const coverSrc = resolveImageUrl(viewProject?.mainImage);
  const imagesForViewer = [
    ...(coverSrc ? [coverSrc] : []),
    ...gallery.map(g => g.url)
  ].filter((v, i, self) => v && self.indexOf(v) === i);

  const totalImages = imagesForViewer.length;
  const goPrev = () => totalImages && setViewIndex(i => (i - 1 + totalImages) % totalImages);
  const goNext = () => totalImages && setViewIndex(i => (i + 1) % totalImages);

  /* ==================================================================== */

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

      {/* Header & Filters */}
      <Accordion defaultExpanded disableGutters sx={{ mb: 2, borderRadius: 3, overflow: 'hidden' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Projects Management
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={openAdd}
              disabled={submitting}
              sx={{
                borderRadius: 4, px: 3, py: 1.25, fontWeight: 700, textTransform: 'none',
                background: 'linear-gradient(45deg, #1AC99F, #2196F3)', color: '#fff',
                '&:hover': { background: 'linear-gradient(45deg, #0E9A78, #1AC99F)' }
              }}
            >
              Add Project
            </Button>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 260, md: 320 } }}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                <MenuItem value="all">All</MenuItem>
                {PROJECT_STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label="Category">
                <MenuItem value="all">All Categories</MenuItem>
                {CATEGORY_OPTIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', pr: { xs: 0.5, md: 1 }, mb: 5 }}>
        <Grid container spacing={2}>
          {loading ? (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Grid>
          ) : (
            filtered.map((p) => {
              const cover = resolveImageUrl(p.mainImage) || resolveImageUrl(p.images?.[0]?.url);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p._id}>
                  <Card
                    sx={{
                      ...CARD_SX,
                      height: { xs: CARD_FIXED_HEIGHT.xs, sm: CARD_FIXED_HEIGHT.sm, md: CARD_FIXED_HEIGHT.md, lg: CARD_FIXED_HEIGHT.lg },
                      border: p.featured ? '2px solid #1AC99F' : CARD_SX.border
                    }}
                  >
                    {p.featured && (
                      <Chip
                        label="Featured"
                        size="small"
                        sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2, backgroundColor: '#1AC99F', color: 'white', fontWeight: 600 }}
                      />
                    )}

                    <CardActionArea
                      onClick={() => openView(p)}
                      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', flexGrow: 1 }}
                    >
                      {cover ? (
                        <CardMedia
                          component="img"
                          height={MEDIA_HEIGHT}
                          image={cover}
                          alt={p.title}
                          sx={{ objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = ''; }}
                        />
                      ) : (
                        <Box sx={{ height: MEDIA_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                          <ImageIcon sx={{ opacity: 0.35, fontSize: 46 }} />
                        </Box>
                      )}

                      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 20 }}>
                          <CategoryIcon sx={{ fontSize: 18, color: p.style?.accent || '#1AC99F' }} />
                          <Typography variant="caption" sx={{ color: p.style?.accent || '#0f766e', fontWeight: 700 }}>
                            {p.category}
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 800, fontSize: '1rem', lineHeight: 1.2,
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}
                          title={p.title}
                        >
                          {p.title}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: '#6b7280', fontSize: '0.86rem',
                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}
                          title={p.description}
                        >
                          {p.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                          <Chip
                            icon={<VerifiedIcon />}
                            label={p.status || '—'}
                            size="small"
                            sx={{ backgroundColor: '#eef2ff', color: '#3730a3', fontWeight: 700 }}
                          />
                          {p.location && (
                            <Chip icon={<PlaceIcon />} label={p.location} size="small" sx={{ backgroundColor: '#f0fdf4', color: '#166534' }} />
                          )}
                          {p.completedYear && (
                            <Chip icon={<CalendarIcon />} label={p.completedYear} size="small" sx={{ backgroundColor: '#fff7ed', color: '#9a3412' }} />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#9ca3af' }}>Order: {p.order ?? 0}</Typography>
                          <Typography variant="caption" sx={{ color: '#9ca3af' }}>{p.client || ''}</Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>

                    <Box sx={{ p: 1.5, pt: 0, display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(p)} disabled={submitting} sx={{ flex: 1, textTransform: 'none' }}>
                        Edit
                      </Button>
                      <IconButton color="error" onClick={() => deleteProject(p._id)} disabled={submitting}
                        sx={{ '&:hover': { backgroundColor: 'rgba(244,67,54,0.08)' } }}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>

        {!loading && filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <BusinessIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No projects found</Typography>
            <Typography variant="body2">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first project'}
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
        PaperProps={{ sx: { borderRadius: 4, maxHeight: '95vh' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
          {editProject ? 'Edit Project' : 'Add Project'}
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: 'calc(95vh - 120px)' }}>
          <Box sx={{ pt: 1 }}>
            {/* Basic */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ fontWeight: 700 }}>📝 Basic</Typography></AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Title *" value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} disabled={submitting} />
                  </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select value={form.category} label="Category"
                          onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} disabled={submitting}>
                          {CATEGORY_OPTIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select value={form.status} label="Status"
                        onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))} disabled={submitting}>
                        {PROJECT_STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Completed Year" value={form.completedYear}
                      onChange={(e) => setForm(prev => ({ ...prev, completedYear: e.target.value }))} disabled={submitting} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Area" value={form.area}
                      onChange={(e) => setForm(prev => ({ ...prev, area: e.target.value }))} disabled={submitting} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Client" value={form.client}
                      onChange={(e) => setForm(prev => ({ ...prev, client: e.target.value }))} disabled={submitting} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Architect" value={form.architect}
                      onChange={(e) => setForm(prev => ({ ...prev, architect: e.target.value }))} disabled={submitting} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Location" value={form.location}
                      onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))} disabled={submitting}
                      InputProps={{ startAdornment: (<InputAdornment position="start"><PlaceIcon /></InputAdornment>) }} />
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <TextField fullWidth label="Longitude" value={form.lng}
                      onChange={(e) => setForm(prev => ({ ...prev, lng: e.target.value }))} disabled={submitting} />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField fullWidth label="Latitude" value={form.lat}
                      onChange={(e) => setForm(prev => ({ ...prev, lat: e.target.value }))} disabled={submitting} />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="Short Description *"
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} disabled={submitting} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={5} label="About"
                      value={form.about} onChange={(e) => setForm(prev => ({ ...prev, about: e.target.value }))} disabled={submitting} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Images */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ fontWeight: 700 }}>📸 Images</Typography></AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Cover Image (mainImage)</Typography>
                    <Button component="label" startIcon={<CloudUploadIcon />}
                      disabled={submitting}
                      sx={{ mb: 2, py: 1.25, px: 3, borderRadius: 3 }}>
                      {form.coverFile ? 'Change Cover' : 'Upload Cover'}
                      <input type="file" hidden accept="image/*" onChange={onPickCover} />
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Gallery Images (max 12)</Typography>
                    <Button component="label" startIcon={<CloudUploadIcon />}
                      disabled={form.existingGallery.length + form.images.length >= 12 || submitting}
                      sx={{ mb: 2, py: 1.25, px: 3, borderRadius: 3 }}>
                      {form.existingGallery.length + form.images.length >= 12 ? 'Maximum 12 images reached' : 'Add Image'}
                      <input type="file" hidden accept="image/*" onChange={onAddGalleryImage} />
                    </Button>
                  </Grid>
                </Grid>

                {/* Existing gallery */}
                {form.existingGallery.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Current Gallery</Typography>
                    <Grid container spacing={2}>
                      {form.existingGallery.map((img, idx) => (
                        <Grid item xs={6} sm={4} md={3} key={idx}>
                          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #eee' }}>
                            <img src={resolveImageUrl(img.serverUrl) || img.url} alt={`Current ${idx + 1}`} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                            <IconButton
                              onClick={() => removeExistingImage(idx)}
                              disabled={submitting}
                              sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(244,67,54,.9)', color: 'white', width: 26, height: 26 }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* New gallery previews */}
                {form.imagePreviews.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>New Images</Typography>
                    <Grid container spacing={2}>
                      {form.imagePreviews.map((preview, idx) => (
                        <Grid item xs={6} sm={4} md={3} key={idx}>
                          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #eee' }}>
                            <img src={preview} alt={`New ${idx + 1}`} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                            <Chip label="New" size="small"
                              sx={{ position: 'absolute', top: 6, left: 6, bgcolor: '#3b82f6', color: 'white', fontWeight: 700 }} />
                            <IconButton
                              onClick={() => removeNewImage(idx)}
                              disabled={submitting}
                              sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(244,67,54,.9)', color: 'white', width: 26, height: 26 }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Theme / Colors (maps to backend "style") */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ fontWeight: 700 }}>🎨 Theme & Colors</Typography></AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {[
                    { key: 'color', label: 'Primary (style.color)' },
                    { key: 'accent', label: 'Accent (style.accent)' },
                    { key: 'bg', label: 'Background (style.bg)' },
                    { key: 'gradientFrom', label: 'Gradient From (style.gradient.from)' },
                    { key: 'gradientTo', label: 'Gradient To (style.gradient.to)' },
                  ].map(({ key, label }) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <TextField
                        fullWidth
                        label={label}
                        value={form[key]}
                        onChange={(e) => {
                          let v = e.target.value;
                          if (v && !v.startsWith('#')) v = `#${v}`;
                          if (v === '' || isValidHex(v)) setForm(prev => ({ ...prev, [key]: v }));
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Box
                                sx={{
                                  width: 20, height: 20, borderRadius: '50%',
                                  background: isValidHex(form[key]) ? form[key] : '#ccc',
                                  border: '1px solid #ddd', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                {!isValidHex(form[key]) && <ColorLensIcon sx={{ fontSize: 12, color: '#999' }} />}
                              </Box>
                            </InputAdornment>
                          )
                        }}
                        helperText={form[key] && !isValidHex(form[key]) ? 'Enter a valid hex color (e.g., #1AC99F)' : ' '}
                        error={form[key] && !isValidHex(form[key])}
                      />
                      <Box sx={{ display: 'flex', gap: .5, flexWrap: 'wrap' }}>
                        {PREDEFINED_COLORS.map(c => (
                          <ColorSwatch key={c} value={c} selected={form[key] === c}
                            onClick={() => setForm(prev => ({ ...prev, [key]: c }))} />
                        ))}
                      </Box>
                    </Grid>
                  ))}

                  <Grid item xs={12}>
                    <Box sx={{
                      mt: 2, p: 2, borderRadius: 2, border: '1px solid #e5e7eb',
                      background: isValidHex(form.gradientFrom) && isValidHex(form.gradientTo)
                        ? `linear-gradient(90deg, ${form.gradientFrom}, ${form.gradientTo})`
                        : '#f3f4f6'
                    }}>
                      <Typography variant="caption" sx={{ color: '#111', fontWeight: 700 }}>
                        Gradient preview
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ fontWeight: 700 }}>⚙️ Settings</Typography></AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth type="number" label="Display Order"
                      value={form.order} onChange={(e) => setForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                      disabled={submitting}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={<Switch checked={form.featured} onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))} />}
                      label="Featured"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting} sx={{ px: 3 }}>Cancel</Button>
          <Button onClick={submit} variant="contained" disabled={submitting}
            sx={{ px: 4, background: 'linear-gradient(45deg, #1AC99F, #0E9A78)', '&:hover': { background: 'linear-gradient(45deg, #0E9A78, #1AC99F)' } }}>
            {submitting ? <CircularProgress size={20} /> : (editProject ? 'Update' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        {viewProject && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem' }}>{viewProject.title}</DialogTitle>
            <DialogContent dividers sx={{ maxHeight: '75vh' }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ position: 'relative', width: '100%', height: { xs: 220, sm: 260, md: 300 }, borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.100' }}>
                  {imagesForViewer.length > 0 ? (
                    <img
                      src={imagesForViewer[viewIndex]}
                      alt={`Image ${viewIndex + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon sx={{ opacity: 0.3, fontSize: 72 }} />
                    </Box>
                  )}

                  {imagesForViewer.length > 1 && (
                    <>
                      <IconButton onClick={goPrev}
                        sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.35)', color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}>
                        <ChevronLeftIcon />
                      </IconButton>
                      <IconButton onClick={goNext}
                        sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.35)', color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}>
                        <ChevronRightIcon />
                      </IconButton>
                    </>
                  )}
                </Box>

                {imagesForViewer.length > 1 && (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
                    {imagesForViewer.map((url, idx) => (
                      <Box key={idx} onClick={() => setViewIndex(idx)}
                        sx={{
                          flex: '0 0 auto', width: 72, height: 56, borderRadius: 1, overflow: 'hidden',
                          border: idx === viewIndex ? '2px solid #1AC99F' : '1px solid #e5e7eb',
                          cursor: 'pointer', opacity: idx === viewIndex ? 1 : 0.85
                        }}>
                        <img src={url} alt={`Image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: .5 }}>Category</Typography>
                  <Chip label={viewProject.category} size="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: .5 }}>Status</Typography>
                  <Chip label={viewProject.status} size="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: .5 }}>Client</Typography>
                  <Typography variant="body2">{viewProject.client || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: .5 }}>Architect</Typography>
                  <Typography variant="body2">{viewProject.architect || '—'}</Typography>
                </Box>
                <Box sx={{ gridColumn: { md: '1 / span 2' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: .5 }}>Description</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{viewProject.description}</Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
              <Button onClick={() => { setViewDialog(false); openEdit(viewProject); }} variant="contained">Edit</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectPanel;