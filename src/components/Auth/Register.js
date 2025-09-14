import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, TextField, Button, Typography, CircularProgress, Alert, Paper, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, Stepper, Step, StepLabel, StepContent,
  Avatar, LinearProgress, Divider, Chip, Card, CardContent, Container, Stack,
  Grid, IconButton
} from '@mui/material';
import {
  Person as PersonIcon, Email as EmailIcon, Lock as LockIcon,
  AdminPanelSettings as AdminIcon, AccountCircle as UserIcon, CheckCircle as CheckIcon,
  PersonAdd as PersonAddIcon, Security as SecurityIcon, ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon, Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { API_BASE } from '../../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const steps = [
    {
      label: 'Personal Information',
      description: 'Enter your basic details',
      icon: <PersonIcon />
    },
    {
      label: 'Security Setup',
      description: 'Create a secure password',
      icon: <SecurityIcon />
    },
    {
      label: 'Role Assignment',
      description: 'Select user permissions',
      icon: <AdminIcon />
    }
  ];

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return '#F44336';
    if (passwordStrength < 75) return '#FF9800';
    return '#4CAF50';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    if (error) setError('');
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.name.trim() && formData.email.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 1:
        return formData.password.length >= 6 &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword;
      case 2:
        return formData.role;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setError('');
    } else {
      setError('Please fill all required fields correctly');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) {
      setError('Please complete all steps');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/api/auth/register`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('User registered successfully!');
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
        setActiveStep(0);
        setPasswordStrength(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    return role === 'admin' ? <AdminIcon /> : <UserIcon />;
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? '#F44336' : '#1AC99F';
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
          background: 'linear-gradient(135deg, #1AC99F 0%, #0E9A78 50%, #306659ff 100%)',
      overflow: 'hidden'
    }}>
      {/* Alert - Fixed at top */}
      {(alert.open || error || success) && (
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          mx: 3,
          mt: 2,
          mb: 1
        }}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(244,67,54,0.2)',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255,255,255,0.95)'
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              onClose={() => setSuccess('')}
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(76,175,80,0.2)',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255,255,255,0.95)'
              }}
            >
              {success}
            </Alert>
          )}
        </Box>
      )}

      {/* Fixed Header Section */}
      <Box sx={{ 
        flexShrink: 0,
        px: 3, 
        py: 2,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
          <Avatar sx={{ 
            bgcolor: '#1AC99F', 
            width: 56, 
            height: 56,
            boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
          }}>
            <PersonAddIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box textAlign="center">
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              color: 'white',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              mb: 0.5
            }}>
              Create New User
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 500
            }}>
              Follow the steps below to register a new user
            </Typography>
          </Box>
        </Stack>

        {/* Progress Indicator */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontWeight: 600 
            }}>
              Registration Progress
            </Typography>
            <Chip 
              label={`Step ${activeStep + 1} of ${steps.length}`}
              sx={{ 
                bgcolor: '#1AC99F', 
                color: 'white', 
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(26,201,159,0.3)'
              }}
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={((activeStep + 1) / steps.length) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(45deg, #f17d0fff, #9a1e0eff)',
                boxShadow: '0 0 10px rgba(26,201,159,0.5)'
              }
            }}
          />
        </Box>
      </Box>

      {/* ✅ FIXED: Scrollable Content Area */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        px: 3,
        py: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        '&::-webkit-scrollbar': {
          width: 8,
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
        },
      }}>
        <Box sx={{ width: '100%', maxWidth: 800 }}>
          {/* Main Form Card */}
          <Card sx={{ 
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 4 }}>
              {/* Step Content */}
              <Box sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: '#1AC99F', 
                    width: 48, 
                    height: 48,
                    boxShadow: '0 4px 12px rgba(26,201,159,0.3)'
                  }}>
                    {steps[activeStep].icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1AC99F' }}>
                      {steps[activeStep].label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {steps[activeStep].description}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 4, bgcolor: 'rgba(26,201,159,0.2)' }} />

                {/* Step 0: Personal Information */}
                {activeStep === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="name"
                        label="Full Name *"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: '#1AC99F' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '&.Mui-focused fieldset': {
                              borderColor: '#1AC99F',
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="email"
                        type="email"
                        label="Email Address *"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
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
                            '&.Mui-focused fieldset': {
                              borderColor: '#1AC99F',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Step 1: Security Setup */}
                {activeStep === 1 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        label="Password *"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: '#1AC99F' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '&.Mui-focused fieldset': {
                              borderColor: '#1AC99F',
                            },
                          },
                        }}
                      />

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <Box sx={{ mt: 2 }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Password Strength:
                            </Typography>
                            <Chip 
                              label={getPasswordStrengthText()}
                              size="small"
                              sx={{ 
                                bgcolor: getPasswordStrengthColor(),
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={passwordStrength}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: getPasswordStrengthColor()
                              }
                            }}
                          />
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        label="Confirm Password *"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: '#1AC99F' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                >
                                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                                {formData.password === formData.confirmPassword && formData.confirmPassword && (
                                  <CheckIcon sx={{ color: '#4CAF50' }} />
                                )}
                              </Stack>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '&.Mui-focused fieldset': {
                              borderColor: '#1AC99F',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Step 2: Role Assignment */}
                {activeStep === 2 && (
                  <Box>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel sx={{ color: '#1AC99F' }}>Select User Role *</InputLabel>
                      <Select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        label="Select User Role *"
                        disabled={loading}
                        sx={{
                          borderRadius: 3,
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1AC99F',
                          },
                        }}
                      >
                        <MenuItem value="user">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <UserIcon sx={{ color: '#1AC99F' }} />
                            <Box>
                              <Typography variant="body1" fontWeight={600}>User</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Standard access permissions
                              </Typography>
                            </Box>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="admin">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <AdminIcon sx={{ color: '#F44336' }} />
                            <Box>
                              <Typography variant="body1" fontWeight={600}>Admin</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Full administrative privileges
                              </Typography>
                            </Box>
                          </Stack>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Role Preview Card */}
                    <Card sx={{ 
                      background: `linear-gradient(135deg, ${getRoleColor(formData.role)}, ${getRoleColor(formData.role)}15)`,
                      border: `2px solid ${getRoleColor(formData.role)}`,
                      borderRadius: 3,
                      p: 3
                    }}>
                      <Stack direction="row" alignItems="center" spacing={3}>
                        <Avatar sx={{ 
                          bgcolor: getRoleColor(formData.role), 
                          width: 64, 
                          height: 64,
                          boxShadow: `0 8px 25px ${getRoleColor(formData.role)}40`
                        }}>
                          {getRoleIcon(formData.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ 
                            fontWeight: 700, 
                            color: getRoleColor(formData.role),
                            mb: 1
                          }}>
                            {formData.role.toUpperCase()} ROLE
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {formData.role === 'admin'
                              ? 'Full system access with administrative privileges including user management, system settings, and all content management capabilities.'
                              : 'Standard user access with limited permissions for viewing and basic interactions within the system.'
                            }
                          </Typography>
                        </Box>
                      </Stack>
                    </Card>
                  </Box>
                )}
              </Box>

              {/* Navigation Buttons */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0 || loading}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    color: '#666',
                    '&:hover': {
                      bgcolor: 'rgba(102,102,102,0.1)'
                    }
                  }}
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !validateStep(activeStep)}
                    startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
                      },
                      '&:disabled': {
                        background: 'rgba(0,0,0,0.12)',
                        color: 'rgba(0,0,0,0.26)'
                      },
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      color: '#ffffff',
                      boxShadow: '0 4px 20px rgba(26,201,159,0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? 'Creating User...' : 'Register User'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={loading || !validateStep(activeStep)}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #0E9A78, #1AC99F)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(26,201,159,0.4)'
                      },
                      '&:disabled': {
                        background: 'rgba(0,0,0,0.12)',
                        color: 'rgba(0,0,0,0.26)'
                      },
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      color: '#ffffff',
                      boxShadow: '0 4px 20px rgba(26,201,159,0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Next Step
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
