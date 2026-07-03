// src/components/Career/components/JobCreationForm.jsx - FIXED SALARY RANGE

import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, FormControl, InputLabel, Select, MenuItem, Accordion, AccordionSummary,
  AccordionDetails, Typography, IconButton, LinearProgress, InputAdornment,
  Stack, Chip, FormControlLabel, Switch, Box, Alert, Paper, Tooltip
} from '@mui/material';
import {
  Close as CloseIcon, ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon, Star as StarIcon, StarBorder as StarBorderIcon,
  Add as AddIcon, Delete as DeleteIcon, ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon, DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import axios from 'axios';
import { API_BASE } from '../../../utils/api';

const API_URL = `${API_BASE}/api/careers`;

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Design'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const OTHER_DEPARTMENT = '__other__';
const DURATION_UNITS = ['Days', 'Weeks', 'Months', 'Years'];

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Answer' },
  { value: 'textarea', label: 'Long Answer (Paragraph)' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'number', label: 'Number' },
  { value: 'radio', label: 'Single Choice (Radio Buttons)' },
  { value: 'checkbox', label: 'Multiple Choice (Checkboxes)' },
  { value: 'dropdown', label: 'Single Choice (Dropdown)' },
  { value: 'multiselect', label: 'Multiple Choice (Dropdown)' },
  { value: 'link', label: 'Link (URL)' }
];
const CHOICE_TYPES = ['radio', 'checkbox', 'dropdown', 'multiselect'];
const DEFAULT_SECTION = 'General';
// Server-computed fields that come along when editing (spread from the loaded job) but
// must never be sent back — e.g. `analytics` is a Mongo subdocument and can't be cast
// from a plain JSON string, which crashes the update.
const SERVER_MANAGED_FIELDS = ['_id', '__v', 'analytics', 'viewCount', 'applicationCount', 'createdAt', 'updatedAt', 'slug'];

