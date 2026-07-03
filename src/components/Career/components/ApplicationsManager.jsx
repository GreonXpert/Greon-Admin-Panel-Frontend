// src/components/Career/components/ApplicationsManager.jsx - WORKING PDF PREVIEW

import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Grid, TextField, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, LinearProgress, Checkbox, Avatar,
  Chip, IconButton, Tooltip, TablePagination, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Stack, CircularProgress,
  Tabs, Tab, Divider
} from '@mui/material';
import {
  Search as SearchIcon, Visibility as ViewIcon, Edit as EditIcon,
  Download as DownloadIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon, Close as CloseIcon,
  PictureAsPdf as PdfIcon, ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon, OpenInNew as OpenInNewIcon,
  GetApp as GetAppIcon, RocketLaunch as RocketLaunchIcon
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
  onboarded: { label: 'Onboarded', color: '#00897B', bgColor: '#E0F2F1', icon: '🚀' },
  rejected: { label: 'Rejected', color: '#F44336', bgColor: '#FFEBEE', icon: '❌' },
  withdrawn: { label: 'Withdrawn', color: '#9E9E9E', bgColor: '#F5F5F5', icon: '🔙' }
};

// Default subject/message + button styling for each status that gets a
// customizable, admin-composed email instead of the generic auto-template
const EMAIL_STATUS_META = {
  shortlisted: {
    actionLabel: 'Shortlist',
    icon: '🎉',
    defaultSubject: (app) => `🎉 Congratulations! You've Been Shortlisted - ${app.jobRole}`,
    defaultMessage: (app) => `Congratulations! Your application for the ${app.jobRole} position has impressed our team, and we're excited to shortlist you for the next round. Our HR team will be in touch shortly with the next steps.`,
    sendLabel: 'Send & Shortlist',
    color: '#9C27B0',
    hoverColor: '#7B1FA2'
  },
  rejected: {
    actionLabel: 'Reject',
    icon: '📧',
    defaultSubject: (app) => `Application Status Update - ${app.jobRole}`,
    defaultMessage: (app) => `Thank you for your interest in the ${app.jobRole} position at Greon Xpert and for the time you invested in this process. After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs. We encourage you to apply for future openings that match your skills.`,
    sendLabel: 'Send & Reject',
    color: '#F44336',
    hoverColor: '#D32F2F'
  },
  onboarded: {
    actionLabel: 'Onboard',
    icon: '🚀',
    defaultSubject: (app) => `🚀 Welcome Onboard! - ${app.jobRole}`,
    defaultMessage: (app) => `Welcome to Greon Xpert! We're thrilled to have you join our team as ${app.jobRole}. Our HR team will reach out shortly with your onboarding details and next steps to get you started.`,
    sendLabel: 'Send & Onboard',
    color: '#00897B',
    hoverColor: '#00695C'
  }
};

// Rewrites common file-sharing links (Google Drive, Google Docs/Sheets/Slides, Dropbox)
// into their dedicated embeddable preview URL. The plain "share" link a resume was
// pasted as usually renders a sign-in/blocked page inside an iframe; these services
// expose a separate endpoint specifically meant for iframe embedding.
const getEmbeddablePreviewUrl = (url) => {
  if (!url) return url;
  try {
    const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (driveFileMatch) return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;

    const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (driveOpenMatch) return `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`;

    const docsMatch = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (docsMatch) return `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/preview`;

    if (/dropbox\.com\/(s|scl)\//.test(url)) {
      const u = new URL(url);
      u.searchParams.delete('dl');
      u.searchParams.set('raw', '1');
      return u.toString();
    }
  } catch (e) {
    // Malformed URL - fall through and try the original as-is
  }
  return url;
};

