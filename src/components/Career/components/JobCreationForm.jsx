// src/components/Career/components/JobCreationForm.jsx - FIXED SALARY RANGE

import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, FormControl, InputLabel, Select, MenuItem, Accordion, AccordionSummary,
  AccordionDetails, Typography, IconButton, LinearProgress, InputAdornment,
  Stack, Chip, FormControlLabel, Switch, Box
} from '@mui/material';
import {
  Close as CloseIcon, ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon, Star as StarIcon, StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import axios from 'axios';
import { API_BASE } from '../../../utils/api';

const API_URL = `${API_BASE}/api/careers`;

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Design'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

const JOB_STATUS_CONFIG = {
  active: { label: 'Active', icon: '✅' },
  inactive: { label: 'Inactive', icon: '⏸️' },
  closed: { label: 'Closed', icon: '🔒' },
  draft: { label: 'Draft', icon: '📝' }
};

const FeaturedSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#FFD700',
    '&:hover': {
      backgroundColor: alpha('#FFD700', 0.1),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: '#FFD700',
  },
}));

const emptyJobForm = {
  jobRole: '',
  shortDescription: '',
  jobDescription: '',
  responsibilities: [],
  requirements: [],
  experienceRequired: '',
  location: '',
  jobType: 'Full-time',
  joiningTime: '',
  skills: [],
  benefits: [],
  department: 'Engineering',
  status: 'active',
  featured: false,
  salaryRange: { min: '', max: '', currency: 'INR' },
  metaTitle: '',
  metaDescription: '',
  imageFile: null,
  imagePreview: null,
  // Input helpers
  responsibilitiesInput: '',
  requirementsInput: '',
  skillsInput: '',
  benefitsInput: ''
};

