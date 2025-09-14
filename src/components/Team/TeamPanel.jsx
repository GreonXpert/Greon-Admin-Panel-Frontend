// src/components/Team/TeamPanel.jsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardActionArea, CardContent, CardMedia,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Stack, Tooltip, Alert, Divider, InputAdornment,
  FormControl, InputLabel, Select, OutlinedInput, CircularProgress,
  Switch, FormControlLabel, Accordion, AccordionSummary, AccordionDetails,
  Paper, CardActions, Avatar
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  CloudUpload as CloudUploadIcon, Person as PersonIcon, ExpandMore as ExpandMoreIcon,
  Star as StarIcon, Business as BusinessIcon, School as SchoolIcon,
  Language as LanguageIcon, EmojiEvents as EmojiEventsIcon, Close as CloseIcon,
  Visibility as VisibilityIcon, Group as GroupIcon, WorkOutline as WorkOutlineIcon,
  LocationOn as LocationOnIcon, Email as EmailIcon
} from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;

// Status options
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'alumni', label: 'Alumni' }
];

// Department options
const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'HR',
  'Finance',
  'Executive'
];

const emptyForm = {
  name: '',
  role: '',
  bio: '',
  description: '',
  email: '',
  linkedin: '',
  twitter: '',
  github: '',
  experience: 0,
  location: '',
  department: '',
  specialised: [],
  specialisedInput: '',
  achievements: [],
  achievementInput: '',
  certifications: [],
  certificationInput: '',
  languages: [],
  languageInput: '',
  hobbies: [],
  hobbyInput: '',
  education: [],
  images: [],
  imagePreviews: [],
  existingImagePreviews: [],
  removedImages: [],
  status: 'active',
  displayOrder: 0,
  featured: false
};

