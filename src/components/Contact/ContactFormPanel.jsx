// src/components/Contact/ContactFormPanel.jsx - Complete Table Format Version with Accordion Header

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Paper, Chip, Stack,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Alert, InputAdornment, FormControl, InputLabel,
  Select, Avatar, Badge, TablePagination, CircularProgress, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, FormControlLabel,
  RadioGroup, Radio, Switch, Divider, List, ListItem, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, TableSortLabel
} from '@mui/material';
import {
  Search as SearchIcon, FilterList as FilterIcon, Analytics as AnalyticsIcon,
  Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon,
  Reply as ReplyIcon, Download as DownloadIcon, Refresh as RefreshIcon,
  Email as EmailIcon, Phone as PhoneIcon, Business as BusinessIcon,
  Person as PersonIcon, Schedule as ScheduleIcon, AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon, CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon, Close as CloseIcon, ExpandMore as ExpandMoreIcon,
  Send as SendIcon, Message as MessageIcon, NotificationImportant as NotificationIcon,
  ContactMail as ContactIcon, MoreVert as MoreIcon, Sort as SortIcon
} from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;

// Enhanced Status configurations with colors and actions
const STATUS_CONFIG = {
  open: {
    label: 'Open',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    icon: '🔓',
    description: 'New inquiry awaiting review'
  },
  in_progress: {
    label: 'In Progress',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    icon: '⚡',
    description: 'Currently being processed'
  },
  deal_signed: {
    label: 'Deal Signed',
    color: '#4CAF50',
    bgColor: '#E8F5E8',
    icon: '🎉',
    description: 'Successfully converted to customer'
  },
  rejected: {
    label: 'Rejected',
    color: '#F44336',
    bgColor: '#FFEBEE',
    icon: '❌',
    description: 'Not suitable for our services'
  },
  not_applicable: {
    label: 'Not Applicable',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
    icon: '🚫',
    description: 'Outside our scope of services'
  },
  closed: {
    label: 'Closed',
    color: '#607D8B',
    bgColor: '#ECEFF1',
    icon: '✅',
    description: 'Inquiry completed and resolved'
  }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#4CAF50', icon: '🟢', bgColor: '#E8F5E8' },
  medium: { label: 'Medium', color: '#FF9800', icon: '🟡', bgColor: '#FFF3E0' },
  high: { label: 'High', color: '#F44336', icon: '🔴', bgColor: '#FFEBEE' },
  urgent: { label: 'Urgent', color: '#E91E63', icon: '🚨', bgColor: '#FCE4EC' }
};

const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry', icon: '💬' },
  { value: 'sales', label: 'Sales', icon: '💰' },
  { value: 'support', label: 'Support', icon: '🛠️' },
  { value: 'partnership', label: 'Partnership', icon: '🤝' },
  { value: 'career', label: 'Career', icon: '💼' },
  { value: 'other', label: 'Other', icon: '📋' }
];

const RESPONSE_TEMPLATES = {
  initial_response: {
    title: "Initial Response",
    template: `Dear [NAME],

Thank you for your inquiry about [SUBJECT]. We have received your message and our team is reviewing your requirements.

Our team will get back to you within 24-48 hours with a detailed response.

If you have any urgent questions, please feel free to call us at +91 77365 38040.

Best regards,
GreonXpert Team`
  },
  proposal_ready: {
    title: "Proposal Ready",
    template: `Dear [NAME],

We are pleased to inform you that we have prepared a customized proposal for your sustainability requirements.

Our proposal includes:
- Detailed analysis of your current situation
- Recommended solutions tailored to your needs
- Implementation timeline and pricing

We would like to schedule a call to discuss the proposal in detail. Please let us know your preferred time.

Best regards,
GreonXpert Team`
  },
  follow_up: {
    title: "Follow Up",
    template: `Dear [NAME],

We wanted to follow up on our previous conversation regarding [SUBJECT].

We are still interested in helping you achieve your sustainability goals and would like to know if you have any questions or if there's anything specific you'd like to discuss.

Please feel free to reach out to us at your convenience.

Best regards,
GreonXpert Team`
  }
};

