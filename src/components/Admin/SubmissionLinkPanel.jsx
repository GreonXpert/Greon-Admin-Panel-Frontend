// src/components/Admin/SubmissionLinkPanel.jsx - Enhanced Version with Scrolling & Card Alignment

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Switch, Alert, Snackbar,
  IconButton, Tooltip, FormControlLabel, CircularProgress,
  Grid, Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import axios from 'axios';
import io from 'socket.io-client';
import { API_BASE } from '../../utils/api';


const StyledCard = styled(Card)(({ theme, isExpired, isInactive }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  border: `2px solid ${isInactive ? theme.palette.grey[300] : isExpired ? theme.palette.error.light : theme.palette.success.light}`,
  borderLeft: `6px solid ${isInactive ? theme.palette.grey[500] : isExpired ? theme.palette.error.main : theme.palette.success.main}`,
  opacity: isInactive || isExpired ? 0.7 : 1,
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
    background: `linear-gradient(90deg, ${isInactive ? theme.palette.grey[500] : isExpired ? theme.palette.error.main : theme.palette.success.main}, ${isInactive ? theme.palette.grey[400] : isExpired ? theme.palette.error.light : theme.palette.success.light})`,
    zIndex: 1
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 12px 40px ${isInactive ? 'rgba(158, 158, 158, 0.15)' : isExpired ? 'rgba(244, 67, 54, 0.15)' : 'rgba(76, 175, 80, 0.15)'}`,
    '& .card-actions': {
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
}));

const SubmissionLinkPanel = () => {
  const [submissionLinks, setSubmissionLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    allowedCategories: ['Blog'],
    maxSubmissions: 10,
    expiresInDays: 30
  });
  const socketRef = useRef(null);

  // Memoized auth header to prevent infinite re-renders
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, [token]);

  // Memoized showSnackbar to prevent dependency changes
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Stable fetchSubmissionLinks function
  const fetchSubmissionLinks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/submission-links`, authHeader);
      if (data?.success) {
        setSubmissionLinks(data.data.submissionLinks || []);
      }
    } catch (error) {
      console.error('Failed to fetch submission links:', error);
      const errorMessage = error.response?.status === 404
        ? 'Submission links API not found. Please check backend routes.'
        : error.response?.data?.message || 'Failed to fetch submission links';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeader, showSnackbar]);

  // Setup Socket.IO and initial load
  useEffect(() => {
    fetchSubmissionLinks();
    
    console.log('🔌 Connecting to Submission Links Socket...');
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Submission Links Socket Connected:', socket.id);
      socket.emit('join-admin-room');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      showSnackbar('Real-time updates unavailable', 'warning');
    });

    socket.on('submission-link-created', (payload) => {
      console.log('📝 New submission link created:', payload);
      if (payload?.success) {
        fetchSubmissionLinks();
        showSnackbar(`New submission link created: ${payload.data?.title || 'Unknown'}`, 'success');
      }
    });

    socket.on('submission-link-updated', (payload) => {
      console.log('✏️ Submission link updated:', payload);
      if (payload?.success) {
        fetchSubmissionLinks();
        showSnackbar(`Submission link updated: ${payload.data?.title || 'Unknown'}`, 'info');
      }
    });

    socket.on('submission-link-deleted', (payload) => {
      console.log('🗑️ Submission link deleted:', payload);
      fetchSubmissionLinks();
      showSnackbar(`Submission link deleted: ${payload.title || 'Unknown'}`, 'warning');
    });

    socket.on('disconnect', () => {
      console.log('❌ Submission Links Socket Disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [fetchSubmissionLinks, showSnackbar]);

  const handleCreateSubmissionLink = async () => {
    if (!formData.title.trim()) {
      showSnackbar('Please enter a title', 'error');
      return;
    }

    if (formData.allowedCategories.length === 0) {
      showSnackbar('Please select at least one category', 'error');
      return;
    }

    try {
      console.log('🚀 Sending submission link data:', formData);
      const { data } = await axios.post(`${API_BASE}/api/submission-links`, formData, authHeader);
      console.log('✅ Submission link created:', data);
      
      if (data?.success) {
        setOpenDialog(false);
        setFormData({
          title: '',
          description: '',
          allowedCategories: ['Blog'],
          maxSubmissions: 10,
          expiresInDays: 30
        });
        
        showSnackbar(
          `Submission link created! Password: ${data.data.password}`,
          'success'
        );
        fetchSubmissionLinks();
      }
    } catch (error) {
      console.error('❌ Failed to create submission link:', error);
      let errorMessage = 'Failed to create submission link';
      
      if (error.response) {
        const { status, data: errorData } = error.response;
        switch (status) {
          case 404:
            errorMessage = 'Submission links API not found. Please check backend routes.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please login as admin.';
            break;
          case 400:
            errorMessage = errorData?.message || 'Invalid data provided';
            break;
          case 500:
            errorMessage = errorData?.message || 'Server error occurred';
            break;
          default:
            errorMessage = errorData?.message || `Error ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if backend is running.';
      }

      showSnackbar(errorMessage, 'error');
    }
  };

  const handleToggleLink = async (id) => {
    try {
      const { data } = await axios.patch(`${API_BASE}/api/submission-links/${id}/toggle`, {}, authHeader);
      if (data?.success) {
        showSnackbar(data.message, 'success');
        fetchSubmissionLinks();
      }
    } catch (error) {
      console.error('Failed to toggle submission link:', error);
      showSnackbar(error.response?.data?.message || 'Failed to update submission link', 'error');
    }
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission link?')) return;
    
    try {
      const { data } = await axios.delete(`${API_BASE}/api/submission-links/${id}`, authHeader);
      if (data?.success) {
        showSnackbar('Submission link deleted successfully', 'success');
        fetchSubmissionLinks();
      }
    } catch (error) {
      console.error('Failed to delete submission link:', error);
      showSnackbar(error.response?.data?.message || 'Failed to delete submission link', 'error');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSnackbar('Copied to clipboard!', 'success');
    }
  };

  const isExpired = (expiresAt) => new Date() > new Date(expiresAt);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)', mb: 1 }}>
              <LinkIcon sx={{ mr: 2, fontSize: '2rem' }} />
              Submission Links
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Create and manage external submission links for stories
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
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
            Create Link
          </Button>
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
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                Loading submission links...
              </Typography>
              <CircularProgress size={40} sx={{ color: '#1AC99F' }} />
            </Box>
          </Box>
        )}

        {/* Empty State */}
        {!loading && submissionLinks.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'linear-gradient(135deg, rgba(26, 201, 159, 0.05), rgba(52, 152, 219, 0.05))',
            borderRadius: 4,
            border: '2px dashed rgba(26, 201, 159, 0.2)',
            margin: 2
          }}>
            <Box sx={{ mb: 3 }}>
              <LinkIcon sx={{ fontSize: 64, color: 'rgba(26, 201, 159, 0.4)' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              No submission links found
            </Typography>
            <Typography variant="body1" sx={{ color: '#546e7a', mb: 3 }}>
              Create your first submission link to allow external story submissions
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
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
              Create First Link
            </Button>
          </Box>
        )}

        {/* Submission Links Grid */}
        {!loading && submissionLinks.length > 0 && (
          <Grid container spacing={3}>
            {submissionLinks.map((link) => {
              const expired = isExpired(link.expiresAt);
              const inactive = !link.isActive;

              return (
                <Grid item xs={12} sm={6} key={link._id}>
                  <StyledCard isExpired={expired} isInactive={inactive}>
                    <CardContent sx={{ flexGrow: 1, p: 3, pt: 2, position: 'relative' }}>
                      {/* Status Indicators */}
                      {(inactive || expired) && (
                        <Chip
                          label={inactive ? 'Inactive' : 'Expired'}
                          color={inactive ? 'default' : 'error'}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 2,
                            fontWeight: 600
                          }}
                        />
                      )}
                      {!inactive && !expired && (
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 2,
                            fontWeight: 600
                          }}
                        />
                      )}

                      {/* Title and Description */}
                      <Typography 
                        variant="h6" 
                        component="h3"
                        sx={{ 
                          fontWeight: 700,
                          color: '#2c3e50',
                          fontSize: '1.2rem',
                          lineHeight: 1.3,
                          mb: 1,
                          pr: 8 // Space for status chip
                        }}
                      >
                        {link.title}
                      </Typography>
                      
                      {link.description && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#546e7a',
                            mb: 2,
                            lineHeight: 1.4
                          }}
                        >
                          {link.description}
                        </Typography>
                      )}

                      {/* Categories */}
                      <Box sx={{ mb: 2 }}>
                        {link.allowedCategories?.map((category, index) => (
                          <Chip 
                            key={index} 
                            label={category} 
                            size="small"
                            sx={{ 
                              mr: 0.5, 
                              mb: 0.5,
                              backgroundColor: 'rgba(26, 201, 159, 0.1)',
                              color: '#1AC99F',
                              fontWeight: 500
                            }}
                          />
                        ))}
                      </Box>

                      {/* Statistics */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: 2, 
                        mb: 2,
                        p: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 2
                      }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                            Submissions
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1AC99F' }}>
                            {link.currentSubmissions || 0}/{link.maxSubmissions || 0}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                            Password
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                            {link.password || '----'}
                          </Typography>
                        </Box>
                        <Box sx={{ gridColumn: 'span 2' }}>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                            Expires
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                            {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Never'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* URL */}
                      <Box sx={{ 
                        p: 2, 
                        backgroundColor: 'rgba(52, 152, 219, 0.05)', 
                        borderRadius: 2,
                        border: '1px solid rgba(52, 152, 219, 0.1)'
                      }}>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                          Submission URL
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            wordBreak: 'break-all', 
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: '#2196F3'
                          }}
                        >
                          {link.url || `${window.location.origin}/submit/${link.token}`}
                        </Typography>
                      </Box>
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
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Tooltip title="Copy URL">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CopyIcon />}
                          onClick={() => copyToClipboard(link.url || `${window.location.origin}/submit/${link.token}`)}
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
                          Copy
                        </Button>
                      </Tooltip>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={link.isActive}
                            onChange={() => handleToggleLink(link._id)}
                            size="small"
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#1AC99F',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#1AC99F',
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Active
                          </Typography>
                        }
                      />

                      <Tooltip title="Delete Link">
                        <IconButton
                          onClick={() => handleDeleteLink(link._id)}
                          color="error"
                          size="small"
                          sx={{
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <DeleteIcon />
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

      {/* Create Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        height="auto"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #EBF3FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <LinkIcon sx={{ mr: 1 }} />
          Create New Submission Link
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Title *"
                fullWidth
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                error={!formData.title.trim()}
                helperText={!formData.title.trim() ? 'Title is required' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Allowed Categories *"
                fullWidth
                value={formData.allowedCategories}
                onChange={e => setFormData({ ...formData, allowedCategories: e.target.value })}
                SelectProps={{ multiple: true }}
                required
                error={formData.allowedCategories.length === 0}
                helperText={formData.allowedCategories.length === 0 ? 'Select at least one category' : ''}
              >
                <MenuItem value="Blog">Blog</MenuItem>
                <MenuItem value="Video">Video</MenuItem>
                <MenuItem value="Resources">Resources</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Submissions"
                type="number"
                fullWidth
                value={formData.maxSubmissions}
                onChange={e => setFormData({ ...formData, maxSubmissions: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Expires In (Days)"
                type="number"
                fullWidth
                value={formData.expiresInDays}
                onChange={e => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateSubmissionLink}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1AC99F, #3498DB)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0E9A78, #2980B9)',
              }
            }}
          >
            Create Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default SubmissionLinkPanel;
