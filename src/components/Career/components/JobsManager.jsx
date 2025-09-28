// src/components/Career/components/JobsManager.jsx - COMPLETE FIXED VERSION

import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Grid, TextField, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, Button, Card, CardContent, CardMedia,
  CardActionArea, CardActions, Chip, CircularProgress, TablePagination,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Paper, List, ListItem, ListItemText, Stack, Divider
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Edit as EditIcon,
  Delete as DeleteIcon, Visibility as ViewIcon, LocationOn as LocationIcon,
  Business as BusinessIcon, Person as PersonIcon, Star as StarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import axios from 'axios';
import { API_BASE } from '../../../utils/api';
import JobCreationForm from './JobCreationForm';

const API_URL = `${API_BASE}/api/careers`;

const JOB_STATUS_CONFIG = {
  active: { label: 'Active', color: '#4CAF50', bgColor: '#E8F5E8', icon: '✅' },
  inactive: { label: 'Inactive', color: '#FF9800', bgColor: '#FFF3E0', icon: '⏸️' },
  closed: { label: 'Closed', color: '#F44336', bgColor: '#FFEBEE', icon: '🔒' },
  draft: { label: 'Draft', color: '#9E9E9E', bgColor: '#F5F5F5', icon: '📝' }
};

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Design'];

