// src/Pages/JobApplication.jsx - Public job detail + application form

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Container, Typography, Grid, Paper, Chip, Stack, Divider,
  TextField, Button, CircularProgress, Alert, List, ListItem,
  ListItemText, FormControlLabel, Checkbox, RadioGroup, Radio, FormGroup,
  Breadcrumbs, Link as MuiLink, FormControl, InputLabel, Select, MenuItem,
  OutlinedInput
} from '@mui/material';
import {
  LocationOn as LocationIcon, Business as BusinessIcon,
  WorkOutline as WorkOutlineIcon, Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';

const API_URL = `${API_BASE}/api/careers`;

const formatSalaryRange = (salaryRange) => {
  if (!salaryRange || typeof salaryRange !== 'object') return 'Competitive';
  const { min, max, currency = 'INR' } = salaryRange;
  const minNum = min ? Number(min) : 0;
  const maxNum = max ? Number(max) : 0;
  if (!minNum && !maxNum) return 'Competitive';
  if (minNum && maxNum) return `${currency} ${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`;
  if (minNum) return `${currency} ${minNum.toLocaleString()}+`;
  return `Up to ${currency} ${maxNum.toLocaleString()}`;
};

const formatInternshipDuration = (job) => {
  if (job?.jobType !== 'Internship' || !job?.internshipDuration?.value) return null;
  const { value, unit = 'Months' } = job.internshipDuration;
  return `${value} ${unit}`;
};

const emptyContact = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  resumeUrl: '',
  coverLetter: '',
  portfolioUrl: '',
  linkedinUrl: '',
  githubUrl: ''
};

const JobApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [contact, setContact] = useState(emptyContact);
  const [answers, setAnswers] = useState({});
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    axios.get(`${API_URL}/${id}`)
      .then(res => {
        if (!cancelled && res.data?.success) setJob(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('This job could not be found. It may have been filled or removed.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const questions = useMemo(
    () => [...(job?.customQuestions || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [job]
  );

  const groupedQuestions = useMemo(() => {
    const map = new Map();
    questions.forEach(q => {
      const section = q.section || 'General';
      if (!map.has(section)) map.set(section, []);
      map.get(section).push(q);
    });
    return Array.from(map.entries()).map(([section, sectionQuestions]) => ({ section, questions: sectionQuestions }));
  }, [questions]);

  const handleContactChange = (field, value) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const validate = useCallback(() => {
    const newErrors = {};
    if (!contact.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!contact.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(contact.email)) newErrors.email = 'Enter a valid email address';
    if (!/^[+]?[0-9]{10,15}$/.test(contact.phone)) newErrors.phone = 'Enter a valid phone number';
    if (!/^https?:\/\/.+/.test(contact.resumeUrl.trim())) {
      newErrors.resumeUrl = 'Paste a valid link to your resume/CV (must start with http:// or https://)';
    }
    if (!consent) newErrors.consent = 'You must consent to data processing to apply';

    questions.forEach(q => {
      const val = answers[q._id];
      const isEmpty = val === undefined || val === null || val === '' ||
        (Array.isArray(val) && val.length === 0);

      if (q.required && isEmpty) {
        newErrors[`q_${q._id}`] = 'This question is required';
      } else if (q.questionType === 'link' && !isEmpty && !/^https?:\/\/.+/.test(String(val).trim())) {
        newErrors[`q_${q._id}`] = 'Enter a valid link starting with http:// or https://';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [contact, consent, questions, answers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) {
      setSubmitError('Please fix the highlighted fields below.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...contact,
        consentToDataProcessing: true,
        answers: questions.map(q => ({ questionId: q._id, answer: answers[q._id] }))
      };

      await axios.post(`${API_URL}/${job._id}/apply`, payload);
      setSubmitted(true);
    } catch (err) {
      const message = err?.response?.data?.message;
      if (err?.response?.status === 409) {
        setSubmitError('You have already applied for this position with this email address.');
      } else {
        setSubmitError(message || 'Something went wrong while submitting your application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#1AC99F' }} />
      </Box>
    );
  }

  if (loadError || !job) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>{loadError || 'Job not found.'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/careers')} variant="contained"
          sx={{ background: 'linear-gradient(135deg, #1AC99F, #0E9A78)' }}>
          Back to Careers
        </Button>
      </Container>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: 4, textAlign: 'center', maxWidth: 520 }}>
          <CheckCircleIcon sx={{ fontSize: 72, color: '#1AC99F', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Application Submitted!</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Thanks for applying to <strong>{job.jobRole}</strong>. We've sent a confirmation to{' '}
            <strong>{contact.email}</strong> and our team will review your application shortly.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/careers')}
            sx={{ background: 'linear-gradient(135deg, #1AC99F, #0E9A78)' }}>
            View More Openings
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 100%)', color: 'white', py: 5, px: 2 }}>
        <Container maxWidth="md">
          <Breadcrumbs sx={{ mb: 2, '& a, & p': { color: 'rgba(255,255,255,0.85)' } }}>
            <MuiLink component={RouterLink} to="/careers" underline="hover" color="inherit">Careers</MuiLink>
            <Typography color="inherit">{job.jobRole}</Typography>
          </Breadcrumbs>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{job.jobRole}</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ opacity: 0.95 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon fontSize="small" /> <Typography variant="body2">{job.location}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BusinessIcon fontSize="small" />
              <Typography variant="body2">
                {job.department} • {job.jobType}
                {formatInternshipDuration(job) ? ` (${formatInternshipDuration(job)})` : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WorkOutlineIcon fontSize="small" /> <Typography variant="body2">{job.experienceRequired}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon fontSize="small" /> <Typography variant="body2">Joining: {job.joiningTime}</Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 5 }}>
        <Grid container spacing={4}>
          {/* Job details */}
          <Grid size={12}>
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0E9A78' }}>
                {formatSalaryRange(job.salaryRange)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>{job.shortDescription}</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>{job.jobDescription}</Typography>

              {job.responsibilities?.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Responsibilities</Typography>
                  <List dense sx={{ mb: 2 }}>
                    {job.responsibilities.map((r, i) => (
                      <ListItem key={i} sx={{ py: 0.25 }}><ListItemText primary={`• ${r}`} /></ListItem>
                    ))}
                  </List>
                </>
              )}

              {job.requirements?.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Requirements</Typography>
                  <List dense sx={{ mb: 2 }}>
                    {job.requirements.map((r, i) => (
                      <ListItem key={i} sx={{ py: 0.25 }}><ListItemText primary={`• ${r}`} /></ListItem>
                    ))}
                  </List>
                </>
              )}

              {job.skills?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Skills</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {job.skills.map((s, i) => <Chip key={i} label={s} size="small" color="primary" />)}
                  </Stack>
                </Box>
              )}

              {job.benefits?.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Benefits</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {job.benefits.map((b, i) => <Chip key={i} label={b} size="small" color="success" />)}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Application form */}
          <Grid size={12}>
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }} component="form" onSubmit={handleSubmit}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Apply for this Role</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fields marked with * are required.
              </Typography>

              {submitError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{submitError}</Alert>}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="First Name" fullWidth required
                    value={contact.firstName}
                    onChange={(e) => handleContactChange('firstName', e.target.value)}
                    error={!!errors.firstName} helperText={errors.firstName}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Last Name" fullWidth required
                    value={contact.lastName}
                    onChange={(e) => handleContactChange('lastName', e.target.value)}
                    error={!!errors.lastName} helperText={errors.lastName}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Email" type="email" fullWidth required
                    value={contact.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    error={!!errors.email} helperText={errors.email}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Phone Number" fullWidth required
                    value={contact.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    error={!!errors.phone} helperText={errors.phone}
                    placeholder="+91XXXXXXXXXX"
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    label="Resume / CV Link" fullWidth required
                    value={contact.resumeUrl}
                    onChange={(e) => handleContactChange('resumeUrl', e.target.value)}
                    error={!!errors.resumeUrl}
                    helperText={errors.resumeUrl || 'Upload your resume to Google Drive, Dropbox, OneDrive, etc., set sharing to "Anyone with the link", and paste the link here.'}
                    placeholder="https://drive.google.com/..."
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Portfolio URL (optional)" fullWidth
                    value={contact.portfolioUrl}
                    onChange={(e) => handleContactChange('portfolioUrl', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="LinkedIn URL (optional)" fullWidth
                    value={contact.linkedinUrl}
                    onChange={(e) => handleContactChange('linkedinUrl', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="GitHub URL (optional)" fullWidth
                    value={contact.githubUrl}
                    onChange={(e) => handleContactChange('githubUrl', e.target.value)}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    label="Cover Letter (optional)" fullWidth multiline rows={4}
                    value={contact.coverLetter}
                    onChange={(e) => handleContactChange('coverLetter', e.target.value)}
                  />
                </Grid>
              </Grid>

              {questions.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Application Questions</Typography>
                  <Stack spacing={4}>
                    {groupedQuestions.map(({ section, questions: sectionQuestions }) => (
                      <Box key={section}>
                        {!(groupedQuestions.length === 1 && section === 'General') && (
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#0E9A78' }}>
                            {section}
                          </Typography>
                        )}
                        <Stack spacing={3}>
                          {sectionQuestions.map((q) => (
                            <Box key={q._id}>
                              {q.questionType === 'text' && (
                                <TextField
                                  label={q.questionText} fullWidth required={q.required}
                                  value={answers[q._id] || ''}
                                  onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                  error={!!errors[`q_${q._id}`]} helperText={errors[`q_${q._id}`]}
                                />
                              )}
                              {q.questionType === 'link' && (
                                <TextField
                                  label={q.questionText} type="url" fullWidth required={q.required}
                                  value={answers[q._id] || ''}
                                  onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                  placeholder="https://..."
                                  error={!!errors[`q_${q._id}`]} helperText={errors[`q_${q._id}`]}
                                />
                              )}
                              {q.questionType === 'textarea' && (
                                <TextField
                                  label={q.questionText} fullWidth required={q.required} multiline rows={4}
                                  value={answers[q._id] || ''}
                                  onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                  error={!!errors[`q_${q._id}`]} helperText={errors[`q_${q._id}`]}
                                />
                              )}
                              {q.questionType === 'number' && (
                                <TextField
                                  label={q.questionText} type="number" fullWidth required={q.required}
                                  value={answers[q._id] ?? ''}
                                  onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                  error={!!errors[`q_${q._id}`]} helperText={errors[`q_${q._id}`]}
                                />
                              )}
                              {q.questionType === 'yesno' && (
                                <Box>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {q.questionText}{q.required && ' *'}
                                  </Typography>
                                  <RadioGroup
                                    row
                                    value={answers[q._id] === undefined ? '' : String(answers[q._id])}
                                    onChange={(e) => handleAnswerChange(q._id, e.target.value === 'true')}
                                  >
                                    <FormControlLabel value="true" control={<Radio />} label="Yes" />
                                    <FormControlLabel value="false" control={<Radio />} label="No" />
                                  </RadioGroup>
                                  {errors[`q_${q._id}`] && (
                                    <Typography variant="caption" color="error">{errors[`q_${q._id}`]}</Typography>
                                  )}
                                </Box>
                              )}
                              {q.questionType === 'radio' && (
                                <Box>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {q.questionText}{q.required && ' *'}
                                  </Typography>
                                  <RadioGroup
                                    value={answers[q._id] ?? ''}
                                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                  >
                                    {(q.options || []).map((opt, oi) => (
                                      <FormControlLabel key={oi} value={opt} control={<Radio />} label={opt} />
                                    ))}
                                  </RadioGroup>
                                  {errors[`q_${q._id}`] && (
                                    <Typography variant="caption" color="error">{errors[`q_${q._id}`]}</Typography>
                                  )}
                                </Box>
                              )}
                              {q.questionType === 'checkbox' && (
                                <Box>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {q.questionText}{q.required && ' *'}
                                  </Typography>
                                  <FormGroup>
                                    {(q.options || []).map((opt, oi) => {
                                      const selected = Array.isArray(answers[q._id]) ? answers[q._id] : [];
                                      return (
                                        <FormControlLabel
                                          key={oi}
                                          control={
                                            <Checkbox
                                              checked={selected.includes(opt)}
                                              onChange={(e) => {
                                                const next = e.target.checked
                                                  ? [...selected, opt]
                                                  : selected.filter(s => s !== opt);
                                                handleAnswerChange(q._id, next);
                                              }}
                                            />
                                          }
                                          label={opt}
                                        />
                                      );
                                    })}
                                  </FormGroup>
                                  {errors[`q_${q._id}`] && (
                                    <Typography variant="caption" color="error">{errors[`q_${q._id}`]}</Typography>
                                  )}
                                </Box>
                              )}
                              {q.questionType === 'dropdown' && (
                                <FormControl fullWidth required={q.required} error={!!errors[`q_${q._id}`]}>
                                  <InputLabel>{q.questionText}</InputLabel>
                                  <Select
                                    value={answers[q._id] ?? ''}
                                    label={q.questionText}
                                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                  >
                                    {(q.options || []).map((opt, oi) => (
                                      <MenuItem key={oi} value={opt}>{opt}</MenuItem>
                                    ))}
                                  </Select>
                                  {errors[`q_${q._id}`] && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                      {errors[`q_${q._id}`]}
                                    </Typography>
                                  )}
                                </FormControl>
                              )}
                              {q.questionType === 'multiselect' && (
                                <FormControl fullWidth required={q.required} error={!!errors[`q_${q._id}`]}>
                                  <InputLabel>{q.questionText}</InputLabel>
                                  <Select
                                    multiple
                                    value={Array.isArray(answers[q._id]) ? answers[q._id] : []}
                                    onChange={(e) => {
                                      const { value } = e.target;
                                      handleAnswerChange(q._id, typeof value === 'string' ? value.split(',') : value);
                                    }}
                                    input={<OutlinedInput label={q.questionText} />}
                                    renderValue={(selected) => (
                                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                        {selected.map((val) => (
                                          <Chip key={val} label={val} size="small" />
                                        ))}
                                      </Stack>
                                    )}
                                  >
                                    {(q.options || []).map((opt, oi) => (
                                      <MenuItem key={oi} value={opt}>
                                        <Checkbox checked={(Array.isArray(answers[q._id]) ? answers[q._id] : []).includes(opt)} />
                                        {opt}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                  {errors[`q_${q._id}`] && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                      {errors[`q_${q._id}`]}
                                    </Typography>
                                  )}
                                </FormControl>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                }
                label="I consent to Greon Xpert processing my personal data for recruitment purposes. *"
              />
              {errors.consent && (
                <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>{errors.consent}</Typography>
              )}

              <Box sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{
                    background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
                    '&:hover': { background: 'linear-gradient(135deg, #0E9A78, #0A7B5E)' },
                    px: 5, py: 1.5, borderRadius: 2, fontWeight: 700
                  }}
                >
                  {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Application'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default JobApplication;
