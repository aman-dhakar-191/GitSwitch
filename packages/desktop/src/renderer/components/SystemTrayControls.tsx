import React, { useState, useEffect } from 'react';
import { IPCEvent } from '@gitswitch/types';

// Material-UI imports
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Grid,
  alpha,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Icons
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderIcon from '@mui/icons-material/Folder';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import InfoIcon from '@mui/icons-material/Info';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

// Keyframes for animations
const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
`;

const pulseGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 4px 16px rgba(0, 122, 204, 0.3);
  }
  50% { 
    box-shadow: 0 8px 24px rgba(0, 122, 204, 0.5);
  }
`;

const slideIn = keyframes`
  0% { 
    transform: translateX(-20px);
    opacity: 0;
  }
  100% { 
    transform: translateX(0);
    opacity: 1;
  }
`;

// Background with animated gradient
const BackgroundContainer = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: `
    radial-gradient(circle at 20% 20%, rgba(0, 122, 204, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(156, 39, 176, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(255, 152, 0, 0.05) 0%, transparent 50%),
    linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)
  `,
  zIndex: -1,
});

// Optimized glass styles
const glassBaseStyles = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
};

// Enhanced Glass Card
const GlassCard = styled(Card)(({ theme }) => ({
  ...glassBaseStyles,
  borderRadius: 20,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-2px)',
    background: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
}));

// Status Card with glow effect
const StatusCard = styled(Card)(({ theme }) => ({
  ...glassBaseStyles,
  background: 'rgba(76, 175, 80, 0.1)',
  border: '1px solid rgba(76, 175, 80, 0.3)',
  borderRadius: 16,
  animation: `${pulseGlow} 3s ease-in-out infinite`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

// Action Button with enhanced styling
const ActionButton = styled(Button)<{ buttonvariant?: 'primary' | 'secondary' }>(({ theme, buttonvariant = 'primary' }) => {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #007acc 0%, #3399dd 100%)',
      '&:hover': { background: 'linear-gradient(135deg, #005a9e 0%, #007acc 100%)' }
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      '&:hover': { background: 'rgba(255, 255, 255, 0.15)' }
    }
  };

  const selectedVariant = variants[buttonvariant];

  return {
    borderRadius: 12,
    padding: '12px 20px',
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    ...selectedVariant,
    '&:hover': {
      ...selectedVariant['&:hover'],
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
    },
    '&:disabled': {
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'rgba(255, 255, 255, 0.3)',
      transform: 'none',
    },
  };
});

// Feature Card for tray features
const FeatureCard = styled(Paper)(({ theme }) => ({
  ...glassBaseStyles,
  borderRadius: 16,
  padding: theme.spacing(2.5),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateX(8px)',
    background: 'rgba(255, 255, 255, 0.08)',
  },
}));

// Tip Item styled component
const TipItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: 12,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.05)',
    transform: 'translateX(4px)',
  },
}));

interface SystemTrayControlsProps {
  currentProject?: any;
}

