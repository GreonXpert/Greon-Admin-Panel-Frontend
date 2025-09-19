// src/pages/Testimonials/TestimonialPanel.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, IconButton, Avatar, Rating, Tabs, Tab,
  Tooltip, Alert, Snackbar, CircularProgress, Stack, InputAdornment, Container,
  MenuItem, ButtonGroup, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper,
  ToggleButton, ToggleButtonGroup, CardActions, useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  CheckCircle as ApproveIcon, ContentCopy as CopyIcon, Share as ShareIcon,
  Link as LinkIcon, Close as CloseIcon, Visibility as ViewIcon, Image as ImageIcon,
  OpenInNew as OpenIcon, Block as RejectIcon, PauseCircle as PendingIcon,
  ViewList as TableViewIcon, ViewModule as CardViewIcon
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

/** ==================== CONFIG ==================== */
const API_URL = `${API_BASE}/api/testimonials`;
const STAR_COLOR = '#F5B301';
const BRAND_A = '#1AC99F';
const BRAND_B = '#0E9A78';
const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_A} 0%, ${BRAND_B} 100%)`;
const TABLE_HEAD_GRADIENT =`linear-gradient(135deg, #1AC99F 0%, #0E9A78 50%, #306659ff 100%)`;


/** ==================== HELPERS ==================== */
const firstWords = (text = '', n = 3) => {
  const words = String(text).trim().split(/\s+/);
  return words.slice(0, n).join(' ') + (words.length > n ? '…' : '');
};
const toRGBA = (hex, a = 1) => {
  try {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch { return `rgba(26,201,159,${a})`; }
};

/** ==================== STYLES ==================== */
const HeaderPaper = styled('div')(() => ({
  padding: '16px 24px',
  borderRadius: 16,
  background: `linear-gradient(135deg, #E6F7F1, #EBF3FD)`,
  border: `1px solid ${toRGBA(BRAND_A, 0.2)}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
}));
const AccentButton = styled(Button)(() => ({
  background: BRAND_GRADIENT,
  color: '#fff',
  fontWeight: 700,
  borderRadius: 12,
  textTransform: 'none',
  padding: '10px 18px',
  boxShadow: '0 8px 24px rgba(26,201,159,0.35)',
  '&:hover': {
    background: `linear-gradient(135deg, ${BRAND_B} 0%, ${BRAND_A} 100%)`,
    transform: 'translateY(-2px)'
  }
}));
const SoftCard = styled(Card)(() => ({
  borderRadius: 16,
  border: `1px solid rgba(15,23,42,0.08)`,
  background: 'rgba(255,255,255,0.96)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
}));
const TestimonialCard = styled(Card)(() => ({
  borderRadius: 16,
  border: `1px solid rgba(15,23,42,0.08)`,
  background: 'rgba(255,255,255,0.98)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
    borderColor: toRGBA(BRAND_A, 0.3)
  }
}));

/** A row that NEVER wraps, and scrolls horizontally if tight */
const NoWrapRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'nowrap',
  overflowX: 'auto',
  overflowY: 'hidden',
  padding: '8px 0',
  scrollbarWidth: 'thin'
});

/** Make table behave like desktop on any size with horizontal scroll */
const DesktopTableContainer = styled(TableContainer)({
  borderRadius: 12,
  overflowX: 'auto',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
});

/** ==================== SUBMISSION PANEL ==================== */
const TestimonialSubmissionPanel = ({ switchToManage }) => {
  const [count, setCount] = useState(0);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const socketRef = useRef(null);

  const toast = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/count`);
      if (data?.success) setCount(data.data?.count ?? 0);
    } catch (e) {
      console.error(e);
      toast('Failed to fetch testimonial count', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const generateLink = useCallback(async () => {
    try {
      const { data } = await axios.post(`${API_URL}/submission-link`);
      if (data?.success && data.data?.link) {
        setLink(data.data.link);
        if (typeof data.data.count === 'number') setCount(data.data.count);
        toast('Submission URL generated');
        return;
      }
      const origin = window.location.origin;
      const fallback = `${origin}/testimonials/submit/${(count || 0) + 1}`;
      setLink(fallback);
      toast('Generated fallback submission URL');
    } catch (e) {
      console.error(e);
      const origin = window.location.origin;
      const fallback = `${origin}/testimonials/submit/${(count || 0) + 1}`;
      setLink(fallback);
      toast('Using fallback submission URL', 'warning');
    }
  }, [count, toast]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast('Copied to clipboard!'); }
    catch { toast('Copy failed', 'error'); }
  };
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Add your testimonial', text: 'Please add your testimonial here:', url: link });
      } else {
        await copy();
      }
    } catch { /* dismissed */ }
  };

  useEffect(() => {
    fetchCount();
    const socket = io(API_BASE, { transports: ['websocket', 'polling'], forceNew: true });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join-testimonials-admin', 'testimonials-admin'));
    socket.on('testimonial-created', fetchCount);
    socket.on('testimonial-deleted', fetchCount);
    socket.on('testimonials-updated', fetchCount);
    return () => socketRef.current?.disconnect();
  }, [fetchCount]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <HeaderPaper>
        <NoWrapRow>
          <Box sx={{ minWidth: 280 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1f2937', mb: .25 }}>
              Submission Link
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569' }}>
              Generate a public link that lets users add their testimonial (photo + details). No password required.
            </Typography>
          </Box>
          <AccentButton onClick={switchToManage} startIcon={<CloseIcon />}>Back to Manage</AccentButton>
        </NoWrapRow>
      </HeaderPaper>

      <Box sx={{ mt: 3 }}>
        <SoftCard>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 3, borderRadius: 3, background: 'rgba(26,201,159,0.06)', border: `1px dashed ${toRGBA(BRAND_A, 0.35)}` }}>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: .5 }}>
                    Current Testimonials
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', lineHeight: 1 }}>
                    {loading ? '—' : count}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: .5 }}>
                  Public Submission URL
                </Typography>
                <NoWrapRow>
                  <TextField
                    sx={{ minWidth: 380, flex: '0 0 460px' }}
                    placeholder="Click Generate to create a public URL"
                    value={link}
                    onChange={() => {}}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LinkIcon color="primary" /></InputAdornment>,
                      readOnly: true
                    }}
                  />
                  <AccentButton startIcon={<LinkIcon />} onClick={generateLink}>Generate</AccentButton>
                  <Button variant="outlined" startIcon={<OpenIcon />} onClick={() => link && window.open(link, '_blank', 'noopener')} sx={{ borderRadius: 2, fontWeight: 700 }}>Open</Button>
                  <Button variant="outlined" startIcon={<CopyIcon />} onClick={copy} sx={{ borderRadius: 2, fontWeight: 700 }}>Copy</Button>
                  <Button variant="outlined" startIcon={<ShareIcon />} onClick={share} sx={{ borderRadius: 2, fontWeight: 700 }}>Share</Button>
                </NoWrapRow>
              </Grid>
            </Grid>
          </CardContent>
        </SoftCard>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/** ==================== MANAGE PANEL ==================== */
