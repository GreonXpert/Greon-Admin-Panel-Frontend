import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Box, TextField, Button, Typography, CircularProgress, Alert, Paper, 
  InputAdornment, IconButton, Avatar, Stack, Divider, Card, CardContent, Fade
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import {
  Email as EmailIcon, Lock as LockIcon, Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon, Login as LoginIcon, AdminPanelSettings as AdminIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import theme from '../../theme';
import logo from '../../logo.svg';
import { API_BASE } from '../../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
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
        alignItems: 'center',
        justifyContent: 'center',
          background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 50%, #306659ff 100%)',
        px: 2,
        py: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(26, 201, 159, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(118, 75, 162, 0.3) 0%, transparent 50%)',
          zIndex: 0
        }
      }}>
        <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in={isVisible} timeout={800}>
            <Card sx={{
              borderRadius: 4,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.3)',
              overflow: 'hidden'
            }}>
              {/* Header Section */}
              <Box sx={{ 
                background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 100%)',
                color: 'white',
                py: 4,
                px: 4,
                textAlign: 'center',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)'
                }
              }}>
                <Avatar 
                  src={logo} 
                  alt="GreonXpert Logo" 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto',
                    mb: 2,
                    border: '3px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                  }} 
                />
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  Welcome Back
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.9,
                  fontWeight: 500
                }}>
                  Sign in to access your admin panel
                </Typography>
              </Box>

              <CardContent sx={{ p: 4 }}>
                {/* Security Badge */}
                <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
                  <Paper sx={{ 
                    px: 3, 
                    py: 1, 
                    borderRadius: 20,
                    background: 'rgba(26,201,159,0.1)',
                    border: '1px solid rgba(26,201,159,0.2)'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SecurityIcon sx={{ color: '#1AC99F', fontSize: 18 }} />
                      <Typography variant="caption" sx={{ color: '#1AC99F', fontWeight: 600 }}>
                        Secure Admin Access
                      </Typography>
                    </Stack>
                  </Paper>
                </Stack>

                {/* Alert */}
                {error && (
                  <Fade in={Boolean(error)}>
                    <Alert 
                      severity="error" 
                      onClose={() => setError('')}
                      sx={{ 
                        mb: 3,
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(244,67,54,0.2)',
                        '& .MuiAlert-icon': {
                          color: '#F44336'
                        }
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                {/* Login Form */}
                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ 
                        mb: 1, 
                        fontWeight: 600, 
                        color: 'text.secondary' 
                      }}>
                        Email Address
                      </Typography>
                      <TextField
                        variant="outlined"
                        required
                        fullWidth
                        id="email"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Enter your email address"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: '#1AC99F' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: 'rgba(26,201,159,0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(26,201,159,0.08)',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(26,201,159,0.5)',
                              },
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'rgba(26,201,159,0.08)',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1AC99F',
                                borderWidth: '2px',
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ 
                        mb: 1, 
                        fontWeight: 600, 
                        color: 'text.secondary' 
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
                        disabled={loading}
                        placeholder="Enter your password"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: '#1AC99F' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleTogglePasswordVisibility}
                                edge="end"
                                disabled={loading}
                                sx={{ color: '#1AC99F' }}
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: 'rgba(26,201,159,0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(26,201,159,0.08)',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(26,201,159,0.5)',
                              },
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'rgba(26,201,159,0.08)',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1AC99F',
                                borderWidth: '2px',
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading || !formData.email || !formData.password}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
                        },
                        '&:disabled': {
                          background: 'rgba(0,0,0,0.12)',
                          color: 'rgba(0,0,0,0.26)',
                          transform: 'none'
                        },
                        borderRadius: 3,
                        py: 1.8,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        color: '#ffffff',
                        boxShadow: '0 4px 20px rgba(26,201,159,0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In to Dashboard'}
                    </Button>
                  </Stack>
                </Box>

                <Divider sx={{ my: 4, opacity: 0.3 }} />

                {/* Admin Info */}
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(26,201,159,0.05), rgba(26,201,159,0.1))',
                  border: '1px solid rgba(26,201,159,0.2)',
                  textAlign: 'center'
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                    <AdminIcon sx={{ color: '#1AC99F', fontSize: 28 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1AC99F' }}>
                        Admin Panel Access
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only authorized administrators can access this system
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </CardContent>
            </Card>
          </Fade>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