const JobCreationForm = ({ open, onClose, onSuccess, editJob = null, toast }) => {
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  React.useEffect(() => {
    if (open) {
      if (editJob) {
        setJobForm({
          ...editJob,
          responsibilities: editJob.responsibilities || [],
          requirements: editJob.requirements || [],
          skills: editJob.skills || [],
          benefits: editJob.benefits || [],
          responsibilitiesInput: '',
          requirementsInput: '',
          skillsInput: '',
          benefitsInput: '',
          imageFile: null,
          imagePreview: editJob.image ? `${API_BASE}${editJob.image}` : null,
          // FIXED: Ensure salaryRange is properly structured
          salaryRange: {
            min: editJob.salaryRange?.min || '',
            max: editJob.salaryRange?.max || '',
            currency: editJob.salaryRange?.currency || 'INR'
          }
        });
      } else {
        setJobForm(emptyJobForm);
      }
    }
  }, [open, editJob]);

  const handleFormChange = useCallback((field, value) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJobForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    }));
  }, []);

  const addToArray = useCallback((arrayField, inputField) => {
    const value = jobForm[inputField].trim();
    if (!value) return;

    setJobForm(prev => ({
      ...prev,
      [arrayField]: [...new Set([...prev[arrayField], value])],
      [inputField]: ''
    }));
  }, [jobForm]);

  const removeFromArray = useCallback((arrayField, index) => {
    setJobForm(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].filter((_, i) => i !== index)
    }));
  }, []);

  // FIXED: Handle salary range changes properly
  const handleSalaryRangeChange = useCallback((field, value) => {
    setJobForm(prev => ({
      ...prev,
      salaryRange: {
        ...prev.salaryRange,
        [field]: value
      }
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!jobForm.jobRole || !jobForm.shortDescription || !jobForm.jobDescription) {
      toast('Please fill in required fields', 'error');
      return;
    }

    const formData = new FormData();

    // Add all form fields except files and preview fields
    Object.keys(jobForm).forEach(key => {
      if (key.endsWith('File') || key.endsWith('Preview') || key.endsWith('Input')) return;
      
      const value = jobForm[key];
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === 'object' && value !== null) {
        // FIXED: Properly serialize salaryRange object
        formData.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (jobForm.imageFile) {
      formData.append('image', jobForm.imageFile);
    }

    try {
      setSubmitting(true);
      const config = {
        ...authHeader,
        headers: {
          ...authHeader.headers,
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editJob) {
        await axios.put(`${API_URL}/${editJob._id}`, formData, config);
      } else {
        await axios.post(`${API_URL}`, formData, config);
      }
      onSuccess();
    } catch (error) {
      console.error('Job submit error:', error);
      toast(error?.response?.data?.message || 'Failed to save job', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [jobForm, editJob, authHeader, onSuccess, toast]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {editJob ? 'Edit Job' : 'Create New Job'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#1AC99F' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {submitting && <LinearProgress />}
        
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Basic Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Job Role"
                      fullWidth
                      value={jobForm.jobRole}
                      onChange={(e) => handleFormChange('jobRole', e.target.value)}
                      error={!jobForm.jobRole && submitting}
                      helperText={!jobForm.jobRole && submitting ? 'Job role is required' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Location"
                      fullWidth
                      value={jobForm.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Short Description"
                      multiline
                      rows={2}
                      fullWidth
                      value={jobForm.shortDescription}
                      onChange={(e) => handleFormChange('shortDescription', e.target.value)}
                      error={!jobForm.shortDescription && submitting}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Job Description"
                      multiline
                      rows={6}
                      fullWidth
                      value={jobForm.jobDescription}
                      onChange={(e) => handleFormChange('jobDescription', e.target.value)}
                      error={!jobForm.jobDescription && submitting}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={jobForm.department}
                        onChange={(e) => handleFormChange('department', e.target.value)}
                        label="Department"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Job Type</InputLabel>
                      <Select
                        value={jobForm.jobType}
                        onChange={(e) => handleFormChange('jobType', e.target.value)}
                        label="Job Type"
                      >
                        {JOB_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={jobForm.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        label="Status"
                      >
                        {Object.entries(JOB_STATUS_CONFIG).map(([key, config]) => (
                          <MenuItem key={key} value={key}>
                            {config.icon} {config.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Experience Required"
                      fullWidth
                      value={jobForm.experienceRequired}
                      onChange={(e) => handleFormChange('experienceRequired', e.target.value)}
                      placeholder="e.g., 2-5 years"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Joining Time"
                      fullWidth
                      value={jobForm.joiningTime}
                      onChange={(e) => handleFormChange('joiningTime', e.target.value)}
                      placeholder="e.g., Immediate, 1 month"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Skills & Requirements */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Skills & Requirements</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Add Skill"
                      fullWidth
                      value={jobForm.skillsInput}
                      onChange={(e) => handleFormChange('skillsInput', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('skills', 'skillsInput');
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button onClick={() => addToArray('skills', 'skillsInput')}>
                              Add
                            </Button>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {jobForm.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          onDelete={() => removeFromArray('skills', index)}
                          size="small"
                          color="primary"
                        />
                      ))}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Add Responsibility"
                      multiline
                      rows={2}
                      fullWidth
                      value={jobForm.responsibilitiesInput}
                      onChange={(e) => handleFormChange('responsibilitiesInput', e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button onClick={() => addToArray('responsibilities', 'responsibilitiesInput')}>
                              Add
                            </Button>
                          </InputAdornment>
                        )
                      }}
                    />
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                      Responsibilities:
                    </Typography>
                    <Stack spacing={1}>
                      {jobForm.responsibilities.map((resp, index) => (
                        <Chip
                          key={index}
                          label={resp}
                          onDelete={() => removeFromArray('responsibilities', index)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Add Requirement"
                      multiline
                      rows={2}
                      fullWidth
                      value={jobForm.requirementsInput}
                      onChange={(e) => handleFormChange('requirementsInput', e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button onClick={() => addToArray('requirements', 'requirementsInput')}>
                              Add
                            </Button>
                          </InputAdornment>
                        )
                      }}
                    />
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                      Requirements:
                    </Typography>
                    <Stack spacing={1}>
                      {jobForm.requirements.map((req, index) => (
                        <Chip
                          key={index}
                          label={req}
                          onDelete={() => removeFromArray('requirements', index)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Salary & Benefits */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Salary and Benefits</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Minimum Salary"
                      type="number"
                      fullWidth
                      value={jobForm.salaryRange.min}
                      onChange={(e) => handleSalaryRangeChange('min', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Maximum Salary"
                      type="number"
                      fullWidth
                      value={jobForm.salaryRange.max}
                      onChange={(e) => handleSalaryRangeChange('max', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={jobForm.salaryRange.currency}
                        onChange={(e) => handleSalaryRangeChange('currency', e.target.value)}
                        label="Currency"
                      >
                        <MenuItem value="INR">INR</MenuItem>
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Add Benefit"
                      fullWidth
                      value={jobForm.benefitsInput}
                      onChange={(e) => handleFormChange('benefitsInput', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('benefits', 'benefitsInput');
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button onClick={() => addToArray('benefits', 'benefitsInput')}>
                              Add
                            </Button>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {jobForm.benefits.map((benefit, index) => (
                        <Chip
                          key={index}
                          label={benefit}
                          onDelete={() => removeFromArray('benefits', index)}
                          size="small"
                          color="success"
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Media & Settings */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Media and Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <FeaturedSwitch
                          checked={jobForm.featured}
                          onChange={(e) => handleFormChange('featured', e.target.checked)}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography>Featured Job</Typography>
                          {jobForm.featured ? 
                            <StarIcon sx={{ ml: 1, color: '#FFD700' }} /> : 
                            <StarBorderIcon sx={{ ml: 1 }} />
                          }
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <input
                      accept="image/*"
                      type="file"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="job-image-upload"
                    />
                    <label htmlFor="job-image-upload">
                      <Button
                        component="span"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        sx={{ height: 56, mb: 2 }}
                      >
                        {jobForm.imagePreview ? 'Change Job Image' : 'Upload Job Image'}
                      </Button>
                    </label>
                    {jobForm.imagePreview && (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <img
                          src={jobForm.imagePreview}
                          alt="Job preview"
                          style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                        />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Meta Title (SEO)"
                      fullWidth
                      value={jobForm.metaTitle}
                      onChange={(e) => handleFormChange('metaTitle', e.target.value)}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Meta Description (SEO)"
                      multiline
                      rows={2}
                      fullWidth
                      value={jobForm.metaDescription}
                      onChange={(e) => handleFormChange('metaDescription', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
            '&:hover': { background: 'linear-gradient(135deg, #0E9A78, #0A7B5E)' }
          }}
        >
          {submitting ? 'Saving...' : editJob ? 'Update Job' : 'Create Job'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobCreationForm;
