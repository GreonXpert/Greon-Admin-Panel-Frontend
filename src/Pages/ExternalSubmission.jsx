// src/components/ExternalSubmission/ExternalSubmission.jsx - COMPLETE ENHANCED VERSION

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Paper, TextField, Button,
  MenuItem, Stepper, Step, StepLabel, Alert, CircularProgress,
  Grid, Chip, Avatar, Stack, Divider, useMediaQuery, IconButton,
  InputAdornment, FormControlLabel, Switch
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import { keyframes } from '@emotion/react';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArticleIcon from '@mui/icons-material/Article';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AttachFileIcon from '@mui/icons-material/AttachFile';

import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { API_BASE } from '../utils/api';


// Enhanced Animations
const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// Responsive Container
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(6),
  minHeight: '100vh',
  background: `linear-gradient(135deg,
    ${alpha('#1AC99F', 0.1)} 0%,
    ${alpha('#2E8B8B', 0.15)} 50%,
    ${alpha('#1AC99F', 0.08)} 100%)`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, ${alpha('#1AC99F', 0.3)} 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, ${alpha('#2E8B8B', 0.2)} 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, ${alpha('#4EDCB9', 0.1)} 0%, transparent 50%)
    `,
    zIndex: 0,
  },
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
}));

// Glass-morphism Form Card
const FormCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 1000,
  padding: theme.spacing(4),
  borderRadius: 24,
  background: `linear-gradient(145deg,
    ${alpha('#ffffff', 0.8)},
    ${alpha('#ffffff', 0.6)}
  )`,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#1AC99F', 0.2)}`,
  boxShadow: `
    0 8px 32px ${alpha('#1AC99F', 0.1)},
    0 1px 3px ${alpha('#000000', 0.05)},
    inset 0 1px 0 ${alpha('#ffffff', 0.9)}
  `,
  position: 'relative',
  zIndex: 1,
  animation: `${slideUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1)`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, #1AC99F, #4EDCB9, #2E8B8B)`,
    borderRadius: '24px 24px 0 0',
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: '95vw',
    padding: theme.spacing(3),
    borderRadius: 20,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2.5),
    borderRadius: 16,
    margin: theme.spacing(1),
  },
}));

// 4-Dot Password Input
const PasswordDotsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(2),
  margin: theme.spacing(3, 0),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1.5),
  },
}));

const PasswordDot = styled(Box)(({ theme, filled, active }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  border: `3px solid ${filled ? '#1AC99F' : alpha('#1AC99F', 0.3)}`,
  background: filled 
    ? `linear-gradient(145deg, #1AC99F, #4EDCB9)`
    : `linear-gradient(145deg, ${alpha('#ffffff', 0.8)}, ${alpha('#1AC99F', 0.05)})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: filled ? '#ffffff' : alpha('#2E8B8B', 0.5),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  animation: active ? `${pulse} 1s infinite` : 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.3)}, transparent)`,
    animation: filled ? `${shimmer} 1.5s ease-in-out` : 'none',
  },
  [theme.breakpoints.down('sm')]: {
    width: 50,
    height: 50,
    fontSize: '1.25rem',
  },
}));

// Enhanced Stepper
const StyledStepper = styled(Stepper)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  background: `linear-gradient(145deg,
    ${alpha('#1AC99F', 0.08)},
    ${alpha('#2E8B8B', 0.05)}
  )`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: 20,
  border: `1px solid ${alpha('#1AC99F', 0.15)}`,
  '& .MuiStepLabel-iconContainer': {
    '& .Mui-active': {
      color: '#1AC99F',
      background: alpha('#1AC99F', 0.1),
      borderRadius: '50%',
      padding: 8,
    },
    '& .Mui-completed': {
      color: '#0E9A78',
      background: alpha('#1AC99F', 0.15),
      borderRadius: '50%',
      padding: 8,
    },
  },
  '& .MuiStepConnector-line': {
    borderColor: alpha('#1AC99F', 0.3),
    borderTopWidth: 3,
  },
  '& .MuiStepLabel-label': {
    fontWeight: 600,
    fontSize: '0.9rem',
    '&.Mui-active': {
      color: '#0E9A78',
      fontWeight: 700,
    },
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    '& .MuiStepLabel-label': {
      fontSize: '0.8rem',
    },
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    '& .MuiStepLabel-label': {
      display: 'none',
    },
  },
}));