const JobsManager = ({ jobs, totalJobs, loading, onRefresh, onCreateJob, onUpdateJob, onDeleteJob, toast }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    department: 'all',
    featured: 'all'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // FIXED: Format salary range properly to avoid object rendering error
  const formatSalaryRange = (salaryRange) => {
    if (!salaryRange || typeof salaryRange !== 'object') {
      return 'Not specified';
    }
    
    const { min, max, currency = 'INR' } = salaryRange;
    
    // Handle cases where min/max are strings or numbers
    const minNum = min ? Number(min) : 0;
    const maxNum = max ? Number(max) : 0;
    
    if (!minNum && !maxNum) return 'Not specified';
    if (minNum && maxNum) return `${currency} ${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`;
    if (minNum) return `${currency} ${minNum.toLocaleString()}+`;
    if (maxNum) return `Up to ${currency} ${maxNum.toLocaleString()}`;
    
    return 'Competitive';
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
    onRefresh({ ...filters, [field]: value }, 0, rowsPerPage);
  };

  const openViewDialog = (job) => {
    setSelectedJob(job);
    setViewDialog(true);
  };

  const openEditDialog = (job) => {
    setSelectedJob(job);
    setEditDialog(true);
  };

  const deleteJob = async (id, jobRole) => {
    if (!window.confirm(`Delete "${jobRole}"? This will also delete all related applications.`)) return;

    try {
      await axios.delete(`${API_URL}/${id}`, authHeader);
      onDeleteJob(id);
      toast('Job deleted successfully', 'success');
    } catch (error) {
      console.error('Delete job error:', error);
      toast('Failed to delete job', 'error');
    }
  };

  const duplicateJob = async (job) => {
    try {
      const jobData = {
        ...job,
        jobRole: `${job.jobRole} (Copy)`,
        status: 'draft',
        featured: false
      };
      delete jobData._id;
      delete jobData.createdAt;
      delete jobData.updatedAt;
      delete jobData.applicationCount;
      delete jobData.viewCount;

      await axios.post(`${API_URL}`, jobData, authHeader);
      toast('Job duplicated successfully', 'success');
      onRefresh(filters, page, rowsPerPage);
    } catch (error) {
      console.error('Duplicate job error:', error);
      toast('Failed to duplicate job', 'error');
    }
  };

  const toggleJobStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.put(`${API_URL}/${job._id}`, { status: newStatus }, authHeader);
      toast(`Job ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
      onRefresh(filters, page, rowsPerPage);
    } catch (error) {
      console.error('Toggle status error:', error);
      toast('Failed to update job status', 'error');
    }
  };

  const StatusChip = ({ status }) => {
    const config = JOB_STATUS_CONFIG[status] || JOB_STATUS_CONFIG.draft;
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
      {/* Filters and Create Button */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search jobs..."
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All Status</MenuItem>
                {Object.entries(JOB_STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.icon} {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                label="Department"
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {DEPARTMENTS.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Featured</InputLabel>
              <Select
                value={filters.featured}
                onChange={(e) => handleFilterChange('featured', e.target.value)}
                label="Featured"
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All Jobs</MenuItem>
                <MenuItem value="true">Featured Only</MenuItem>
                <MenuItem value="false">Regular Jobs</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateJob}
              sx={{
                background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0E9A78, #0A7B5E)',
                  transform: 'translateY(-2px)'
                },
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(26, 201, 159, 0.3)',
                transition: 'all 0.3s ease'
              }}
              fullWidth
            >
              Create New Job
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Jobs Grid */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#1AC99F' }} />
          <Typography sx={{ mt: 2, color: '#1AC99F' }}>
            Loading jobs...
          </Typography>
        </Box>
      ) : !jobs.length ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          <Typography variant="h6">No Jobs Found</Typography>
          <Typography sx={{ mb: 2 }}>
            {filters.search || filters.status !== 'all' || filters.department !== 'all'
              ? 'Try adjusting your filters to see more jobs'
              : 'Start by creating your first job posting'
            }
          </Typography>
          {!filters.search && filters.status === 'all' && filters.department === 'all' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateJob}
              sx={{
                background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
                '&:hover': { background: 'linear-gradient(135deg, #0E9A78, #0A7B5E)' },
                borderRadius: 3,
                fontWeight: 600
              }}
            >
              Create Your First Job
            </Button>
          )}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  },
                  position: 'relative'
                }}
              >
                <CardActionArea onClick={() => openViewDialog(job)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                  {/* Job Image */}
                  {job.image && (
                    <CardMedia
                      component="img"
                      height="160"
                      image={`${API_BASE}${job.image}`}
                      alt={job.jobRole}
                      onError={(e) => { e.target.style.display = 'none'; }}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  
                  {/* Featured Badge */}
                  {job.featured && (
                    <Chip
                      icon={<StarIcon />}
                      label="FEATURED"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 2,
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        color: '#333',
                        fontWeight: 700,
                        borderRadius: 3
                      }}
                    />
                  )}
                  
                  {/* Status Badge */}
                  <Chip
                    label={`${JOB_STATUS_CONFIG[job.status]?.icon} ${JOB_STATUS_CONFIG[job.status]?.label}`}
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      backgroundColor: JOB_STATUS_CONFIG[job.status]?.bgColor,
                      color: JOB_STATUS_CONFIG[job.status]?.color,
                      fontWeight: 600,
                      borderRadius: 3
                    }}
                  />

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}>
                      {job.jobRole}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {job.shortDescription}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ mr: 1, fontSize: 18, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {job.location}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <BusinessIcon sx={{ mr: 1, fontSize: 18, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {job.department} • {job.jobType}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ mr: 1, fontSize: 18, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {job.experienceRequired}
                      </Typography>
                    </Box>

                    {/* FIXED: Salary Range Display */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        💰 {formatSalaryRange(job.salaryRange)}
                      </Typography>
                    </Box>

                    {/* Skills Preview */}
                    <Box sx={{ mb: 2 }}>
                      {job.skills?.slice(0, 3).map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5, fontSize: '0.75rem' }}
                        />
                      ))}
                      {job.skills?.length > 3 && (
                        <Chip
                          label={`+${job.skills.length - 3} more`}
                          size="small"
                          color="primary"
                          sx={{ mr: 0.5, mb: 0.5, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>

                    {/* Metrics */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {job.applicationCount || 0} applications
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {job.viewCount || 0} views
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>

                {/* Action Buttons */}
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    onClick={(e) => { e.stopPropagation(); openEditDialog(job); }}
                    startIcon={<EditIcon />}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#1AC99F',
                      color: '#1AC99F',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: alpha('#1AC99F', 0.1),
                        borderColor: '#1AC99F',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); deleteJob(job._id, job.jobRole); }}
                    startIcon={<DeleteIcon />}
                    size="small"
                    sx={{
                      color: '#e74c3c',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: alpha('#e74c3c', 0.1),
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

      {/* Pagination */}
      {jobs.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <TablePagination
            component="div"
            count={totalJobs}
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
            rowsPerPageOptions={[9, 18, 27, 36]}
            sx={{
              '& .MuiTablePagination-toolbar': {
                minHeight: 52
              }
            }}
          />
        </Box>
      )}

      {/* View Job Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{selectedJob?.jobRole}</Typography>
          <IconButton onClick={() => setViewDialog(false)} sx={{ color: '#1AC99F' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedJob && (
            <>
              {/* Job Image */}
              {selectedJob.image && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <img
                    src={`${API_BASE}${selectedJob.image}`}
                    alt={selectedJob.jobRole}
                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </Box>
              )}

              {/* Job Status and Featured */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <StatusChip status={selectedJob.status} />
                {selectedJob.featured && (
                  <Chip
                    icon={<StarIcon />}
                    label="FEATURED JOB"
                    sx={{
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      color: '#333',
                      fontWeight: 700
                    }}
                  />
                )}
              </Box>

              <Grid container spacing={3}>
                {/* Job Details */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                      🎯 Job Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                        <Typography variant="body1">{selectedJob.department}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                        <Typography variant="body1">{selectedJob.location}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Job Type</Typography>
                        <Typography variant="body1">{selectedJob.jobType}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Experience Required</Typography>
                        <Typography variant="body1">{selectedJob.experienceRequired}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Joining Time</Typography>
                        <Typography variant="body1">{selectedJob.joiningTime}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Salary Range</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {formatSalaryRange(selectedJob.salaryRange)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Metrics & Info */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                      📊 Performance Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Applications</Typography>
                        <Typography variant="h4" sx={{ color: '#1AC99F', fontWeight: 700 }}>
                          {selectedJob.applicationCount || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Views</Typography>
                        <Typography variant="h4" sx={{ color: '#2196F3', fontWeight: 700 }}>
                          {selectedJob.viewCount || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Posted Date</Typography>
                        <Typography variant="body1">{formatDate(selectedJob.createdAt)}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                        <Typography variant="body1">{formatDate(selectedJob.updatedAt)}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                      📝 Job Description
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                      {selectedJob.shortDescription}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {selectedJob.jobDescription}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Responsibilities */}
                {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                        📋 Key Responsibilities
                      </Typography>
                      <List dense>
                        {selectedJob.responsibilities.map((resp, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={resp}
                              sx={{
                                '& .MuiListItemText-primary': {
                                  fontSize: '0.9rem'
                                }
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}

                {/* Requirements */}
                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                        ✅ Requirements
                      </Typography>
                      <List dense>
                        {selectedJob.requirements.map((req, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={req}
                              sx={{
                                '& .MuiListItemText-primary': {
                                  fontSize: '0.9rem'
                                }
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}

                {/* Skills */}
                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                        🛠️ Required Skills
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {selectedJob.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            color="primary"
                            size="small"
                            sx={{ fontSize: '0.8rem' }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                )}

                {/* Benefits */}
                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#1AC99F', fontWeight: 600 }}>
                        🎁 Benefits & Perks
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {selectedJob.benefits.map((benefit, index) => (
                          <Chip
                            key={index}
                            label={benefit}
                            color="success"
                            size="small"
                            sx={{ fontSize: '0.8rem' }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setViewDialog(false)} variant="outlined">
            Close
          </Button>
          <Button
            onClick={() => {
              setViewDialog(false);
              openEditDialog(selectedJob);
            }}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{ bgcolor: '#1AC99F', '&:hover': { bgcolor: '#0E9A78' } }}
          >
            Edit Job
          </Button>
          <Button
            onClick={() => toggleJobStatus(selectedJob)}
            variant="contained"
            sx={{
              bgcolor: selectedJob?.status === 'active' ? '#FF9800' : '#4CAF50',
              '&:hover': { bgcolor: selectedJob?.status === 'active' ? '#F57C00' : '#388E3C' }
            }}
          >
            {selectedJob?.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            onClick={() => duplicateJob(selectedJob)}
            variant="outlined"
            sx={{
              borderColor: '#2196F3',
              color: '#2196F3',
              '&:hover': {
                bgcolor: alpha('#2196F3', 0.1),
                borderColor: '#2196F3'
              }
            }}
          >
            Duplicate
          </Button>
          <Button
            onClick={() => deleteJob(selectedJob._id, selectedJob.jobRole)}
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{ bgcolor: '#F44336', '&:hover': { bgcolor: '#D32F2F' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Job Dialog */}
      <JobCreationForm
        open={editDialog}
        onClose={() => setEditDialog(false)}
        editJob={selectedJob}
        onSuccess={() => {
          toast('Job updated successfully!', 'success');
          setEditDialog(false);
          onUpdateJob(selectedJob);
          onRefresh(filters, page, rowsPerPage);
        }}
        toast={toast}
      />
    </Box>
  );
};

export default JobsManager;
