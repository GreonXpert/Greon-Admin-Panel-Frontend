// src/Pages/Careers.jsx - Public job listings page

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, InputAdornment, Card, CardActionArea, CardContent,
  Chip, Stack, CircularProgress, Alert, Button, Pagination
} from '@mui/material';
import {
  Search as SearchIcon, LocationOn as LocationIcon,
  Business as BusinessIcon, WorkOutline as WorkOutlineIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';

const API_URL = `${API_BASE}/api/careers`;

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Design'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

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

const Careers = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [filters, setFilters] = useState({ search: '', department: 'all', jobType: 'all' });
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async (currentFilters, currentPage) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status: 'active', page: currentPage, limit: 9 });
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.department !== 'all') params.append('department', currentFilters.department);
      if (currentFilters.jobType !== 'all') params.append('jobType', currentFilters.jobType);

      const res = await axios.get(`${API_URL}?${params.toString()}`);
      if (res.data?.success) {
        setJobs(res.data.data.jobs || []);
        setPagination(res.data.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('We could not load open positions right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchJobs(filters, page), filters.search ? 400 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 100%)',
          color: 'white',
          py: { xs: 6, md: 9 },
          px: 2,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2rem', md: '2.75rem' } }}>
            Join Greon Xpert
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 400, maxWidth: 640, mx: 'auto' }}>
            Help us build a more sustainable future. Explore our open roles below.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search by role, skill, or location..."
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
          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => handleFilterChange('department', e.target.value)}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {DEPARTMENTS.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={filters.jobType}
                label="Job Type"
                onChange={(e) => handleFilterChange('jobType', e.target.value)}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All Types</MenuItem>
                {JOB_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#1AC99F' }} />
          </Box>
        ) : jobs.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="h6">No open positions match your search</Typography>
            <Typography variant="body2">Try adjusting your filters, or check back soon for new openings.</Typography>
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={job._id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      position: 'relative',
                      transition: 'all 0.25s ease',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/careers/${job.slug || job._id}`)}
                      sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      {job.featured && (
                        <Chip
                          icon={<StarIcon sx={{ fontSize: 16 }} />}
                          label="Featured"
                          size="small"
                          sx={{
                            position: 'absolute', top: 12, right: 12,
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            color: '#333', fontWeight: 700
                          }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, pr: job.featured ? 8 : 0 }}>
                          {job.jobRole}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                          {job.shortDescription}
                        </Typography>

                        <Stack spacing={0.75} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon sx={{ fontSize: 18, color: '#1AC99F' }} />
                            <Typography variant="body2">{job.location}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon sx={{ fontSize: 18, color: '#1AC99F' }} />
                            <Typography variant="body2">
                              {job.department} • {job.jobType}
                              {formatInternshipDuration(job) ? ` (${formatInternshipDuration(job)})` : ''}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WorkOutlineIcon sx={{ fontSize: 18, color: '#1AC99F' }} />
                            <Typography variant="body2">{job.experienceRequired}</Typography>
                          </Box>
                        </Stack>

                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: '#0E9A78' }}>
                          {formatSalaryRange(job.salaryRange)}
                        </Typography>

                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {(job.skills || []).slice(0, 3).map((skill, i) => (
                            <Chip key={i} label={skill} size="small" sx={{ mb: 0.5 }} />
                          ))}
                        </Stack>
                      </CardContent>
                      <Box sx={{ px: 3, pb: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            background: 'linear-gradient(135deg, #1AC99F, #0E9A78)',
                            '&:hover': { background: 'linear-gradient(135deg, #0E9A78, #0A7B5E)' },
                            borderRadius: 2, fontWeight: 600
                          }}
                        >
                          View & Apply
                        </Button>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                  sx={{ '& .Mui-selected': { bgcolor: '#1AC99F !important', color: 'white' } }}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Careers;
