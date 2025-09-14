import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ExternalSubmission from './Pages/ExternalSubmission';

/**
 * A component to protect routes that require authentication.
 * It checks for a token in localStorage. If it exists, it renders the requested component.
 * Otherwise, it redirects the user to the login page.
 */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/submit/:token" element={<ExternalSubmission />} />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Default route redirects to the login page */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;