const TeamPanel = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);
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
        const res = await axios.get(`${API_URL}/team?status=all`, authHeader);
        if (res.data?.success) setTeamMembers(res.data.data || []);
      } catch (e) {
        toast('Failed to fetch team members', 'error');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
    const socket = io(API_BASE);
    socket.emit('join-team-room', 'team-admin');
    socket.on('team-admin-updated', (payload) => {
      if (payload?.success && Array.isArray(payload.data)) {
        setTeamMembers(payload.data);
        if (payload.action === 'created') {
          toast('✅ New team member added successfully!');
        } else if (payload.action === 'updated') {
          toast('✅ Team member updated successfully!');
        } else if (payload.action === 'deleted') {
          toast('✅ Team member deleted successfully!');
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  // Filter team members
  const filtered = useMemo(() => {
    let result = teamMembers;
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }
    if (departmentFilter !== 'all') {
      result = result.filter(m => m.department === departmentFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(m =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q) ||
        (m.bio || '').toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [teamMembers, search, statusFilter, departmentFilter]);

  // Dialog handlers
  const openAdd = () => {
    setEditMember(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const openEdit = (member) => {
    setEditMember(member);
    setForm({
      name: member.name || '',
      role: member.role || '',
      bio: member.bio || '',
      description: member.description || '',
      email: member.email || '',
      linkedin: member.linkedin || '',
      twitter: member.twitter || '',
      github: member.github || '',
      experience: member.experience || 0,
      location: member.location || '',
      department: member.department || '',
      specialised: Array.isArray(member.specialised) ? member.specialised : [],
      specialisedInput: '',
      achievements: Array.isArray(member.achievements) ? member.achievements : [],
      achievementInput: '',
      certifications: Array.isArray(member.certifications) ? member.certifications : [],
      certificationInput: '',
      languages: Array.isArray(member.languages) ? member.languages : [],
      languageInput: '',
      hobbies: Array.isArray(member.hobbies) ? member.hobbies : [],
      hobbyInput: '',
      education: Array.isArray(member.education) ? member.education : [],
      images: [],
      imagePreviews: [],
      existingImagePreviews: member.images?.map(img => ({
        url: `${API_BASE}${img.url}`,
        serverUrl: img.url,
        caption: img.caption || '',
        isPrimary: img.isPrimary || false
      })) || [],
      removedImages: [],
      status: member.status || 'active',
      displayOrder: member.displayOrder || 0,
      featured: member.featured || false
    });
    setOpenDialog(true);
  };

  const openView = (member) => {
    setViewMember(member);
    setViewDialog(true);
  };

  // Image handling
  const onAddSingleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const totalImages = form.existingImagePreviews.length + form.images.length;
    if (totalImages >= 5) {
      toast('Maximum 5 images allowed', 'warning');
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

  const handleKeyDown = (field, inputField) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addArrayItem(field, inputField);
    }
  };

  const submit = async () => {
    if (submitting) return;
    console.log('🚀 Starting form submission...');
    console.log('📝 Form data:', form);
    if (!form.name || !form.role || !form.bio || !form.description) {
      toast('Please fill all required fields (name, role, bio, description)', 'error');
      return;
    }

    const totalImages = form.existingImagePreviews.length + form.images.length;
    if (!editMember && totalImages === 0) {
      toast('Please upload at least one image', 'error');
      return;
    }

    if (editMember && totalImages === 0) {
      toast('At least one image is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      // Add text fields
      fd.append('name', form.name.trim());
      fd.append('role', form.role.trim());
      fd.append('bio', form.bio.trim());
      fd.append('description', form.description.trim());
      fd.append('email', form.email.trim());
      fd.append('linkedin', form.linkedin.trim());
      fd.append('twitter', form.twitter.trim());
      fd.append('github', form.github.trim());
      fd.append('experience', String(form.experience));
      fd.append('location', form.location.trim());
      fd.append('department', form.department);
      fd.append('status', form.status);
      fd.append('displayOrder', String(form.displayOrder));
      fd.append('featured', String(form.featured));

      // Add array fields as JSON strings
      fd.append('specialised', JSON.stringify(form.specialised));
      fd.append('achievements', JSON.stringify(form.achievements));
      fd.append('certifications', JSON.stringify(form.certifications));
      fd.append('languages', JSON.stringify(form.languages));
      fd.append('hobbies', JSON.stringify(form.hobbies));
      fd.append('education', JSON.stringify(form.education));

      // Handle file deletion and updates for edit mode
      if (editMember) {
        if (form.removedImages.length > 0) {
          fd.append('removedImages', JSON.stringify(form.removedImages));
        }
        if (form.existingImagePreviews.length > 0) {
          const keepExisting = form.existingImagePreviews.map((img, index) => ({
            url: img.serverUrl,
            caption: img.caption,
            isPrimary: index === 0
          }));
          fd.append('keepExistingImages', JSON.stringify(keepExisting));
        }
      }

      // Add new images
      form.images.forEach((image, index) => {
        fd.append('images', image);
        fd.append(`imageCaption${index}`, '');
      });

      console.log('📤 Submitting FormData...');
      for (let [key, value] of fd.entries()) {
        console.log(`${key}:`, value);
      }

      if (editMember) {
        console.log(`📝 Updating team member ${editMember._id}...`);
        await axios.put(`${API_URL}/team/${editMember._id}`, fd, authHeaderMultipart);
        toast('Team member updated successfully!');
      } else {
        console.log('🆕 Creating new team member...');
        await axios.post(`${API_URL}/team`, fd, authHeaderMultipart);
        toast('Team member added successfully!');
      }

      setOpenDialog(false);
      setEditMember(null);
      setForm(emptyForm);
      console.log('✅ Form submission completed successfully');
    } catch (e) {
      console.error('❌ Form submission error:', e);
      console.error('❌ Response data:', e.response?.data);
      console.error('❌ Response status:', e.response?.status);
      const msg = e?.response?.status === 401
        ? 'Unauthorized: please log in as admin/superadmin.'
        : (e?.response?.data?.message || e.message || 'Save failed');
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMember = async (id) => {
    if (!window.confirm('Delete this team member? This will also delete all associated files.')) return;
    try {
      await axios.delete(`${API_URL}/team/${id}`, authHeader);
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

      {/* Header - Fixed */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          m: 2, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 100%)',
          color: 'white',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)', mb: 1 }}>
              <GroupIcon sx={{ mr: 2, fontSize: '2rem' }} />
              Team Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your team members and their profiles
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            disabled={submitting}
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
            Add Team Member
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search team members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
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
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              label="Status"
              sx={{
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
                '& .MuiSelect-select': {
                  color: 'white'
                }
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Department</InputLabel>
            <Select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              label="Department"
              sx={{
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
                '& .MuiSelect-select': {
                  color: 'white'
                }
              }}
            >
              <MenuItem value="all">All Departments</MenuItem>
              {DEPARTMENT_OPTIONS.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

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
            background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            transition: 'all 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(135deg, #0E9A78, #1AC99F)',
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
        {/* Team Members Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                Loading team members...
              </Typography>
              <CircularProgress size={40} sx={{ color: '#1AC99F' }} />
            </Box>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((member) => (
              <Grid item xs={12} sm={6} key={member._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '2px solid rgba(26, 201, 159, 0.2)',
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
                      background: 'linear-gradient(90deg, #1AC99F, #0E9A78)',
                      zIndex: 1
                    },
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(26, 201, 159, 0.15)',
                      '& .card-actions': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      },
                      '& .member-image': {
                        transform: 'scale(1.05)'
                      }
                    }
                  }}
                >
                  {/* Featured Badge */}
                  {member.featured && (
                    <Chip
                      icon={<StarIcon />}
                      label="Featured"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 2,
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        color: '#333',
                        fontWeight: 700
                      }}
                    />
                  )}

                  <CardActionArea 
                    onClick={() => openView(member)}
                    sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'stretch',
                      pt: 1
                    }}
                  >
                    {/* Profile Image */}
                    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', p: 2, pt: 3 }}>
                      <Avatar
                        className="member-image"
                        src={member.images?.[0] ? `${API_BASE}${member.images[0].url}` : undefined}
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          border: '4px solid #1AC99F',
                          fontSize: '2rem',
                          fontWeight: 700,
                          bgcolor: '#1AC99F',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        {member.name?.charAt(0)}
                      </Avatar>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 3, pt: 1 }}>
                      {/* Name & Role */}
                      <Typography 
                        variant="h6" 
                        component="h3"
                        sx={{ 
                          fontWeight: 700,
                          color: '#2c3e50',
                          fontSize: '1.2rem',
                          lineHeight: 1.3,
                          mb: 0.5,
                          textAlign: 'center'
                        }}
                      >
                        {member.name}
                      </Typography>
                      
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: '#1AC99F',
                          fontWeight: 600,
                          fontSize: '1rem',
                          mb: 2,
                          textAlign: 'center'
                        }}
                      >
                        {member.role}
                      </Typography>

                      {/* Department & Location */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                        {member.department && (
                          <Chip 
                            icon={<BusinessIcon />}
                            label={member.department}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: 'rgba(26, 201, 159, 0.4)',
                              color: '#1AC99F',
                              backgroundColor: 'rgba(26, 201, 159, 0.05)',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                        {member.location && (
                          <Chip 
                            icon={<LocationOnIcon />}
                            label={member.location}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: 'rgba(26, 201, 159, 0.4)',
                              color: '#1AC99F',
                              backgroundColor: 'rgba(26, 201, 159, 0.05)',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </Box>
                      
                      {/* Bio */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                          fontSize: '0.9rem',
                          textAlign: 'center',
                          mb: 2,
                          color: '#546e7a'
                        }}
                      >
                        {member.bio}
                      </Typography>

                      {/* Experience */}
                      {member.experience && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                          <WorkOutlineIcon sx={{ fontSize: 16, color: '#666' }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#666',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            {member.experience}+ years experience
                          </Typography>
                        </Box>
                      )}

                      {/* Specializations */}
                      {member.specialised && member.specialised.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                          {member.specialised.slice(0, 2).map((skill, index) => (
                            <Chip 
                              key={index} 
                              label={skill} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.7rem',
                                height: '22px',
                                backgroundColor: 'rgba(26, 201, 159, 0.1)',
                                color: '#1AC99F',
                                fontWeight: 500
                              }}
                            />
                          ))}
                          {member.specialised.length > 2 && (
                            <Chip 
                              label={`+${member.specialised.length - 2}`} 
                              size="small"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: '22px',
                                backgroundColor: 'rgba(26, 201, 159, 0.2)',
                                color: '#1AC99F',
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Stack>
                      )}
                    </CardContent>
                  </CardActionArea>

                  {/* Action Buttons */}
                  <CardActions 
                    className="card-actions"
                    sx={{ 
                      p: 2, 
                      pt: 0, 
                      gap: 1,
                      opacity: 0.7,
                      transform: 'translateY(4px)',
                      transition: 'all 0.3s ease',
                      justifyContent: 'center'
                    }}
                  >
                    <Button
                      onClick={(e) => { e.stopPropagation(); openView(member); }}
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      sx={{ 
                        color: '#1AC99F',
                        borderColor: 'rgba(26, 201, 159, 0.4)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: 'rgba(26, 201, 159, 0.1)',
                          borderColor: '#1AC99F',
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      View
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); openEdit(member); }}
                      disabled={submitting}
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      sx={{ 
                        color: '#D96F32',
                        borderColor: 'rgba(217, 111, 50, 0.4)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#D96F32',
                          color: 'white',
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); deleteMember(member._id); }}
                      disabled={submitting}
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
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
            ))}
          </Grid>
        )}

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
              <GroupIcon sx={{ fontSize: 64, color: 'rgba(26, 201, 159, 0.4)' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              No team members found
            </Typography>
            <Typography variant="body1" sx={{ color: '#546e7a', mb: 3 }}>
              {search || statusFilter !== 'all' || departmentFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first team member'}
            </Typography>
            {!search && statusFilter === 'all' && departmentFilter === 'all' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAdd}
                sx={{ 
                  background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #0E9A78, #1AC99F)',
                    transform: 'translateY(-2px)'
                  },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600
                }}
              >
                Add Your First Team Member
              </Button>
            )}
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
            borderRadius: 3,
            maxHeight: '95vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #D4EDDA)', 
          color: '#1AC99F', 
          fontWeight: 700,
          fontSize: '1.5rem',
          position: 'relative'
        }}>
          <PersonIcon sx={{ mr: 1 }} />
          {editMember ? 'Edit Team Member' : 'Add Team Member'}
          <IconButton
            onClick={() => !submitting && setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, overflow: 'auto' }}>
          {/* Basic Information */}
          <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">📝 Basic Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Name *"
                    fullWidth
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Role *"
                    fullWidth
                    value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={form.department}
                      onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                      label="Department"
                      disabled={submitting}
                    >
                      {DEPARTMENT_OPTIONS.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Location"
                    fullWidth
                    value={form.location}
                    onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Bio *"
                    fullWidth
                    multiline
                    rows={2}
                    value={form.bio}
                    onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                    helperText="Short bio for card display"
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description *"
                    fullWidth
                    multiline
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    helperText="Detailed description for profile page"
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Contact Information */}
          <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">📧 Contact Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="LinkedIn"
                    fullWidth
                    value={form.linkedin}
                    onChange={e => setForm(prev => ({ ...prev, linkedin: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Twitter"
                    fullWidth
                    value={form.twitter}
                    onChange={e => setForm(prev => ({ ...prev, twitter: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="GitHub"
                    fullWidth
                    value={form.github}
                    onChange={e => setForm(prev => ({ ...prev, github: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Images */}
          <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">📸 Images - {form.existingImagePreviews.length + form.images.length}/5</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                disabled={form.existingImagePreviews.length + form.images.length >= 5 || submitting}
                sx={{ mb: 3, py: 1.5, px: 3, borderRadius: 3 }}
              >
                {form.existingImagePreviews.length + form.images.length >= 5
                  ? 'Maximum 5 images reached'
                  : 'Add Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={onAddSingleImage}
                />
              </Button>

              {/* Current Images */}
              {form.existingImagePreviews.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    📂 Current Images ({form.existingImagePreviews.length}):
                  </Typography>
                  <Grid container spacing={2}>
                    {form.existingImagePreviews.map((image, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box sx={{ position: 'relative' }}>
                          {index === 0 && (
                            <Chip
                              label="Primary"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                zIndex: 1,
                                backgroundColor: '#1AC99F',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                          <img
                            src={image.url}
                            alt={`Current ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '120px', 
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #e0e0e0'
                            }}
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
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* New Images */}
              {form.imagePreviews.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    ✨ New Images ({form.imagePreviews.length}):
                  </Typography>
                  <Grid container spacing={2}>
                    {form.imagePreviews.map((preview, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={preview}
                            alt={`New ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '120px', 
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #e0e0e0'
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
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Skills & Experience */}
          <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">💼 Skills & Experience</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="Years of Experience"
                type="number"
                fullWidth
                value={form.experience}
                onChange={e => setForm(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                disabled={submitting}
                sx={{ mb: 3 }}
              />

              {/* Array fields */}
              {[
                { field: 'specialised', inputField: 'specialisedInput', label: 'Specializations', icon: <StarIcon /> },
                { field: 'achievements', inputField: 'achievementInput', label: 'Achievements', icon: <EmojiEventsIcon /> },
                { field: 'certifications', inputField: 'certificationInput', label: 'Certifications', icon: <SchoolIcon /> },
                { field: 'languages', inputField: 'languageInput', label: 'Languages', icon: <LanguageIcon /> },
                { field: 'hobbies', inputField: 'hobbyInput', label: 'Hobbies', icon: <PersonIcon /> }
              ].map(({ field, inputField, label, icon }) => (
                <Box key={field} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {icon}
                    <Typography variant="subtitle2">{label}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Add ${label.toLowerCase()}`}
                      value={form[inputField]}
                      onChange={e => setForm(prev => ({ ...prev, [inputField]: e.target.value }))}
                      onKeyDown={handleKeyDown(field, inputField)}
                      disabled={submitting}
                    />
                    <Button
                      onClick={() => addArrayItem(field, inputField)}
                      variant="outlined"
                      size="small"
                      disabled={submitting}
                      sx={{ px: 3 }}
                    >
                      Add
                    </Button>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {form[field].map((item, idx) => (
                      <Chip 
                        key={idx} 
                        label={item} 
                        onDelete={() => !submitting && removeArrayItem(field, idx)}
                        size="small"
                        sx={{ backgroundColor: '#f3f4f6' }}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>

          {/* Settings */}
          <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">⚙️ Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                      label="Status"
                      disabled={submitting}
                    >
                      {STATUS_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Display Order"
                    type="number"
                    fullWidth
                    value={form.displayOrder}
                    onChange={e => setForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.featured}
                        onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                        disabled={submitting}
                      />
                    }
                    label="Featured Member"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={submitting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={submit} 
            variant="contained"
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0E9A78, #1AC99F)',
              }
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : (editMember ? 'Update' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #D4EDDA)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <PersonIcon sx={{ mr: 1 }} />
          {viewMember?.name}
          <IconButton
            onClick={() => setViewDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {viewMember && (
            <>
              {/* Profile Image */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  src={viewMember.images?.[0] ? `${API_BASE}${viewMember.images[0].url}` : undefined}
                  sx={{ 
                    width: 150, 
                    height: 150, 
                    margin: '0 auto',
                    border: '4px solid #1AC99F',
                    fontSize: '3rem',
                    bgcolor: '#1AC99F'
                  }}
                >
                  {viewMember.name?.charAt(0)}
                </Avatar>
              </Box>

              {/* Basic Info */}
              <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 700, mb: 1 }}>
                {viewMember.name}
              </Typography>
              <Typography variant="h6" sx={{ textAlign: 'center', color: '#1AC99F', mb: 2 }}>
                {viewMember.role}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {viewMember.description}
              </Typography>

              {/* Specializations */}
              {viewMember.specialised && viewMember.specialised.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F' }}>Specializations:</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {viewMember.specialised.map((skill, index) => (
                      <Chip key={index} label={skill} color="primary" />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Featured Badge */}
              {viewMember.featured && (
                <Chip
                  icon={<StarIcon />}
                  label="Featured"
                  size="small"
                  sx={{ backgroundColor: '#1AC99F', color: 'white' }}
                />
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setViewDialog(false)} variant="outlined">
            Close
          </Button>
          <Button 
            onClick={() => { setViewDialog(false); openEdit(viewMember); }} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0E9A78, #1AC99F)',
              }
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamPanel;
