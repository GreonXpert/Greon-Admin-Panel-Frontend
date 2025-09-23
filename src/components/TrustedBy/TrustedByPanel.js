import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Chip,
  Paper,
  Divider,
  Stack,
  Skeleton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Business as BusinessIcon,
  EmojiEvents as TrophyIcon,
  BrokenImage as BrokenImageIcon,
  Apps as ProductIcon
} from '@mui/icons-material';
import axios from 'axios';
import io from 'socket.io-client';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;
const SOCKET_URL = API_BASE;

// Helper function to construct image URLs properly
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/uploads')) {
    return `${API_BASE}${imageUrl}`;
  }
  if (imageUrl.startsWith('uploads')) {
    return `${API_BASE}/${imageUrl}`;
  }
  return `${API_BASE}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
};

// Custom Image Component with error handling
const SafeImage = ({ src, alt, sx, onLoad, onError, ...props }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    if (onError) onError();
  };

  if (imageError) {
    return (
      <Box
        sx={{
          ...sx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          color: 'grey.500',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <BrokenImageIcon sx={{ fontSize: 24 }} />
        <Typography variant="caption" fontSize="0.7rem">
          Image not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', ...sx }}>
      {imageLoading && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} 
        />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: imageLoading ? 'none' : 'block',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        {...props}
      />
    </Box>
  );
};

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trusted-tabpanel-${index}`}
      aria-labelledby={`trusted-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TrustedByPanel = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Data states
  const [partnerships, setPartnerships] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [productIcons, setProductIcons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddPartnership, setShowAddPartnership] = useState(false);
  const [showAddRecognition, setShowAddRecognition] = useState(false);
  const [showAddProductIcon, setShowAddProductIcon] = useState(false);

  // Edit modal states
  const [editPartnership, setEditPartnership] = useState(null);
  const [editRecognition, setEditRecognition] = useState(null);
  const [editProductIcon, setEditProductIcon] = useState(null);

  // Form states
  const [partnershipForm, setPartnershipForm] = useState({
    name: '',
    description: '',
    image: null,
  });

  const [recognitionForm, setRecognitionForm] = useState({
    name: '',
    image: null,
  });

  const [productIconForm, setProductIconForm] = useState({
    name: '',
    description: '',
    image: null,
  });

  // Image preview states
  const [partnershipImagePreview, setPartnershipImagePreview] = useState('');
  const [recognitionImagePreview, setRecognitionImagePreview] = useState('');
  const [productIconImagePreview, setProductIconImagePreview] = useState('');
  const [editPartnershipImagePreview, setEditPartnershipImagePreview] = useState('');
  const [editRecognitionImagePreview, setEditRecognitionImagePreview] = useState('');
  const [editProductIconImagePreview, setEditProductIconImagePreview] = useState('');

  // Feedback
  const [alert, setAlert] = useState({ open: false, message: '', type: 'success' });

  useEffect(() => {
    fetchData();
    
    // Real-time updates with proper socket connection
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      socket.emit('join-room', 'trustedBy');
    });

    socket.on('partnerships-updated', (payload) => {
      console.log('📡 Partnerships updated:', payload);
      if (payload?.success && Array.isArray(payload.data)) {
        setPartnerships(payload.data);
      }
    });

    socket.on('recognitions-updated', (payload) => {
      console.log('📡 Recognitions updated:', payload);
      if (payload?.success && Array.isArray(payload.data)) {
        setRecognitions(payload.data);
      }
    });

    socket.on('product-icons-updated', (payload) => {
      console.log('📡 Product Icons updated:', payload);
      if (payload?.success && Array.isArray(payload.data)) {
        setProductIcons(payload.data);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching data...');
      
      const [pRes, rRes, piRes] = await Promise.all([
        axios.get(`${API_URL}/trusted/partnerships`),
        axios.get(`${API_URL}/trusted/recognitions`),
        axios.get(`${API_URL}/trusted/product-icons`),
      ]);

      console.log('📊 API responses:', {
        partnerships: pRes.data,
        recognitions: rRes.data,
        productIcons: piRes.data
      });

      if (pRes.data.success) {
        setPartnerships(pRes.data.data);
        console.log('✅ Partnerships set:', pRes.data.data);
      }
      if (rRes.data.success) {
        setRecognitions(rRes.data.data);
        console.log('✅ Recognitions set:', rRes.data.data);
      }
      if (piRes.data.success) {
        setProductIcons(piRes.data.data);
        console.log('✅ Product Icons set:', piRes.data.data);
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      showAlert('Error fetching data: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ open: true, message, type });
    setTimeout(() => setAlert({ open: false, message: '', type: 'success' }), 5000);
  };

  // Reset forms
  const resetProductIconForm = () => {
    setProductIconForm({
      name: '',
      description: '',
      image: null,
    });
    setProductIconImagePreview('');
  };

  // Image change handlers
  const handlePartnershipImageChange = (e) => {
    const file = e.target.files?.[0];
    setPartnershipForm({ ...partnershipForm, image: file || null });
    setPartnershipImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleRecognitionImageChange = (e) => {
    const file = e.target.files?.[0];
    setRecognitionForm({ ...recognitionForm, image: file || null });
    setRecognitionImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleProductIconImageChange = (e) => {
    const file = e.target.files?.[0];
    setProductIconForm({ ...productIconForm, image: file || null });
    setProductIconImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleEditPartnershipImageChange = (e) => {
    const file = e.target.files?.[0];
    setEditPartnership({ ...editPartnership, newImage: file || null });
    setEditPartnershipImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleEditRecognitionImageChange = (e) => {
    const file = e.target.files?.[0];
    setEditRecognition({ ...editRecognition, newImage: file || null });
    setEditRecognitionImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleEditProductIconImageChange = (e) => {
    const file = e.target.files?.[0];
    setEditProductIcon({ ...editProductIcon, newImage: file || null });
    setEditProductIconImagePreview(file ? URL.createObjectURL(file) : '');
  };

  // CRUD Operations - Partnerships
  const handleAddPartnership = async () => {
    if (!partnershipForm.name || !partnershipForm.description || !partnershipForm.image) {
      showAlert('Please fill all fields and select an image', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', partnershipForm.name);
    formData.append('description', partnershipForm.description);
    formData.append('image', partnershipForm.image);

    try {
      const res = await axios.post(`${API_URL}/trusted/partnerships`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setPartnershipForm({ name: '', description: '', image: null });
        setPartnershipImagePreview('');
        setShowAddPartnership(false);
        showAlert('Partnership added successfully!');
        // Fetch fresh data
        fetchData();
      }
    } catch (error) {
      console.error('❌ Error adding partnership:', error);
      showAlert('Error adding partnership: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleUpdatePartnership = async () => {
    const formData = new FormData();
    formData.append('name', editPartnership.name);
    formData.append('description', editPartnership.description);
    if (editPartnership.newImage) formData.append('image', editPartnership.newImage);

    try {
      const res = await axios.put(
        `${API_URL}/trusted/partnerships/${editPartnership._id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success) {
        setEditPartnership(null);
        setEditPartnershipImagePreview('');
        showAlert('Partnership updated successfully!');
        fetchData();
      }
    } catch (error) {
      console.error('❌ Error updating partnership:', error);
      showAlert('Error updating partnership: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleDeletePartnership = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partnership?')) return;
    try {
      await axios.delete(`${API_URL}/trusted/partnerships/${id}`);
      showAlert('Partnership deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('❌ Error deleting partnership:', error);
      showAlert('Error deleting partnership: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // CRUD Operations - Recognitions
  const handleAddRecognition = async () => {
    if (!recognitionForm.name || !recognitionForm.image) {
      showAlert('Please fill all fields and select an image', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', recognitionForm.name);
    formData.append('image', recognitionForm.image);

    try {
      const res = await axios.post(`${API_URL}/trusted/recognitions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setRecognitionForm({ name: '', image: null });
        setRecognitionImagePreview('');
        setShowAddRecognition(false);
        showAlert('Recognition added successfully!');
        fetchData();
      }
    } catch (error) {
      console.error('❌ Error adding recognition:', error);
      showAlert('Error adding recognition: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleUpdateRecognition = async () => {
    const formData = new FormData();
    formData.append('name', editRecognition.name);
    if (editRecognition.newImage) formData.append('image', editRecognition.newImage);

    try {
      const res = await axios.put(
        `${API_URL}/trusted/recognitions/${editRecognition._id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success) {
        setEditRecognition(null);
        setEditRecognitionImagePreview('');
        showAlert('Recognition updated successfully!');
        fetchData();
      }
    } catch (error) {
      console.error('❌ Error updating recognition:', error);
      showAlert('Error updating recognition: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleDeleteRecognition = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recognition?')) return;
    try {
      await axios.delete(`${API_URL}/trusted/recognitions/${id}`);
      showAlert('Recognition deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('❌ Error deleting recognition:', error);
      showAlert('Error deleting recognition: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // CRUD Operations - Product Icons
  const handleAddProductIcon = async () => {
    if (!productIconForm.name || !productIconForm.description || !productIconForm.image) {
      showAlert('Please fill all fields and select an image', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', productIconForm.name);
    formData.append('description', productIconForm.description);
    formData.append('image', productIconForm.image);

    try {
      console.log('🚀 Adding product icon:', formData);
      const res = await axios.post(`${API_URL}/trusted/product-icons`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('✅ Product icon added:', res.data);
      if (res.data.success) {
        resetProductIconForm();
        setShowAddProductIcon(false);
        showAlert('Product Icon added successfully!');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('❌ Error adding product icon:', error);
      showAlert('Error adding product icon: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleUpdateProductIcon = async () => {
    const formData = new FormData();
    formData.append('name', editProductIcon.name);
    formData.append('description', editProductIcon.description);
    if (editProductIcon.newImage) formData.append('image', editProductIcon.newImage);

    try {
      const res = await axios.put(
        `${API_URL}/trusted/product-icons/${editProductIcon._id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success) {
        setEditProductIcon(null);
        setEditProductIconImagePreview('');
        showAlert('Product Icon updated successfully!');
        fetchData();
      }
    } catch (error) {
      console.error('❌ Error updating product icon:', error);
      showAlert('Error updating product icon: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleDeleteProductIcon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product icon?')) return;
    try {
      await axios.delete(`${API_URL}/trusted/product-icons/${id}`);
      showAlert('Product Icon deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('❌ Error deleting product icon:', error);
      showAlert('Error deleting product icon: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Alert */}
      {alert.open && (
        <Alert 
          severity={alert.type} 
          sx={{ mx: 3, mt: 2, mb: 1 }} 
          onClose={() => setAlert({ open: false, message: '', type: 'success' })}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header section */}
      <Box sx={{ px: 3, py: 2, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h5" color="primary" fontWeight={700}>
            Manage Partnerships & Recognitions
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Add, update, and manage your trusted partnerships, recognitions, and product icons
        </Typography>
        
        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={(event, newValue) => setTabValue(newValue)} 
            centered
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 1, sm: 2 }
              },
              '& .Mui-selected': {
                color: '#1AC99F !important'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1AC99F'
              }
            }}
          >
            <Tab 
              label="Partnerships" 
              icon={<BusinessIcon />} 
              iconPosition="start"
              sx={{ color: '#1AC99F' }}
            />
            <Tab 
              label="Recognitions" 
              icon={<TrophyIcon />} 
              iconPosition="start"
              sx={{ color: '#FF9800' }}
            />
            <Tab 
              label="Product Icons" 
              icon={<ProductIcon />} 
              iconPosition="start"
              sx={{ color: '#2E8B8B' }}
            />
          </Tabs>
        </Box>

        {/* Add Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          {tabValue === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setPartnershipForm({ name: '', description: '', image: null });
                setPartnershipImagePreview('');
                setShowAddPartnership(true);
              }}
              sx={{ 
                backgroundColor: '#1AC99F', 
                '&:hover': { backgroundColor: '#0E9A78' },
                fontWeight: 600,
                px: 3
              }}
            >
              Add Partnership
            </Button>
          )}
          {tabValue === 1 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setRecognitionForm({ name: '', image: null });
                setRecognitionImagePreview('');
                setShowAddRecognition(true);
              }}
              sx={{ 
                backgroundColor: '#FF9800', 
                '&:hover': { backgroundColor: '#F57C00' },
                fontWeight: 600,
                px: 3
              }}
            >
              Add Recognition
            </Button>
          )}
          {tabValue === 2 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetProductIconForm();
                setShowAddProductIcon(true);
              }}
              sx={{ 
                backgroundColor: '#2E8B8B', 
                '&:hover': { backgroundColor: '#1E6565' },
                fontWeight: 600,
                px: 3
              }}
            >
              Add Product Icon
            </Button>
          )}
        </Stack>
      </Box>

      {/* Scrollable content area */}
      <Box 
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          px: 3,
          pb: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(26, 201, 159, 0.6)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(26, 201, 159, 0.8)',
            }
          }
        }}
      >
        {/* Partnerships Tab Panel */}
        <TabPanel value={tabValue} index={0}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <BusinessIcon color="primary" />
              <Typography variant="h6" fontWeight={700} color="primary">
                Partnerships
              </Typography>
            </Stack>
            <Chip 
              label={`${partnerships.length} Items`} 
              color="primary" 
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          <Grid container spacing={2}>
            {partnerships.length === 0 && !loading && (
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    backgroundColor: 'grey.50',
                    border: '2px dashed',
                    borderColor: 'grey.300'
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No partnerships added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Add Partnership" to get started
                  </Typography>
                </Paper>
              </Grid>
            )}
            
            {loading && (
              [...Array(4)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} xl={3} key={index}>
                  <Card sx={{ height: 280 }}>
                    <Skeleton variant="rectangular" height={100} />
                    <CardContent>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="90%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
            
            {partnerships.map((partnership) => (
              <Grid item xs={12} sm={6} md={4} xl={3} key={partnership._id}>
                <Card 
                  sx={{ 
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      height: 100,
                      backgroundColor: 'grey.50',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid rgba(0,0,0,0.08)'
                    }}
                  >
                    <SafeImage
                      src={getImageUrl(partnership.imageUrl)}
                      alt={partnership.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        maxWidth: 70,
                        maxHeight: 70
                      }}
                    />
                  </Box>
                  
                  <CardContent sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      gutterBottom 
                      sx={{ 
                        fontSize: '0.95rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {partnership.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        flex: 1,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        fontSize: '0.8rem',
                        lineHeight: 1.4
                      }}
                    >
                      {partnership.description}
                    </Typography>
                  </CardContent>
                  
                  <Divider />
                  <CardActions sx={{ justifyContent: 'center', gap: 0.5, p: 1.5, height: 56 }}>
                    <Button
                      startIcon={<EditIcon />}
                      size="small"
                      onClick={() => {
                        setEditPartnership({ ...partnership, newImage: null });
                        setEditPartnershipImagePreview('');
                      }}
                      sx={{ 
                        color: '#1AC99F',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        px: 2,
                        '&:hover': { backgroundColor: 'rgba(26, 201, 159, 0.08)' }
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      size="small"
                      onClick={() => handleDeletePartnership(partnership._id)}
                      sx={{ 
                        color: '#e74c3c',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        px: 2,
                        '&:hover': { backgroundColor: 'rgba(231, 76, 60, 0.08)' }
                      }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Recognitions Tab Panel */}
        <TabPanel value={tabValue} index={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrophyIcon color="warning" />
              <Typography variant="h6" fontWeight={700} color="warning.main">
                Recognitions
              </Typography>
            </Stack>
            <Chip 
              label={`${recognitions.length} Items`} 
              color="warning" 
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          <Grid container spacing={2}>
            {recognitions.length === 0 && !loading && (
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    backgroundColor: 'grey.50',
                    border: '2px dashed',
                    borderColor: 'grey.300'
                  }}
                >
                  <TrophyIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No recognitions added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Add Recognition" to get started
                  </Typography>
                </Paper>
              </Grid>
            )}
            
            {recognitions.map((recognition) => (
              <Grid item xs={12} sm={6} md={4} xl={3} key={recognition._id}>
                <Card 
                  sx={{ 
                    height: 240,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      height: 120,
                      backgroundColor: 'grey.50',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid rgba(0,0,0,0.08)'
                    }}
                  >
                    <SafeImage
                      src={getImageUrl(recognition.imageUrl)}
                      alt={recognition.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        maxWidth: 90,
                        maxHeight: 90
                      }}
                    />
                  </Box>
                  
                  <CardContent sx={{ flex: 1, textAlign: 'center', p: 2 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      sx={{ 
                        fontSize: '0.95rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {recognition.name}
                    </Typography>
                  </CardContent>
                  
                  <Divider />
                  <CardActions sx={{ justifyContent: 'center', gap: 0.5, p: 1.5, height: 56 }}>
                    <Button
                      startIcon={<EditIcon />}
                      size="small"
                      onClick={() => {
                        setEditRecognition({ ...recognition, newImage: null });
                        setEditRecognitionImagePreview('');
                      }}
                      sx={{ 
                        color: '#FF9800',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        px: 2,
                        '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.08)' }
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      size="small"
                      onClick={() => handleDeleteRecognition(recognition._id)}
                      sx={{ 
                        color: '#e74c3c',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        px: 2,
                        '&:hover': { backgroundColor: 'rgba(231, 76, 60, 0.08)' }
                      }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Product Icons Tab Panel */}
        <TabPanel value={tabValue} index={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ProductIcon sx={{ color: '#2E8B8B' }} />
              <Typography variant="h6" fontWeight={700} sx={{ color: '#2E8B8B' }}>
                Product Icons ({productIcons.length})
              </Typography>
            </Stack>
            <Chip 
              label={`${productIcons.length} Items`} 
              sx={{ 
                backgroundColor: '#2E8B8B', 
                color: 'white',
                fontWeight: 600 
              }}
              size="small"
            />
          </Stack>

          <Grid container spacing={2}>
            {productIcons.length === 0 && !loading && (
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    backgroundColor: 'grey.50',
                    border: '2px dashed',
                    borderColor: 'grey.300'
                  }}
                >
                  <ProductIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No product icons added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Add Product Icon" to get started
                  </Typography>
                </Paper>
              </Grid>
            )}
            
            {productIcons.map((productIcon) => (
              <Grid item xs={12} sm={6} md={4} xl={3} key={productIcon._id}>
                <Card 
                  sx={{ 
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    border: '2px solid #2E8B8B20',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px #2E8B8B30',
                      borderColor: '#2E8B8B40'
                    }
                  }}
                >
                  {/* Header with simple design */}
                  <Box
                    sx={{
                      height: 8,
                      background: 'linear-gradient(90deg, #2E8B8B, #1E6565)'
                    }}
                  />
                  
                  <Box
                    sx={{
                      height: 100,
                      backgroundColor: 'grey.50',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid rgba(0,0,0,0.08)'
                    }}
                  >
                    <SafeImage
                      src={getImageUrl(productIcon.imageUrl)}
                      alt={productIcon.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        maxWidth: 80,
                        maxHeight: 80
                      }}
                    />
                  </Box>
                  
                  <CardContent sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      gutterBottom 
                      sx={{ 
                        fontSize: '0.95rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#2E8B8B'
                      }}
                    >
                      {productIcon.name}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        flex: 1,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        fontSize: '0.75rem',
                        lineHeight: 1.4
                      }}
                    >
                      {productIcon.description}
                    </Typography>
                  </CardContent>
                  
                  <Divider />
                  <CardActions sx={{ justifyContent: 'center', gap: 0.5, p: 1.5, height: 56 }}>
                    <Button
                      startIcon={<EditIcon />}
                      size="small"
                      onClick={() => {
                        setEditProductIcon({ ...productIcon, newImage: null });
                        setEditProductIconImagePreview('');
                      }}
                      sx={{ 
                        color: '#2E8B8B',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        px: 2,
                        '&:hover': { backgroundColor: '#2E8B8B08' }
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      size="small"
                      onClick={() => handleDeleteProductIcon(productIcon._id)}
                      sx={{ 
                        color: '#e74c3c',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        px: 2,
                        '&:hover': { backgroundColor: 'rgba(231, 76, 60, 0.08)' }
                      }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Box>

      {/* Add Product Icon Dialog */}
      <Dialog 
        open={showAddProductIcon} 
        onClose={() => setShowAddProductIcon(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ProductIcon sx={{ color: '#2E8B8B' }} />
            <Typography variant="h6" fontWeight={700}>Add New Product Icon</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Product Name"
            fullWidth
            required
            value={productIconForm.name}
            onChange={(e) => setProductIconForm({ ...productIconForm, name: e.target.value })}
            margin="dense"
          />
          <TextField
            label="Description"
            fullWidth
            required
            multiline
            rows={3}
            value={productIconForm.description}
            onChange={(e) => setProductIconForm({ ...productIconForm, description: e.target.value })}
            margin="dense"
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ my: 2 }}
          >
            Upload Product Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleProductIconImageChange}
            />
          </Button>
          {productIconImagePreview && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={productIconImagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowAddProductIcon(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleAddProductIcon}
            variant="contained"
            sx={{ 
              backgroundColor: '#2E8B8B', 
              '&:hover': { backgroundColor: '#1E6565' },
              fontWeight: 600
            }}
          >
            Add Product Icon
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Partnership Dialog */}
      <Dialog open={showAddPartnership} onClose={() => setShowAddPartnership(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Add New Partnership</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Partnership Name"
            fullWidth
            value={partnershipForm.name}
            onChange={(e) => setPartnershipForm({ ...partnershipForm, name: e.target.value })}
            margin="dense"
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={partnershipForm.description}
            onChange={(e) => setPartnershipForm({ ...partnershipForm, description: e.target.value })}
            margin="dense"
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2, mt: 2, width: '100%' }}
          >
            Upload Logo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handlePartnershipImageChange}
            />
          </Button>
          {partnershipImagePreview && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <img
                src={partnershipImagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowAddPartnership(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleAddPartnership}
            variant="contained"
            sx={{ 
              backgroundColor: '#1AC99F', 
              '&:hover': { backgroundColor: '#0E9A78' },
              fontWeight: 600
            }}
          >
            Add Partnership
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Recognition Dialog */}
      <Dialog open={showAddRecognition} onClose={() => setShowAddRecognition(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Add New Recognition</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Recognition Name"
            fullWidth
            value={recognitionForm.name}
            onChange={(e) => setRecognitionForm({ ...recognitionForm, name: e.target.value })}
            margin="dense"
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2, mt: 2, width: '100%' }}
          >
            Upload Logo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleRecognitionImageChange}
            />
          </Button>
          {recognitionImagePreview && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <img
                src={recognitionImagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowAddRecognition(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleAddRecognition}
            variant="contained"
            sx={{ 
              backgroundColor: '#FF9800', 
              '&:hover': { backgroundColor: '#F57C00' },
              fontWeight: 600
            }}
          >
            Add Recognition
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Partnership Dialog */}
      {editPartnership && (
        <Dialog open={Boolean(editPartnership)} onClose={() => setEditPartnership(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" fontWeight={700}>Edit Partnership</Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Partnership Name"
              fullWidth
              value={editPartnership.name}
              onChange={(e) => setEditPartnership({ ...editPartnership, name: e.target.value })}
              margin="dense"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={editPartnership.description}
              onChange={(e) => setEditPartnership({ ...editPartnership, description: e.target.value })}
              margin="dense"
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2, mt: 2, width: '100%' }}
            >
              Upload New Logo (optional)
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleEditPartnershipImageChange}
              />
            </Button>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>Current Logo:</Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  <SafeImage
                    src={getImageUrl(editPartnership.imageUrl)}
                    alt="Current"
                    sx={{ maxWidth: '90%', maxHeight: '90%' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>New Logo:</Typography>
                {editPartnershipImagePreview ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    <img
                      src={editPartnershipImagePreview}
                      alt="New Preview"
                      style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                    />
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      height: 120, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: 'grey.100',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No new image selected
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditPartnership(null)} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePartnership}
              variant="contained"
              sx={{ 
                backgroundColor: '#1AC99F', 
                '&:hover': { backgroundColor: '#0E9A78' },
                fontWeight: 600
              }}
            >
              Update Partnership
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Recognition Dialog */}
      {editRecognition && (
        <Dialog open={Boolean(editRecognition)} onClose={() => setEditRecognition(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" fontWeight={700}>Edit Recognition</Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Recognition Name"
              fullWidth
              value={editRecognition.name}
              onChange={(e) => setEditRecognition({ ...editRecognition, name: e.target.value })}
              margin="dense"
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2, mt: 2, width: '100%' }}
            >
              Upload New Logo (optional)
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleEditRecognitionImageChange}
              />
            </Button>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>Current Logo:</Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  <SafeImage
                    src={getImageUrl(editRecognition.imageUrl)}
                    alt="Current"
                    sx={{ maxWidth: '90%', maxHeight: '90%' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>New Logo:</Typography>
                {editRecognitionImagePreview ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    <img
                      src={editRecognitionImagePreview}
                      alt="New Preview"
                      style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                    />
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      height: 120, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: 'grey.100',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No new image selected
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditRecognition(null)} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRecognition}
              variant="contained"
              sx={{ 
                backgroundColor: '#FF9800', 
                '&:hover': { backgroundColor: '#F57C00' },
                fontWeight: 600
              }}
            >
              Update Recognition
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Product Icon Dialog */}
      {editProductIcon && (
        <Dialog open={Boolean(editProductIcon)} onClose={() => setEditProductIcon(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" fontWeight={700}>Edit Product Icon</Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Product Name"
              fullWidth
              value={editProductIcon.name}
              onChange={(e) => setEditProductIcon({ ...editProductIcon, name: e.target.value })}
              margin="dense"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={editProductIcon.description}
              onChange={(e) => setEditProductIcon({ ...editProductIcon, description: e.target.value })}
              margin="dense"
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2, mt: 2, width: '100%' }}
            >
              Upload New Image (optional)
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleEditProductIconImageChange}
              />
            </Button>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>Current Image:</Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  <SafeImage
                    src={getImageUrl(editProductIcon.imageUrl)}
                    alt="Current"
                    sx={{ maxWidth: '90%', maxHeight: '90%' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>New Image:</Typography>
                {editProductIconImagePreview ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    <img
                      src={editProductIconImagePreview}
                      alt="New Preview"
                      style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                    />
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      height: 120, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: 'grey.100',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No new image selected
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditProductIcon(null)} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProductIcon}
              variant="contained"
              sx={{ 
                backgroundColor: '#2E8B8B', 
                '&:hover': { backgroundColor: '#1E6565' },
                fontWeight: 600
              }}
            >
              Update Product Icon
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default TrustedByPanel;