let questionIdCounter = 0;
const newQuestion = (section = DEFAULT_SECTION) => ({
  _key: `new-${Date.now()}-${questionIdCounter++}`,
  section,
  questionText: '',
  questionType: 'text',
  options: [],
  optionInput: '',
  required: true
});

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
  customQuestions: [],
  department: 'Engineering',
  status: 'active',
  featured: false,
  salaryRange: { min: '', max: '', currency: 'INR' },
  internshipDuration: { value: '', unit: 'Months' },
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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [customDeptMode, setCustomDeptMode] = useState(false);
  const [questionSections, setQuestionSections] = useState([DEFAULT_SECTION]);
  const [questionsAccordionOpen, setQuestionsAccordionOpen] = useState(false);
  const questionRefs = React.useRef({});

  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  React.useEffect(() => {
    if (open) {
      setAttemptedSubmit(false);
      if (editJob) {
        setCustomDeptMode(!!editJob.department && !DEPARTMENTS.includes(editJob.department));
        const sectionsFromJob = [];
        (editJob.customQuestions || []).forEach(q => {
          const s = q.section || DEFAULT_SECTION;
          if (!sectionsFromJob.includes(s)) sectionsFromJob.push(s);
        });
        setQuestionSections(sectionsFromJob.length ? sectionsFromJob : [DEFAULT_SECTION]);
        setQuestionsAccordionOpen((editJob.customQuestions || []).length > 0);
        setJobForm({
          ...editJob,
          responsibilities: editJob.responsibilities || [],
          requirements: editJob.requirements || [],
          skills: editJob.skills || [],
          benefits: editJob.benefits || [],
          customQuestions: (editJob.customQuestions || []).map(q => ({
            ...q,
            _key: q._id || `existing-${q._id}`,
            section: q.section || DEFAULT_SECTION,
            options: q.options || [],
            optionInput: ''
          })),
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
          },
          internshipDuration: {
            value: editJob.internshipDuration?.value ?? '',
            unit: editJob.internshipDuration?.unit || 'Months'
          }
        });
      } else {
        setCustomDeptMode(false);
        setQuestionSections([DEFAULT_SECTION]);
        setQuestionsAccordionOpen(false);
        setJobForm(emptyJobForm);
      }
    }
  }, [open, editJob]);

  const handleFormChange = useCallback((field, value) => {
    setJobForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'jobType' && value !== 'Internship') {
        next.internshipDuration = { value: '', unit: 'Months' };
      }
      return next;
    });
  }, []);

  const handleInternshipDurationChange = useCallback((field, value) => {
    setJobForm(prev => ({
      ...prev,
      internshipDuration: { ...prev.internshipDuration, [field]: value }
    }));
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

  // Custom application question builder handlers
  const addQuestion = useCallback((section = DEFAULT_SECTION) => {
    setJobForm(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, newQuestion(section)]
    }));
  }, []);

  const updateQuestion = useCallback((index, field, value) => {
    setJobForm(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }));
  }, []);

  const removeQuestion = useCallback((index) => {
    setJobForm(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((_, i) => i !== index)
    }));
  }, []);

  // Moves a question up/down within its own section
  const moveQuestion = useCallback((questionKey, direction) => {
    setJobForm(prev => {
      const list = [...prev.customQuestions];
      const currentIdx = list.findIndex(q => q._key === questionKey);
      if (currentIdx === -1) return prev;
      const section = list[currentIdx].section || DEFAULT_SECTION;
      const sectionIndices = list.reduce((acc, q, i) => {
        if ((q.section || DEFAULT_SECTION) === section) acc.push(i);
        return acc;
      }, []);
      const posInSection = sectionIndices.indexOf(currentIdx);
      const targetPos = direction === 'up' ? posInSection - 1 : posInSection + 1;
      if (targetPos < 0 || targetPos >= sectionIndices.length) return prev;
      const targetIdx = sectionIndices[targetPos];
      [list[currentIdx], list[targetIdx]] = [list[targetIdx], list[currentIdx]];
      return { ...prev, customQuestions: list };
    });
  }, []);

  const addQuestionOption = useCallback((index, rawValue) => {
    const trimmed = (rawValue || '').trim();
    if (!trimmed) return;
    setJobForm(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map((q, i) =>
        i === index
          ? { ...q, options: [...new Set([...(q.options || []), trimmed])], optionInput: '' }
          : q
      )
    }));
  }, []);

  const removeQuestionOption = useCallback((index, optionIndex) => {
    setJobForm(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map((q, i) =>
        i === index ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) } : q
      )
    }));
  }, []);

  // Application question section builder handlers
  const addSection = useCallback(() => {
    setQuestionSections(prev => {
      let n = prev.length + 1;
      while (prev.includes(`Section ${n}`)) n++;
      return [...prev, `Section ${n}`];
    });
  }, []);

  const renameSection = useCallback((oldName, newName) => {
    setQuestionSections(prev => prev.map(s => (s === oldName ? newName : s)));
    setJobForm(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q =>
        (q.section || DEFAULT_SECTION) === oldName ? { ...q, section: newName } : q
      )
    }));
  }, []);

  const removeSection = useCallback((name) => {
    const count = jobForm.customQuestions.filter(q => (q.section || DEFAULT_SECTION) === name).length;
    if (count > 0 && !window.confirm(`Delete section "${name}" and its ${count} question(s)?`)) {
      return;
    }
    setQuestionSections(prev => prev.filter(s => s !== name));
    setJobForm(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => (q.section || DEFAULT_SECTION) !== name)
    }));
  }, [jobForm.customQuestions]);

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

  // Opens the Application Questions section and scrolls/focuses the offending question
  // so it's obvious which one is causing a validation error, instead of leaving the
  // admin to guess when the section is collapsed.
  const scrollToQuestion = useCallback((key) => {
    setQuestionsAccordionOpen(true);
    setTimeout(() => {
      const el = questionRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el.querySelector('input, textarea');
        if (input) input.focus();
      }
    }, 350);
  }, []);

  const handleSubmit = useCallback(async () => {
    setAttemptedSubmit(true);

    if (!jobForm.jobRole || !jobForm.shortDescription || !jobForm.jobDescription ||
        !jobForm.location || !jobForm.department.trim()) {
      toast('Please fill in all required fields, marked in red', 'error');
      return;
    }

    const blankQuestion = jobForm.customQuestions.find(q => !q.questionText.trim());
    if (blankQuestion) {
      toast('Every application question needs question text (or remove the empty one) — scroll down, it\'s highlighted in red', 'error');
      scrollToQuestion(blankQuestion._key);
      return;
    }

    const invalidChoiceQuestion = jobForm.customQuestions.find(
      q => CHOICE_TYPES.includes(q.questionType) && (q.options || []).length < 2
    );
    if (invalidChoiceQuestion) {
      toast('A choice question needs at least 2 options — scroll down, it\'s highlighted in red', 'error');
      scrollToQuestion(invalidChoiceQuestion._key);
      return;
    }

    const formData = new FormData();

    // Add all form fields except files, preview fields, and server-managed fields
    Object.keys(jobForm).forEach(key => {
      if (key.endsWith('File') || key.endsWith('Preview') || key.endsWith('Input')) return;
      if (SERVER_MANAGED_FIELDS.includes(key)) return;

      let value = jobForm[key];
      if (key === 'customQuestions') {
        value = value.map(({ _key, optionInput, ...q }) => q);
      }
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
  }, [jobForm, editJob, authHeader, onSuccess, toast, scrollToQuestion]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="span">
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
          <Grid size={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Basic Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Job Role"
                      fullWidth
                      required
                      value={jobForm.jobRole}
                      onChange={(e) => handleFormChange('jobRole', e.target.value)}
                      error={attemptedSubmit && !jobForm.jobRole}
                      helperText={attemptedSubmit && !jobForm.jobRole ? 'Job role is required' : ''}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Location"
                      fullWidth
                      required
                      value={jobForm.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      error={attemptedSubmit && !jobForm.location}
                      helperText={attemptedSubmit && !jobForm.location ? 'Location is required' : ''}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Short Description"
                      multiline
                      rows={2}
                      fullWidth
                      required
                      value={jobForm.shortDescription}
                      onChange={(e) => handleFormChange('shortDescription', e.target.value)}
                      error={attemptedSubmit && !jobForm.shortDescription}
                      helperText={attemptedSubmit && !jobForm.shortDescription ? 'Short description is required' : `${jobForm.shortDescription.length}/300`}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Job Description"
                      multiline
                      rows={6}
                      fullWidth
                      required
                      value={jobForm.jobDescription}
                      onChange={(e) => handleFormChange('jobDescription', e.target.value)}
                      error={attemptedSubmit && !jobForm.jobDescription}
                      helperText={attemptedSubmit && !jobForm.jobDescription ? 'Job description is required' : `${jobForm.jobDescription.length}/2000`}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: customDeptMode ? 2 : 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={customDeptMode ? OTHER_DEPARTMENT : jobForm.department}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === OTHER_DEPARTMENT) {
                            setCustomDeptMode(true);
                            handleFormChange('department', '');
                          } else {
                            setCustomDeptMode(false);
                            handleFormChange('department', value);
                          }
                        }}
                        label="Department"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                        <MenuItem value={OTHER_DEPARTMENT}>Other…</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {customDeptMode && (
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        label="Custom Department"
                        fullWidth
                        required
                        value={jobForm.department}
                        onChange={(e) => handleFormChange('department', e.target.value)}
                        placeholder="e.g., Legal"
                        error={attemptedSubmit && !jobForm.department.trim()}
                        helperText={attemptedSubmit && !jobForm.department.trim() ? 'Enter a department name' : ''}
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, md: 4 }}>
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
                  {jobForm.jobType === 'Internship' && (
                    <>
                      <Grid size={{ xs: 6, md: 2 }}>
                        <TextField
                          label="Internship Duration"
                          type="number"
                          fullWidth
                          value={jobForm.internshipDuration.value}
                          onChange={(e) => handleInternshipDurationChange('value', e.target.value)}
                          placeholder="e.g., 3"
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, md: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value={jobForm.internshipDuration.unit}
                            onChange={(e) => handleInternshipDurationChange('unit', e.target.value)}
                            label="Unit"
                          >
                            {DURATION_UNITS.map((unit) => (
                              <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  )}
                  <Grid size={{ xs: 12, md: 4 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Experience Required"
                      fullWidth
                      value={jobForm.experienceRequired}
                      onChange={(e) => handleFormChange('experienceRequired', e.target.value)}
                      placeholder="e.g., 2-5 years"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
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
          <Grid size={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Skills & Requirements</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={12}>
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
                  <Grid size={12}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
          <Grid size={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Salary and Benefits</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Minimum Salary"
                      type="number"
                      fullWidth
                      value={jobForm.salaryRange.min}
                      onChange={(e) => handleSalaryRangeChange('min', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Maximum Salary"
                      type="number"
                      fullWidth
                      value={jobForm.salaryRange.max}
                      onChange={(e) => handleSalaryRangeChange('max', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
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
                  <Grid size={12}>
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
                  <Grid size={12}>
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

          {/* Application Questions */}
          <Grid size={12}>
            <Accordion expanded={questionsAccordionOpen} onChange={(e, expanded) => setQuestionsAccordionOpen(expanded)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" component="span">Application Questions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Organize application questions into sections. Every applicant is also automatically asked for
                  their name, email, phone number and a resume/CV link, regardless of what's added below.
                </Typography>

                <Stack spacing={3}>
                  {questionSections.map((sectionName) => {
                    const sectionQuestions = jobForm.customQuestions
                      .map((q, idx) => ({ ...q, _idx: idx }))
                      .filter(q => (q.section || DEFAULT_SECTION) === sectionName);

                    return (
                      <Paper key={sectionName} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <TextField
                            variant="standard"
                            fullWidth
                            value={sectionName}
                            onChange={(e) => renameSection(sectionName, e.target.value)}
                            placeholder="Section title (e.g., Technical Skills)"
                            InputProps={{
                              sx: { fontSize: '1.05rem', fontWeight: 700 }
                            }}
                          />
                          <Tooltip title={questionSections.length === 1 ? "At least one section is required" : "Remove section"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => removeSection(sectionName)}
                                disabled={questionSections.length === 1}
                                sx={{ color: '#e74c3c' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>

                        {sectionQuestions.length === 0 && (
                          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                            No questions in this section yet.
                          </Alert>
                        )}

                        <Stack spacing={2}>
                          {sectionQuestions.map((question, qIndex) => (
                            <Paper
                              key={question._key}
                              ref={(el) => { questionRefs.current[question._key] = el; }}
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                borderColor: attemptedSubmit && (
                                  !question.questionText.trim() ||
                                  (CHOICE_TYPES.includes(question.questionType) && (question.options || []).length < 2)
                                ) ? 'error.main' : undefined
                              }}
                            >
                              <Grid container spacing={2} alignItems="flex-start">
                                <Grid size={{ xs: 12, sm: 1 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: { sm: 1 } }}>
                                  <DragIndicatorIcon sx={{ color: 'text.disabled' }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <TextField
                                    label={`Question ${qIndex + 1}`}
                                    fullWidth
                                    value={question.questionText}
                                    onChange={(e) => updateQuestion(question._idx, 'questionText', e.target.value)}
                                    placeholder="e.g., Why do you want to join us?"
                                    error={attemptedSubmit && !question.questionText.trim()}
                                    helperText={attemptedSubmit && !question.questionText.trim() ? 'Question text is required' : ''}
                                  />
                                </Grid>
                                <Grid size={{ xs: 7, sm: 3 }}>
                                  <FormControl fullWidth>
                                    <InputLabel>Answer Type</InputLabel>
                                    <Select
                                      value={question.questionType}
                                      onChange={(e) => updateQuestion(question._idx, 'questionType', e.target.value)}
                                      label="Answer Type"
                                    >
                                      {QUESTION_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid size={{ xs: 5, sm: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        size="small"
                                        checked={question.required}
                                        onChange={(e) => updateQuestion(question._idx, 'required', e.target.checked)}
                                      />
                                    }
                                    label="Required"
                                    sx={{ mr: 0 }}
                                  />
                                </Grid>
                              </Grid>

                              {CHOICE_TYPES.includes(question.questionType) && (
                                <Box sx={{ mt: 2, pl: { sm: 5 } }}>
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                    {question.questionType === 'radio'
                                      ? 'Choices the applicant can pick one of:'
                                      : 'Choices the applicant can pick multiple of:'}
                                  </Typography>
                                  <TextField
                                    size="small"
                                    label="Add Option"
                                    value={question.optionInput || ''}
                                    onChange={(e) => updateQuestion(question._idx, 'optionInput', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addQuestionOption(question._idx, question.optionInput);
                                      }
                                    }}
                                    sx={{ mb: 1, maxWidth: 320, display: 'block' }}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <Button size="small" onClick={() => addQuestionOption(question._idx, question.optionInput)}>
                                            Add
                                          </Button>
                                        </InputAdornment>
                                      )
                                    }}
                                  />
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {(question.options || []).map((opt, oi) => (
                                      <Chip
                                        key={oi}
                                        label={opt}
                                        size="small"
                                        onDelete={() => removeQuestionOption(question._idx, oi)}
                                      />
                                    ))}
                                  </Stack>
                                  {attemptedSubmit && (question.options || []).length < 2 && (
                                    <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                      Add at least 2 options for this question
                                    </Typography>
                                  )}
                                </Box>
                              )}

                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
                                <Tooltip title="Move up">
                                  <span>
                                    <IconButton size="small" onClick={() => moveQuestion(question._key, 'up')} disabled={qIndex === 0}>
                                      <ArrowUpwardIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Move down">
                                  <span>
                                    <IconButton size="small" onClick={() => moveQuestion(question._key, 'down')} disabled={qIndex === sectionQuestions.length - 1}>
                                      <ArrowDownwardIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Remove question">
                                  <IconButton size="small" onClick={() => removeQuestion(question._idx)} sx={{ color: '#e74c3c' }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          ))}
                        </Stack>

                        <Button
                          onClick={() => addQuestion(sectionName)}
                          startIcon={<AddIcon />}
                          size="small"
                          sx={{ mt: 2, color: '#1AC99F' }}
                        >
                          Add Question to "{sectionName}"
                        </Button>
                      </Paper>
                    );
                  })}
                </Stack>

                <Button
                  onClick={addSection}
                  startIcon={<AddIcon />}
                  variant="outlined"
                  sx={{
                    mt: 3,
                    borderColor: '#1AC99F',
                    color: '#1AC99F',
                    '&:hover': { borderColor: '#0E9A78', bgcolor: alpha('#1AC99F', 0.08) }
                  }}
                >
                  Add Section
                </Button>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Media & Settings */}
          <Grid size={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Media and Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={12}>
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
                  <Grid size={12}>
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
                  <Grid size={12}>
                    <TextField
                      label="Meta Title (SEO)"
                      fullWidth
                      value={jobForm.metaTitle}
                      onChange={(e) => handleFormChange('metaTitle', e.target.value)}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid size={12}>
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
