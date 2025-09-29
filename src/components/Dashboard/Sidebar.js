import React, { useState } from 'react';
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
  IconButton,
  Collapse,
  Badge
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
import Testimonial from '@mui/icons-material/Person4';
import Project from '@mui/icons-material/PresentToAll';
import Career from '@mui/icons-material/Work';
import WebIcon from '@mui/icons-material/Web';
import GroupsIcon from '@mui/icons-material/Groups';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Sidebar = ({ activePanel, setActivePanel, onItemClick, isMobileOpen, setIsMobileOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [expandedSections, setExpandedSections] = useState({
    website: true,
    teams: true,
    leads: true,
    vlogs: true
  });
  
  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role || '';
  const userName = user?.name || 'Admin User';
  const userEmail = user?.email || 'admin@greonxpert.com';

  // Organized navigation structure
  const navigationSections = {
    website: {
      title: 'Website',
      icon: <WebIcon />,
      color: '#1AC99F',
      items: [
        { 
          text: 'Emissions Panel', 
          key: 'emissions', 
          icon: <BubbleChartIcon />,
          color: '#FF6B6B'
        },
        { 
          text: 'Climate Intelligence', 
          key: 'climateIntelligence', 
          icon: <AssessmentIcon />,
          color: '#96CEB4'
        },
        { 
          text: 'Trusted By Panel', 
          key: 'trustedBy', 
          icon: <VerifiedIcon />,
          color: '#4ECDC4'
        },
        { 
          text: 'Powered By Science', 
          key: 'PoweredByScience', 
          icon: <EcoIcon />,
          color: '#45B7D1'
        },
        { 
          text: 'Our Solutions', 
          key: 'solutions', 
          icon: <SolutionIcon />,
          color: '#87CEEB'
        },
        { 
          text: 'Our Projects', 
          key: 'project', 
          icon: <Project />,
          color: '#4d8fe7ff'
        },
        { 
          text: 'Our Journey', 
          key: 'journey', 
          icon: <PublicIcon />,
          color: '#1AC99F'
        }
      ]
    },
    teams: {
      title: 'Teams',
      icon: <GroupsIcon />,
      color: '#2E8B8B',
      items: [
        { 
          text: 'Advisory Board', 
          key: 'AdvisoryBoard', 
          icon: <InsightsIcon />,
          color: '#FFEAA7'
        },
        { 
          text: 'Our Team', 
          key: 'team', 
          icon: <Team />,
          color: '#20B2AA'
        },
        { 
          text: 'Career Management', 
          key: 'career', 
          icon: <Career />,
          color: '#f02000ff'
        },
        ...(userRole === 'superadmin' ? [{
          text: 'User Registration', 
          key: 'register', 
          icon: <PersonAddIcon />,
          color: '#FF4757'
        }] : [])
      ]
    },
    leads: {
      title: 'Leads & Testimonials',
      icon: <LeaderboardIcon />,
      color: '#FF9800',
      items: [
        {
          text: 'Testimonials Management', 
          key: 'Testimonials', 
          icon: <Testimonial />,
          color: '#a314e0ff'
        },
        { 
          text: 'Contact Management', 
          key: 'contact', 
          icon: <Contact />,
          color: '#F0A500'
        }
      ]
    },
    vlogs: {
      title: 'Content & Vlogs',
      icon: <VideoLibraryIcon />,
      color: '#E91E63',
      items: [
        { 
          text: 'Sustainability Stories', 
          key: 'story', 
          icon: <NatureIcon />,
          color: '#DDA0DD'
        },
        { 
          text: 'Submission Links', 
          key: 'submissionLink', 
          icon: <TrendingUpIcon />,
          color: '#FFB6C1'
        },
        { 
          text: 'Pending Reviews', 
          key: 'PendingReviews', 
          icon: <LanguageIcon />,
          color: '#FFA07A'
        }
      ]
    }
  };

  const handleSectionToggle = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleItemClick = (key) => {
    setActivePanel(key);
    if (onItemClick) {
      onItemClick();
    }
    if (isMobile && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // Count active items per section for badge
  const getActiveCount = (sectionItems) => {
    return sectionItems.filter(item => activePanel === item.key).length;
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
            Admin Menu
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
        p: { xs: 2, md: 3 }, 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <Avatar
          sx={{
            width: { xs: 48, md: 64 },
            height: { xs: 48, md: 64 },
            mx: 'auto',
            mb: 2,
            background: 'linear-gradient(45deg, #1AC99F, #0E9A78)',
            fontSize: { xs: '1.2rem', md: '1.5rem' },
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <AdminPanelSettingsIcon sx={{ fontSize: { xs: 24, md: 32 } }} />
        </Avatar>
        
        <Typography 
          variant={isMobile ? "h6" : "h5"}
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
            fontWeight: 500,
            fontSize: { xs: '0.75rem', md: '0.875rem' }
          }}
        >
          Admin Dashboard
        </Typography>

        {/* User Info */}
        <Box sx={{ 
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          p: { xs: 1.5, md: 2 },
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white', 
              fontWeight: 600, 
              mb: 0.5,
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          >
            {userName}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              fontSize: { xs: '0.65rem', md: '0.75rem' }
            }}
          >
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
              fontSize: '0.65rem',
              height: { xs: 20, md: 24 }
            }}
          />
        </Box>
      </Box>

      {/* Navigation Section with Collapsible Groups */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        py: 1,
        position: 'relative',
        zIndex: 1,
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
        {Object.entries(navigationSections).map(([sectionKey, section]) => (
          <Box key={sectionKey} sx={{ mb: 1 }}>
            {/* Section Header */}
            <ListItemButton
              onClick={() => handleSectionToggle(sectionKey)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                }
              }}
            >
              <ListItemIcon sx={{ color: section.color, minWidth: 36 }}>
                <Badge 
                  badgeContent={section.items.filter(item => activePanel === item.key).length} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: section.color,
                      color: 'white',
                      fontSize: '0.6rem',
                      minWidth: 16,
                      height: 16
                    }
                  }}
                >
                  {section.icon}
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={section.title}
                primaryTypographyProps={{
                  fontSize: { xs: '0.8rem', md: '0.9rem' },
                  fontWeight: 700,
                  color: 'white'
                }}
              />
              {expandedSections[sectionKey] ? 
                <ExpandLessIcon sx={{ color: 'white' }} /> : 
                <ExpandMoreIcon sx={{ color: 'white' }} />
              }
            </ListItemButton>

            {/* Section Items */}
            <Collapse in={expandedSections[sectionKey]} timeout="auto" unmountOnExit>
              <List sx={{ pl: 1 }}>
                {section.items.map((item) => (
                  <ListItem key={item.key} disablePadding sx={{ mb: 0.25 }}>
                    <Tooltip 
                      title={isMobile ? '' : item.text} 
                      placement="right"
                      arrow
                    >
                      <ListItemButton
                        selected={activePanel === item.key}
                        onClick={() => handleItemClick(item.key)}
                        sx={{
                          borderRadius: 2,
                          mx: 1,
                          px: { xs: 1.5, md: 2 },
                          py: { xs: 0.75, md: 1 },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          minHeight: { xs: 40, md: 48 },
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
                            minWidth: { xs: 32, md: 36 },
                            color: 'rgba(255,255,255,0.8)',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: { xs: '0.75rem', md: '0.85rem' },
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.9)'
                          }}
                        />
                        {activePanel === item.key && (
                          <Box
                            sx={{
                              width: { xs: 6, md: 8 },
                              height: { xs: 6, md: 8 },
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
            </Collapse>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: { xs: 2, md: 3 }, 
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
                fontSize: { xs: '0.65rem', md: '0.75rem' }
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
              fontSize: { xs: '0.7rem', md: '0.8rem' }
            }}
          >
            Climate Tech Solutions
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.6)',
              fontSize: { xs: '0.6rem', md: '0.7rem' }
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
