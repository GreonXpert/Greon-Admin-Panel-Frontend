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
  LinearProgress,
  Container,
  Stack,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

const API_URL = `${API_BASE}/api`;

const EmissionsPanel = () => {
  // States for data
  const [emissionsData, setEmissionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for add/edit forms
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [addForm, setAddForm] = useState({
    year: new Date().getFullYear(),
    scope1: '',
    scope2: '',
    scope3: ''
  });
  
  const [editForm, setEditForm] = useState({
    year: '',
    scope1: '',
    scope2: '',
    scope3: ''
  });
  
  // Feedback state
  const [alert, setAlert] = useState({ open: false, message: '', type: 'success' });

  // Fetch data on component mount
  useEffect(() => {
    fetchEmissions();
  }, []);

  const fetchEmissions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/emissions`);
      if (res.data.success) {
        setEmissionsData(res.data.data.sort((a, b) => b.year - a.year));
      }
    } catch (error) {
      showAlert('Error fetching emissions data', 'error');
      console.error('Error fetching emissions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ open: true, message, type });
    setTimeout(() => setAlert({ open: false, message: '', type: 'success' }), 4000);
  };

  // Add Emission
  const handleAddEmission = async () => {
    if (!addForm.year || !addForm.scope1 || !addForm.scope2 || !addForm.scope3) {
      showAlert('Please fill all fields', 'error');
      return;
    }
    
    try {
      const res = await axios.post(`${API_URL}/emissions`, {
        year: parseInt(addForm.year),
        scope1: parseFloat(addForm.scope1),
        scope2: parseFloat(addForm.scope2),
        scope3: parseFloat(addForm.scope3)
      });
      
      if (res.data.success) {
        const existingIndex = emissionsData.findIndex(e => e.year === parseInt(addForm.year));
        if (existingIndex !== -1) {
          const updatedData = [...emissionsData];
          updatedData[existingIndex] = res.data.data;
          setEmissionsData(updatedData.sort((a, b) => b.year - a.year));
          showAlert(`Emissions data for ${addForm.year} updated successfully!`);
        } else {
          setEmissionsData([res.data.data, ...emissionsData].sort((a, b) => b.year - a.year));
          showAlert(`Emissions data for ${addForm.year} added successfully!`);
        }
        setAddForm({ year: new Date().getFullYear(), scope1: '', scope2: '', scope3: '' });
        setShowAddDialog(false);
      }
    } catch (error) {
      showAlert('Error adding emissions data', 'error');
      console.error('Error adding emissions data:', error);
    }
  };

  // Start editing
  const handleEditClick = (emission) => {
    setEditingId(emission._id);
    setEditForm({
      year: emission.year,
      scope1: emission.scope1,
      scope2: emission.scope2,
      scope3: emission.scope3
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ year: '', scope1: '', scope2: '', scope3: '' });
  };

  // Save edit
  const handleSaveEdit = async () => {
    try {
      const res = await axios.put(`${API_URL}/emissions/${editForm.year}`, {
        scope1: parseFloat(editForm.scope1),
        scope2: parseFloat(editForm.scope2),
        scope3: parseFloat(editForm.scope3)
      });
      
      if (res.data.success) {
        setEmissionsData(emissionsData.map(e =>
          e._id === editingId ? res.data.data : e
        ));
        setEditingId(null);
        showAlert('Emissions data updated successfully!');
      }
    } catch (error) {
      showAlert('Error updating emissions data', 'error');
      console.error('Error updating emissions data:', error);
    }
  };

  // Delete emission
  const handleDeleteEmission = async (year, id) => {
    if (!window.confirm(`Are you sure you want to delete emissions data for ${year}?`)) return;
    
    try {
      await axios.delete(`${API_URL}/emissions/${year}`);
      setEmissionsData(emissionsData.filter(e => e._id !== id));
      showAlert(`Emissions data for ${year} deleted successfully!`);
    } catch (error) {
      showAlert('Error deleting emissions data', 'error');
      console.error('Error deleting emissions data:', error);
    }
  };

  // Calculate total emissions
  const calculateTotal = (scope1, scope2, scope3) => {
    return (parseFloat(scope1 || 0) + parseFloat(scope2 || 0) + parseFloat(scope3 || 0)).toFixed(2);
  };

  // Get max total for progress bar calculations
  const getMaxTotal = () => {
    if (emissionsData.length === 0) return 100;
    return Math.max(...emissionsData.map(e => {
      const total = e.total || calculateTotal(e.scope1, e.scope2, e.scope3);
      return parseFloat(total);
    }));
  };

  const maxValue = getMaxTotal();

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

      {/* Header */}
      <Box sx={{ px: 3, py: 2, textAlign: 'center', flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
          <TrendingUpIcon color="primary" />
          <Typography variant="h5" color="primary" fontWeight={700}>
            Emissions Management
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Track and manage carbon emissions data across all scopes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
          sx={{
            backgroundColor: '#1AC99F',
            '&:hover': { backgroundColor: '#0E9A78' },
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2
          }}
        >
          Add Emissions Data
        </Button>
      </Box>

      {/* Scrollable Content Area */}
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
        {/* Loading */}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading emissions data...</Typography>
          </Box>
        )}

        {/* No Data State */}
        {emissionsData.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No emissions data found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Add Emissions Data" to get started
            </Typography>
          </Box>
        )}

        {/* Emissions Cards Grid */}
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {emissionsData.map((emission) => {
            const total = emission.total || calculateTotal(emission.scope1, emission.scope2, emission.scope3);
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={emission._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    minHeight: 420,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {editingId === emission._id ? (
                    // Edit Mode
                    <>
                      <CardContent sx={{ flex: 1 }}>
                        <Typography variant="h6" color="primary" fontWeight={700} gutterBottom>
                          Edit {emission.year} Data
                        </Typography>
                        <TextField
                          label="Scope 1 (tCO₂e)"
                          type="number"
                          fullWidth
                          value={editForm.scope1}
                          onChange={(e) => setEditForm({...editForm, scope1: e.target.value})}
                          sx={{ mb: 2 }}
                          size="small"
                          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        />
                        <TextField
                          label="Scope 2 (tCO₂e)"
                          type="number"
                          fullWidth
                          value={editForm.scope2}
                          onChange={(e) => setEditForm({...editForm, scope2: e.target.value})}
                          sx={{ mb: 2 }}
                          size="small"
                          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        />
                        <TextField
                          label="Scope 3 (tCO₂e)"
                          type="number"
                          fullWidth
                          value={editForm.scope3}
                          onChange={(e) => setEditForm({...editForm, scope3: e.target.value})}
                          sx={{ mb: 2 }}
                          size="small"
                          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        />
                        <Box 
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'grey.100', 
                            borderRadius: 2, 
                            textAlign: 'center' 
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            Total: {calculateTotal(editForm.scope1, editForm.scope2, editForm.scope3)} tCO₂e
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveEdit}
                          size="small"
                          sx={{ backgroundColor: '#1AC99F', '&:hover': { backgroundColor: '#0E9A78' } }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                          size="small"
                          sx={{ borderColor: '#6c757d', color: '#6c757d' }}
                        >
                          Cancel
                        </Button>
                      </CardActions>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <CardContent sx={{ flex: 1, pb: 1 }}>
                        {/* Year Header with Icon */}
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <TrendingUpIcon color="primary" />
                          <Typography variant="h5" color="primary" fontWeight={800}>
                            {emission.year}
                          </Typography>
                        </Stack>

                        {/* Scope Data with Progress Bars */}
                        <Stack spacing={2} sx={{ mb: 3 }}>
                          {/* Scope 1 */}
                          <Box>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                              Scope 1
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((parseFloat(emission.scope1) / maxValue) * 100, 100)}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4, 
                                mb: 1,
                                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#f44336'
                                }
                              }}
                            />
                            <Chip 
                              label={`${emission.scope1} tCO₂e`} 
                              color="error" 
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>

                          {/* Scope 2 */}
                          <Box>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                              Scope 2
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((parseFloat(emission.scope2) / maxValue) * 100, 100)}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4, 
                                mb: 1,
                                backgroundColor: 'rgba(255, 152, 0, 0.2)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#ff9800'
                                }
                              }}
                            />
                            <Chip 
                              label={`${emission.scope2} tCO₂e`} 
                              sx={{ 
                                backgroundColor: '#ff9800', 
                                color: 'white',
                                fontWeight: 600
                              }} 
                              size="small"
                            />
                          </Box>

                          {/* Scope 3 */}
                          <Box>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                              Scope 3
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((parseFloat(emission.scope3) / maxValue) * 100, 100)}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4, 
                                mb: 1,
                                backgroundColor: 'rgba(156, 39, 176, 0.2)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#9c27b0'
                                }
                              }}
                            />
                            <Chip 
                              label={`${emission.scope3} tCO₂e`} 
                              sx={{ 
                                backgroundColor: '#9c27b0', 
                                color: 'white',
                                fontWeight: 600
                              }} 
                              size="small"
                            />
                          </Box>
                        </Stack>

                        {/* Total Emissions - Highlighted */}
                        <Box
                          sx={{
                            border: '2px solid',
                            borderColor: 'primary.main',
                            borderRadius: 3,
                            p: 2,
                            textAlign: 'center',
                            backgroundColor: 'rgba(26, 201, 159, 0.05)'
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} color="primary">
                            TOTAL EMISSIONS
                          </Typography>
                          <Typography variant="h6" fontWeight={800} color="primary">
                            {total} tCO₂e
                          </Typography>
                        </Box>
                      </CardContent>

                      <Divider />
                      <CardActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditClick(emission)}
                          size="small"
                          sx={{
                            color: '#1AC99F',
                            borderColor: '#1AC99F',
                            '&:hover': { 
                              backgroundColor: 'rgba(26, 201, 159, 0.08)',
                              borderColor: '#1AC99F'
                            },
                            px: 3,
                            fontWeight: 600
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteEmission(emission.year, emission._id)}
                          size="small"
                          sx={{
                            color: '#e74c3c',
                            borderColor: '#e74c3c',
                            '&:hover': { 
                              backgroundColor: 'rgba(231, 76, 60, 0.08)',
                              borderColor: '#e74c3c'
                            },
                            px: 3,
                            fontWeight: 600
                          }}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Add New Emissions Data</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Year"
            type="number"
            fullWidth
            value={addForm.year}
            onChange={(e) => setAddForm({...addForm, year: e.target.value})}
            margin="normal"
            InputProps={{ inputProps: { min: 2000, max: 2050 } }}
          />
          <TextField
            label="Scope 1 (tCO₂e)"
            type="number"
            fullWidth
            value={addForm.scope1}
            onChange={(e) => setAddForm({...addForm, scope1: e.target.value})}
            margin="normal"
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />
          <TextField
            label="Scope 2 (tCO₂e)"
            type="number"
            fullWidth
            value={addForm.scope2}
            onChange={(e) => setAddForm({...addForm, scope2: e.target.value})}
            margin="normal"
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />
          <TextField
            label="Scope 3 (tCO₂e)"
            type="number"
            fullWidth
            value={addForm.scope3}
            onChange={(e) => setAddForm({...addForm, scope3: e.target.value})}
            margin="normal"
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />

          {/* Total Preview in Add Dialog */}
          {(addForm.scope1 || addForm.scope2 || addForm.scope3) && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700} color="primary">
                Total Emissions: {calculateTotal(addForm.scope1, addForm.scope2, addForm.scope3)} tCO₂e
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setShowAddDialog(false)} 
            sx={{ color: '#6c757d', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddEmission}
            variant="contained"
            sx={{ 
              backgroundColor: '#1AC99F', 
              '&:hover': { backgroundColor: '#0E9A78' },
              fontWeight: 600,
              px: 3
            }}
          >
            Add Emissions Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmissionsPanel;