const ContactFormPanel = () => {
  // State management
  const [contactForms, setContactForms] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [selectedForms, setSelectedForms] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [headerExpanded, setHeaderExpanded] = useState(true); // New state for accordion

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    inquiryType: 'all',
    isRead: 'all'
  });

  // Pagination and sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Dialog states
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    notes: '',
    estimatedValue: '',
    statusChangeReason: '',
    sendUpdateEmail: false
  });

  // Response form state
  const [responseForm, setResponseForm] = useState({
    response: '',
    responseType: 'email',
    sendEmail: true,
    emailSubject: '',
    template: '',
    isUrgent: false
  });

  // Auth setup
  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  const toast = (message, type = 'success') => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: 'success', message: '' }), 4000);
  };

  // Date formatting functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDistanceToNow = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return '1 week ago';
    return `${diffInWeeks} weeks ago`;
  };

  // Fetch contact forms
  const fetchContactForms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      params.append('page', page + 1);
      params.append('limit', rowsPerPage);
      params.append('sort', order === 'desc' ? `-${orderBy}` : orderBy);

      const res = await axios.get(`${API_URL}/contact-forms?${params.toString()}`, authHeader);
      if (res.data?.success) {
        setContactForms(res.data.data || []);
        setTotalCount(res.data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch contact forms:', error);
      toast('Failed to fetch contact forms', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/contact-forms/analytics/dashboard`, authHeader);
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  // Setup Socket.IO and initial load
  useEffect(() => {
    const socket = io(API_BASE);
    socket.emit('join-contact-room', 'contact-forms-admin');
    
    socket.on('new-contact-form', (payload) => {
      if (payload?.success) {
        toast('📩 New contact form received!', 'info');
        fetchContactForms();
        fetchAnalytics();
      }
    });

    socket.on('contact-form-updated', (payload) => {
      if (payload?.success) {
        toast('✅ Contact form updated!', 'success');
        fetchContactForms();
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchContactForms();
  }, [filters, page, rowsPerPage, orderBy, order]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filter and dialog handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleSort = (field) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedForms(contactForms.map(form => form._id));
    } else {
      setSelectedForms([]);
    }
  };

  const handleSelectForm = (formId) => {
    setSelectedForms(prev =>
      prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const openViewDialog = (form) => {
    setSelectedForm(form);
    setViewDialog(true);
  };

  const openEditDialog = (form) => {
    setSelectedForm(form);
    setEditForm({
      status: form.status,
      priority: form.priority,
      notes: form.notes || '',
      estimatedValue: form.estimatedValue || '',
      statusChangeReason: '',
      sendUpdateEmail: false
    });
    setEditDialog(true);
  };

  const openResponseDialog = (form) => {
    setSelectedForm(form);
    setResponseForm({
      response: '',
      responseType: 'email',
      sendEmail: true,
      emailSubject: `Re: ${form.subject}`,
      template: '',
      isUrgent: form.priority === 'urgent' || form.priority === 'high'
    });
    setResponseDialog(true);
  };

  // Apply template to response
  const applyTemplate = (templateKey) => {
    const template = RESPONSE_TEMPLATES[templateKey];
    if (template && selectedForm) {
      let responseText = template.template
        .replace(/\[NAME\]/g, selectedForm.name)
        .replace(/\[SUBJECT\]/g, selectedForm.subject)
        .replace(/\[COMPANY\]/g, selectedForm.company || 'your organization');
      
      setResponseForm(prev => ({
        ...prev,
        response: responseText,
        emailSubject: `${template.title}: ${selectedForm.subject}`
      }));
    }
  };

  // Update contact form
  const handleUpdateForm = async () => {
    if (!selectedForm) return;
    try {
      setSubmitting(true);
      await axios.put(`${API_URL}/contact-forms/${selectedForm._id}`, editForm, authHeader);
      toast('Contact form updated successfully!', 'success');
      setEditDialog(false);
      fetchContactForms();
    } catch (error) {
      console.error('Update failed:', error);
      toast(error.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Add response
  const handleAddResponse = async () => {
    if (!selectedForm || !responseForm.response.trim()) {
      toast('Please enter a response', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const responseData = {
        response: responseForm.response,
        responseType: responseForm.responseType,
        sendEmail: responseForm.sendEmail,
        emailSubject: responseForm.emailSubject,
        isUrgent: responseForm.isUrgent
      };

      await axios.post(`${API_URL}/contact-forms/${selectedForm._id}/responses`, responseData, authHeader);
      toast('Response sent successfully!', 'success');
      setResponseDialog(false);
      fetchContactForms();
    } catch (error) {
      console.error('Add response failed:', error);
      toast(error.response?.data?.message || 'Failed to send response', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk mark as read
  const handleBulkMarkAsRead = async () => {
    if (selectedForms.length === 0) {
      toast('Please select forms to mark as read', 'warning');
      return;
    }

    try {
      await axios.put(`${API_URL}/contact-forms/bulk/mark-read`, { ids: selectedForms }, authHeader);
      toast(`${selectedForms.length} forms marked as read`, 'success');
      setSelectedForms([]);
      fetchContactForms();
    } catch (error) {
      toast('Failed to mark as read', 'error');
    }
  };

  // Status and Priority chip components
  const StatusChip = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
    return (
      <Chip
        label={`${config.icon} ${config.label}`}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem'
        }}
      />
    );
  };

  const PriorityChip = ({ priority }) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
    return (
      <Chip
        label={`${config.icon} ${config.label}`}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem'
        }}
      />
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'hidden',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
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
          background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 50%, #306659ff 100%)',
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)', mb: 1 }}>
                  <ContactIcon sx={{ mr: 2, fontSize: '2rem' }} />
                  Contact Form Management
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage customer inquiries, responses, and track conversions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="contained"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => setAnalyticsDialog(true)}
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
                  Analytics
                </Button>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={fetchContactForms}
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
                    px: 3,
                    py: 1.5,
                    transition: 'all 0.3s ease'
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ pt: 0 }}>
            {/* Analytics Cards */}
            {analytics && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                      {analytics.overview?.totalForms || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      📊 Total Forms
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                      {analytics.overview?.totalOpen || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      🔓 Open Forms
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                      {analytics.overview?.totalDeals || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      🎉 Deals Signed
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                      {analytics.overview?.unreadForms || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      📧 Unread Forms
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search contact forms..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
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
                sx={{ flexGrow: 1, maxWidth: '300px' }}
              />
              
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={e => handleFilterChange('status', e.target.value)}
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
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.icon} {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={e => handleFilterChange('priority', e.target.value)}
                  label="Priority"
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
                  <MenuItem value="all">All Priorities</MenuItem>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.icon} {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Type</InputLabel>
                <Select
                  value={filters.inquiryType}
                  onChange={e => handleFilterChange('inquiryType', e.target.value)}
                  label="Type"
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
                  <MenuItem value="all">All Types</MenuItem>
                  {INQUIRY_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedForms.length > 0 && (
                <Button
                  variant="contained"
                  onClick={handleBulkMarkAsRead}
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    '&:hover': { backgroundColor: 'rgba(76, 175, 80, 1)' },
                    borderRadius: 3
                  }}
                >
                  ✅ Mark Read ({selectedForms.length})
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Scrollable Table Container with Custom Scrollbar */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'hidden',
          mx: 2,
          mb: 2,

        }}
      >
        <Paper 
          sx={{ 
            height: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'

          }}
        >
          {loading && <LinearProgress sx={{ height: 2 }} />}
          
          <TableContainer 
            sx={{ 
              flex: 1,
              // Custom Scrollbar Styling
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '10px',
                margin: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #1AC99F, #2196F3, #FF9800)',
                borderRadius: '10px',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
                transition: 'all 0.3s ease',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'linear-gradient(135deg, #FF9800, #2196F3, #1AC99F)',
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
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }}>
                    <Checkbox
                      checked={selectedForms.length > 0 && selectedForms.length === contactForms.length}
                      indeterminate={selectedForms.length > 0 && selectedForms.length < contactForms.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }}>
                    <Button
                      onClick={() => handleSort('name')}
                      startIcon={<SortIcon />}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      👤 Contact
                    </Button>
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }}>📝 Subject</TableCell>
                  <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }}>📊 Status</TableCell>
                  <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }}>🔥 Priority</TableCell>
                  <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }}>📂 Type</TableCell>
                  <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }}>
                    <Button
                      onClick={() => handleSort('createdAt')}
                      startIcon={<SortIcon />}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      📅 Date
                    </Button>
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }} align="center">⚡ Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contactForms.map((form) => (
                  <TableRow 
                    key={form._id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(26, 201, 159, 0.05)',
                        transform: 'scale(1.001)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease',
                      borderLeft: !form.isRead ? '4px solid #ff5722' : '4px solid transparent'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedForms.includes(form._id)}
                        onChange={() => handleSelectForm(form._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge
                          variant="dot"
                          color={form.isRead ? 'default' : 'error'}
                          sx={{
                            '& .MuiBadge-dot': {
                              display: form.isRead ? 'none' : 'block'
                            }
                          }}
                        >
                          <Avatar sx={{ bgcolor: '#1AC99F', width: 40, height: 40 }}>
                            {form.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {form.name}
                          </Typography>
                          {!form.isRead && (
                            <Chip label="New" size="small" color="error" sx={{ fontSize: '0.6rem', height: 16 }} />
                          )}
                          <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                            📧 {form.email}
                          </Typography>
                          {form.company && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                              🏢 {form.company}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {form.subject}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#666',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {form.message?.substring(0, 80)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={form.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityChip priority={form.priority} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${INQUIRY_TYPES.find(t => t.value === form.inquiryType)?.icon} ${form.inquiryType}`}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize', borderRadius: 3 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(form.createdAt)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        ⏱️ {formatDistanceToNow(form.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => openViewDialog(form)}
                            sx={{ color: '#1AC99F' }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(form)}
                            sx={{ color: '#2196F3' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reply">
                          <IconButton
                            size="small"
                            onClick={() => openResponseDialog(form)}
                            sx={{ color: '#FF9800' }}
                          >
                            <ReplyIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{ borderTop: '1px solid #e0e0e0' }}
          />
        </Paper>

        {!loading && contactForms.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'linear-gradient(135deg, rgba(26, 201, 159, 0.05), rgba(33, 150, 243, 0.05))',
            borderRadius: 4,
            border: '2px dashed rgba(26, 201, 159, 0.2)',
            mt: 2
          }}>
            <Box sx={{ mb: 3 }}>
              <ContactIcon sx={{ fontSize: 64, color: 'rgba(26, 201, 159, 0.4)' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              No contact forms found
            </Typography>
            <Typography variant="body1" sx={{ color: '#546e7a' }}>
              {filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.inquiryType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No contact forms have been submitted yet'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* All existing dialogs remain the same - View Dialog, Edit Dialog, Response Dialog, Analytics Dialog */}
      {/* ... (keeping all the existing dialog components exactly as they were) ... */}

      {/* View Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)}
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
          <ContactIcon sx={{ mr: 1 }} />
          📋 Contact Form Details
          <IconButton
            onClick={() => setViewDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, overflow: 'auto' }}>
          {selectedForm && (
            <>
              {/* Contact Information */}
              <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">👤 Contact Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Name</Typography>
                      <Typography variant="body1">{selectedForm.name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Email</Typography>
                      <Typography variant="body1">{selectedForm.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Phone</Typography>
                      <Typography variant="body1">{selectedForm.phone || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Company</Typography>
                      <Typography variant="body1">{selectedForm.company || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Designation</Typography>
                      <Typography variant="body1">{selectedForm.designation || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Submitted</Typography>
                      <Typography variant="body1">{formatDate(selectedForm.createdAt)}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Message Details */}
              <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">💬 Message Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Subject</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedForm.subject}</Typography>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Message</Typography>
                  <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{selectedForm.message}</Typography>
                  
                  <Chip
                    label={`${INQUIRY_TYPES.find(t => t.value === selectedForm.inquiryType)?.icon} ${selectedForm.inquiryType}`}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </AccordionDetails>
              </Accordion>

              {/* Response History */}
              {selectedForm.responses && selectedForm.responses.length > 0 && (
                <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">💬 Response History ({selectedForm.responses.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {selectedForm.responses.map((response, index) => (
                        <Paper key={index} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {response.respondedBy?.name || 'Team Member'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {formatDate(response.responseDate)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {response.response}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setViewDialog(false)} variant="outlined">
            Close
          </Button>
          <Button 
            onClick={() => { setViewDialog(false); openEditDialog(selectedForm); }}
            variant="contained"
            sx={{ 
              bgcolor: '#1AC99F', 
              '&:hover': { bgcolor: '#0E9A78' }
            }}
          >
            Edit Form
          </Button>
          <Button 
            onClick={() => { setViewDialog(false); openResponseDialog(selectedForm); }}
            variant="contained"
            sx={{ 
              bgcolor: '#FF9800', 
              '&:hover': { bgcolor: '#F57C00' }
            }}
          >
            Send Response
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #E3F2FD)', 
          color: '#1AC99F', 
          fontWeight: 700
        }}>
          ✏️ Edit Contact Form - {selectedForm?.name}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{config.icon}</span>
                          <Typography>{config.label}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {config.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editForm.priority}
                  onChange={e => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{config.icon}</span>
                        <Typography>{config.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Status Change Reason"
                value={editForm.statusChangeReason}
                onChange={e => setEditForm(prev => ({ ...prev, statusChangeReason: e.target.value }))}
                placeholder="Reason for status change (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Value"
                value={editForm.estimatedValue}
                onChange={e => setEditForm(prev => ({ ...prev, estimatedValue: e.target.value }))}
                placeholder="Potential deal value"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Internal Notes"
                value={editForm.notes}
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add internal notes..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.sendUpdateEmail}
                    onChange={e => setEditForm(prev => ({ ...prev, sendUpdateEmail: e.target.checked }))}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      📧 Send status update email to customer
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Customer will receive an automated email notification about this status change
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setEditDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateForm} 
            variant="contained"
            disabled={submitting}
            sx={{ 
              bgcolor: '#1AC99F', 
              '&:hover': { bgcolor: '#0E9A78' }
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Update & Notify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog 
        open={responseDialog} 
        onClose={() => setResponseDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #FFF3E0, #E3F2FD)', 
          color: '#FF9800', 
          fontWeight: 700
        }}>
          💬 Send Response to {selectedForm?.name}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {/* Response Type Selection */}
          <Typography variant="h6" sx={{ mb: 2 }}>📝 Response Type</Typography>
          <RadioGroup
            value={responseForm.responseType}
            onChange={e => setResponseForm(prev => ({ ...prev, responseType: e.target.value }))}
            row
          >
            <FormControlLabel 
              value="email" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Email to Customer</Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Send response directly to customer's email
                  </Typography>
                </Box>
              } 
            />
            <FormControlLabel 
              value="internal" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Internal Note</Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Add internal note for team reference
                  </Typography>
                </Box>
              } 
            />
          </RadioGroup>

          {/* Email Subject */}
          {responseForm.responseType === 'email' && (
            <TextField
              fullWidth
              label="Email Subject"
              value={responseForm.emailSubject}
              onChange={e => setResponseForm(prev => ({ ...prev, emailSubject: e.target.value }))}
              sx={{ mt: 2, mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                )
              }}
            />
          )}

          {/* Quick Templates */}
          {responseForm.responseType === 'email' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>🚀 Quick Templates</Typography>
              <Grid container spacing={2}>
                {Object.entries(RESPONSE_TEMPLATES).map(([key, template]) => (
                  <Grid item xs={12} sm={4} key={key}>
                    <Button
                      variant="outlined"
                      onClick={() => applyTemplate(key)}
                      sx={{
                        height: 80,
                        width: '100%',
                        textTransform: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': { backgroundColor: '#FF980020' }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {template.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Click to apply
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Response Content */}
          <Typography variant="h6" sx={{ mb: 1 }}>✍️ Response Content</Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={responseForm.response}
            onChange={e => setResponseForm(prev => ({ ...prev, response: e.target.value }))}
            placeholder={responseForm.responseType === 'email'
              ? "Type your email response to the customer..."
              : "Add internal notes for team reference..."
            }
            helperText={`${responseForm.response.length}/2000 characters`}
          />

          {/* Email Options */}
          {responseForm.responseType === 'email' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>📧 Email Options</Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={responseForm.sendEmail}
                      onChange={e => setResponseForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Send email immediately</Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Email will be sent to {selectedForm?.email}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={responseForm.isUrgent}
                      onChange={e => setResponseForm(prev => ({ ...prev, isUrgent: e.target.checked }))}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>🚨 Mark as urgent</Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        High priority email notification
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </Box>
          )}

          {/* Preview */}
          {responseForm.response && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>👀 Preview</Typography>
              <Paper sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                {responseForm.responseType === 'email' && (
                  <Box sx={{ mb: 2, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="body2"><strong>To:</strong> {selectedForm?.email}</Typography>
                    <Typography variant="body2"><strong>Subject:</strong> {responseForm.emailSubject}</Typography>
                  </Box>
                )}
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {responseForm.response}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setResponseDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleAddResponse} 
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{
              bgcolor: '#FF9800',
              '&:hover': { bgcolor: '#F57C00' }
            }}
          >
            {submitting ? (
              'Sending...'
            ) : (
              responseForm.responseType === 'email' ? 'Send Email Response' : 'Add Internal Note'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog 
        open={analyticsDialog} 
        onClose={() => setAnalyticsDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #E3F2FD)', 
          color: '#1AC99F', 
          fontWeight: 700
        }}>
          📊 Contact Form Analytics
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {analytics && (
            <>
              {/* Overview Cards */}
              <Typography variant="h6" sx={{ mb: 2 }}>📈 Overview</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#1AC99F', fontWeight: 700 }}>
                      {analytics.overview?.totalForms || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Total Forms
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#2196F3', fontWeight: 700 }}>
                      {analytics.overview?.totalOpen || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Open
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                      {analytics.overview?.totalDeals || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Deals
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 700 }}>
                      {analytics.overview?.unreadForms || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Unread
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Status Distribution */}
              <Typography variant="h6" sx={{ mb: 2 }}>📊 Status Distribution</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {analytics.distributions?.status?.map((item) => (
                  <Grid item xs={6} sm={4} md={2} key={item._id}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h5" sx={{ color: STATUS_CONFIG[item._id]?.color, fontWeight: 700 }}>
                        {item.count}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {STATUS_CONFIG[item._id]?.icon} {STATUS_CONFIG[item._id]?.label || item._id}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Priority Distribution */}
              <Typography variant="h6" sx={{ mb: 2 }}>🔥 Priority Distribution</Typography>
              <Grid container spacing={2}>
                {analytics.distributions?.priority?.map((item) => (
                  <Grid item xs={6} sm={3} key={item._id}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h5" sx={{ color: PRIORITY_CONFIG[item._id]?.color, fontWeight: 700 }}>
                        {item.count}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {PRIORITY_CONFIG[item._id]?.icon} {PRIORITY_CONFIG[item._id]?.label || item._id}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAnalyticsDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactFormPanel;
