// src/components/Career/CareerPanel.jsx - FIXED VERSION - Compact Header

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Box, Typography, Grid, Paper, Alert, Accordion, AccordionSummary, 
  AccordionDetails, IconButton, Tabs, Tab, Container
} from '@mui/material';
import {
  Refresh as RefreshIcon, Work as WorkIcon,
  ExpandMore as ExpandMoreIcon, Group as GroupIcon
} from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

// Import separate components
import JobCreationForm from './components/JobCreationForm';
import ApplicationsManager from './components/ApplicationsManager';
import JobsManager from './components/JobsManager';

const API_URL = `${API_BASE}/api/careers`;

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`career-tabpanel-${index}`}
      aria-labelledby={`career-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CareerPanel = () => {
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    activeJobs: 0,
    pendingApplications: 0
  });

  // Dialog states
  const [createJobDialog, setCreateJobDialog] = useState(false);

  // Refs for Socket.IO and API control
  const initialized = useRef(false);
  const socketRef = useRef(null);

  // Auth setup
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => 
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  , [token]);

  const toast = useCallback((message, type = 'success') => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: 'success', message: '' }), 4000);
  }, []);

  // Fetch functions
  const fetchApplications = useCallback(async (filters = {}, page = 0, limit = 25, sort = '-createdAt') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      params.append('page', page + 1);
      params.append('limit', limit);
      params.append('sort', sort);

      const res = await axios.get(`${API_URL}/admin/applications?${params.toString()}`, authHeader);
      if (res.data?.success) {
        setApplications(res.data.data.applications || []);
        setTotalApplications(res.data.data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast('Failed to fetch applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeader, toast]);

  const fetchJobs = useCallback(async (filters = {}, page = 0, limit = 25, sort = '-createdAt') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      params.append('page', page + 1);
      params.append('limit', limit);
      params.append('sort', sort);

      const res = await axios.get(`${API_URL}?${params.toString()}`, authHeader);
      if (res.data?.success) {
        setJobs(res.data.data.jobs || []);
        setTotalJobs(res.data.data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast('Failed to fetch jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeader, toast]);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch basic statistics
      const [jobsRes, applicationsRes] = await Promise.all([
        axios.get(`${API_URL}?limit=1`, authHeader),
        axios.get(`${API_URL}/admin/applications?limit=1`, authHeader)
      ]);

      const jobsData = jobsRes.data?.success ? jobsRes.data.data : {};
      const appsData = applicationsRes.data?.success ? applicationsRes.data.data : {};

      // Calculate active jobs (assuming status field exists)
      const activeJobsRes = await axios.get(`${API_URL}?status=active&limit=1`, authHeader);
      const activeJobs = activeJobsRes.data?.success ? activeJobsRes.data.data.pagination?.totalItems || 0 : 0;

      // Calculate pending applications
      const pendingAppsRes = await axios.get(`${API_URL}/admin/applications?status=pending&limit=1`, authHeader);
      const pendingApps = pendingAppsRes.data?.success ? pendingAppsRes.data.data.pagination?.totalItems || 0 : 0;

      setStats({
        totalJobs: jobsData.pagination?.totalItems || 0,
        totalApplications: appsData.pagination?.totalItems || 0,
        activeJobs: activeJobs,
        pendingApplications: pendingApps
      });

    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Set default stats if API fails
      setStats({
        totalJobs: totalJobs,
        totalApplications: totalApplications,
        activeJobs: jobs.filter(job => job.status === 'active').length,
        pendingApplications: applications.filter(app => app.status === 'pending').length
      });
    }
  }, [authHeader, totalJobs, totalApplications, jobs, applications]);

  // Socket.IO setup
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      
      socketRef.current = io(API_BASE);
      const socket = socketRef.current;
      
      socket.emit('join-career-room', 'careers-admin');

      socket.on('job-created', (payload) => {
        if (payload?.success) {
          toast('📋 New job posted!', 'info');
          fetchJobs();
          fetchStats();
        }
      });

      socket.on('application-received', (payload) => {
        if (payload?.success) {
          toast('📝 New application received!', 'info');
          fetchApplications();
          fetchStats();
        }
      });

      socket.on('job-updated', (payload) => {
        if (payload?.success) {
          toast('✅ Job updated!', 'success');
          fetchJobs();
          fetchStats();
        }
      });

      socket.on('application-status-updated', (payload) => {
        if (payload?.success) {
          toast('✅ Application status updated!', 'success');
          fetchApplications();
          fetchStats();
        }
      });

      // Initial data fetch
      fetchStats();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      initialized.current = false;
    };
  }, [fetchApplications, fetchJobs, fetchStats, toast]);

  // Initial data fetch based on tab
  useEffect(() => {
    if (currentTab === 0) {
      fetchApplications();
    } else if (currentTab === 1) {
      fetchJobs();
    }
  }, [currentTab, fetchApplications, fetchJobs]);

  const handleTabChange = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const refreshData = useCallback(() => {
    if (currentTab === 0) fetchApplications();
    else fetchJobs();
    fetchStats();
    toast('Data refreshed successfully!', 'success');
  }, [currentTab, fetchApplications, fetchJobs, fetchStats, toast]);

  return (
    <Box 
      sx={{ 
        width: '100%', 
        minHeight: '100vh',
        bgcolor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Fixed Alert at Top */}
      {alert.open && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1300,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header - Fixed & Compact */}
      <Box sx={{ flexShrink: 0 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
          <Accordion
            expanded={headerExpanded}
            onChange={() => setHeaderExpanded(!headerExpanded)}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 50%, #306659ff 100%)',
              color: 'white',
              '&::before': { display: 'none' },
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              my: { xs: 1, sm: 2 }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                minHeight: { xs: 64, sm: 72 }, // Reduced height
                '& .MuiAccordionSummary-content': {
                  margin: '8px 0' // Reduced margin
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'white'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WorkIcon sx={{ mr: 2, fontSize: { xs: 22, sm: 26 } }} />
                  <Box>
                    <Typography variant="h5" sx={{ // Changed from h4 to h5
                      fontWeight: 700, 
                      mb: 0.5,
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } // Reduced font sizes
                    }}>
                      Career Management
                    </Typography>
                    <Typography variant="body2" sx={{ // Changed from subtitle1 to body2
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' } // Reduced font sizes
                    }}>
                      Manage job postings and applications
                    </Typography>
                  </Box>
                </Box>
                
                {/* Refresh Button in Header - Smaller */}
                <IconButton
                  onClick={refreshData}
                  size="medium" // Changed from default to medium
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)'
                    },
                    borderRadius: 2,
                    p: { xs: 0.8, sm: 1 } // Reduced padding
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ 
              px: { xs: 2, sm: 3 }, // Reduced horizontal padding
              pb: 2, // Reduced bottom padding
              pt: 0  // Removed top padding
            }}>
              {/* Stats Cards - Compact & Responsive */}
              <Grid container spacing={{ xs: 1.5, sm: 2 }}> {/* Reduced spacing */}
                <Grid item xs={6} sm={6} md={3}>
                  <Paper sx={{ 
                    p: { xs: 1, sm: 1.5 }, // Reduced padding
                    textAlign: 'center', 
                    bgcolor: 'rgba(255,255,255,0.15)', 
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    height: { xs: 70, sm: 80 } // Fixed smaller height
                  }}>
                    <Typography variant="h5" sx={{ // Changed from h4 to h5
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }, // Reduced font size
                      mb: 0.5 // Reduced margin
                    }}>
                      {stats.totalJobs}
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }, // Smaller font
                      lineHeight: 1.2
                    }}>
                      📋 Total Jobs
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={6} md={3}>
                  <Paper sx={{ 
                    p: { xs: 1, sm: 1.5 }, 
                    textAlign: 'center', 
                    bgcolor: 'rgba(255,255,255,0.15)', 
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    height: { xs: 70, sm: 80 }
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      mb: 0.5
                    }}>
                      {stats.totalApplications}
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}>
                      📝 Applications
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={6} md={3}>
                  <Paper sx={{ 
                    p: { xs: 1, sm: 1.5 }, 
                    textAlign: 'center', 
                    bgcolor: 'rgba(255,255,255,0.15)', 
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    height: { xs: 70, sm: 80 }
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      mb: 0.5
                    }}>
                      {stats.activeJobs}
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}>
                      🟢 Active Jobs
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={6} md={3}>
                  <Paper sx={{ 
                    p: { xs: 1, sm: 1.5 }, 
                    textAlign: 'center', 
                    bgcolor: 'rgba(255,255,255,0.15)', 
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    height: { xs: 70, sm: 80 }
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      mb: 0.5
                    }}>
                      {stats.pendingApplications}
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}>
                      ⏳ Pending
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Container>
      </Box>

      {/* Main Content - Scrollable */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          height: 'calc(100vh - 160px)' // Reduced header space calculation
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, height: '100%' }}>
          <Paper sx={{ 
            borderRadius: 3, 
            overflow: 'hidden', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            my: { xs: 1, sm: 2 }
          }}>
            {/* Tabs - Responsive */}
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              bgcolor: '#ffffff',
              flexShrink: 0
            }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  px: { xs: 1, sm: 3 },
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: { xs: 48, sm: 56 }, // Reduced tab height
                    '&.Mui-selected': { color: '#1AC99F' }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1AC99F',
                    height: 3
                  }
                }}
              >
                <Tab
                  icon={<GroupIcon />}
                  label={`Applications (${totalApplications})`}
                  iconPosition="start"
                  sx={{ mr: { xs: 1, sm: 2 } }}
                />
                <Tab
                  icon={<WorkIcon />}
                  label={`Jobs (${totalJobs})`}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Tab Content - Scrollable */}
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '4px',
                '&:hover': {
                  background: '#a8a8a8',
                },
              },
            }}>
              {/* Tab Panels */}
              <TabPanel value={currentTab} index={0}>
                <ApplicationsManager
                  applications={applications}
                  totalApplications={totalApplications}
                  jobs={jobs}
                  loading={loading}
                  onRefresh={fetchApplications}
                  onStatusUpdate={(appId, status, note) => {
                    toast('Application status updated!', 'success');
                    fetchApplications();
                    fetchStats();
                  }}
                  toast={toast}
                />
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                <JobsManager
                  jobs={jobs}
                  totalJobs={totalJobs}
                  loading={loading}
                  onRefresh={fetchJobs}
                  onCreateJob={() => setCreateJobDialog(true)}
                  onUpdateJob={(job) => {
                    toast('Job updated successfully!', 'success');
                    fetchJobs();
                    fetchStats();
                  }}
                  onDeleteJob={(jobId) => {
                    toast('Job deleted successfully!', 'success');
                    fetchJobs();
                    fetchStats();
                  }}
                  toast={toast}
                />
              </TabPanel>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Job Creation Dialog */}
      <JobCreationForm
        open={createJobDialog}
        onClose={() => setCreateJobDialog(false)}
        onSuccess={() => {
          toast('Job created successfully!', 'success');
          setCreateJobDialog(false);
          fetchJobs();
          fetchStats();
        }}
        toast={toast}
      />
    </Box>
  );
};

export default CareerPanel;
