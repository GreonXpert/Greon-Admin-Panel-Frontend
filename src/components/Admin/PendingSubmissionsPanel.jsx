// src/components/Admin/PendingSubmissionsPanel.jsx - Enhanced Version with Scrolling & Card Alignment

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar,
  IconButton, Tooltip, FormControlLabel, Switch,
  Grid, Paper, Avatar, Collapse, CardMedia, Accordion,
  AccordionSummary, AccordionDetails, Stack
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import io from 'socket.io-client';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { API_BASE } from '../../utils/api';


const StyledCard = styled(Card)(({ theme, status }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  border: `2px solid ${
    status === 'pending' ? alpha(theme.palette.warning.main, 0.2) :
    status === 'approved' ? alpha(theme.palette.success.main, 0.2) :
    status === 'rejected' ? alpha(theme.palette.error.main, 0.2) :
    alpha(theme.palette.info.main, 0.2)
  }`,
  borderLeft: `6px solid ${
    status === 'pending' ? theme.palette.warning.main :
    status === 'approved' ? theme.palette.success.main :
    status === 'rejected' ? theme.palette.error.main :
    theme.palette.info.main
  }`,
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
    background: `linear-gradient(90deg, ${
      status === 'pending' ? theme.palette.warning.main :
      status === 'approved' ? theme.palette.success.main :
      status === 'rejected' ? theme.palette.error.main :
      theme.palette.info.main
    }, ${
      status === 'pending' ? alpha(theme.palette.warning.main, 0.7) :
      status === 'approved' ? alpha(theme.palette.success.main, 0.7) :
      status === 'rejected' ? alpha(theme.palette.error.main, 0.7) :
      alpha(theme.palette.info.main, 0.7)
    })`,
    zIndex: 1
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 12px 40px ${
      status === 'pending' ? alpha(theme.palette.warning.main, 0.15) :
      status === 'approved' ? alpha(theme.palette.success.main, 0.15) :
      status === 'rejected' ? alpha(theme.palette.error.main, 0.15) :
      alpha(theme.palette.info.main, 0.15)
    }`,
    '& .card-actions': {
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  ...(status === 'pending' && {
    backgroundColor: alpha(theme.palette.warning.main, 0.1),
    color: theme.palette.warning.main,
  }),
  ...(status === 'approved' && {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.main,
  }),
  ...(status === 'rejected' && {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
  }),
  ...(status === 'needs_revision' && {
    backgroundColor: alpha(theme.palette.info.main, 0.1),
    color: theme.palette.info.main,
  }),
}));

// Image component with error handling
const SubmissionImage = ({ src, alt, width = 120, height = 80 }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (error || !src) {
    return (
      <Box sx={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 2,
        border: '1px solid #e0e0e0'
      }}>
        <ImageIcon sx={{ color: '#999', fontSize: 24 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width, height }}>
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 2
        }}>
          <Typography variant="caption">Loading...</Typography>
        </Box>
      )}
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 8,
          border: '1px solid #e0e0e0'
        }}
        onError={handleError}
        onLoad={handleLoad}
      />
    </Box>
  );
};

const PendingSubmissionsPanel = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedSubmissions, setExpandedSubmissions] = useState(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewDialog, setReviewDialog] = useState({ open: false, type: 'approve' });
  const [reviewNotes, setReviewNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewDialog, setViewDialog] = useState({ open: false, submission: null });
  const socketRef = useRef(null);

  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [token]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/pending-submissions`, {
        ...authHeader,
        params: { status: statusFilter }
      });
      if (data?.success) {
        console.log('📥 Fetched submissions:', data.data.submissions.length);
        setSubmissions(data.data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      showSnackbar('Failed to fetch submissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeader, statusFilter, showSnackbar]);

  useEffect(() => {
    fetchSubmissions();
    
    // Socket.IO for real-time updates
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Pending Submissions Socket Connected:', socket.id);
      socket.emit('join-admin-room');
    });

    socket.on('new-submission', (payload) => {
      if (payload?.success) {
        fetchSubmissions();
        showSnackbar(`New submission: "${payload.data?.title}"`, 'info');
      }
    });

    socket.on('submission-approved', (payload) => {
      fetchSubmissions();
      showSnackbar(`Submission approved: "${payload.submission?.title}"`, 'success');
    });

    socket.on('submission-rejected', (payload) => {
      fetchSubmissions();
      showSnackbar(`Submission rejected: "${payload.submission?.title}"`, 'warning');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchSubmissions, showSnackbar]);

  const toggleExpanded = (submissionId) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedSubmissions(newExpanded);
  };

  const openReviewDialog = (submission, type) => {
    setSelectedSubmission(submission);
    setReviewDialog({ open: true, type });
    setReviewNotes('');
  };

  const openViewDialog = (submission) => {
    setViewDialog({ open: true, submission });
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      const endpoint = reviewDialog.type === 'approve'
        ? `${API_BASE}/api/pending-submissions/${selectedSubmission._id}/approve`
        : `${API_BASE}/api/pending-submissions/${selectedSubmission._id}/reject`;

      const payload = reviewDialog.type === 'approve'
        ? { reviewNotes, storyData: {} }
        : { reviewNotes };

      const { data } = await axios.post(endpoint, payload, authHeader);

      if (data?.success) {
        setReviewDialog({ open: false, type: 'approve' });
        setSelectedSubmission(null);
        setReviewNotes('');
        fetchSubmissions();

        const message = reviewDialog.type === 'approve'
          ? 'Submission approved and story published!'
          : 'Submission rejected';
        showSnackbar(message, 'success');
      }
    } catch (error) {
      console.error('Review submission failed:', error);
      showSnackbar(error.response?.data?.message || 'Failed to review submission', 'error');
    }
  };

  const deleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;

    try {
      const { data } = await axios.delete(`${API_BASE}/api/pending-submissions/${submissionId}`, authHeader);
      if (data?.success) {
        fetchSubmissions();
        showSnackbar('Submission deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Delete submission failed:', error);
      showSnackbar('Failed to delete submission', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sanitizeAndParseContent = (content) => {
    if (!content) return '';
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: []
    });
    return parse(sanitized);
  };

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'hidden',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header - Fixed */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          m: 2, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 50%, #306659ff 100%)',
          color: 'white',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)', mb: 1 }}>
              <AssignmentIcon sx={{ mr: 2, fontSize: '2rem' }} />
              Pending Submissions
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Review and manage external story submissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchSubmissions}
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
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            label="Status Filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            size="small"
            sx={{ 
              minWidth: 200,
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
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.8)'
              }
            }}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="needs_revision">Needs Revision</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>
          
          <Chip 
            label={`${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 600
            }}
          />
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
          background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 50%, #306659ff 100%)',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            transition: 'all 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 50%, #306659ff 100%)',
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
        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                Loading submissions...
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
        ) : submissions.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(245, 124, 0, 0.05))',
            borderRadius: 4,
            border: '2px dashed rgba(255, 152, 0, 0.2)',
            margin: 2
          }}>
            <Box sx={{ mb: 3 }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'rgba(255, 152, 0, 0.4)' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              No submissions found
            </Typography>
            <Typography variant="body1" sx={{ color: '#546e7a' }}>
              Submissions matching your filter criteria will appear here
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {submissions.map((submission) => {
              const isExpanded = expandedSubmissions.has(submission._id);

              return (
                <Grid item xs={12} sm={6} key={submission._id}>
                  <StyledCard status={submission.status}>
                    <CardContent sx={{ flexGrow: 1, p: 3, pt: 2, position: 'relative' }}>
                      {/* Status Chip */}
                      <StatusChip 
                        status={submission.status} 
                        label={submission.status.replace('_', ' ').toUpperCase()}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 2
                        }}
                      />

                      {/* Submission Image */}
                      {submission.imageUrls?.main && (
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                          <SubmissionImage 
                            src={submission.imageUrls.main} 
                            alt={submission.title}
                            width={120}
                            height={80}
                          />
                        </Box>
                      )}

                      {/* Title and Description */}
                      <Typography 
                        variant="h6" 
                        component="h3"
                        sx={{ 
                          fontWeight: 700,
                          color: '#2c3e50',
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                          mb: 1,
                          pr: 8 // Space for status chip
                        }}
                      >
                        {submission.title}
                      </Typography>
                      
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
                        {submission.description}
                      </Typography>

                      {/* Submitter Info */}
                      <Box sx={{ 
                        p: 2, 
                        backgroundColor: 'rgba(0, 0, 0, 0.02)', 
                        borderRadius: 2,
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, color: '#666' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {submission.submitterName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <EmailIcon sx={{ fontSize: 16, color: '#666' }} />
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {submission.submitterEmail}
                          </Typography>
                        </Box>
                        {submission.submitterOrganization && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <BusinessIcon sx={{ fontSize: 16, color: '#666' }} />
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {submission.submitterOrganization}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: '#666' }} />
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {formatDate(submission.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* File Attachments Summary */}
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {submission.imageUrls?.main && (
                          <Chip 
                            icon={<ImageIcon />} 
                            label="Main Image" 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                        {submission.imageUrls?.author && (
                          <Chip 
                            icon={<PersonIcon />} 
                            label="Author Image" 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                        {submission.imageUrls?.file && (
                          <Chip 
                            icon={<AttachFileIcon />} 
                            label="Resource File" 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>

                      {/* Expand/Collapse Section */}
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 2 }}>
                          {/* Images Section */}
                          {(submission.imageUrls?.main || submission.imageUrls?.author || submission.imageUrls?.file) && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Attached Files:
                              </Typography>
                              <Grid container spacing={1}>
                                {submission.imageUrls?.main && (
                                  <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                      <SubmissionImage 
                                        src={submission.imageUrls.main} 
                                        alt="Main Image"
                                        width="100%"
                                        height={80}
                                      />
                                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                        Main Image
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                                {submission.imageUrls?.author && (
                                  <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                      <SubmissionImage 
                                        src={submission.imageUrls.author} 
                                        alt="Author Image"
                                        width="100%"
                                        height={80}
                                      />
                                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                        Author Image
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                                {submission.imageUrls?.file && (
                                  <Grid item xs={4}>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      height: 80,
                                      backgroundColor: '#f5f5f5',
                                      borderRadius: 2,
                                      border: '1px solid #e0e0e0'
                                    }}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <AttachFileIcon sx={{ fontSize: 32, color: '#666' }} />
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                          Resource File
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                          {submission.resourceType || 'File'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          )}

                          {/* Content Preview */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Content Preview:
                            </Typography>
                            <Box sx={{ 
                              p: 2, 
                              backgroundColor: '#f9f9f9', 
                              borderRadius: 2,
                              maxHeight: 200,
                              overflow: 'auto',
                              '& p': { margin: '8px 0' },
                              '& h1, & h2, & h3': { margin: '12px 0 8px 0' }
                            }}>
                              {sanitizeAndParseContent(submission.content)}
                            </Box>
                          </Box>

                          {/* Category-specific Information */}
                          {submission.category === 'Blog' && submission.suggestedAuthor && (
                            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                              <strong>Suggested Author:</strong> {submission.suggestedAuthor}
                            </Typography>
                          )}
                          {submission.category === 'Video' && submission.videoUrl && (
                            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                              <strong>Video URL:</strong> {submission.videoUrl}
                            </Typography>
                          )}
                          {submission.category === 'Resources' && submission.resourceType && (
                            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                              <strong>Resource Type:</strong> {submission.resourceType}
                            </Typography>
                          )}

                          {/* Tags */}
                          {submission.suggestedTags && submission.suggestedTags.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Suggested Tags:
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                {submission.suggestedTags.map((tag, index) => (
                                  <Chip 
                                    key={index} 
                                    label={tag} 
                                    size="small"
                                    sx={{ 
                                      backgroundColor: 'rgba(0, 255, 136, 0.1)',
                                      color: '#1AC99F',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {/* Review Notes */}
                          {submission.reviewNotes && (
                            <Box sx={{ 
                              p: 2, 
                              backgroundColor: 'rgba(0, 255, 55, 0.05)', 
                              borderRadius: 2,
                              border: '1px solid rgba(0, 255, 13, 0.2)',
                              mb: 2
                            }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Review Notes:
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {submission.reviewNotes}
                              </Typography>
                              {submission.reviewedBy && (
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  Reviewed by: {submission.reviewedBy.name} on {formatDate(submission.reviewedAt)}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>

                    {/* Action Buttons */}
                    <CardActions 
                      className="card-actions"
                      sx={{ 
                        p: 2, 
                        pt: 0, 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        opacity: 0.7,
                        transform: 'translateY(4px)',
                        transition: 'all 0.3s ease',
                        flexWrap: 'wrap'
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Tooltip title="View Details">
                          <Button
                            onClick={() => openViewDialog(submission)}
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            sx={{ 
                              color: '#1AC99F',
                              borderColor: 'rgba(0, 255, 98, 0.4)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: 'rgba(255, 152, 0, 0.1)',
                                borderColor: '#1AC99F',
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            View
                          </Button>
                        </Tooltip>

                        {submission.status === 'pending' && (
                          <>
                            <Tooltip title="Approve Submission">
                              <Button
                                onClick={() => openReviewDialog(submission, 'approve')}
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<ApproveIcon />}
                                sx={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  '&:hover': {
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              >
                                Approve
                              </Button>
                            </Tooltip>
                            <Tooltip title="Reject Submission">
                              <Button
                                onClick={() => openReviewDialog(submission, 'reject')}
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<RejectIcon />}
                                sx={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  '&:hover': {
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              >
                                Reject
                              </Button>
                            </Tooltip>
                          </>
                        )}

                        <Tooltip title="Delete Submission">
                          <IconButton
                            onClick={() => deleteSubmission(submission._id)}
                            size="small"
                            color="error"
                            sx={{
                              '&:hover': {
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Tooltip title={isExpanded ? "Show Less" : "Show More"}>
                        <IconButton
                          onClick={() => toggleExpanded(submission._id)}
                          size="small"
                          sx={{ color: '#1AC99F' }}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </StyledCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* View Dialog for Full Submission Details */}
      <Dialog 
        open={viewDialog.open} 
        onClose={() => setViewDialog({ open: false, submission: null })}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1AC99F, #0E9A78)', 
          color: '#ffff', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <AssignmentIcon sx={{ mr: 1 }} />
          Submission Details: {viewDialog.submission?.title}
          <IconButton
            onClick={() => setViewDialog({ open: false, submission: null })}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, overflow: 'auto' }}>
          {viewDialog.submission && (
            <>
              {/* Submission Images */}
              <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">📎 Attached Files</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {viewDialog.submission.imageUrls?.main && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Main Image
                          </Typography>
                          <SubmissionImage 
                            src={viewDialog.submission.imageUrls.main} 
                            alt="Main Image"
                            width="100%"
                            height={150}
                          />
                        </Box>
                      </Grid>
                    )}
                    {viewDialog.submission.imageUrls?.author && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Author Image
                          </Typography>
                          <SubmissionImage 
                            src={viewDialog.submission.imageUrls.author} 
                            alt="Author Image"
                            width="100%"
                            height={150}
                          />
                        </Box>
                      </Grid>
                    )}
                    {viewDialog.submission.imageUrls?.file && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Resource File
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: 150,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 2,
                            border: '1px solid #e0e0e0'
                          }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <AttachFileIcon sx={{ fontSize: 48, color: '#666' }} />
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {viewDialog.submission.resourceType || 'File'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Content */}
              <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">📄 Content</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: 2,
                    '& p': { margin: '8px 0' },
                    '& h1, & h2, & h3': { margin: '12px 0 8px 0' }
                  }}>
                    {sanitizeAndParseContent(viewDialog.submission.content)}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Category-specific details */}
              <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">📋 Category Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {viewDialog.submission.category === 'Blog' && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Suggested Author:</strong> {viewDialog.submission.suggestedAuthor}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Estimated Read Time:</strong> {viewDialog.submission.estimatedReadTime}
                          </Typography>
                        </Grid>
                      </>
                    )}
                    {viewDialog.submission.category === 'Video' && (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Video URL:</strong> {viewDialog.submission.videoUrl}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Duration:</strong> {viewDialog.submission.duration}
                          </Typography>
                        </Grid>
                        {viewDialog.submission.speakers && viewDialog.submission.speakers.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>Speakers:</strong> {viewDialog.submission.speakers.join(', ')}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    )}
                    {viewDialog.submission.category === 'Resources' && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Resource Type:</strong> {viewDialog.submission.resourceType}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Estimated Pages:</strong> {viewDialog.submission.estimatedPages}
                          </Typography>
                        </Grid>
                        {viewDialog.submission.resourceIncludes && viewDialog.submission.resourceIncludes.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>Includes:</strong> {viewDialog.submission.resourceIncludes.join(', ')}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Tags */}
              {viewDialog.submission.suggestedTags && viewDialog.submission.suggestedTags.length > 0 && (
                <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">🏷️ Suggested Tags</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {viewDialog.submission.suggestedTags.map((tag, index) => (
                        <Chip 
                          key={index} 
                          label={tag} 
                          color="primary" 
                          size="small"
                        />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Submitter Details */}
              <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">👤 Submitter Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Name:</strong> {viewDialog.submission.submitterName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Email:</strong> {viewDialog.submission.submitterEmail}
                      </Typography>
                    </Grid>
                    {viewDialog.submission.submitterOrganization && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Organization:</strong> {viewDialog.submission.submitterOrganization}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Target Audience:</strong> {viewDialog.submission.targetAudience}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Priority:</strong> {viewDialog.submission.urgency}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setViewDialog({ open: false, submission: null })} variant="outlined">
            Close
          </Button>
          {viewDialog.submission?.status === 'pending' && (
            <>
              <Button 
                onClick={() => {
                  setViewDialog({ open: false, submission: null });
                  openReviewDialog(viewDialog.submission, 'approve');
                }}
                color="success"
                variant="contained"
                startIcon={<ApproveIcon />}
              >
                Approve
              </Button>
              <Button 
                onClick={() => {
                  setViewDialog({ open: false, submission: null });
                  openReviewDialog(viewDialog.submission, 'reject');
                }}
                color="error"
                variant="outlined"
                startIcon={<RejectIcon />}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialog.open} 
        onClose={() => setReviewDialog({ open: false, type: 'approve' })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: reviewDialog.type === 'approve' 
            ? 'linear-gradient(135deg, #E8F5E8, #C8E6C8)' 
            : 'linear-gradient(135deg, #FFEBEE, #FFCDD2)', 
          color: reviewDialog.type === 'approve' ? '#4CAF50' : '#F44336', 
          fontWeight: 700
        }}>
          {reviewDialog.type === 'approve' ? <ApproveIcon sx={{ mr: 1 }} /> : <RejectIcon sx={{ mr: 1 }} />}
          {reviewDialog.type === 'approve' ? 'Approve Submission' : 'Reject Submission'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {selectedSubmission && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f9f9f9', 
              borderRadius: 2,
              mb: 3
            }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {selectedSubmission.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>By:</strong> {selectedSubmission.submitterName} ({selectedSubmission.submitterEmail})
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {selectedSubmission.category}
              </Typography>
            </Box>
          )}
          
          <TextField
            label="Review Notes"
            value={reviewNotes}
            onChange={e => setReviewNotes(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required={reviewDialog.type === 'reject'}
            placeholder={
              reviewDialog.type === 'approve'
                ? 'Optional notes about the approval...'
                : 'Please provide a clear reason for rejection...'
            }
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setReviewDialog({ open: false, type: 'approve' })} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleReviewSubmission}
            variant="contained"
            color={reviewDialog.type === 'approve' ? 'success' : 'error'}
            startIcon={reviewDialog.type === 'approve' ? <ApproveIcon /> : <RejectIcon />}
          >
            {reviewDialog.type === 'approve' ? 'Approve & Publish' : 'Reject Submission'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PendingSubmissionsPanel;
