import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

const ProtectedRoute = ({ children, allowedRoles, userRole }) => {
  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
        <BlockIcon sx={{ fontSize: 64, color: '#e74c3c', mb: 2, opacity: 0.7 }} />
        <Typography variant="h4" sx={{ color: '#e74c3c', mb: 2, fontWeight: 600 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ color: '#6c757d' }}>
          You don't have permission to access this resource.
        </Typography>
      </Paper>
    );
  }

  return children;
};

export default ProtectedRoute;
