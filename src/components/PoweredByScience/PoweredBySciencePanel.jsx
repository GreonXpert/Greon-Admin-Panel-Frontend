import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, CardMedia, CardActions, Typography, Button, Grid, TextField, Dialog,
  DialogActions, DialogContent, DialogTitle, Alert, Chip, IconButton, Paper, Divider, Select,
  MenuItem, FormControl, InputLabel, CircularProgress, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, CloudUpload as CloudUploadIcon,
  Category as CategoryIcon, Science as ScienceIcon, ExpandMore as ExpandMoreIcon, Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import io from 'socket.io-client';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;
const SOCKET_URL = API_BASE.replace('http', 'ws');

const PoweredBySciencePanel = () => {
  // State management
  const [categories, setCategories] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', type: 'success' });
  const [headerExpanded, setHeaderExpanded] = useState(true); // New state for accordion

  // Modal and form states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [frameworkModalOpen, setFrameworkModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingFramework, setEditingFramework] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [frameworkForm, setFrameworkForm] = useState({ name: '', description: '', category: '', image: null });
  const [imagePreview, setImagePreview] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const authHeaderMultipart = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };

  // Data fetching and real-time updates
  useEffect(() => {
    fetchData();
    const socket = io(SOCKET_URL);
    socket.emit('join', 'poweredByScience');

    socket.on('pbs-categories-updated', (data) => {
      setCategories(data.data);
    });

    socket.on('pbs-frameworks-updated', (data) => {
      setFrameworks(data.data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, frameworksRes] = await Promise.all([
        axios.get(`${API_URL}/pbs/categories`),
        axios.get(`${API_URL}/pbs/frameworks`, authHeader)
      ]);

      if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
      if (frameworksRes.data.success) setFrameworks(frameworksRes.data.data);
    } catch (error) {
      showAlert('Error fetching data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ open: true, message, type });
    setTimeout(() => setAlert({ open: false, message: '', type: 'success' }), 5000);
  };

  // Category Handlers
  const handleOpenCategoryModal = (category = null) => {
    setEditingCategory(category);
    setCategoryForm(category ? { name: category.name, description: category.description } : { name: '', description: '' });
    setCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.description) {
      showAlert('Please fill in all category fields.', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await axios.put(`${API_URL}/pbs/categories/${editingCategory._id}`, categoryForm, authHeader);
        showAlert('Category updated successfully!');
      } else {
        await axios.post(`${API_URL}/pbs/categories`, categoryForm, authHeader);
        showAlert('Category added successfully!');
      }
      handleCloseCategoryModal();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Failed to save category.', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure? Deleting a category will also delete its frameworks.')) {
      try {
        await axios.delete(`${API_URL}/pbs/categories/${categoryId}`, authHeader);
        showAlert('Category deleted successfully!');
      } catch (error) {
        showAlert(error.response?.data?.message || 'Failed to delete category.', 'error');
      }
    }
  };

  // Framework Handlers
  const handleOpenFrameworkModal = (framework = null) => {
    setEditingFramework(framework);
    if (framework) {
      setFrameworkForm({
        name: framework.name,
        description: framework.description,
        category: framework.category._id,
        image: null
      });
      setImagePreview(`${API_URL.replace('/api', '')}${framework.imageUrl}`);
    } else {
      setFrameworkForm({ name: '', description: '', category: '', image: null });
      setImagePreview('');
    }
    setFrameworkModalOpen(true);
  };

  const handleCloseFrameworkModal = () => {
    setFrameworkModalOpen(false);
    setEditingFramework(null);
    setFrameworkForm({ name: '', description: '', category: '', image: null });
    setImagePreview('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrameworkForm({ ...frameworkForm, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveFramework = async () => {
    const { name, description, category, image } = frameworkForm;

    if (!name || !description || !category) {
      showAlert('Please fill all fields except the image.', 'error');
      return;
    }

    if (!editingFramework && !image) {
      showAlert('Please provide an image for the new framework.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    if (image) {
      formData.append('image', image);
    }

    try {
      if (editingFramework) {
        await axios.put(`${API_URL}/pbs/frameworks/${editingFramework._id}`, formData, authHeaderMultipart);
        showAlert('Framework updated successfully!');
      } else {
        await axios.post(`${API_URL}/pbs/frameworks`, formData, authHeaderMultipart);
        showAlert('Framework added successfully!');
      }
      handleCloseFrameworkModal();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Failed to save framework.', 'error');
    }
  };

  const handleDeleteFramework = async (frameworkId) => {
    if (window.confirm('Are you sure you want to delete this framework?')) {
      try {
        await axios.delete(`${API_URL}/pbs/frameworks/${frameworkId}`, authHeader);
        showAlert('Framework deleted successfully!');
      } catch (error) {
        showAlert(error.response?.data?.message || 'Failed to delete framework.', 'error');
      }
    }
  };

  const filteredFrameworks = frameworks.filter(f =>
    selectedCategoryFilter === 'all' || f.category._id === selectedCategoryFilter
  );

  return (
    <Box sx={{ 
      height: '100vh', 
      overflow: 'hidden',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Alert - Fixed at top */}
      {alert.open && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert({ open: false, message: '', type: 'success' })}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            m: 2,
            borderRadius: 2
          }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header Accordion */}
      <Box sx={{ m: 2, flexShrink: 0 }}>
        <Accordion 
          expanded={headerExpanded} 
          onChange={() => setHeaderExpanded(!headerExpanded)}
          sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1AC99F 0%, #2196F3 100%)',
            color: 'white',
            '&::before': {
              display: 'none'
            },
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
            sx={{
              '& .MuiAccordionSummary-content': {
                margin: '12px 0'
              },
              '& .MuiAccordionSummary-expandIconWrapper': {
                color: 'white'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)', mb: 1 }}>
                  <ScienceIcon sx={{ mr: 2, fontSize: '2rem' }} />
                  Powered By Science
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage scientific frameworks and research categories for evidence-based insights
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenCategoryModal()}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    },
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    transition: 'all 0.3s ease'
                  }}
                >
                  Add Category
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenFrameworkModal()}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    },
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    transition: 'all 0.3s ease'
                  }}
                >
                  Add Framework
                </Button>
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ pt: 0 }}>
            {/* Categories Filter */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                label="All Categories"
                onClick={() => setSelectedCategoryFilter('all')}
                sx={{
                  backgroundColor: selectedCategoryFilter === 'all' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                  color: selectedCategoryFilter === 'all' ? '#1AC99F' : 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }
                }}
              />
              {categories.map(cat => (
                <Chip
                  key={cat._id}
                  label={cat.name}
                  onClick={() => setSelectedCategoryFilter(cat._id)}
                  onDelete={() => handleDeleteCategory(cat._id)}
                  deleteIcon={<DeleteIcon />}
                  icon={
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); handleOpenCategoryModal(cat); }}
                      sx={{ p: 0, color: 'inherit' }}
                    >
                      <EditIcon />
                    </IconButton>
                  }
                  sx={{
                    backgroundColor: selectedCategoryFilter === cat._id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                    color: selectedCategoryFilter === cat._id ? '#2E8B8B' : 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Scrollable Content Area with Custom Scrollbar */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          px: 2,
          pb: 2,
          // Custom Scrollbar Styling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '10px',
            margin: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #1AC99F, #2196F3)',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            transition: 'all 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(135deg, #2196F3, #1AC99F)',
            transform: 'scale(1.1)',
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          // Firefox scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: '#1AC99F rgba(0,0,0,0.05)',
        }}
      >
        {/* Frameworks Section */}
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(26, 201, 159, 0.05), rgba(33, 150, 243, 0.05))',
            border: '1px solid rgba(26, 201, 159, 0.1)'
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 700,
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <ScienceIcon sx={{ color: '#1AC99F' }} />
            Science Frameworks
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                  Loading frameworks...
                </Typography>
                <CircularProgress sx={{ color: '#1AC99F' }} />
              </Box>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredFrameworks.map(fw => (
                <Grid item xs={12} sm={6} md={4} key={fw._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '2px solid rgba(26, 201, 159, 0.1)',
                      borderLeft: '6px solid #1AC99F',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(26, 201, 159, 0.15)',
                        '& .card-actions': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={`${API_URL.replace('/api', '')}${fw.imageUrl}`}
                      alt={fw.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography 
                        variant="h6" 
                        component="h3"
                        sx={{ 
                          fontWeight: 700,
                          color: '#2c3e50',
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                          mb: 1
                        }}
                      >
                        {fw.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#546e7a',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {fw.description}
                      </Typography>
                    </CardContent>
                    
                    <CardActions 
                      className="card-actions"
                      sx={{ 
                        p: 2, 
                        pt: 0, 
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 1,
                        opacity: 0.7,
                        transform: 'translateY(4px)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenFrameworkModal(fw)}
                        sx={{
                          color: '#1AC99F',
                          borderColor: 'rgba(217, 111, 50, 0.4)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#1AC99F',
                            color: 'white',
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        Edit
                      </Button>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteFramework(fw._id)}
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {filteredFrameworks.length === 0 && !loading && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              background: 'linear-gradient(135deg, rgba(26, 201, 159, 0.05), rgba(46, 139, 139, 0.05))',
              borderRadius: 4,
              border: '2px dashed rgba(26, 201, 159, 0.2)'
            }}>
              <Box sx={{ mb: 3 }}>
                <ScienceIcon sx={{ fontSize: 64, color: 'rgba(26, 201, 159, 0.4)' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
                No frameworks found for this category
              </Typography>
              <Typography variant="body1" sx={{ color: '#546e7a', mb: 3 }}>
                Start by adding your first science framework
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenFrameworkModal()}
                sx={{
                  background: 'linear-gradient(135deg, #1AC99F, #2E8B8B)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2E8B8B, #1AC99F)',
                    transform: 'translateY(-2px)'
                  },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(217, 111, 50, 0.3)'
                }}
              >
                Add Your First Framework
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Category Add/Edit Modal */}
      <Dialog 
        open={categoryModalOpen} 
        onClose={handleCloseCategoryModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #E3F2FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <CategoryIcon sx={{ mr: 1 }} />
          {editingCategory ? 'Edit' : 'Add'} Category
          <IconButton
            onClick={handleCloseCategoryModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={categoryForm.name}
            onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={categoryForm.description}
            onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={handleCloseCategoryModal} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCategory}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1AC99F, #2196F3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0E9A78, #1976D2)',
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Framework Add/Edit Modal */}
      <Dialog 
        open={frameworkModalOpen} 
        onClose={handleCloseFrameworkModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #E6F7F1, #E3F2FD)', 
          color: '#1AC99F', 
          fontWeight: 700,
          position: 'relative'
        }}>
          <ScienceIcon sx={{ mr: 1 }} />
          {editingFramework ? 'Edit' : 'Add'} Framework
          <IconButton
            onClick={handleCloseFrameworkModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#1AC99F' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Framework Name"
                fullWidth
                variant="outlined"
                value={frameworkForm.name}
                onChange={e => setFrameworkForm({...frameworkForm, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={frameworkForm.description}
                onChange={e => setFrameworkForm({...frameworkForm, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={frameworkForm.category}
                  label="Category"
                  onChange={e => setFrameworkForm({...frameworkForm, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="framework-image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="framework-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2, width: '100%', py: 1.5 }}
                >
                  Upload Logo
                </Button>
              </label>
              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                  }}
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={handleCloseFrameworkModal} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveFramework}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1AC99F, #2196F3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0E9A78, #1976D2)',
              }
            }}
          >
            Save Framework
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PoweredBySciencePanel;