// Modern Glass TextField
const CleanTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 16,
    background: `linear-gradient(145deg,
      ${alpha('#ffffff', 0.8)},
      ${alpha('#1AC99F', 0.03)}
    )`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '& fieldset': {
      borderColor: alpha('#1AC99F', 0.25),
      borderWidth: 2,
    },
    '&:hover fieldset': {
      borderColor: '#1AC99F',
      borderWidth: 2,
    },
    '&.Mui-focused': {
      background: `linear-gradient(145deg,
        ${alpha('#ffffff', 0.9)},
        ${alpha('#1AC99F', 0.05)}
      )`,
      transform: 'translateY(-2px)',
      boxShadow: `0 6px 25px ${alpha('#1AC99F', 0.15)}`,
      '& fieldset': {
        borderColor: '#1AC99F',
        borderWidth: 2,
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: '#2E8B8B',
    fontWeight: 600,
    '&.Mui-focused': {
      color: '#0E9A78',
      fontWeight: 700,
    },
  },
}));

// Premium Button Styles
const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(1.5, 4),
  fontWeight: 700,
  fontSize: '1rem',
  textTransform: 'none',
  background: `linear-gradient(145deg, #1AC99F, #4EDCB9)`,
  color: '#ffffff',
  boxShadow: `
    0 6px 25px ${alpha('#1AC99F', 0.3)},
    0 2px 8px ${alpha('#000000', 0.1)}
  `,
  border: 'none',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.2)}, transparent)`,
    transition: 'left 0.5s',
  },
  '&:hover': {
    background: `linear-gradient(145deg, #0E9A78, #1AC99F)`,
    boxShadow: `
      0 8px 30px ${alpha('#1AC99F', 0.4)},
      0 3px 10px ${alpha('#000000', 0.15)}
    `,
    transform: 'translateY(-2px)',
    '&::before': {
      left: '100%',
    },
  },
  '&:disabled': {
    background: alpha('#2E8B8B', 0.3),
    color: alpha('#ffffff', 0.6),
    boxShadow: 'none',
    transform: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.2, 3),
    fontSize: '0.875rem',
  },
}));

const OutlinedButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(1.5, 4),
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  color: '#1AC99F',
  background: `linear-gradient(145deg,
    ${alpha('#ffffff', 0.8)},
    ${alpha('#1AC99F', 0.05)}
  )`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `2px solid #1AC99F`,
  '&:hover': {
    background: `linear-gradient(145deg,
      ${alpha('#1AC99F', 0.1)},
      ${alpha('#4EDCB9', 0.08)}
    )`,
    borderColor: '#0E9A78',
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${alpha('#1AC99F', 0.2)}`,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.2, 3),
    fontSize: '0.875rem',
  },
}));

// Interactive Category Cards
const CategoryOption = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(3),
  borderRadius: 20,
  cursor: 'pointer',
  textAlign: 'center',
  background: selected
    ? `linear-gradient(145deg,
        ${alpha('#1AC99F', 0.15)},
        ${alpha('#4EDCB9', 0.1)}
      )`
    : `linear-gradient(145deg,
        ${alpha('#ffffff', 0.8)},
        ${alpha('#ffffff', 0.6)}
      )`,
  backdropFilter: 'blur(15px)',
  WebkitBackdropFilter: 'blur(15px)',
  border: selected
    ? `3px solid #1AC99F`
    : `2px solid ${alpha('#1AC99F', 0.2)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `conic-gradient(from 0deg, transparent, ${alpha('#1AC99F', 0.1)}, transparent)`,
    animation: selected ? `${float} 3s ease-in-out infinite` : 'none',
    zIndex: 0,
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
  '&:hover': {
    transform: 'translateY(-6px) scale(1.02)',
    boxShadow: `
      0 12px 35px ${alpha('#1AC99F', 0.2)},
      0 6px 20px ${alpha('#000000', 0.1)}
    `,
    borderColor: '#1AC99F',
    '&::after': {
      animation: `${float} 2s ease-in-out infinite`,
    },
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2.5),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    '&:hover': {
      transform: 'translateY(-3px) scale(1.01)',
    },
  },
}));

// Enhanced Upload Area
const UploadArea = styled(Box)(({ theme, isDragOver, hasFile }) => ({
  border: `3px dashed ${
    hasFile ? '#1AC99F' : (isDragOver ? '#4EDCB9' : alpha('#1AC99F', 0.4))
  }`,
  borderRadius: 20,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  background: hasFile
    ? `linear-gradient(145deg,
        ${alpha('#1AC99F', 0.15)},
        ${alpha('#4EDCB9', 0.1)}
      )`
    : isDragOver
    ? `linear-gradient(145deg,
        ${alpha('#4EDCB9', 0.1)},
        ${alpha('#1AC99F', 0.05)}
      )`
    : `linear-gradient(145deg,
        ${alpha('#ffffff', 0.7)},
        ${alpha('#1AC99F', 0.03)}
      )`,
  backdropFilter: 'blur(15px)',
  WebkitBackdropFilter: 'blur(15px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-200px',
    width: '200px',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#1AC99F', 0.1)}, transparent)`,
    animation: isDragOver ? `${shimmer} 1.5s ease-in-out infinite` : 'none',
  },
  '&:hover': {
    borderColor: '#1AC99F',
    background: `linear-gradient(145deg,
      ${alpha('#1AC99F', 0.08)},
      ${alpha('#4EDCB9', 0.05)}
    )`,
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha('#1AC99F', 0.15)}`,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

// Glass Quill Container
const QuillContainer = styled(Box)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  background: `linear-gradient(145deg,
    ${alpha('#ffffff', 0.8)},
    ${alpha('#1AC99F', 0.02)}
  )`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `2px solid ${alpha('#1AC99F', 0.2)}`,
  '& .ql-toolbar': {
    borderBottom: `1px solid ${alpha('#1AC99F', 0.2)}`,
    background: `linear-gradient(145deg,
      ${alpha('#1AC99F', 0.08)},
      ${alpha('#4EDCB9', 0.05)}
    )`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  '& .ql-container': {
    minHeight: 250,
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.fontFamily,
    background: 'transparent',
  },
  '& .ql-editor': {
    color: '#2E8B8B',
    '&.ql-blank::before': {
      color: alpha('#2E8B8B', 0.6),
    },
  },
  [theme.breakpoints.down('sm')]: {
    '& .ql-container': {
      minHeight: 200,
    },
  },
}));

// Tag Management Components
const TagsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const TagChip = styled(Chip)(({ theme }) => ({
  background: `linear-gradient(145deg, #1AC99F, #4EDCB9)`,
  color: '#ffffff',
  fontWeight: 600,
  borderRadius: 20,
  '& .MuiChip-deleteIcon': {
    color: alpha('#ffffff', 0.8),
    '&:hover': {
      color: '#ffffff',
    },
  },
  '&:hover': {
    background: `linear-gradient(145deg, #0E9A78, #1AC99F)`,
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 15px ${alpha('#1AC99F', 0.3)}`,
  },
}));

const TagInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 16,
    background: `linear-gradient(145deg,
      ${alpha('#ffffff', 0.8)},
      ${alpha('#1AC99F', 0.03)}
    )`,
    '& fieldset': {
      borderColor: alpha('#1AC99F', 0.25),
    },
    '&:hover fieldset': {
      borderColor: '#1AC99F',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1AC99F',
    },
  },
}));

// Image Preview Components
const ImagePreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 200,
  borderRadius: 16,
  overflow: 'hidden',
  background: `linear-gradient(145deg,
    ${alpha('#1AC99F', 0.05)},
    ${alpha('#4EDCB9', 0.03)}
  )`,
  border: `2px dashed ${alpha('#1AC99F', 0.3)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: theme.spacing(2),
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 14,
  },
  '& .upload-text': {
    textAlign: 'center',
    color: alpha('#2E8B8B', 0.6),
    fontWeight: 600,
  },
}));

const RemoveButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  background: alpha('#e74c3c', 0.9),
  color: '#ffffff',
  width: 32,
  height: 32,
  '&:hover': {
    background: '#e74c3c',
    transform: 'scale(1.1)',
  },
}));

// Animated Section Title
const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.h4.fontSize,
  fontWeight: 800,
  background: `linear-gradient(135deg, #1AC99F, #2E8B8B, #4EDCB9)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textAlign: 'center',
  marginBottom: theme.spacing(3),
  position: 'relative',
  animation: `${scaleIn} 0.6s ease-out`,
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 80,
    height: 4,
    background: `linear-gradient(90deg, #1AC99F, #4EDCB9)`,
    borderRadius: 2,
    animation: `${scaleIn} 0.8s ease-out 0.2s both`,
  },
  [theme.breakpoints.down('md')]: {
    fontSize: theme.typography.h5.fontSize,
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: theme.typography.h6.fontSize,
    marginBottom: theme.spacing(2),
  },
}));

// Enhanced Alert
const StyledAlert = styled(Alert)(({ theme }) => ({
  borderRadius: 16,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  background: alpha('#ffffff', 0.9),
  border: `1px solid ${alpha('#1AC99F', 0.2)}`,
  boxShadow: `0 6px 25px ${alpha('#1AC99F', 0.1)}`,
  animation: `${slideUp} 0.5s ease-out`,
  '& .MuiAlert-icon': {
    color: '#1AC99F',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.875rem',
  },
}));

// Rich Text Editor Config
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ],
};

const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'];

