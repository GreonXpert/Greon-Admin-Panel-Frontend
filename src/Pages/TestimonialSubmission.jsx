import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Container, Grid, Card, CardContent, Typography, TextField, Button,
  Rating, Avatar, Chip, Stack, Fade, Grow, useMediaQuery, Paper, Divider,
  IconButton, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { keyframes } from '@emotion/react';
import { API_BASE } from '../utils/api'; 

const STAR_COLOR = '#F5B301';
const CARD_BG = 'rgba(255,255,255,0.98)';
const CARD_BORDER = 'rgba(15,23,42,0.12)';

// Enhanced animations
const floatSoft = keyframes`
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  33% { 
    transform: translateY(-8px) rotate(0.5deg); 
  }
  66% { 
    transform: translateY(-4px) rotate(-0.5deg); 
  }
`;

const slideInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { 
    background-position: -200% 0; 
  }
  100% { 
    background-position: 200% 0; 
  }
`;

// Custom Icon Components using Material-UI styling
const StarIcon = ({ filled, onClick, sx = {} }) => (
  <Box
    component="svg"
    onClick={onClick}
    sx={{ 
      width: 20, 
      height: 20, 
      cursor: 'pointer',
      color: filled ? STAR_COLOR : 'rgba(0,0,0,0.12)',
      transition: 'all 0.2s',
      '&:hover': { transform: 'scale(1.1)' },
      ...sx
    }}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </Box>
);

const CheckCircleIcon = ({ sx = {} }) => (
  <Box
    component="svg"
    sx={{ width: 32, height: 32, ...sx }}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </Box>
);

const UserIcon = ({ sx = {} }) => (
  <Box
    component="svg"
    sx={{ width: 16, height: 16, ...sx }}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </Box>
);

const BuildingIcon = ({ sx = {} }) => (
  <Box
    component="svg"
    sx={{ width: 16, height: 16, ...sx }}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </Box>
);

const MessageIcon = ({ sx = {} }) => (
  <Box
    component="svg"
    sx={{ width: 20, height: 20, ...sx }}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </Box>
);

const UploadIcon = ({ sx = {} }) => (
  <Box
    component="svg"
    sx={{ width: 24, height: 24, ...sx }}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </Box>
);

const RotateIcon = ({ sx = {} }) => (
  <Box
    component="svg"
    sx={{ width: 16, height: 16, ...sx }}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </Box>
);

export default function TestimonialSubmission() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [form, setForm] = useState({
    name: '',
    position: '',
    company: '',
    content: '',
    rating: 5,
    photo: null,
    photoPreview: null,
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [visibleElements, setVisibleElements] = useState({});
  const fileRef = useRef();
  const code = '0002';

  // Animation triggers
  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleElements(prev => ({ ...prev, header: true })), 100),
      setTimeout(() => setVisibleElements(prev => ({ ...prev, cards: true })), 300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm(p => ({ ...p, photo: f, photoPreview: URL.createObjectURL(f) }));
  };

  const submit = async () => {
    if (submitting) return;
    if (!form.name.trim() || !form.content.trim()) {
      setError('Please fill name and content');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('position', form.position.trim());
      formData.append('company', form.company.trim());
      formData.append('content', form.content.trim());
      formData.append('rating', form.rating);
      formData.append('source', 'public-form');

      // Add photo if selected (field name must be 'photo' to match your multer config)
      if (form.photo) {
        formData.append('photo', form.photo);
      }

      // Submit to your backend API
      const response = await axios.post(`${API_BASE}/api/testimonials/public`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      if (response.data.success) {
        console.log('Testimonial submitted successfully:', response.data);
        setDone(true);
        // Clean up photo preview URL
        if (form.photoPreview) {
          URL.revokeObjectURL(form.photoPreview);
        }
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }

    } catch (err) {
      console.error('Testimonial submission error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to submit testimonial. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    // Clean up photo preview URL before resetting
    if (form.photoPreview) {
      URL.revokeObjectURL(form.photoPreview);
    }
    
    setForm({
      name: '',
      position: '',
      company: '',
      content: '',
      rating: 5,
      photo: null,
      photoPreview: null,
    });
    setError('');
    
    // Reset file input
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  // Clean up photo preview URL on unmount
  useEffect(() => {
    return () => {
      if (form.photoPreview) {
        URL.revokeObjectURL(form.photoPreview);
      }
    };
  }, [form.photoPreview]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 4, sm: 6, md: 8 },
        background: `
          radial-gradient(circle at 20% 20%, rgba(26,201,159,0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(46,139,139,0.06) 0%, transparent 50%),
          radial-gradient(circle at 50% 100%, rgba(52,152,219,0.05) 0%, transparent 50%),
          linear-gradient(135deg, #f8fafc 0%, #f0fdfb 50%, #e0f2fe 100%)
        `,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Floating background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: { xs: 100, md: 200 },
          height: { xs: 100, md: 200 },
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(26,201,159,0.1) 0%, transparent 70%)`,
          animation: `${floatSoft} 15s ease-in-out infinite`,
          zIndex: 0,
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: { xs: 80, md: 150 },
          height: { xs: 80, md: 150 },
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(46,139,139,0.08) 0%, transparent 70%)`,
          animation: `${floatSoft} 12s ease-in-out infinite reverse`,
          zIndex: 0,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Fade in={visibleElements.header} timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            <Chip
              icon={<MessageIcon />}
              label="Public Testimonial Submission"
              sx={{
                px: { xs: 3, sm: 4 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.85rem', sm: '1rem' },
                fontWeight: 800,
                letterSpacing: 1,
                color: theme.palette.primary.main,
                border: `2px solid ${theme.palette.primary.main}`,
                background: `linear-gradient(135deg, rgba(26,201,159,0.15), rgba(26,201,159,0.05))`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 8px 32px rgba(26,201,159,0.2)`,
                mb: 3,
                animation: `${slideInUp} 1s ease-out`,
              }}
            />
            
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              sx={{
                fontWeight: 900,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, #2E8B8B, #1976d2)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: `${shimmer} 3s ease-in-out infinite`,
                lineHeight: 1.2,
              }}
            >
              Share Your Experience
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                maxWidth: { xs: '100%', md: 600 },
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                px: { xs: 1, sm: 0 },
              }}
            >
              You're submitting via code{' '}
              <Chip 
                label={code} 
                size="small" 
                color="primary" 
                sx={{ fontWeight: 700, mx: 0.5 }} 
              />. 
              Share your story and help others discover our services.
            </Typography>
          </Box>
        </Fade>

        {/* Error Alert */}
        {error && (
          <Fade in timeout={300}>
            <Container maxWidth="md" sx={{ mb: 3 }}>
              <Alert 
                severity="error" 
                onClose={() => setError('')}
                sx={{ borderRadius: 2 }}
              >
                {error}
              </Alert>
            </Container>
          </Fade>
        )}

        {/* Main Content Grid */}
        <Grow in={visibleElements.cards} timeout={1200}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            
            {/* Right Side - Form Card (1/3 width) */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  height: 'fit-content',
                  border: `2px solid ${CARD_BORDER}`,
                  borderRadius: { xs: 3, md: 4 },
                  background: CARD_BG,
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: { md: 'sticky' },
                  top: { md: 24 },
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 16px 32px rgba(0,0,0,0.12)`,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 4 } }}>
                  {done ? (
                    // Success State
                    <Box sx={{ textAlign: 'center', py: { xs: 4, md: 6 } }}>
                      <Box
                        sx={{
                          width: { xs: 80, md: 100 },
                          height: { xs: 80, md: 100 },
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3,
                          animation: `${slideInUp} 0.8s ease-out`,
                        }}
                      >
                        <CheckCircleIcon sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 900, mb: 2 }}>
                        Thank You!
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 300, mx: 'auto' }}>
                        Your testimonial has been submitted successfully and is pending review. We appreciate you taking the time to share your experience!
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setDone(false);
                          resetForm();
                        }}
                        sx={{ fontWeight: 600, px: 4, borderRadius: 3 }}
                      >
                        Submit Another
                      </Button>
                    </Box>
                  ) : (
                    // Form Content
                    <>
                      {/* Form Header */}
                      <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 3,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MessageIcon sx={{ color: 'white' }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                              Your Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Fill in your information
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Stack spacing={3}>
                        {/* Name Field */}
                        <TextField 
                          label="Full Name *" 
                          value={form.name}
                          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                          fullWidth
                          variant="outlined"
                          disabled={submitting}
                          InputProps={{
                            startAdornment: <UserIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                        />

                        {/* Position */}
                        <TextField 
                          label="Position" 
                          value={form.position}
                          onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                          fullWidth
                          variant="outlined"
                          disabled={submitting}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                            },
                          }}
                        />

                        {/* Company */}
                        <TextField 
                          label="Company" 
                          value={form.company}
                          onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                          fullWidth
                          variant="outlined"
                          disabled={submitting}
                          InputProps={{
                            startAdornment: <BuildingIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                            },
                          }}
                        />

                        {/* Testimonial Content */}
                        <TextField
                          label="Your Testimonial *"
                          value={form.content}
                          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                          multiline 
                          minRows={3}
                          maxRows={5}
                          fullWidth
                          variant="outlined"
                          disabled={submitting}
                          placeholder="Share your experience with our services..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                            },
                          }}
                        />

                        {/* Rating */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'rgba(245,179,1,0.08)',
                            border: '1px solid rgba(245,179,1,0.2)',
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                            Rating
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  filled={i < form.rating}
                                  onClick={() => !submitting && setForm(p => ({ ...p, rating: i + 1 }))}
                                  sx={{ cursor: submitting ? 'not-allowed' : 'pointer' }}
                                />
                              ))}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              ({form.rating}/5)
                            </Typography>
                          </Box>
                        </Paper>

                        {/* Photo Upload */}
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                            Photo (Optional)
                          </Typography>
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            fullWidth
                            disabled={submitting}
                            sx={{ 
                              py: 2,
                              borderRadius: 3,
                              borderStyle: 'dashed',
                              borderWidth: 2,
                              '&:hover': {
                                borderStyle: 'dashed',
                                borderColor: theme.palette.primary.main,
                                background: `${theme.palette.primary.main}08`,
                              },
                            }}
                          >
                            {form.photoPreview ? 'Change Photo' : 'Upload Your Photo'}
                            <input 
                              ref={fileRef} 
                              type="file" 
                              hidden 
                              accept="image/*" 
                              onChange={onPick}
                              disabled={submitting}
                            />
                          </Button>
                          {form.photoPreview && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Avatar 
                                src={form.photoPreview} 
                                sx={{ 
                                  width: { xs: 80, sm: 96 }, 
                                  height: { xs: 80, sm: 96 },
                                  border: `3px solid ${theme.palette.primary.main}`,
                                }} 
                              />
                            </Box>
                          )}
                        </Box>
                      </Stack>

                      {/* Action Buttons */}
                      <Box sx={{ 
                        mt: 4, 
                        display: 'flex', 
                        gap: 2,
                        flexDirection: { xs: 'column', sm: 'row' },
                      }}>
                        <Button
                          onClick={submit}
                          disabled={submitting}
                          variant="contained"
                          size="large"
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            '&:hover': { 
                              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                            },
                            px: 4,
                            py: 2,
                            fontWeight: 800,
                            borderRadius: 3,
                            boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
                            flex: 1,
                          }}
                        >
                          {submitting ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  border: 2,
                                  borderColor: 'rgba(255,255,255,0.3)',
                                  borderTopColor: 'white',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite',
                                  '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' },
                                  },
                                }}
                              />
                              Submitting...
                            </Box>
                          ) : (
                            'Submit Testimonial'
                          )}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={resetForm}
                          disabled={submitting}
                          size="large"
                          startIcon={<RotateIcon />}
                          sx={{ 
                            fontWeight: 700,
                            borderRadius: 3,
                            px: 4,
                            py: 2,
                            flex: 1,
                          }}
                        >
                          Reset Form
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Left Side - Preview Cards (2/3 width) */}
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                
                {/* Live Preview Card */}
                <Card
                  elevation={0}
                  sx={{
                    border: `2px solid ${CARD_BORDER}`,
                    borderRadius: { xs: 3, md: 4 },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}08, transparent 50%)`,
                    backdropFilter: 'blur(20px)',
                    animation: `${floatSoft} 20s ease-in-out infinite`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 16px 32px rgba(0,0,0,0.12)`,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    {/* Preview Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${STAR_COLOR}, #FF8C00)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <StarIcon filled sx={{ color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.secondary.main }}>
                          Live Preview
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          See how your testimonial will appear
                        </Typography>
                      </Box>
                    </Box>

                    {/* Testimonial Preview */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}05, transparent)`,
                        border: `2px solid ${theme.palette.primary.main}20`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                        <Avatar
                          src={form.photoPreview || undefined}
                          sx={{
                            width: { xs: 56, sm: 64, md: 72 },
                            height: { xs: 56, sm: 64, md: 72 },
                            border: `3px solid ${theme.palette.primary.main}`,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
                            flexShrink: 0,
                          }}
                        >
                          {!form.photoPreview && (form.name?.[0]?.toUpperCase() || 'U')}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant={isMobile ? "h6" : "h5"} 
                            sx={{ 
                              fontWeight: 900, 
                              lineHeight: 1.2,
                              mb: 0.5,
                              wordBreak: 'break-word',
                            }}
                          >
                            {form.name || 'Your Name'}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontWeight: 600,
                              mb: 1,
                              wordBreak: 'break-word',
                            }}
                          >
                            {form.position && form.company 
                              ? `${form.position} • ${form.company}`
                              : form.position || form.company || 'Your Position • Your Company'
                            }
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} filled={i < form.rating} sx={{ width: 16, height: 16 }} />
                            ))}
                          </Box>
                        </Box>
                      </Box>

                      <Typography
                        variant="body1"
                        sx={{
                          color: '#0f172a',
                          lineHeight: 1.7,
                          fontWeight: 500,
                          fontStyle: 'italic',
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          wordBreak: 'break-word',
                          '&::before': { content: '"' },
                          '&::after': { content: '"' },
                        }}
                      >
                        {form.content || 'Your testimonial preview will appear here. Share your honest experience and help others discover our services.'}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>

                {/* Tips Card */}
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.success.light}20`,
                    borderRadius: 3,
                    background: `rgba(26,201,159,0.05)`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                        }}
                      >
                        💡
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                        Tips for great testimonials
                      </Typography>
                    </Box>
                    
                    <Stack spacing={1}>
                      {[
                        'Use a clear, professional headshot',
                        'Share specific benefits you experienced',
                        'Keep it concise but meaningful',
                        'Be authentic and honest',
                        'Your testimonial will be reviewed before publishing'
                      ].map((tip, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: theme.palette.primary.main,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {tip}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

          </Grid>
        </Grow>
      </Container>
    </Box>
  );
}