const SystemTrayControls: React.FC<SystemTrayControlsProps> = ({ currentProject }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [notifications, setNotifications] = useState({
    enabled: true,
    silent: false
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const updateTrayMenu = async () => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Tray menu updated');
    } catch (error) {
      console.error('Failed to update tray menu:', error);
    }
  };

  const showTestNotification = async () => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('Test notification sent!');
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

  const minimizeToTray = async () => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('Minimized to tray');
    } catch (error) {
      console.error('Failed to minimize to tray:', error);
    }
  };

  return (
    <>
      <BackgroundContainer />
      <Box sx={{ p: 4, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          ...glassBaseStyles,
          borderRadius: 2,
          p: 3,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <Box>
            <Typography 
              variant="h1" 
              sx={{ 
                fontWeight: 800, 
                mb: 0.5,
                fontSize: '2.5rem',
                background: 'linear-gradient(135deg, #007acc 0%, #9c27b0 50%, #ff9800 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              System Tray Integration
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
              }}
            >
              Control your system tray settings and features
            </Typography>
          </Box>
          
          <Tooltip title="Refresh Tray Status">
            <IconButton 
              sx={{ 
                ...glassBaseStyles,
                borderRadius: 2,
                width: 48,
                height: 48,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'rotate(90deg)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <AutorenewIcon sx={{ color: '#007acc' }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* Tray Status */}
          <Grid item xs={12}>
            <StatusCard sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.1s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#4caf50', 0.2), 
                    mr: 2,
                    width: 56,
                    height: 56,
                    animation: `${subtleFloat} 3s ease-in-out infinite`,
                  }}>
                    <DesktopWindowsIcon sx={{ color: '#4caf50', fontSize: '2rem' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Tray Status
                    </Typography>
                    <Chip 
                      icon={<CheckCircleIcon />}
                      label="System tray is active"
                      color="success"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
                
                {currentProject && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FolderIcon sx={{ color: '#007acc' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Current project: {currentProject.name}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </StatusCard>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <GlassCard sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.2s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#ff9800', 0.15), 
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}>
                    <FlashOnIcon sx={{ color: '#ff9800' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Quick Actions
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <ActionButton
                    buttonvariant="secondary"
                    startIcon={<RefreshIcon />}
                    onClick={updateTrayMenu}
                    fullWidth
                  >
                    Update Tray Menu
                  </ActionButton>
                  
                  <ActionButton
                    buttonvariant="secondary"
                    startIcon={<MinimizeIcon />}
                    onClick={minimizeToTray}
                    fullWidth
                  >
                    Minimize to Tray
                  </ActionButton>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Notifications */}
          <Grid item xs={12} md={6}>
            <GlassCard sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.3s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#9c27b0', 0.15), 
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}>
                    <NotificationsIcon sx={{ color: '#9c27b0' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Notifications
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Paper sx={{ 
                    ...glassBaseStyles, 
                    borderRadius: 2, 
                    p: 2,
                    mb: 2,
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.enabled}
                          onChange={(e) => setNotifications(prev => ({ ...prev, enabled: e.target.checked }))}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {notifications.enabled ? <NotificationsIcon sx={{ mr: 1 }} /> : <NotificationsOffIcon sx={{ mr: 1 }} />}
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Enable tray notifications
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>

                  <Paper sx={{ 
                    ...glassBaseStyles, 
                    borderRadius: 2, 
                    p: 2,
                    mb: 3,
                    background: 'rgba(255, 255, 255, 0.03)',
                    opacity: notifications.enabled ? 1 : 0.5,
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.silent}
                          onChange={(e) => setNotifications(prev => ({ ...prev, silent: e.target.checked }))}
                          disabled={!notifications.enabled}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {notifications.silent ? <VolumeOffIcon sx={{ mr: 1 }} /> : <VolumeUpIcon sx={{ mr: 1 }} />}
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Silent notifications
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                </Box>
                
                <ActionButton
                  buttonvariant="primary"
                  startIcon={<NotificationsIcon />}
                  onClick={showTestNotification}
                  disabled={!notifications.enabled}
                  fullWidth
                >
                  Test Notification
                </ActionButton>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Tray Features */}
          <Grid item xs={12}>
            <GlassCard sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.4s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#2196f3', 0.15), 
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}>
                    <SmartDisplayIcon sx={{ color: '#2196f3' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Tray Features
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  {[
                    {
                      icon: SwapHorizIcon,
                      title: 'Quick Account Switching',
                      description: 'Switch git identities directly from the tray menu',
                      color: '#007acc',
                      delay: '0.5s'
                    },
                    {
                      icon: HistoryIcon,
                      title: 'Recent Projects',
                      description: 'Access your 5 most recent projects instantly',
                      color: '#4caf50',
                      delay: '0.6s'
                    },
                    {
                      icon: FlashOnIcon,
                      title: 'Quick Actions',
                      description: 'Scan projects, manage accounts, view analytics',
                      color: '#ff9800',
                      delay: '0.7s'
                    },
                    {
                      icon: NotificationsIcon,
                      title: 'Smart Notifications',
                      description: 'Get notified about identity switches and important events',
                      color: '#9c27b0',
                      delay: '0.8s'
                    }
                  ].map((feature, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <FeatureCard sx={{
                        animation: `${slideIn} 0.6s ease-out`,
                        animationDelay: feature.delay,
                        animationFillMode: 'backwards',
                      }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(feature.color, 0.15),
                          border: `2px solid ${alpha(feature.color, 0.3)}`,
                          width: 48,
                          height: 48,
                        }}>
                          <feature.icon sx={{ color: feature.color, fontSize: '1.5rem' }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                            {feature.description}
                          </Typography>
                        </Box>
                      </FeatureCard>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Usage Tips */}
          <Grid item xs={12}>
            <GlassCard sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.9s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#f44336', 0.15), 
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}>
                    <InfoIcon sx={{ color: '#f44336' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Usage Tips
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { number: 1, text: 'Right-click the tray icon to access the context menu', icon: TouchAppIcon },
                    { number: 2, text: 'Double-click to quickly show the main GitSwitch window', icon: TouchAppIcon },
                    { number: 3, text: 'Closing the main window minimizes to tray (app keeps running)', icon: MinimizeIcon },
                    { number: 4, text: 'Use "Quit GitSwitch" from tray menu to completely exit', icon: ExitToAppIcon }
                  ].map((tip, index) => (
                    <TipItem key={index} sx={{
                      animation: `${slideIn} 0.5s ease-out`,
                      animationDelay: `${1 + index * 0.1}s`,
                      animationFillMode: 'backwards',
                    }}>
                      <Avatar sx={{ 
                        bgcolor: '#007acc',
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}>
                        {tip.number}
                      </Avatar>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <tip.icon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                        <Typography variant="body1" sx={{ lineHeight: 1.4 }}>
                          {tip.text}
                        </Typography>
                      </Box>
                    </TipItem>
                  ))}
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default SystemTrayControls;