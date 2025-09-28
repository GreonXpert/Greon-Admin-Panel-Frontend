// src/components/Career/components/ApplicationsManager.jsx - WORKING PDF PREVIEW

import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Grid, TextField, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, LinearProgress, Checkbox, Avatar,
  Chip, IconButton, Tooltip, TablePagination, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Stack, CircularProgress,
  Tabs, Tab
} from '@mui/material';
import {
  Search as SearchIcon, Visibility as ViewIcon, Edit as EditIcon,
  Download as DownloadIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon, Close as CloseIcon,
  PictureAsPdf as PdfIcon, ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon, OpenInNew as OpenInNewIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../../../utils/api';

const API_URL = `${API_BASE}/api/careers`;

const APPLICATION_STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#2196F3', bgColor: '#E3F2FD', icon: '⏳' },
  reviewing: { label: 'Reviewing', color: '#FF9800', bgColor: '#FFF3E0', icon: '🔍' },
  shortlisted: { label: 'Shortlisted', color: '#9C27B0', bgColor: '#F3E5F5', icon: '⭐' },
  interview_scheduled: { label: 'Interview Scheduled', color: '#673AB7', bgColor: '#EDE7F6', icon: '📅' },
  interviewed: { label: 'Interviewed', color: '#3F51B5', bgColor: '#E8EAF6', icon: '🤝' },
  selected: { label: 'Selected', color: '#4CAF50', bgColor: '#E8F5E8', icon: '🎉' },
  rejected: { label: 'Rejected', color: '#F44336', bgColor: '#FFEBEE', icon: '❌' },
  withdrawn: { label: 'Withdrawn', color: '#9E9E9E', bgColor: '#F5F5F5', icon: '🔙' }
};