const emptyForm = {
  name: '',
  company: '',
  position: '',
  content: '',
  rating: 5,
  featured: false,
  photo: null,
  photoPreview: null,
};

const StatusChip = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  const map = {
    approved: { bg: toRGBA('#16a34a', .14), color: '#16a34a', label: 'APPROVED' },
    pending:  { bg: toRGBA('#f59e0b', .16), color: '#b45309', label: 'PENDING' },
    rejected: { bg: toRGBA('#ef4444', .14), color: '#b91c1c', label: 'REJECTED' }
  }[s] || { bg: toRGBA('#94a3b8', .16), color: '#334155', label: s.toUpperCase() };
  return <Chip label={map.label} size="small" sx={{ background: map.bg, color: map.color, fontWeight: 700 }} />;
};

/** ==================== CARD VIEW COMPONENT ==================== */
const TestimonialCardView = ({ testimonials, onView, onEdit, onDelete, onStatusChange }) => {
  if (testimonials.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <ImageIcon sx={{ fontSize: 80, color: toRGBA(BRAND_A, .5) }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>No testimonials found</Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>Add your first testimonial or adjust your search.</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {testimonials.map((testimonial) => (
        <Grid item xs={12} sm={6} key={testimonial._id}>
          <TestimonialCard>
            <CardContent sx={{ p: 3, flex: 1 }}>
              {/* Header with Avatar and Name */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                {(testimonial.photoUrl ? `${API_BASE}${testimonial.photoUrl}` : null) ? (
                  <Avatar
                    src={`${API_BASE}${testimonial.photoUrl}`}
                    alt={testimonial.name}
                    sx={{ width: 56, height: 56 }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: toRGBA(BRAND_A, .18),
                      color: BRAND_A,
                      fontWeight: 900,
                      fontSize: '1.5rem'
                    }}
                  >
                    {(testimonial.name || 'A').charAt(0)}
                  </Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: '#1f2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {testimonial.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {(testimonial.position || '')}{testimonial.company ? ` • ${testimonial.company}` : ''}
                  </Typography>
                </Box>
              </Stack>

              {/* Rating */}
              <Box sx={{ mb: 2 }}>
                <Rating
                  value={Number(testimonial.rating) || 5}
                  readOnly
                  size="small"
                  sx={{
                    '& .MuiRating-iconFilled': { color: STAR_COLOR },
                    '& .MuiRating-iconEmpty': { color: 'rgba(0,0,0,.16)' }
                  }}
                />
              </Box>

              {/* Status */}
              <Box sx={{ mb: 2 }}>
                <StatusChip status={testimonial.status} />
              </Box>

              {/* Hint */}
              <Typography
                variant="body2"
                sx={{
                  color: '#94a3b8',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  py: 1
                }}
              >
                Click "View" to read the testimonial
              </Typography>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="Approve"><Button onClick={() => onStatusChange(testimonial, 'approved')} sx={{ borderColor: toRGBA('#16a34a', .4), color: '#16a34a', minWidth: 36, px: 1 }}><ApproveIcon fontSize="small" /></Button></Tooltip>
                <Tooltip title="Pending"><Button onClick={() => onStatusChange(testimonial, 'pending')} sx={{ borderColor: toRGBA('#f59e0b', .4), color: '#b45309', minWidth: 36, px: 1 }}><PendingIcon fontSize="small" /></Button></Tooltip>
                <Tooltip title="Reject"><Button onClick={() => onStatusChange(testimonial, 'rejected')} sx={{ borderColor: toRGBA('#ef4444', .4), color: '#b91c1c', minWidth: 36, px: 1 }}><RejectIcon fontSize="small" /></Button></Tooltip>
              </ButtonGroup>
              <Stack direction="row" spacing={1}>
                <Tooltip title="View"><IconButton onClick={() => onView(testimonial)} size="small" sx={{ color: BRAND_A, '&:hover': { bgcolor: toRGBA(BRAND_A, .1) } }}><ViewIcon /></IconButton></Tooltip>
                <Tooltip title="Edit"><IconButton onClick={() => onEdit(testimonial)} size="small" color="primary"><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton onClick={() => onDelete(testimonial._id)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>
              </Stack>
            </CardActions>
          </TestimonialCard>
        </Grid>
      ))}
    </Grid>
  );
};

/** ==================== MAIN TESTIMONIAL PANEL ==================== */
const TestimonialPanel = () => {
  const [tab, setTab] = useState(0); // 0: Manage, 1: Submission Link
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const socketRef = useRef(null);
  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const authHeaderMultipart = token
    ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    : { headers: { 'Content-Type': 'multipart/form-data' } };

  const theme = useTheme();
  const compact = useMediaQuery('(max-width:1400px)'); // auto-compact on 14" and below

  const toast = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_URL, { params: { sort: '-createdAt' } });
      if (data?.success) setRows(data.data || []);
    } catch (e) {
      console.error(e);
      toast('Failed to fetch testimonials', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
    const socket = io(API_BASE, { transports: ['websocket', 'polling'], forceNew: true });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join-testimonials-admin', 'testimonials-admin'));
    socket.on('testimonial-created', (payload) => {
      if (payload?.success && payload.data) {
        setRows(prev => (prev.some(r => r._id === payload.data._id) ? prev : [payload.data, ...prev]));
      }
    });
    socket.on('testimonial-updated', (payload) => {
      if (payload?.success && payload.data) {
        setRows(prev => prev.map(r => (r._id === payload.data._id ? payload.data : r)));
        toast('Testimonial updated');
      }
    });
    socket.on('testimonials-updated', (payload) => {
      if (payload?.success && payload.data) {
        setRows(prev => prev.map(r => (r._id === payload.data._id ? payload.data : r)));
      }
    });
    socket.on('testimonial-deleted', (payload) => {
      if (payload?.success && payload.id) {
        setRows(prev => prev.filter(r => r._id !== payload.id));
        toast('Testimonial deleted', 'warning');
      }
    });
    return () => socketRef.current?.disconnect();
  }, [fetchRows, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.company || '').toLowerCase().includes(q) ||
      (r.position || '').toLowerCase().includes(q) ||
      (r.content || '').toLowerCase().includes(q)
    );
  }, [rows, query]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpenDialog(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      company: row.company || '',
      position: row.position || '',
      content: row.content || '',
      rating: row.rating || 5,
      featured: !!row.featured,
      photo: null,
      photoPreview: row.photoUrl ? `${API_BASE}${row.photoUrl}` : (row.avatar || null)
    });
    setOpenDialog(true);
  };

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(prev => ({ ...prev, photo: file, photoPreview: URL.createObjectURL(file) }));
  };

  const save = async () => {
    if (saving) return;
    if (!form.name || !form.content) { toast('Please fill name and content', 'error'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('company', form.company);
    fd.append('position', form.position);
    fd.append('content', form.content);
    fd.append('rating', form.rating);
    fd.append('featured', form.featured);
    if (form.photo) fd.append('photo', form.photo);
    try {
      if (editing) {
        await axios.put(`${API_URL}/${editing._id}`, fd, authHeaderMultipart);
        toast('Updated');
      } else {
        await axios.post(API_URL, fd, authHeaderMultipart);
        toast('Saved');
      }
      setOpenDialog(false); setEditing(null); setForm(emptyForm); fetchRows();
    } catch (e) {
      console.error(e);
      toast(e?.response?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try { await axios.delete(`${API_URL}/${id}`, authHeader); toast('Deleted', 'warning'); setRows(prev => prev.filter(r => r._id !== id)); }
    catch (e) { console.error(e); toast(e?.response?.data?.message || 'Delete failed', 'error'); }
  };

  const setStatus = async (row, status) => {
    try {
      const { data } = await axios.patch(`${API_URL}/${row._id}/status`, { status }, authHeader);
      if (data?.success && data.data) {
        setRows(prev => prev.map(r => (r._id === row._id ? data.data : r)));
        toast(`Marked as ${status}`);
      }
    } catch (e) {
      console.error(e);
      toast('Failed to update status', 'error');
    }
  };

  const openView = (row) => { setViewRow(row); setViewOpen(true); };

  /** Action button set that auto-compacts */
  const ActionButtons = ({ row }) => {
    if (compact) {
      return (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title="Approve"><IconButton size="small" onClick={() => setStatus(row, 'approved')} sx={{ color: '#16a34a' }}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Pending"><IconButton size="small" onClick={() => setStatus(row, 'pending')} sx={{ color: '#b45309' }}><PendingIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Reject"><IconButton size="small" onClick={() => setStatus(row, 'rejected')} sx={{ color: '#b91c1c' }}><RejectIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="View"><IconButton size="small" onClick={() => openView(row)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(row._id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      );
    }
    return (
      <>
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="Approve">
            <Button onClick={() => setStatus(row, 'approved')} startIcon={<ApproveIcon />} sx={{ borderColor: toRGBA('#16a34a',.4), color: '#16a34a' }}>
              Approve
            </Button>
          </Tooltip>
          <Tooltip title="Pending">
            <Button onClick={() => setStatus(row, 'pending')} startIcon={<PendingIcon />} sx={{ borderColor: toRGBA('#f59e0b',.4), color: '#b45309' }}>
              Pending
            </Button>
          </Tooltip>
          <Tooltip title="Reject">
            <Button onClick={() => setStatus(row, 'rejected')} startIcon={<RejectIcon />} sx={{ borderColor: toRGBA('#ef4444',.4), color: '#b91c1c' }}>
              Reject
            </Button>
          </Tooltip>
        </ButtonGroup>
        <Tooltip title="View"><IconButton onClick={() => openView(row)}><ViewIcon /></IconButton></Tooltip>
        <Tooltip title="Edit"><IconButton onClick={() => openEdit(row)} color="primary"><EditIcon /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton onClick={() => remove(row._id)} color="error"><DeleteIcon /></IconButton></Tooltip>
      </>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f7fafc' }}>
      {/* Header + Tabs */}
      <Container maxWidth={false} sx={{ pt: 3, px: { xs: 2, md: 3 } }}>
        {/* Wrap inner content to a desktop-like max while allowing full-width scroll on smaller screens */}
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <HeaderPaper>
            <NoWrapRow>
              <Box sx={{ minWidth: 280, flex: '0 0 auto' }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1f2937' }}>Testimonials</Typography>
                <Typography variant="body2" sx={{ color: '#475569' }}>Manage testimonials or generate a public submission link.</Typography>
              </Box>
              <Box sx={{ flex: '0 0 auto' }}>
                {tab === 0 ? (
                  <AccentButton startIcon={<AddIcon />} onClick={openAdd}>New Testimonial</AccentButton>
                ) : (
                  <AccentButton startIcon={<CloseIcon />} onClick={() => setTab(0)}>Back to Manage</AccentButton>
                )}
              </Box>
            </NoWrapRow>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1, '& .MuiTabs-indicator': { background: BRAND_A, height: 3, borderRadius: 2 } }}>
              <Tab label="Manage" sx={{ fontWeight: 700 }} />
              <Tab label="Submission Link" sx={{ fontWeight: 700 }} />
            </Tabs>
          </HeaderPaper>
        </Box>
      </Container>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 3 }}>
        {tab === 1 ? (
          <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
              <TestimonialSubmissionPanel switchToManage={() => setTab(0)} />
            </Box>
          </Container>
        ) : (
          <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
              {/* Search & View Toggle - never wraps, scrolls horizontally if needed */}
              <NoWrapRow style={{ marginBottom: 12 }}>
                <TextField
                  placeholder="Search testimonials…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  size="small"
                  sx={{
                    minWidth: 320,
                    flex: '0 0 420px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.95)',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: BRAND_A }} />
                      </InputAdornment>
                    )
                  }}
                />

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                  sx={{
                    flex: '0 0 auto',
                    '& .MuiToggleButton-root': {
                      borderRadius: 2,
                      fontWeight: 600,
                      '&.Mui-selected': {
                        background: BRAND_GRADIENT,
                        color: '#fff',
                        '&:hover': {
                          background: BRAND_GRADIENT,
                        }
                      }
                    }
                  }}
                >
                  <ToggleButton value="table"><TableViewIcon sx={{ mr: 1 }} />Table View</ToggleButton>
                  <ToggleButton value="card"><CardViewIcon sx={{ mr: 1 }} />Card View</ToggleButton>
                </ToggleButtonGroup>
              </NoWrapRow>

              {/* Content */}
              {loading ? (
                <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress sx={{ color: BRAND_A }} />
                </Box>
              ) : viewMode === 'card' ? (
                <TestimonialCardView
                  testimonials={filtered}
                  onView={openView}
                  onEdit={openEdit}
                  onDelete={remove}
                  onStatusChange={setStatus}
                />
              ) : (
                /* Table View */
                <DesktopTableContainer component={Paper}>
                  <Table stickyHeader sx={{ minWidth: 1200 }}>
                    <TableHead>
                <TableRow sx={{ background: TABLE_HEAD_GRADIENT }}>
                    <TableCell sx={{ color: '#000', fontWeight: 800, whiteSpace: 'nowrap' }}>User</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 800, minWidth: 180, whiteSpace: 'nowrap' }}>Role & Company</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 800, whiteSpace: 'nowrap' }}>Rating</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 800, width: 420, minWidth: 320, whiteSpace: 'nowrap' }}>Content preview</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 800, whiteSpace: 'nowrap' }}>Status</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 800, textAlign: 'right', minWidth: compact ? 220 : 260, whiteSpace: 'nowrap' }}>Actions</TableCell>
                </TableRow>
                </TableHead>

                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748b' }}>
                            <Stack alignItems="center" spacing={1}>
                              <ImageIcon sx={{ fontSize: 64, color: toRGBA(BRAND_A, .5) }} />
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937' }}>No testimonials found</Typography>
                              <Typography variant="body2">Add your first testimonial or adjust your search.</Typography>
                              <AccentButton startIcon={<AddIcon />} onClick={openAdd}>Add Testimonial</AccentButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((r) => (
                          <TableRow key={r._id} sx={{ '&:hover': { backgroundColor: 'rgba(26,201,159,0.04)' } }}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 220 }}>
                                {(r.photoUrl ? `${API_BASE}${r.photoUrl}` : null) ? (
                                  <Avatar src={`${API_BASE}${r.photoUrl}`} alt={r.name} sx={{ width: 42, height: 42 }} />
                                ) : (
                                  <Avatar sx={{ width: 42, height: 42, bgcolor: toRGBA(BRAND_A,.18), color: BRAND_A, fontWeight: 900 }}>
                                    {(r.name || 'A').charAt(0)}
                                  </Avatar>
                                )}
                                <Typography sx={{ fontWeight: 800, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260 }}>
                              <Typography variant="body2" sx={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {(r.position || '')}{r.company ? ` • ${r.company}` : ''}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Rating
                                value={Number(r.rating) || 5}
                                readOnly
                                sx={{ '& .MuiRating-iconFilled': { color: STAR_COLOR }, '& .MuiRating-iconEmpty': { color: 'rgba(0,0,0,.16)' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 420 }}>
                              <Typography variant="body2" sx={{ color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                "{firstWords(r.content, 3)}"
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}><StatusChip status={r.status} /></TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <ActionButtons row={r} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </DesktopTableContainer>
              )}
            </Box>
          </Container>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => !saving && setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(18px)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' } }}>
        <DialogTitle sx={{ background: BRAND_GRADIENT, color: '#fff', fontWeight: 800 }}>
          {editing ? 'Edit Testimonial' : 'Add Testimonial'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField label="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} fullWidth />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Position" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} fullWidth />
              <TextField label="Company" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} fullWidth />
            </Stack>
            <TextField label="Content *" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} fullWidth multiline minRows={3} />
            <TextField select label="Rating" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: Number(e.target.value) }))} fullWidth>
              {[5,4,3,2,1].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Photo (preferred)</Typography>
              <Button component="label" variant="outlined" startIcon={<ImageIcon />} disabled={saving} sx={{ py: 1.25 }}>
                {form.photoPreview ? 'Change Photo' : 'Upload Photo'}
                <input type="file" hidden accept="image/*" onChange={onPickPhoto} />
              </Button>
              {form.photoPreview && (
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar src={form.photoPreview} sx={{ width: 96, height: 96, mx: 'auto', my: 1 }} />
                  <Typography variant="caption" color="text.secondary">Preview</Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>Cancel</Button>
          <AccentButton onClick={save} startIcon={saving ? <CircularProgress size={16} /> : (editing ? <EditIcon /> : <AddIcon />)} disabled={saving}>
            {editing ? (saving ? 'Updating…' : 'Update') : (saving ? 'Saving…' : 'Save')}
          </AccentButton>
        </DialogActions>
      </Dialog>

      {/* View Dialog (full content) */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, background: 'rgba(255,255,255,0.98)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Testimonial</Typography>
          {viewRow && <StatusChip status={viewRow.status} />}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {viewRow && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {(viewRow.photoUrl ? `${API_BASE}${viewRow.photoUrl}` : null) ? (
                  <Avatar src={`${API_BASE}${viewRow.photoUrl}`} alt={viewRow.name} sx={{ width: 64, height: 64 }} />
                ) : (
                  <Avatar sx={{ width: 64, height: 64, bgcolor: toRGBA(BRAND_A,.18), color: BRAND_A, fontWeight: 900 }}>
                    {(viewRow.name || 'A').charAt(0)}
                  </Avatar>
                )}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>{viewRow.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {(viewRow.position || '')}{viewRow.company ? ` • ${viewRow.company}` : ''}
                  </Typography>
                </Box>
              </Stack>
              <Rating value={Number(viewRow.rating) || 5} readOnly sx={{ '& .MuiRating-iconFilled': { color: STAR_COLOR } }} />
              <Typography variant="body1" sx={{ color: '#0f172a', lineHeight: 1.75 }}>
                "{viewRow.content}"
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={() => { if (viewRow) setStatus(viewRow, 'approved'); }} startIcon={<ApproveIcon />} sx={{ borderColor: toRGBA('#16a34a',.4), color: '#16a34a' }}>Approve</Button>
            <Button onClick={() => { if (viewRow) setStatus(viewRow, 'pending'); }} startIcon={<PendingIcon />} sx={{ borderColor: toRGBA('#f59e0b',.4), color: '#b45309' }}>Pending</Button>
            <Button onClick={() => { if (viewRow) setStatus(viewRow, 'rejected'); }} startIcon={<RejectIcon />} sx={{ borderColor: toRGBA('#ef4444',.4), color: '#b91c1c' }}>Reject</Button>
          </ButtonGroup>
          <Button onClick={() => setViewOpen(false)} startIcon={<CloseIcon />}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TestimonialPanel;
