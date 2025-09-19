import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  ThemeProvider,
  IconButton,
  Avatar,
  Container,
  useTheme,
  useMediaQuery,
  Drawer
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';
import TrustedByPanel from '../TrustedBy/TrustedByPanel';
import EmissionsPanel from '../Emission/EmissionsPanel';
import PoweredBySciencePanel from '../PoweredByScience/PoweredBySciencePanel';
import ClimateIntelligencePanel from '../ClimateIntelligence/ClimateIntelligencePanel';
import AdvisoryBoardPanel from '../AdvisoryBoard/AdvisoryBoardPanel';
import StoryPanel from '../SustainabilityStory/StoryPanel';
import SubmissionLinkPanel from '../Admin/SubmissionLinkPanel';
import Register from '../Auth/Register';
import ProtectedRoute from '../ProtectedRoute';
import theme from '../../theme';
import PendingSubmissionsPanel from '../Admin/PendingSubmissionsPanel';
import JourneyPanel from '../Journey/JourneyPanel';
import TeamPanel from '../Team/TeamPanel';
import SolutionPanel from '../Solutions/SolutionPanel';
import ContactFormPanel from '../Contact/ContactFormPanel';
import TestimonialPanel from '../Testimonials/TestimonialPanel';
import ProjectPanel from '../Projects/ProjectPanel';

const drawerWidth = 260;

const Dashboard = () => {
  const [activePanel, setActivePanel] = useState('emissions');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role || '';

  const renderPanel = () => {
    switch (activePanel) {
      case 'trustedBy':
        return <TrustedByPanel />;
      case 'emissions':
        return <EmissionsPanel />;
      case 'PoweredByScience':
        return <PoweredBySciencePanel />;
      case 'climateIntelligence':
        return <ClimateIntelligencePanel />;
      case 'AdvisoryBoard':
        return <AdvisoryBoardPanel />;
      case 'story':
        return <StoryPanel />;
      case 'submissionLink':
        return <SubmissionLinkPanel />;
      case 'PendingReviews':
        return <PendingSubmissionsPanel />;
      case 'journey':
        return <JourneyPanel />;
      case 'team':
        return <TeamPanel />;
      case 'solutions':
        return <SolutionPanel />;
      case 'contact':
        return <ContactFormPanel />;
      case 'Testimonials':
        return <TestimonialPanel />;  
      case 'project':
        return <ProjectPanel/>  
      case 'register':
        return (
          <ProtectedRoute requiredRole="superadmin">
            <Register />
          </ProtectedRoute>
        );
      default:
        return <EmissionsPanel />;
    }
  };

  const userInitial = user && user.name ? user.name.charAt(0).toUpperCase() : 'A';

  const getPanelTitle = () => {
    switch (activePanel) {
      case 'trustedBy':
        return 'Trusted By Management';
      case 'emissions':
        return 'Emissions Dashboard';
      case 'register':
        return 'User Registration';
      case 'PoweredByScience':
        return 'Powered By Science';
      case 'climateIntelligence':
        return 'Climate Intelligence';
      case 'AdvisoryBoard':
        return 'Advisory Board';
      case 'story':
        return 'Sustainability Stories';
      case 'submissionLink':
        return 'Submission Links';
      case 'PendingReviews':
        return 'Pending Submissions';
      case 'journey':
        return 'Our Journey';
      case 'team':
        return 'Our Team';
      case 'solutions':
        return 'Our Solutions';
      case 'contact':
        return 'Contact Form Submissions';
      case 'Testimonials':
        return 'Testimonials Management';  
      case 'project':
        return 'Our Projects';  
      default:
        return 'Emissions Dashboard';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
        {/* AppBar */}
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            borderBottom: '1px solid rgba(0,0,0,0.12)',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
            {/* Mobile menu button */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  mr: 2, 
                  display: { md: 'none' },
                  color: 'text.primary'
                }}
              >
                <MenuIcon />
              </IconButton>
              
              {/* Panel title */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}
                >
                  {getPanelTitle()}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  GreonXpert Admin Panel
                </Typography>
              </Box>
            </Box>

            {/* User info and logout */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  {user ? user.name : 'Admin'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  {user ? user.role.toUpperCase() : 'ADMINISTRATOR'}
                </Typography>
              </Box>
              
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 40,
                  height: 40,
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {userInitial}
              </Avatar>
              
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                    bgcolor: 'error.lighter'
                  }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Sidebar Navigation */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            <Sidebar 
              activePanel={activePanel} 
              setActivePanel={setActivePanel}
              onItemClick={() => setMobileOpen(false)}
            />
          </Drawer>

          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            open
          >
            <Sidebar 
              activePanel={activePanel} 
              setActivePanel={setActivePanel}
            />
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            bgcolor: 'grey.50',
          }}
        >
          {/* Toolbar spacer */}
          <Toolbar />
          
          {/* Content Container */}
          <Container
            maxWidth={false}
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 2, md: 3 },
              maxWidth: 'none',
              height: 'calc(100vh - 64px)',
              overflow: 'hidden',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'white',
                border: '1px solid rgba(0,0,0,0.12)',
              }}
            >
              {renderPanel()}
            </Paper>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;