// FIXED: Enhanced PDF Viewer with better loading handling
const PdfViewer = ({ resumeUrl, applicantName, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadTimeout, setLoadTimeout] = useState(null);
  const previewUrl = getEmbeddablePreviewUrl(resumeUrl);
  const isKnownEmbedService = previewUrl !== resumeUrl;

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
            {/* Primary iframe approach - uses the rewritten embed-friendly URL when
                the link is from a recognized service (Google Drive/Docs, Dropbox) */}
            <iframe
              src={previewUrl}
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
              allow="autoplay"
            />

            {/* Fallback: direct object/embed for raw PDF URLs. Skipped for known
                embed services since their preview page is HTML, not a raw PDF file,
                so this fallback would just render blank on top of the working iframe. */}
            {!isKnownEmbedService && (
            <object
              data={previewUrl}
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
                src={previewUrl}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </object>
            )}
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
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);
  const [emailComposeStatus, setEmailComposeStatus] = useState(null);
  const [emailComposeTarget, setEmailComposeTarget] = useState(null);
  const [emailComposeSubject, setEmailComposeSubject] = useState('');
  const [emailComposeMessage, setEmailComposeMessage] = useState('');
  const [emailComposeSending, setEmailComposeSending] = useState(false);

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

  // Format an answer to a custom application question for display
  const formatAnswer = (answer, questionType) => {
    const isEmpty = answer === undefined || answer === null || answer === '' ||
      (Array.isArray(answer) && answer.length === 0);
    if (isEmpty) return 'Not answered';
    if (questionType === 'yesno') return answer === true || answer === 'true' ? 'Yes' : 'No';
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer);
  };

  // Group an application's question answers by their section, in first-seen order
  const groupAnswersBySection = (answers) => {
    const map = new Map();
    (answers || []).forEach(a => {
      const section = a.section || 'General';
      if (!map.has(section)) map.set(section, []);
      map.get(section).push(a);
    });
    return Array.from(map.entries()).map(([section, sectionAnswers]) => ({ section, answers: sectionAnswers }));
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
      setSelectedApp(applications[newIndex]);
      setCurrentIndex(newIndex);
    }
  };

  // Statuses that use the admin-composable email dialog instead of firing immediately
  const CUSTOM_EMAIL_STATUSES = ['shortlisted', 'rejected', 'onboarded'];

  const updateStatus = async () => {
    if (!selectedApp) return;

    if (CUSTOM_EMAIL_STATUSES.includes(statusUpdate.status)) {
      setStatusDialog(false);
      openEmailCompose(selectedApp, statusUpdate.status);
      return;
    }

    try {
      await axios.put(
        `${API_URL}/admin/applications/${selectedApp._id}/status`,
        statusUpdate,
        authHeader
      );

      onStatusUpdate(selectedApp._id, statusUpdate.status, statusUpdate.note);
      setStatusDialog(false);

      if (statusUpdate.status === 'selected') {
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
    } catch (error) {
      console.error('Quick status update failed:', error);
      toast('Failed to update status', 'error');
    }
  };

  // Once an application is rejected, it's treated as final: shortlist/onboard/reject
  // can't be repeated. Shortlist and onboard also can't be repeated once already done.
  const isStatusLocked = (application, targetStatus) => {
    if (!application) return false;
    if (targetStatus !== 'rejected' && application.status === 'rejected') return true;
    return application.status === targetStatus;
  };

  const statusLockReason = (application, targetStatus) => {
    if (!application) return '';
    if (targetStatus !== 'rejected' && application.status === 'rejected') {
      return 'Application already rejected';
    }
    if (application.status === targetStatus) {
      return `Already ${EMAIL_STATUS_META[targetStatus]?.actionLabel.toLowerCase() || targetStatus}`;
    }
    return '';
  };

  const openEmailCompose = (application, status) => {
    if (isStatusLocked(application, status)) {
      toast(statusLockReason(application, status), 'info');
      return;
    }
    const meta = EMAIL_STATUS_META[status];
    setEmailComposeTarget(application);
    setEmailComposeStatus(status);
    setEmailComposeSubject(meta.defaultSubject(application));
    setEmailComposeMessage(meta.defaultMessage(application));
    setEmailComposeOpen(true);
  };

  const confirmEmailCompose = async () => {
    if (!emailComposeTarget || !emailComposeStatus) return;

    setEmailComposeSending(true);
    try {
      await axios.put(
        `${API_URL}/admin/applications/${emailComposeTarget._id}/status`,
        {
          status: emailComposeStatus,
          note: `${EMAIL_STATUS_META[emailComposeStatus].actionLabel} by admin`,
          emailSubject: emailComposeSubject,
          emailMessage: emailComposeMessage
        },
        authHeader
      );

      onStatusUpdate(emailComposeTarget._id, emailComposeStatus, `${EMAIL_STATUS_META[emailComposeStatus].actionLabel} by admin`);
      toast(`Candidate ${emailComposeStatus} and notified!`, 'success');
      setEmailComposeOpen(false);
      setEmailComposeTarget(null);
    } catch (error) {
      console.error(`${emailComposeStatus} failed:`, error);
      toast(error?.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setEmailComposeSending(false);
    }
  };

  const openResume = (resumeUrl) => {
    if (!resumeUrl) {
      toast('No resume link was provided for this applicant', 'warning');
      return;
    }
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
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

  return (
    <Box>
      {/* Filters - Same as before */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
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
          <Grid size={{ xs: 12, md: 3 }}>
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
          <Grid size={{ xs: 12, md: 3 }}>
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
            <Grid size={{ xs: 12, md: 2 }}>
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
                <TableCell>📄 Resume</TableCell>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {application.firstName} {application.lastName}
                      </Typography>
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
                    {application.resumeUrl ? (
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<OpenInNewIcon fontSize="small" />}
                        onClick={() => openResume(application.resumeUrl)}
                      >
                        Open
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not provided</Typography>
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
                      <Tooltip title={isStatusLocked(application, 'shortlisted') ? statusLockReason(application, 'shortlisted') : 'Shortlist'}>
                        <span>
                          <IconButton
                            onClick={() => openEmailCompose(application, 'shortlisted')}
                            disabled={isStatusLocked(application, 'shortlisted')}
                            sx={{ color: '#9C27B0' }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isStatusLocked(application, 'onboarded') ? statusLockReason(application, 'onboarded') : 'Onboard'}>
                        <span>
                          <IconButton
                            onClick={() => openEmailCompose(application, 'onboarded')}
                            disabled={isStatusLocked(application, 'onboarded')}
                            sx={{ color: '#00897B' }}
                          >
                            <RocketLaunchIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isStatusLocked(application, 'rejected') ? statusLockReason(application, 'rejected') : 'Reject'}>
                        <span>
                          <IconButton
                            onClick={() => openEmailCompose(application, 'rejected')}
                            disabled={isStatusLocked(application, 'rejected')}
                            sx={{ color: '#F44336' }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton
                          onClick={() => openStatusDialog(application)}
                          sx={{ color: '#2196F3' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
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

      {/* View Application Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '95vh', height: '95vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" component="span">
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
          <IconButton onClick={() => setViewDialog(false)} sx={{ color: '#666' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Tabs for Details and Resume */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={dialogTab}
            onChange={(event, newValue) => setDialogTab(newValue)}
            sx={{ px: 3 }}
          >
            <Tab
              label="📋 Application Details"
              id="application-tab-0"
              aria-controls="application-tabpanel-0"
            />
            {selectedApp?.resumeUrl && (
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                        👤 Personal Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={6}>
                          <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                          <Typography variant="body1">{selectedApp.firstName} {selectedApp.lastName}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                          <Typography variant="body1">{selectedApp.email}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">{selectedApp.phone}</Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="subtitle2" color="text.secondary">Resume / CV</Typography>
                          {selectedApp.resumeUrl ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNewIcon />}
                              onClick={() => openResume(selectedApp.resumeUrl)}
                              sx={{ mt: 0.5 }}
                            >
                              Open Resume Link
                            </Button>
                          ) : (
                            <Typography variant="body1">Not provided</Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Job Information */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                        💼 Job Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={12}>
                          <Typography variant="subtitle2" color="text.secondary">Position Applied</Typography>
                          <Typography variant="body1">{selectedApp.jobRole}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                          <StatusChip status={selectedApp.status} />
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="subtitle2" color="text.secondary">Applied Date</Typography>
                          <Typography variant="body1">{formatDate(selectedApp.createdAt)}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Application Question Answers */}
                  {selectedApp.answers && selectedApp.answers.length > 0 && (
                    <Grid size={12}>
                      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                          📝 Application Questions
                        </Typography>
                        <Stack spacing={3}>
                          {groupAnswersBySection(selectedApp.answers).map(({ section, answers: sectionAnswers }) => (
                            <Box key={section}>
                              {groupAnswersBySection(selectedApp.answers).length > 1 && (
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0E9A78' }}>
                                  {section}
                                </Typography>
                              )}
                              <Stack spacing={2} divider={<Divider flexItem />}>
                                {sectionAnswers.map((a, index) => (
                                  <Box key={index}>
                                    <Typography variant="subtitle2" color="text.secondary">{a.questionText}</Typography>
                                    {a.questionType === 'link' && a.answer ? (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<OpenInNewIcon />}
                                        onClick={() => openResume(a.answer)}
                                        sx={{ mt: 0.5 }}
                                      >
                                        Open Link
                                      </Button>
                                    ) : (
                                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                        {formatAnswer(a.answer, a.questionType)}
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Cover Letter */}
                  {selectedApp.coverLetter && (
                    <Grid size={12}>
                      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                          💭 Cover Letter
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {selectedApp.coverLetter}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          </TabPanel>

          {/* Resume Preview Tab */}
          {selectedApp?.resumeUrl && (
            <TabPanel value={dialogTab} index={1}>
              <Box sx={{ p: 3, height: '100%' }}>
                <PdfViewer
                  resumeUrl={selectedApp.resumeUrl}
                  applicantName={`${selectedApp.firstName}_${selectedApp.lastName}`}
                  onDownload={() => openResume(selectedApp.resumeUrl)}
                />
              </Box>
            </TabPanel>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setViewDialog(false)} variant="outlined">
            Close
          </Button>
          <Button
            onClick={() => {
              setViewDialog(false);
              openStatusDialog(selectedApp);
            }}
            variant="contained"
            sx={{ bgcolor: '#1AC99F', '&:hover': { bgcolor: '#0E9A78' } }}
          >
            Update Status
          </Button>
          <Button
            onClick={() => openEmailCompose(selectedApp, 'shortlisted')}
            variant="contained"
            disabled={isStatusLocked(selectedApp, 'shortlisted')}
            sx={{ bgcolor: '#9C27B0', '&:hover': { bgcolor: '#7B1FA2' } }}
          >
            {selectedApp?.status === 'shortlisted' ? '✅ Already Shortlisted' : '⭐ Shortlist'}
          </Button>
          <Button
            onClick={() => openEmailCompose(selectedApp, 'onboarded')}
            variant="contained"
            disabled={isStatusLocked(selectedApp, 'onboarded')}
            startIcon={<RocketLaunchIcon />}
            sx={{ bgcolor: '#00897B', '&:hover': { bgcolor: '#00695C' } }}
          >
            {selectedApp?.status === 'onboarded' ? 'Already Onboarded' : 'Onboard'}
          </Button>
          <Button
            onClick={() => openEmailCompose(selectedApp, 'rejected')}
            variant="contained"
            disabled={isStatusLocked(selectedApp, 'rejected')}
            sx={{ bgcolor: '#F44336', '&:hover': { bgcolor: '#D32F2F' } }}
          >
            {selectedApp?.status === 'rejected' ? '✅ Already Rejected' : '❌ Reject'}
          </Button>
          {selectedApp?.resumeUrl && (
            <Button
              onClick={() => openResume(selectedApp.resumeUrl)}
              variant="contained"
              startIcon={<OpenInNewIcon />}
              sx={{ bgcolor: '#FF9800', '&:hover': { bgcolor: '#F57C00' } }}
            >
              Open Resume
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
            <Grid size={12}>
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
            <Grid size={12}>
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

      {/* Status Email Compose Dialog - reused for Shortlist / Reject / Onboard */}
      <Dialog
        open={emailComposeOpen}
        onClose={() => !emailComposeSending && setEmailComposeOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          {emailComposeStatus && EMAIL_STATUS_META[emailComposeStatus].icon}{' '}
          {emailComposeStatus && EMAIL_STATUS_META[emailComposeStatus].actionLabel} {emailComposeTarget?.firstName} {emailComposeTarget?.lastName}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Edit the message below if you'd like, or send it as-is.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Subject"
              fullWidth
              value={emailComposeSubject}
              onChange={(e) => setEmailComposeSubject(e.target.value)}
            />
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                Dear <strong>{emailComposeTarget?.firstName} {emailComposeTarget?.lastName}</strong>,
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={emailComposeMessage}
                onChange={(e) => setEmailComposeMessage(e.target.value)}
                sx={{ bgcolor: 'white' }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailComposeOpen(false)} variant="outlined" disabled={emailComposeSending}>
            Cancel
          </Button>
          <Button
            onClick={confirmEmailCompose}
            variant="contained"
            disabled={emailComposeSending || !emailComposeMessage.trim()}
            startIcon={emailComposeSending ? <CircularProgress size={16} sx={{ color: 'white' }} /> : null}
            sx={
              emailComposeStatus
                ? { bgcolor: EMAIL_STATUS_META[emailComposeStatus].color, '&:hover': { bgcolor: EMAIL_STATUS_META[emailComposeStatus].hoverColor } }
                : undefined
            }
          >
            {emailComposeSending ? 'Sending...' : (emailComposeStatus && EMAIL_STATUS_META[emailComposeStatus].sendLabel)}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationsManager;