// Main Component
const ExternalSubmission = () => {
  const theme = useTheme();
  const { token } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // States
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submissionLink, setSubmissionLink] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'info', message: '' });
  
  // Password states
  const [password, setPassword] = useState(['', '', '', '']);
  const [passwordError, setPasswordError] = useState(false);

  // Form data with enhanced structure
  const [formData, setFormData] = useState({
    password: '',
    title: '',
    description: '',
    content: '',
    category: '',
    submitterName: '',
    submitterEmail: '',
    submitterOrganization: '',
    suggestedAuthor: '',
    estimatedReadTime: '',
    videoUrl: '',
    duration: '',
    speakers: [],
    speakersInput: '',
    resourceType: 'PDF',
    estimatedPages: 1,
    resourceIncludes: [],
    includesInput: '',
    suggestedTags: [],
    tagsInput: '',
    targetAudience: 'General',
    urgency: 'Medium',
    // File upload states
    imageFile: null,
    authorImageFile: null,
    resourceFile: null,
    imagePreview: null,
    authorImagePreview: null,
    resourceFilePreview: null,
  });

  const steps = ['Access', 'Category', 'Content', 'Details', 'Complete'];

  // Password handling
  const handlePasswordChange = (index, value) => {
    if (value.length > 1) return;
    
    const newPassword = [...password];
    newPassword[index] = value;
    setPassword(newPassword);
    setPasswordError(false);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.querySelector(`input[name="password-${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }

    // Auto-verify when all 4 digits are filled
    if (newPassword.every(digit => digit !== '')) {
      verifyPassword(newPassword.join(''));
    }
  };

  const handlePasswordKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !password[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="password-${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
        const newPassword = [...password];
        newPassword[index - 1] = '';
        setPassword(newPassword);
      }
    }
  };

  const verifyPassword = async (passwordString) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/api/submission-links/${token}/validate`, {
        password: passwordString
      });

      if (response.data.success) {
        setSubmissionLink(response.data.data);
        setAuthenticated(true);
        setFormData(prev => ({ ...prev, password: passwordString }));
        setActiveStep(1);
        showAlert('Access granted! Welcome to the submission portal.', 'success');
      }
    } catch (error) {
      setPasswordError(true);
      setPassword(['', '', '', '']);
      const message = error.response?.data?.message || 'Invalid access code';
      showAlert(message, 'error');
      // Focus first input
      setTimeout(() => {
        const firstInput = document.querySelector('input[name="password-0"]');
        if (firstInput) firstInput.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: 'info', message: '' }), 5000);
  };

  // Tag management
  const addTag = () => {
    const tag = formData.tagsInput.trim();
    if (!tag || formData.suggestedTags.includes(tag)) return;
    
    setFormData(prev => ({
      ...prev,
      suggestedTags: [...prev.suggestedTags, tag],
      tagsInput: ''
    }));
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      suggestedTags: prev.suggestedTags.filter((_, i) => i !== index)
    }));
  };

  // Speaker management
  const addSpeaker = () => {
    const speaker = formData.speakersInput.trim();
    if (!speaker || formData.speakers.includes(speaker)) return;
    
    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, speaker],
      speakersInput: ''
    }));
  };

  const removeSpeaker = (index) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index)
    }));
  };

  // Resource includes management
  const addInclude = () => {
    const include = formData.includesInput.trim();
    if (!include || formData.resourceIncludes.includes(include)) return;
    
    setFormData(prev => ({
      ...prev,
      resourceIncludes: [...prev.resourceIncludes, include],
      includesInput: ''
    }));
  };

  const removeInclude = (index) => {
    setFormData(prev => ({
      ...prev,
      resourceIncludes: prev.resourceIncludes.filter((_, i) => i !== index)
    }));
  };

  // File upload handling
  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileURL = URL.createObjectURL(file);
    
    setFormData(prev => ({
      ...prev,
      [`${type}File`]: file,
      [`${type}Preview`]: fileURL
    }));
  };

  const removeFile = (type) => {
    setFormData(prev => ({
      ...prev,
      [`${type}File`]: null,
      [`${type}Preview`]: null
    }));
  };

  // Form input handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Navigation
  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key.endsWith('File') || key.endsWith('Preview') || key.endsWith('Input')) return;
        
        if (Array.isArray(formData[key])) {
          formData[key].forEach(item => {
            submitData.append(`${key}[]`, item);
          });
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Add files
      if (formData.imageFile) submitData.append('image', formData.imageFile);
      if (formData.authorImageFile) submitData.append('authorImage', formData.authorImageFile);
      if (formData.resourceFile) submitData.append('file', formData.resourceFile);

      const response = await axios.post(
        `${API_BASE}/api/pending-submissions/${token}/submit`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setActiveStep(4);
        showAlert('Submission successful! You will receive an email confirmation.', 'success');
      }
    } catch (error) {
      console.error('Submission error:', error);
      const message = error.response?.data?.message || 'Submission failed. Please try again.';
      showAlert(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step content renderer
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box textAlign="center">
            <LockIcon sx={{ fontSize: 80, color: '#1AC99F', mb: 3 }} />
            <Typography variant="h4" gutterBottom color="#2E8B8B" fontWeight={700}>
              Enter Access Code
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Please enter the 4-digit access code provided to you
            </Typography>
            
            <PasswordDotsContainer>
              {password.map((digit, index) => (
                <PasswordDot 
                  key={index} 
                  filled={digit !== ''} 
                  active={index === password.findIndex(d => d === '')}
                >
                  <input
                    name={`password-${index}`}
                    type="number"
                    value={digit}
                    onChange={(e) => handlePasswordChange(index, e.target.value)}
                    onKeyDown={(e) => handlePasswordKeyDown(index, e)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      textAlign: 'center',
                      fontSize: 'inherit',
                      fontWeight: 'inherit',
                      color: 'inherit',
                      width: '100%',
                      height: '100%',
                    }}
                    min="0"
                    max="9"
                  />
                </PasswordDot>
              ))}
            </PasswordDotsContainer>

            {passwordError && (
              <Typography color="error" variant="body2" mt={2}>
                Invalid access code. Please check and try again.
              </Typography>
            )}

            {loading && (
              <Box display="flex" justifyContent="center" mt={3}>
                <CircularProgress sx={{ color: '#1AC99F' }} />
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom color="#2E8B8B" fontWeight={700} textAlign="center" mb={4}>
              Choose Your Content Category
            </Typography>
            
            <Grid container spacing={3}>
              {submissionLink?.allowedCategories?.map((category) => (
                <Grid item xs={12} md={4} key={category}>
                  <CategoryOption
                    selected={formData.category === category}
                    onClick={() => handleInputChange('category', category)}
                  >
                    {category === 'Blog' && <ArticleIcon sx={{ fontSize: 50, color: '#1AC99F', mb: 2 }} />}
                    {category === 'Video' && <OndemandVideoIcon sx={{ fontSize: 50, color: '#3498DB', mb: 2 }} />}
                    {category === 'Resources' && <LibraryBooksIcon sx={{ fontSize: 50, color: '#2E8B8B', mb: 2 }} />}
                    
                    <Typography variant="h6" fontWeight={700} color="#2E8B8B" mb={1}>
                      {category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category === 'Blog' && 'Share insights through articles and posts'}
                      {category === 'Video' && 'Create engaging video content'}
                      {category === 'Resources' && 'Provide downloadable materials'}
                    </Typography>
                  </CategoryOption>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom color="#2E8B8B" fontWeight={700} textAlign="center" mb={4}>
              Content Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <CleanTextField
                  label="Story Title *"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <CleanTextField
                  label="Description *"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="#2E8B8B" fontWeight={600} mb={2}>
                  Content * (Rich Text Editor)
                </Typography>
                <QuillContainer>
                  <ReactQuill
                    value={formData.content}
                    onChange={(content) => handleInputChange('content', content)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Start writing your story content..."
                    theme="snow"
                  />
                </QuillContainer>
              </Grid>

              {/* Category-specific fields */}
              {formData.category === 'Blog' && (
                <>
                  <Grid item xs={12} md={6}>
                    <CleanTextField
                      label="Suggested Author"
                      value={formData.suggestedAuthor}
                      onChange={(e) => handleInputChange('suggestedAuthor', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CleanTextField
                      label="Estimated Read Time"
                      value={formData.estimatedReadTime}
                      onChange={(e) => handleInputChange('estimatedReadTime', e.target.value)}
                      placeholder="e.g., 5 min read"
                      fullWidth
                    />
                  </Grid>
                </>
              )}

              {formData.category === 'Video' && (
                <>
                  <Grid item xs={12} md={6}>
                    <CleanTextField
                      label="Video URL *"
                      value={formData.videoUrl}
                      onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CleanTextField
                      label="Duration"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="e.g., 15:30"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TagInput
                      label="Add Speakers"
                      value={formData.speakersInput}
                      onChange={(e) => handleInputChange('speakersInput', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpeaker())}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={addSpeaker} edge="end">
                              <AddIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TagsContainer>
                      {formData.speakers.map((speaker, index) => (
                        <TagChip
                          key={index}
                          label={speaker}
                          onDelete={() => removeSpeaker(index)}
                          deleteIcon={<CloseIcon />}
                        />
                      ))}
                    </TagsContainer>
                  </Grid>
                </>
              )}

              {formData.category === 'Resources' && (
                <>
                  <Grid item xs={12} md={6}>
                    <CleanTextField
                      select
                      label="Resource Type"
                      value={formData.resourceType}
                      onChange={(e) => handleInputChange('resourceType', e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="PDF">PDF Document</MenuItem>
                      <MenuItem value="Excel">Excel Spreadsheet</MenuItem>
                      <MenuItem value="Word">Word Document</MenuItem>
                      <MenuItem value="PowerPoint">PowerPoint Presentation</MenuItem>
                    </CleanTextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CleanTextField
                      type="number"
                      label="Estimated Pages"
                      value={formData.estimatedPages}
                      onChange={(e) => handleInputChange('estimatedPages', parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TagInput
                      label="What's included in this resource?"
                      value={formData.includesInput}
                      onChange={(e) => handleInputChange('includesInput', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInclude())}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={addInclude} edge="end">
                              <AddIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TagsContainer>
                      {formData.resourceIncludes.map((include, index) => (
                        <TagChip
                          key={index}
                          label={include}
                          onDelete={() => removeInclude(index)}
                          deleteIcon={<CloseIcon />}
                        />
                      ))}
                    </TagsContainer>
                  </Grid>
                </>
              )}

              {/* Tags */}
              <Grid item xs={12}>
                <TagInput
                  label="Suggested Tags"
                  value={formData.tagsInput}
                  onChange={(e) => handleInputChange('tagsInput', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={addTag} edge="end">
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TagsContainer>
                  {formData.suggestedTags.map((tag, index) => (
                    <TagChip
                      key={index}
                      label={tag}
                      onDelete={() => removeTag(index)}
                      deleteIcon={<CloseIcon />}
                    />
                  ))}
                </TagsContainer>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom color="#2E8B8B" fontWeight={700} textAlign="center" mb={4}>
              Final Details & Media
            </Typography>
            
            <Grid container spacing={4}>
              {/* Submitter Information */}
              <Grid item xs={12}>
                <Typography variant="h6" color="#2E8B8B" fontWeight={600} mb={3}>
                  Your Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <CleanTextField
                  label="Your Name *"
                  value={formData.submitterName}
                  onChange={(e) => handleInputChange('submitterName', e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#1AC99F' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <CleanTextField
                  label="Your Email *"
                  type="email"
                  value={formData.submitterEmail}
                  onChange={(e) => handleInputChange('submitterEmail', e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#1AC99F' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <CleanTextField
                  label="Organization (Optional)"
                  value={formData.submitterOrganization}
                  onChange={(e) => handleInputChange('submitterOrganization', e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: '#1AC99F' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Media Uploads */}
              <Grid item xs={12}>
                <Typography variant="h6" color="#2E8B8B" fontWeight={600} mb={3}>
                  Media & Files
                </Typography>
              </Grid>

              {/* Main Image */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="#2E8B8B" fontWeight={600} mb={2}>
                  Main Image
                </Typography>
                <UploadArea hasFile={formData.imagePreview}>
                  {formData.imagePreview ? (
                    <Box position="relative">
                      <img src={formData.imagePreview} alt="Preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16 }} />
                      <RemoveButton onClick={() => removeFile('image')}>
                        <CloseIcon />
                      </RemoveButton>
                    </Box>
                  ) : (
                    <Box>
                      <CloudUploadIcon sx={{ fontSize: 50, color: '#1AC99F', mb: 2 }} />
                      <Typography variant="body1" color="#2E8B8B" fontWeight={600}>
                        Click to upload main image
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Recommended: 1200x600px, JPG/PNG
                      </Typography>
                    </Box>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </UploadArea>
              </Grid>

              {/* Author Image (for Blog category) */}
              {formData.category === 'Blog' && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="#2E8B8B" fontWeight={600} mb={2}>
                    Author Image (Optional)
                  </Typography>
                  <UploadArea hasFile={formData.authorImagePreview}>
                    {formData.authorImagePreview ? (
                      <Box position="relative">
                        <img src={formData.authorImagePreview} alt="Author Preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16 }} />
                        <RemoveButton onClick={() => removeFile('authorImage')}>
                          <CloseIcon />
                        </RemoveButton>
                      </Box>
                    ) : (
                      <Box>
                        <PhotoCameraIcon sx={{ fontSize: 50, color: '#1AC99F', mb: 2 }} />
                        <Typography variant="body1" color="#2E8B8B" fontWeight={600}>
                          Upload author photo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Square format recommended
                        </Typography>
                      </Box>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'authorImage')}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    />
                  </UploadArea>
                </Grid>
              )}

              {/* Resource File (for Resources category) */}
              {formData.category === 'Resources' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="#2E8B8B" fontWeight={600} mb={2}>
                    Resource File *
                  </Typography>
                  <UploadArea hasFile={formData.resourceFile}>
                    {formData.resourceFile ? (
                      <Box textAlign="center">
                        <AttachFileIcon sx={{ fontSize: 50, color: '#1AC99F', mb: 2 }} />
                        <Typography variant="body1" color="#2E8B8B" fontWeight={600}>
                          {formData.resourceFile.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(formData.resourceFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>
                        <Button
                          onClick={() => removeFile('resource')}
                          sx={{ mt: 2, color: '#e74c3c' }}
                        >
                          Remove File
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <AttachFileIcon sx={{ fontSize: 50, color: '#1AC99F', mb: 2 }} />
                        <Typography variant="body1" color="#2E8B8B" fontWeight={600}>
                          Upload resource file
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          PDF, DOC, XLS, PPT files accepted
                        </Typography>
                      </Box>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      onChange={(e) => handleFileUpload(e, 'resource')}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    />
                  </UploadArea>
                </Grid>
              )}

              {/* Additional Details */}
              <Grid item xs={12} md={6}>
                <CleanTextField
                  label="Target Audience"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  fullWidth
                  placeholder="Who is this content for?"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <CleanTextField
                  select
                  label="Priority Level"
                  value={formData.urgency}
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="Low">Low Priority</MenuItem>
                  <MenuItem value="Medium">Medium Priority</MenuItem>
                  <MenuItem value="High">High Priority</MenuItem>
                </CleanTextField>
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box textAlign="center">
            <CheckCircleIcon sx={{ fontSize: 100, color: '#1AC99F', mb: 3 }} />
            <Typography variant="h4" gutterBottom color="#2E8B8B" fontWeight={700}>
              Submission Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Thank you for your submission. Your story has been received and will be reviewed by our team.
            </Typography>
            
            <Box sx={{ 
              background: `linear-gradient(145deg, ${alpha('#1AC99F', 0.1)}, ${alpha('#4EDCB9', 0.05)})`,
              padding: 4,
              borderRadius: 3,
              mb: 4
            }}>
              <Typography variant="h6" color="#2E8B8B" fontWeight={600} mb={2}>
                What's Next?
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                You should receive a confirmation email at <strong>{formData.submitterEmail}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Review Timeline:</strong> 2-5 business days
              </Typography>
            </Box>

            <Stack direction={isMobile ? 'column' : 'row'} spacing={2} justifyContent="center">
              <OutlinedButton onClick={() => navigate('/')} fullWidth={isMobile}>
                Return to Home
              </OutlinedButton>
              <PrimaryButton onClick={() => window.location.reload()} fullWidth={isMobile}>
                Submit Another Story
              </PrimaryButton>
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer maxWidth="lg">
      <FormCard>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <SectionTitle>
            Submit Your Story
          </SectionTitle>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            Share your sustainability story with our community
          </Typography>
        </Box>

        {/* Stepper */}
        {authenticated && activeStep < 4 && (
          <StyledStepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </StyledStepper>
        )}

        {/* Alert */}
        {alert.open && (
          <StyledAlert 
            severity={alert.type}
            onClose={() => setAlert({ ...alert, open: false })}
            sx={{ mb: 3 }}
          >
            {alert.message}
          </StyledAlert>
        )}

        {/* Main Form */}
        <Box mb={4}>
          {renderStepContent()}
        </Box>

        {/* Navigation */}
        {authenticated && activeStep < 4 && (
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            justifyContent="space-between" 
            alignItems="center"
            spacing={2}
          >
            <Box sx={{ order: isMobile ? 2 : 1 }}>
              {activeStep > 1 && (
                <OutlinedButton 
                  onClick={prevStep}
                  startIcon={<ArrowBackIcon />}
                  fullWidth={isMobile}
                >
                  Back
                </OutlinedButton>
              )}
            </Box>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ order: isMobile ? 1 : 2 }}
            >
              {activeStep < 4 ? `Step ${activeStep + 1} of ${steps.length}` : ''}
            </Typography>

            <Box sx={{ order: 3 }}>
              <PrimaryButton
                onClick={activeStep === 3 ? handleSubmit : nextStep}
                endIcon={loading ? null : (activeStep === 3 ? <SendIcon /> : <ArrowForwardIcon />)}
                disabled={loading || (activeStep === 1 && !formData.category)}
                fullWidth={isMobile}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  activeStep === 3 ? 'Submit Story' : 'Next'
                )}
              </PrimaryButton>
            </Box>
          </Stack>
        )}
      </FormCard>
    </PageContainer>
  );
};

export default ExternalSubmission;