// FIXED: Enhanced PDF Viewer with better loading handling
const PdfViewer = ({ resumeUrl, applicantName, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadTimeout, setLoadTimeout] = useState(null);

  React.useEffect(() => {
    if (resumeUrl) {
      // Set a timeout to handle cases where onLoad never fires
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('PDF preview timed out. Please try downloading the file.');
      }, 10000); // 10 second timeout

      setLoadTimeout(timeout);

      // Clear timeout if component unmounts
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [resumeUrl]);

  const handleLoad = () => {
    setLoading(false);
    setError('');
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load PDF. Your browser might not support PDF preview.');
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
  };

  const openInNewTab = () => {
    window.open(resumeUrl, '_blank');
  };

  return (
    <Box sx={{ position: 'relative', height: '70vh', border: '1px solid #e0e0e0', borderRadius: 2 }}>
      {/* PDF Controls */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2, 
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#f8f9fa'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon sx={{ color: '#d32f2f' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {applicantName}_Resume.pdf
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Open in New Tab">
            <IconButton onClick={openInNewTab} sx={{ color: '#1976d2' }}>
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download">
            <IconButton onClick={onDownload} sx={{ color: '#1976d2' }}>
              <GetAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* PDF Content */}
      <Box sx={{ 
        height: 'calc(100% - 73px)', 
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: loading || error ? 'center' : 'stretch',
        bgcolor: '#fafafa',
        position: 'relative'
      }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Loading PDF preview...
            </Typography>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              If this takes too long, try downloading the PDF directly
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
            <PdfIcon sx={{ fontSize: 60, color: '#d32f2f', opacity: 0.5 }} />
            <Typography variant="body1" color="error" textAlign="center" sx={{ maxWidth: 400 }}>
              {error}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                onClick={openInNewTab}
                startIcon={<OpenInNewIcon />}
                sx={{ bgcolor: '#1976d2' }}
              >
                Open in New Tab
              </Button>
              <Button 
                variant="contained" 
                onClick={onDownload}
                startIcon={<DownloadIcon />}
                sx={{ bgcolor: '#FF9800' }}
              >
                Download PDF
              </Button>
            </Stack>
          </Box>
        )}

        {resumeUrl && !error && (
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Primary iframe approach */}
            <iframe
              src={resumeUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '4px',
                display: loading ? 'none' : 'block'
              }}
              onLoad={handleLoad}
              onError={handleError}
              title={`${applicantName} Resume`}
            />
            
            {/* Fallback: Direct object embed */}
            <object
              data={resumeUrl}
              type="application/pdf"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: loading ? -1 : 1
              }}
              onLoad={handleLoad}
              onError={handleError}
            >
              <embed
                src={resumeUrl}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </object>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`application-tabpanel-${index}`}
    aria-labelledby={`application-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const ApplicationsManager = ({ 
  applications, 
  totalApplications, 
  jobs, 
  loading, 
  onRefresh, 
  onStatusUpdate, 
  toast 
}) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    jobId: 'all'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [viewDialog, setViewDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', note: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dialogTab, setDialogTab] = useState(0); // 0 = Details, 1 = Resume Preview
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

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

  // Format salary properly to avoid object rendering error
  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    if (typeof salary === 'string') return salary;
    if (typeof salary === 'object') {
      const { amount, currency = 'INR' } = salary;
      if (amount) return `${currency} ${Number(amount).toLocaleString()}`;
      return 'Not specified';
    }
    return String(salary);
  };

  // Format any field that might be an object
  const formatField = (field, fallback = 'Not specified') => {
    if (!field) return fallback;
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      if (field.value) return String(field.value);
      if (field.text) return String(field.text);
      if (field.amount && field.currency) return `${field.currency} ${field.amount}`;
      return fallback;
    }
    return String(field);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
    onRefresh({ ...filters, [field]: value }, 0, rowsPerPage);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedApplications(applications.map(app => app._id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelect = (appId) => {
    setSelectedApplications(prev =>
      prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  const openViewDialog = (application, index) => {
    setSelectedApp(application);
    setCurrentIndex(index);
    setDialogTab(0);
    setViewDialog(true);
    
    // Preload resume if available
    if (application.resume) {
      loadResumePreview(application._id);
    }
  };

  const openStatusDialog = (application) => {
    setSelectedApp(application);
    setStatusUpdate({ status: application.status, note: '' });
    setStatusDialog(true);
  };

  const navigateApplication = (direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, applications.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    if (newIndex !== currentIndex) {
      const newApp = applications[newIndex];
      setSelectedApp(newApp);
      setCurrentIndex(newIndex);
      
      // Load resume for new application if viewing resume tab
      if (dialogTab === 1 && newApp.resume) {
        loadResumePreview(newApp._id);
      }
    }
  };

  // FIXED: Better resume loading with proper error handling
  const loadResumePreview = async (applicationId) => {
    if (!applicationId) return;
    
    setResumeLoading(true);
    
    // Clean up previous URL
    if (resumeUrl) {
      URL.revokeObjectURL(resumeUrl);
      setResumeUrl('');
    }

    try {
      console.log('Loading resume for application:', applicationId);
      
      const response = await axios.get(
        `${API_URL}/admin/applications/${applicationId}/resume`,
        { 
          ...authHeader, 
          responseType: 'blob',
          timeout: 30000, // 30 second timeout
          headers: {
            ...authHeader.headers,
            'Accept': 'application/pdf'
          }
        }
      );

      console.log('Resume response received:', response);

      // Check if we got a valid PDF
      if (response.data.type !== 'application/pdf') {
        throw new Error('Invalid file type received');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      console.log('Resume blob URL created:', url);
      setResumeUrl(url);
      
    } catch (error) {
      console.error('Resume preview load failed:', error);
      
      let errorMessage = 'Failed to load resume preview';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Resume loading timed out. Please try downloading instead.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Resume file not found on server';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      }
      
      toast(errorMessage, 'error');
      setResumeUrl('');
    } finally {
      setResumeLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!selectedApp) return;

    try {
      await axios.put(
        `${API_URL}/admin/applications/${selectedApp._id}/status`,
        statusUpdate,
        authHeader
      );
      
      onStatusUpdate(selectedApp._id, statusUpdate.status, statusUpdate.note);
      setStatusDialog(false);
      
      if (statusUpdate.status === 'rejected') {
        toast('Application rejected', 'info');
      } else if (statusUpdate.status === 'selected') {
        toast('Candidate selected!', 'success');
      } else {
        toast('Status updated successfully', 'success');
      }
    } catch (error) {
      console.error('Status update failed:', error);
      toast('Failed to update status', 'error');
    }
  };

  const quickStatusUpdate = async (appId, status) => {
    try {
      await axios.put(
        `${API_URL}/admin/applications/${appId}/status`,
        { status, note: `Quick update to ${status}` },
        authHeader
      );
      
      onStatusUpdate(appId, status, `Quick update to ${status}`);
      
      if (status === 'rejected') {
        toast('Application rejected', 'info');
      } else if (status === 'shortlisted') {
        toast('Candidate shortlisted!', 'success');
      }
    } catch (error) {
      console.error('Quick status update failed:', error);
      toast('Failed to update status', 'error');
    }
  };

  const downloadResume = async (applicationId, applicantName) => {
    try {
      const response = await axios.get(
        `${API_URL}/admin/applications/${applicationId}/resume`,
        { ...authHeader, responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${applicantName}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast('Resume downloaded successfully', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      toast('Failed to download resume', 'error');
    }
  };

  const StatusChip = ({ status }) => {
    const config = APPLICATION_STATUS_CONFIG[status] || APPLICATION_STATUS_CONFIG.pending;
    return (
      <Chip
        label={`${config.icon} ${config.label}`}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          borderRadius: 3
        }}
      />
    );
  };

  // Cleanup resume URL on component unmount
  React.useEffect(() => {
    return () => {
      if (resumeUrl) {
        URL.revokeObjectURL(resumeUrl);
      }
    };
  }, [resumeUrl]);

  return (
    <Box>
      {/* Filters - Same as before */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search applications..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All Status</MenuItem>
                {Object.entries(APPLICATION_STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.icon} {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Job Position</InputLabel>
              <Select
                value={filters.jobId}
                onChange={(e) => handleFilterChange('jobId', e.target.value)}
                label="Job Position"
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All Positions</MenuItem>
                {jobs.map((job) => (
                  <MenuItem key={job._id} value={job._id}>
                    {job.jobRole}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedApplications.length > 0 && (
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                sx={{
                  bgcolor: '#1AC99F',
                  '&:hover': { bgcolor: '#0E9A78' },
                  borderRadius: 3,
                  fontWeight: 600
                }}
                onClick={() => {
                  selectedApplications.forEach(appId => {
                    quickStatusUpdate(appId, 'reviewing');
                  });
                  setSelectedApplications([]);
                }}
              >
                Review ({selectedApplications.length})
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Applications Table - Same structure as before but keeping the working parts */}
      {!applications.length && !loading ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          <Typography variant="h6">No Applications Found</Typography>
          <Typography>
            {filters.search || filters.status !== 'all' || filters.jobId !== 'all'
              ? 'Try adjusting your filters to see more applications'
              : 'No applications have been submitted yet'}
          </Typography>
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {loading && <LinearProgress />}
          
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={applications.length > 0 && selectedApplications.length === applications.length}
                    indeterminate={selectedApplications.length > 0 && selectedApplications.length < applications.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>👤 Applicant</TableCell>
                <TableCell>📧 Contact</TableCell>
                <TableCell>💼 Position</TableCell>
                <TableCell>📊 Status</TableCell>
                <TableCell>🎓 Experience</TableCell>
                <TableCell>📅 Applied Date</TableCell>
                <TableCell>⚡ Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application, index) => (
                <TableRow key={application._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedApplications.includes(application._id)}
                      onChange={() => handleSelect(application._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                         onClick={() => openViewDialog(application, index)}>
                      <Avatar sx={{ mr: 2, bgcolor: '#1AC99F' }}>
                        {application.firstName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {application.firstName} {application.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {application.position || application.jobRole}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">📧 {application.email}</Typography>
                      <Typography variant="body2" color="text.secondary">📱 {application.phone}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {application.jobRole}
                    </Typography>
                    {application.jobId?.department && (
                      <Typography variant="caption" color="text.secondary">
                        {application.jobId.department}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={application.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{application.experience}</Typography>
                    {application.currentCompany && (
                      <Typography variant="caption" color="text.secondary">
                        at {application.currentCompany}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{formatDate(application.createdAt)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ⏱️ {formatDistanceToNow(application.createdAt)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details & Resume">
                        <IconButton
                          onClick={() => openViewDialog(application, index)}
                          sx={{ color: '#1AC99F' }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Quick Shortlist">
                        <IconButton
                          onClick={() => quickStatusUpdate(application._id, 'shortlisted')}
                          sx={{ color: '#9C27B0' }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Quick Reject">
                        <IconButton
                          onClick={() => quickStatusUpdate(application._id, 'rejected')}
                          sx={{ color: '#F44336' }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton
                          onClick={() => openStatusDialog(application)}
                          sx={{ color: '#2196F3' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {application.resume && (
                        <Tooltip title="Download Resume">
                          <IconButton
                            onClick={() => downloadResume(application._id, `${application.firstName}_${application.lastName}`)}
                            sx={{ color: '#FF9800' }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={totalApplications}
            page={page}
            onPageChange={(event, newPage) => {
              setPage(newPage);
              onRefresh(filters, newPage, rowsPerPage);
            }}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              const newRowsPerPage = parseInt(event.target.value, 10);
              setRowsPerPage(newRowsPerPage);
              setPage(0);
              onRefresh(filters, 0, newRowsPerPage);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </TableContainer>
      )}

      {/* Enhanced View Application Dialog with FIXED Resume Preview */}
      <Dialog
        open={viewDialog}
        onClose={() => {
          setViewDialog(false);
          if (resumeUrl) {
            URL.revokeObjectURL(resumeUrl);
            setResumeUrl('');
          }
        }}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '95vh', height: '95vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              📋 Application - {selectedApp?.firstName} {selectedApp?.lastName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={() => navigateApplication('prev')}
                disabled={currentIndex === 0}
                sx={{ color: '#1AC99F' }}
              >
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="body2" sx={{ alignSelf: 'center', px: 2 }}>
                {currentIndex + 1} of {applications.length}
              </Typography>
              <IconButton
                onClick={() => navigateApplication('next')}
                disabled={currentIndex === applications.length - 1}
                sx={{ color: '#1AC99F' }}
              >
                <NavigateNextIcon />
              </IconButton>
            </Box>
          </Box>
          <IconButton 
            onClick={() => {
              setViewDialog(false);
              if (resumeUrl) {
                URL.revokeObjectURL(resumeUrl);
                setResumeUrl('');
              }
            }} 
            sx={{ color: '#666' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Tabs for Details and Resume */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={dialogTab} 
            onChange={(event, newValue) => {
              setDialogTab(newValue);
              // Load resume when switching to resume tab
              if (newValue === 1 && selectedApp?.resume && !resumeUrl) {
                loadResumePreview(selectedApp._id);
              }
            }}
            sx={{ px: 3 }}
          >
            <Tab 
              label="📋 Application Details" 
              id="application-tab-0"
              aria-controls="application-tabpanel-0"
            />
            {selectedApp?.resume && (
              <Tab 
                label="📄 Resume Preview" 
                id="application-tab-1"
                aria-controls="application-tabpanel-1"
              />
            )}
          </Tabs>
        </Box>

        <DialogContent dividers sx={{ p: 0, height: 'calc(100% - 140px)' }}>
          {/* Application Details Tab */}
          <TabPanel value={dialogTab} index={0}>
            <Box sx={{ p: 3, maxHeight: '100%', overflow: 'auto' }}>
              {selectedApp && (
                <Grid container spacing={3}>
                  {/* Personal Information */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                        👤 Personal Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                          <Typography variant="body1">{selectedApp.firstName} {selectedApp.lastName}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                          <Typography variant="body1">{selectedApp.email}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">{selectedApp.phone}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Experience</Typography>
                          <Typography variant="body1">{selectedApp.experience}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Current Location</Typography>
                          <Typography variant="body1">
                            {formatField(selectedApp.location?.current || selectedApp.location)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Job Information */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                        💼 Job Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Position Applied</Typography>
                          <Typography variant="body1">{selectedApp.jobRole}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                          <StatusChip status={selectedApp.status} />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Applied Date</Typography>
                          <Typography variant="body1">{formatDate(selectedApp.createdAt)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Notice Period</Typography>
                          <Typography variant="body1">
                            {formatField(selectedApp.noticePeriod)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Expected Salary</Typography>
                          <Typography variant="body1">
                            {formatSalary(selectedApp.expectedSalary)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Education Information */}
                  {selectedApp.education && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                          🎓 Education
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Degree</Typography>
                            <Typography variant="body1">{formatField(selectedApp.education.degree)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Field</Typography>
                            <Typography variant="body1">{formatField(selectedApp.education.field)}</Typography>
                          </Grid>
                          <Grid item xs={8}>
                            <Typography variant="subtitle2" color="text.secondary">Institution</Typography>
                            <Typography variant="body1">{formatField(selectedApp.education.institution)}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="subtitle2" color="text.secondary">Year</Typography>
                            <Typography variant="body1">{formatField(selectedApp.education.year)}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}

                  {/* Skills */}
                  {selectedApp.skills && selectedApp.skills.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                          🛠️ Skills
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {selectedApp.skills.map((skill, index) => (
                            <Chip key={index} label={skill} color="primary" size="small" />
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Motivation */}
                  {selectedApp.motivation && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                          💭 Why Greon Xpert?
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {selectedApp.motivation}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          </TabPanel>

          {/* FIXED Resume Preview Tab */}
          {selectedApp?.resume && (
            <TabPanel value={dialogTab} index={1}>
              <Box sx={{ p: 3, height: '100%' }}>
                {resumeLoading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    gap: 2
                  }}>
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="text.secondary">
                      Loading Resume Preview...
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Please wait while we prepare the resume for viewing
                    </Typography>
                  </Box>
                ) : resumeUrl ? (
                  <PdfViewer 
                    resumeUrl={resumeUrl}
                    applicantName={`${selectedApp.firstName}_${selectedApp.lastName}`}
                    onDownload={() => downloadResume(selectedApp._id, `${selectedApp.firstName}_${selectedApp.lastName}`)}
                  />
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    gap: 2
                  }}>
                    <PdfIcon sx={{ fontSize: 80, color: '#d32f2f', opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary">
                      Resume Preview Unavailable
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
                      The resume preview could not be loaded. This might be due to browser compatibility or file issues.
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button 
                        variant="contained" 
                        onClick={() => loadResumePreview(selectedApp._id)}
                        startIcon={<ViewIcon />}
                        sx={{ bgcolor: '#1976d2' }}
                      >
                        Try Loading Again
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={() => downloadResume(selectedApp._id, `${selectedApp.firstName}_${selectedApp.lastName}`)}
                        startIcon={<DownloadIcon />}
                      >
                        Download Instead
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Box>
            </TabPanel>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => {
            setViewDialog(false);
            if (resumeUrl) {
              URL.revokeObjectURL(resumeUrl);
              setResumeUrl('');
            }
          }} variant="outlined">
            Close
          </Button>
          <Button 
            onClick={() => {
              setViewDialog(false);
              if (resumeUrl) {
                URL.revokeObjectURL(resumeUrl);
                setResumeUrl('');
              }
              openStatusDialog(selectedApp);
            }}
            variant="contained"
            sx={{ bgcolor: '#1AC99F', '&:hover': { bgcolor: '#0E9A78' } }}
          >
            Update Status
          </Button>
          <Button 
            onClick={() => quickStatusUpdate(selectedApp._id, 'shortlisted')}
            variant="contained"
            sx={{ bgcolor: '#9C27B0', '&:hover': { bgcolor: '#7B1FA2' } }}
          >
            ⭐ Shortlist
          </Button>
          <Button 
            onClick={() => quickStatusUpdate(selectedApp._id, 'rejected')}
            variant="contained"
            sx={{ bgcolor: '#F44336', '&:hover': { bgcolor: '#D32F2F' } }}
          >
            ❌ Reject
          </Button>
          {selectedApp?.resume && (
            <Button 
              onClick={() => downloadResume(selectedApp._id, `${selectedApp.firstName}_${selectedApp.lastName}`)}
              variant="contained"
              sx={{ bgcolor: '#FF9800', '&:hover': { bgcolor: '#F57C00' } }}
            >
              📄 Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog - Same as before */}
      <Dialog
        open={statusDialog}
        onClose={() => setStatusDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>✏️ Update Application Status - {selectedApp?.firstName} {selectedApp?.lastName}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  {Object.entries(APPLICATION_STATUS_CONFIG).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 1 }}>{config.icon}</Typography>
                        <Box>
                          <Typography>{config.label}</Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Internal Notes"
                multiline
                rows={4}
                fullWidth
                value={statusUpdate.note}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Add internal notes about this status update..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={updateStatus} 
            variant="contained"
            sx={{ bgcolor: '#1AC99F', '&:hover': { bgcolor: '#0E9A78' } }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationsManager;
