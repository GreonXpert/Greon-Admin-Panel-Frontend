import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  Chip,
  Avatar,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
  IconButton
} from '@mui/material';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import VerifiedIcon from '@mui/icons-material/Verified';
import EcoIcon from '@mui/icons-material/Science';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PublicIcon from '@mui/icons-material/Public';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InsightsIcon from '@mui/icons-material/Insights';
import NatureIcon from '@mui/icons-material/Nature';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LanguageIcon from '@mui/icons-material/Language';
import Team from '@mui/icons-material/Group';
import SolutionIcon from '@mui/icons-material/Lightbulb';
import Contact from '@mui/icons-material/ContactMail';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';

const Sidebar = ({ activePanel, setActivePanel, onItemClick, isMobileOpen, setIsMobileOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role || '';
  const userName = user?.name || 'Admin User';
  const userEmail = user?.email || 'admin@greonxpert.com';

  // Base navigation items with better organization
  const baseNavItems = [
    { 
      text: 'Emissions Panel', 
      key: 'emissions', 
      icon: <BubbleChartIcon />,
      category: 'Analytics',
      color: '#FF6B6B'
    },
    { 
      text: 'Trusted By Panel', 
      key: 'trustedBy', 
      icon: <VerifiedIcon />,
      category: 'Content',
      color: '#4ECDC4'
    },
    { 
      text: 'Powered By Science', 
      key: 'PoweredByScience', 
      icon: <EcoIcon />,
      category: 'Content',
      color: '#45B7D1'
    },
    { 
      text: 'Climate Intelligence', 
      key: 'climateIntelligence', 
      icon: <AssessmentIcon />,
      category: 'Analytics',
      color: '#96CEB4'
    },
    { 
      text: 'Advisory Board', 
      key: 'AdvisoryBoard', 
      icon: <InsightsIcon />,
      category: 'Team',
      color: '#FFEAA7'
    },
    { 
      text: 'Sustainability Stories', 
      key: 'story', 
      icon: <NatureIcon />,
      category: 'Content',
      color: '#DDA0DD'
    },
    { 
      text: 'Submission Links', 
      key: 'submissionLink', 
      icon: <TrendingUpIcon />,
      category: 'Management',
      color: '#FFB6C1'
    },
    { 
      text: 'Pending Submissions', 
      key: 'PendingReviews', 
      icon: <LanguageIcon />,
      category: 'Management',
      color: '#FFA07A'
    },
    { 
      text: 'Our Journey', 
      key: 'journey', 
      icon: <PublicIcon />,
      category: 'Content',
      color: '#1AC99F'
    },
    { 
      text: 'Our Team', 
      key: 'team', 
      icon: <Team />,
      category: 'Team',
      color: '#20B2AA'
    },
    { 
      text: 'Our Solutions', 
      key: 'solutions', 
      icon: <SolutionIcon />,
      category: 'Content',
      color: '#87CEEB'
    },
    { 
      text: 'Contact', 
      key: 'contact', 
      icon: <Contact />,
      category: 'Management',
      color: '#F0A500'
    },
  ];

  // Add Register option only for superadmin
  const navItems = userRole === 'superadmin'
    ? [
        ...baseNavItems,
        { 
          text: 'User Registration', 
          key: 'register', 
          icon: <PersonAddIcon />,
          category: 'Admin',
          color: '#FF4757'
        }
      ]
    : baseNavItems;

  // Group items by category
  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleItemClick = (key) => {
    setActivePanel(key);
    if (onItemClick) {
      onItemClick(); // Close mobile drawer
    }
    // Close mobile sidebar on item click
    if (isMobile && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1AC99F 0%, #2E8B8B 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          opacity: 0.7,
          animation: 'float 6s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          opacity: 0.5,
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />

      {/* Mobile Header with Close Button */}
      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
            Menu
          </Typography>
          <IconButton 
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Header Section */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
            background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
            fontSize: '1.5rem',
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 32 }} />
        </Avatar>
        
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'white',
            fontWeight: 800,
            mb: 0.5,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          GreonXpert
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255,255,255,0.8)',
            mb: 2,
            fontWeight: 500
          }}
        >
          Admin Dashboard
        </Typography>

        {/* User Info */}
        <Box sx={{ 
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          p: 2,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>
            {userName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {userEmail}
          </Typography>
          <Chip
            label={userRole.toUpperCase()}
            size="small"
            sx={{
              mt: 1,
              bgcolor: userRole === 'superadmin' ? '#FF6B6B' : '#4ECDC4',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.65rem'
            }}
          />
        </Box>
      </Box>

      {/* ✅ SCROLLABLE Navigation Section */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        py: 2,
        position: 'relative',
        zIndex: 1,
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.3)',
          borderRadius: 3,
          '&:hover': {
            background: 'rgba(255,255,255,0.5)',
          }
        },
      }}>
        {Object.entries(groupedItems).map(([category, items], categoryIndex) => (
          <Box key={category} sx={{ mb: 3 }}>
            {/* Category Header */}
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 700,
                fontSize: '0.75rem',
                px: 3,
                mb: 1,
                display: 'block',
                letterSpacing: 1
              }}
            >
              {category}
            </Typography>

            {/* Category Items */}
            <List sx={{ px: 1 }}>
              {items.map((item, index) => (
                <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip 
                    title={isMobile ? '' : item.text} 
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      selected={activePanel === item.key}
                      onClick={() => handleItemClick(item.key)}
                      sx={{
                        borderRadius: 3,
                        mx: 1,
                        px: 2,
                        py: 1.5,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: 56,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          transform: 'translateX(4px)',
                          border: `2px solid ${item.color}`,
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            backgroundColor: item.color,
                            borderRadius: '0 2px 2px 0',
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.25)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: item.color,
                            transform: 'scale(1.1)',
                          },
                          '& .MuiListItemText-primary': {
                            fontWeight: 700,
                          }
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          transform: 'translateX(2px)',
                          '& .MuiListItemIcon-root': {
                            color: item.color,
                            transform: 'scale(1.05)',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: 'rgba(255,255,255,0.8)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.9)'
                        }}
                      />
                      {/* Active indicator dot */}
                      {activePanel === item.key && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            boxShadow: `0 0 10px ${item.color}`,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <Stack spacing={1} alignItems="center">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: 1
          }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                animation: 'pulse 2s infinite'
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              System Online
            </Typography>
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            Climate Tech Solutions
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.7rem'
            }}
          >
            Kerala • Laos • Global
          </Typography>
        </Stack>
      </Box>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );

  return sidebarContent;
};

export default Sidebar;
