import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, TextField, Button, Typography, CircularProgress, Alert, Paper, 
  InputAdornment, IconButton, Avatar, Stack, Fade, Zoom,
  useMediaQuery, useTheme, Container
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { keyframes } from '@emotion/react';
import {
  Email as EmailIcon, Lock as LockIcon, Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon, Login as LoginIcon, 
  Shield as ShieldIcon, Analytics as AnalyticsIcon, 
  Public as PublicIcon, Insights as InsightsIcon,
  BusinessCenter as BusinessIcon, Speed as SpeedIcon, 
  Security as SecurityIcon
} from '@mui/icons-material';
import theme from '../../theme';
import { API_BASE } from '../../utils/api';

// Optimized Animations
const morphingBackground = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;

const floatingCard = keyframes`
  0%, 100% { 
    transform: translateY(0px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
  }
  50% { 
    transform: translateY(-3px);
    box-shadow: 0 20px 45px rgba(0,0,0,0.15);
  }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const particleFloat = keyframes`
  0%, 100% { 
    transform: translate3d(0, 0, 0);
    opacity: 0.6;
  }
  50% { 
    transform: translate3d(20px, -20px, 0);
    opacity: 1;
  }
`;

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, formData);
      const { data } = response;

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        if (data.data.user.role === 'superadmin' || data.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard'); 
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Background Image Side - Left (Desktop Only) */}
        <Box sx={{
          flex: { xs: 0, md: 1 },
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          background: `
            linear-gradient(45deg, 
              rgba(26, 201, 159, 0.85) 0%,
              rgba(32, 178, 170, 0.75) 50%,
              rgba(26, 201, 159, 0.85) 100%
            ),
            url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: `${morphingBackground} 15s ease-in-out infinite`
        }}>
          
          {/* Compact Particles */}
          {[...Array(8)].map((_, index) => (
            <Box key={index} sx={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 12 + 6}px`,
              height: `${Math.random() * 12 + 6}px`,
              borderRadius: '50%',
              background: `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.3})`,
              animation: `${particleFloat} ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }} />
          ))}

          {/* Centered Content */}
          <Box sx={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
            color: 'white'
          }}>
            
            {/* Logo Section */}
            <Fade in={isVisible} timeout={800}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                  backdropFilter: 'blur(15px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontSize: '2.5rem',
                  animation: `${floatingCard} 4s ease-in-out infinite`
                }}>
                  🌱
                </Avatar>
                
                <Typography variant="h2" sx={{
                  fontWeight: 900,
                  mb: 1,
                  fontSize: { md: '2.5rem', lg: '3rem' },
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  GreonXpert
                </Typography>
                
                <Typography variant="h6" sx={{
                  fontWeight: 600,
                  opacity: 0.9,
                  mb: 2,
                  fontSize: '1.1rem'
                }}>
                  Climate Intelligence Platform
                </Typography>
                
                <Typography variant="body1" sx={{
                  opacity: 0.8,
                  lineHeight: 1.6,
                  maxWidth: '400px',
                  fontSize: '0.95rem',
                  textShadow: '0 1px 5px rgba(0,0,0,0.3)'
                }}>
                  Empowering organizations worldwide to achieve carbon neutrality 
                  through AI-powered insights and strategic solutions.
                </Typography>
              </Box>
            </Fade>

            {/* Compact Feature Stats */}
            <Fade in={isVisible} timeout={1200}>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                {[
                  { icon: <PublicIcon />, stat: '50+', label: 'Countries' },
                  { icon: <BusinessIcon />, stat: '1K+', label: 'Companies' },
                  { icon: <AnalyticsIcon />, stat: '1M+', label: 'Insights' }
                ].map((item, index) => (
                  <Zoom in={isVisible} timeout={1500 + index * 100} key={item.label}>
                    <Paper sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      textAlign: 'center',
                      minWidth: '80px',
                      transition: 'transform 0.3s ease',
                      '&:hover': { transform: 'translateY(-5px)' }
                    }}>
                      <Box sx={{ color: 'white', mb: 0.5, fontSize: '1.5rem' }}>
                        {item.icon}
                      </Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 800, 
                        color: 'white',
                        fontSize: '1.2rem'
                      }}>
                        {item.stat}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}>
                        {item.label}
                      </Typography>
                    </Paper>
                  </Zoom>
                ))}
              </Stack>
            </Fade>
          </Box>
        </Box>

        {/* Login Form Side - Right */}
        <Box sx={{
          flex: { xs: 1, md: 1 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isMobile 
            ? `linear-gradient(135deg, 
                rgba(26, 201, 159, 0.1) 0%,
                rgba(32, 178, 170, 0.1) 100%
              ), url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')`
            : `linear-gradient(135deg, 
                #f8fafc 0%, 
                #f1f5f9 50%,
                #f8fafc 100%
              )`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          p: { xs: 2, sm: 3, md: 4 },
          animation: isMobile ? '' : `${gradientShift} 12s ease-in-out infinite`,
          '&::before': isMobile ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 0
          } : {}
        }}>

          <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
            <Fade in={isVisible} timeout={600}>
              <Paper sx={{
                borderRadius: { xs: 3, md: 4 },
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                boxShadow: `
                  0 20px 40px rgba(0, 0, 0, 0.1),
                  0 8px 16px rgba(0, 0, 0, 0.06),
                  inset 0 1px 0 rgba(255, 255, 255, 0.9)
                `,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                overflow: 'hidden',
                position: 'relative',
                maxHeight: '90vh',
                animation: `${floatingCard} 6s ease-in-out infinite`,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, 
                    #1AC99F 0%, 
                    #20B2AA 50%, 
                    #1AC99F 100%
                  )`,
                  backgroundSize: '200% 100%',
                  animation: `${gradientShift} 2s ease-in-out infinite`
                }
              }}>
                
                <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  
                  {/* Mobile Brand Header */}
                  {isMobile && (
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Avatar sx={{
                        width: 60,
                        height: 60,
                        mx: 'auto',
                        mb: 2,
                        background: 'linear-gradient(135deg, #1AC99F, #20B2AA)',
                        fontSize: '1.8rem'
                      }}>
                        🌱
                      </Avatar>
                      <Typography variant="h5" sx={{
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #1AC99F, #20B2AA)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        GreonXpert
                      </Typography>
                    </Box>
                  )}

                  {/* Compact Header */}
                  <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
                    <Typography variant="h4" sx={{
                      fontWeight: 800,
                      color: '#1e293b',
                      mb: 1,
                      fontSize: { xs: '1.8rem', md: '2rem' }
                    }}>
                      Welcome Back
                    </Typography>
                    <Typography variant="body1" sx={{
                      color: '#64748b',
                      fontWeight: 500,
                      fontSize: { xs: '0.9rem', md: '1rem' }
                    }}>
                      Access your sustainability dashboard
                    </Typography>
                  </Box>

                  {/* Compact Security Badge */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: { xs: 3, md: 4 }
                  }}>
                    <Paper sx={{
                      px: 3,
                      py: 1,
                      borderRadius: 20,
                      background: 'linear-gradient(135deg, rgba(26, 201, 159, 0.1), rgba(32, 178, 170, 0.1))',
                      border: '1px solid rgba(26, 201, 159, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}>
                      <SecurityIcon sx={{ color: '#1AC99F', fontSize: 18 }} />
                      <Typography variant="caption" sx={{
                        color: '#1AC99F',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}>
                        Enterprise Security
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Error Alert */}
                  {error && (
                    <Fade in={Boolean(error)}>
                      <Alert 
                        severity="error" 
                        onClose={() => setError('')}
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          fontSize: '0.85rem'
                        }}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}

                  {/* Compact Login Form */}
                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                      
                      {/* Email Field */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1, 
                          fontWeight: 600, 
                          color: '#374151',
                          fontSize: '0.9rem'
                        }}>
                          Email Address
                        </Typography>
                        <TextField
                          variant="outlined"
                          required
                          fullWidth
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          autoFocus
                          value={formData.email}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField('')}
                          disabled={loading}
                          placeholder="Enter your professional email"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon sx={{ 
                                  color: focusedField === 'email' ? '#1AC99F' : '#94a3b8',
                                  transition: 'all 0.3s ease',
                                  fontSize: '1.2rem'
                                }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: focusedField === 'email' 
                                ? 'rgba(26, 201, 159, 0.05)' 
                                : 'rgba(248, 250, 252, 0.8)',
                              transition: 'all 0.3s ease',
                              fontSize: '0.95rem',
                              height: '48px',
                              '& fieldset': {
                                borderColor: 'rgba(203, 213, 225, 0.6)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(26, 201, 159, 0.4)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1AC99F',
                                borderWidth: '2px'
                              },
                            },
                          }}
                        />
                      </Box>

                      {/* Password Field */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1, 
                          fontWeight: 600, 
                          color: '#374151',
                          fontSize: '0.9rem'
                        }}>
                          Password
                        </Typography>
                        <TextField
                          variant="outlined"
                          required
                          fullWidth
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          autoComplete="current-password"
                          value={formData.password}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField('')}
                          disabled={loading}
                          placeholder="Enter your secure password"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon sx={{ 
                                  color: focusedField === 'password' ? '#1AC99F' : '#94a3b8',
                                  transition: 'all 0.3s ease',
                                  fontSize: '1.2rem'
                                }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                  disabled={loading}
                                  sx={{ 
                                    color: '#64748b',
                                    '&:hover': { color: '#1AC99F' }
                                  }}
                                >
                                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: focusedField === 'password' 
                                ? 'rgba(26, 201, 159, 0.05)' 
                                : 'rgba(248, 250, 252, 0.8)',
                              transition: 'all 0.3s ease',
                              fontSize: '0.95rem',
                              height: '48px',
                              '& fieldset': {
                                borderColor: 'rgba(203, 213, 225, 0.6)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(26, 201, 159, 0.4)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1AC99F',
                                borderWidth: '2px'
                              },
                            },
                          }}
                        />
                      </Box>

                      {/* Login Button */}
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading || !formData.email || !formData.password}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LoginIcon />}
                        sx={{
                          background: 'linear-gradient(135deg, #1AC99F, #20B2AA)',
                          color: 'white',
                          py: { xs: 1.8, md: 2 },
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                          boxShadow: '0 8px 20px rgba(26, 201, 159, 0.3)',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #20B2AA, #1AC99F)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 28px rgba(26, 201, 159, 0.4)'
                          },
                          '&:disabled': {
                            background: 'rgba(148, 163, 184, 0.4)',
                            color: 'rgba(100, 116, 139, 0.8)',
                            transform: 'none',
                            boxShadow: 'none'
                          },
                        }}
                      >
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                      </Button>
                    </Stack>
                  </Box>

                 
                </Box>
              </Paper>
            </Fade>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
