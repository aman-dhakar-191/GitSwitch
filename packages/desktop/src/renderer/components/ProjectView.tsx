import React, { useState, useEffect } from 'react';
import { Project, GitConfig, GitAccount } from '@gitswitch/types';

// Material-UI imports
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Alert,
  AlertTitle,
  Divider,
  Tooltip,
  alpha,
  Grid,
  IconButton,
  Paper
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Icons
import FolderIcon from '@mui/icons-material/Folder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LabelIcon from '@mui/icons-material/Label';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import SettingsIcon from '@mui/icons-material/Settings';
import CodeIcon from '@mui/icons-material/Code';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';

// Keyframes for animations
const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
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
    radial-gradient(circle at 30% 20%, rgba(0, 122, 204, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(76, 175, 80, 0.08) 0%, transparent 50%),
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
    transform: 'translateY(-3px)',
    background: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
}));

// Status Card for Git Identity
const StatusCard = styled(Card)<{ status: 'success' | 'warning' | 'error' }>(({ theme, status }) => {
  const statusColors = {
    success: { bg: 'rgba(76, 175, 80, 0.1)', border: 'rgba(76, 175, 80, 0.3)' },
    warning: { bg: 'rgba(255, 152, 0, 0.1)', border: 'rgba(255, 152, 0, 0.3)' },
    error: { bg: 'rgba(244, 67, 54, 0.1)', border: 'rgba(244, 67, 54, 0.3)' }
  };

  return {
    ...glassBaseStyles,
    background: statusColors[status].bg,
    border: `1px solid ${statusColors[status].border}`,
    borderRadius: 16,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
    },
  };
});

// Account Switch Card
const AccountCard = styled(Paper)<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  ...glassBaseStyles,
  borderRadius: 16,
  padding: theme.spacing(2),
  margin: theme.spacing(1, 0),
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  background: isSelected ? 'rgba(0, 122, 204, 0.15)' : 'rgba(255, 255, 255, 0.03)',
  border: isSelected ? '2px solid rgba(0, 122, 204, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
  '&:hover': {
    transform: 'translateX(8px) translateY(-2px)',
    background: isSelected ? 'rgba(0, 122, 204, 0.2)' : 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
}));

// Floating Action Button
const FloatingButton = styled(Button)(({ theme }) => ({
  borderRadius: 16,
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #007acc 0%, #3399dd 100%)',
  boxShadow: '0 4px 16px rgba(0, 122, 204, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  fontWeight: 700,
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-2px)',
    background: 'linear-gradient(135deg, #005a9e 0%, #007acc 100%)',
    boxShadow: '0 8px 24px rgba(0, 122, 204, 0.4)',
  },
}));

// Empty State Container
const EmptyStateContainer = styled(Box)(({ theme }) => ({
  ...glassBaseStyles,
  borderRadius: 20,
  padding: theme.spacing(6),
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

interface ProjectViewProps {
  project: Project | null;
  gitConfig: GitConfig | null;
  accounts: GitAccount[];
  onSwitchIdentity: (accountId: string) => void;
  onOpenAccountManager: () => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({
  project,
  gitConfig,
  accounts,
  onSwitchIdentity,
  onOpenAccountManager
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!project) {
    return (
      <>
        <BackgroundContainer />
        <Box sx={{ p: 4, position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyStateContainer sx={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <Avatar sx={{ 
              width: 120, 
              height: 120, 
              bgcolor: alpha('#007acc', 0.15),
              border: '3px solid rgba(0, 122, 204, 0.3)',
              animation: `${subtleFloat} 4s ease-in-out infinite`,
            }}>
              <FolderIcon sx={{ fontSize: 60, color: '#007acc' }} />
            </Avatar>
            
            <Box>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 800,
                  mb: 2,
                  background: 'linear-gradient(135deg, #007acc 0%, #3399dd 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                No Project Selected
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 4,
                  fontSize: '1.1rem',
                }}
              >
                Run <Box component="code" sx={{ 
                  background: 'rgba(0, 122, 204, 0.2)', 
                  padding: '4px 8px', 
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  color: '#007acc'
                }}>gitswitch .</Box> from a git repository to get started.
              </Typography>
            </Box>
            
            <FloatingButton
              startIcon={<SettingsIcon />}
              onClick={onOpenAccountManager}
              size="large"
            >
              Manage Accounts
            </FloatingButton>
          </EmptyStateContainer>
        </Box>
      </>
    );
  }

  const currentAccount = gitConfig ? 
    accounts.find(acc => acc.email === gitConfig.email && acc.gitName === gitConfig.name) : 
    null;

  const isConfigCorrect = currentAccount && gitConfig;
  const statusType = isConfigCorrect ? 'success' : gitConfig ? 'warning' : 'error';

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
                background: 'linear-gradient(135deg, #007acc 0%, #3399dd 50%, #4caf50 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Current Project
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
              }}
            >
              Manage your Git identity for this project
            </Typography>
          </Box>
          
          <Tooltip title="Refresh Project">
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
          {/* Project Info */}
          <Grid item xs={12} lg={8}>
            <GlassCard sx={{
              mb: 3,
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.1s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#007acc', 0.15), 
                    mr: 3,
                    width: 64,
                    height: 64,
                    border: '2px solid rgba(0, 122, 204, 0.3)',
                  }}>
                    <FolderIcon sx={{ color: '#007acc', fontSize: '2rem' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {project.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={project.status || 'active'} 
                        size="small" 
                        color={project.status === 'active' ? 'success' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                      {project.platform && (
                        <Chip 
                          icon={<CodeIcon />} 
                          label={project.platform} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <LocationOnIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Path
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontFamily: 'monospace',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '4px 8px',
                          borderRadius: 1,
                          wordBreak: 'break-all'
                        }}>
                          {project.path}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {project.remoteUrl && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <LinkIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Remote
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontFamily: 'monospace',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '4px 8px',
                            borderRadius: 1,
                            wordBreak: 'break-all'
                          }}>
                            {project.remoteUrl}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <HistoryIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Project Stats
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            icon={<TrendingUpIcon />} 
                            label={`${project.commitCount || 0} commits`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip 
                            label={`Confidence: ${((project.confidence || 0) * 100).toFixed(0)}%`} 
                            size="small" 
                            color={(project.confidence || 0) > 0.8 ? 'success' : (project.confidence || 0) > 0.5 ? 'warning' : 'error'} 
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip 
                            label={`Last: ${project.lastAccessed ? new Date(project.lastAccessed).toLocaleDateString() : 'N/A'}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </GlassCard>

            {/* Git Identity Status */}
            <StatusCard 
              status={statusType}
              sx={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: '0.2s'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: statusType === 'success' ? 'rgba(76, 175, 80, 0.2)' : 
                             statusType === 'warning' ? 'rgba(255, 152, 0, 0.2)' : 
                             'rgba(244, 67, 54, 0.2)',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}>
                    {statusType === 'success' ? 
                      <CheckCircleIcon sx={{ color: '#4caf50' }} /> :
                      statusType === 'warning' ? 
                      <WarningIcon sx={{ color: '#ff9800' }} /> :
                      <ErrorIcon sx={{ color: '#f44336' }} />
                    }
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Git Identity
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {statusType === 'success' ? 'Identity looks good!' :
                       statusType === 'warning' ? 'Identity not recognized' :
                       'No identity configured'}
                    </Typography>
                  </Box>
                </Box>

                {gitConfig ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon sx={{ mr: 1, fontSize: '1.25rem', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">Name:</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, ml: 3 }}>
                        {gitConfig.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EmailIcon sx={{ mr: 1, fontSize: '1.25rem', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, ml: 3 }}>
                        {gitConfig.email}
                      </Typography>
                    </Grid>
                    {currentAccount && (
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LabelIcon sx={{ mr: 1, fontSize: '1.25rem', color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">Account:</Typography>
                        </Box>
                        <Box sx={{ ml: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {currentAccount.description || currentAccount.name}
                          </Typography>
                          {currentAccount.isDefault && (
                            <Chip 
                              label="Default" 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    This project doesn't have a Git identity configured yet.
                  </Typography>
                )}
              </CardContent>
            </StatusCard>
          </Grid>

          {/* Account Switcher */}
          <Grid item xs={12} lg={4}>
            <GlassCard sx={{
              height: 'fit-content',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.3s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SwapHorizIcon sx={{ mr: 2, color: '#007acc', fontSize: '1.5rem' }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Switch Identity
                  </Typography>
                </Box>

                {accounts.length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    {accounts.map((account, index) => (
                      <AccountCard 
                        key={account.id}
                        isSelected={currentAccount?.id === account.id}
                        onClick={() => currentAccount?.id !== account.id && onSwitchIdentity(account.id)}
                        sx={{
                          animation: `${slideIn} 0.5s ease-out`,
                          animationDelay: `${index * 0.1}s`,
                          animationFillMode: 'backwards',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            bgcolor: account.color || alpha('#007acc', 0.2), 
                            mr: 2,
                            width: 48,
                            height: 48,
                            fontSize: '1.1rem',
                            fontWeight: 700,
                          }}>
                            {account.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                {account.name}
                              </Typography>
                              {account.isDefault && (
                                <Chip 
                                  label="Default" 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                              {currentAccount?.id === account.id && (
                                <Chip 
                                  icon={<CheckCircleIcon />} 
                                  label="Current" 
                                  color="success" 
                                  size="small"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {account.email}
                            </Typography>
                            {account.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                {account.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label={`Usage: ${account.usageCount || 0}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              <Chip 
                                label={`Priority: ${account.priority || 5}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </AccountCard>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle>No Accounts Found</AlertTitle>
                    Add some Git accounts to get started.
                  </Alert>
                )}

                <FloatingButton
                  fullWidth
                  startIcon={<SettingsIcon />}
                  onClick={onOpenAccountManager}
                >
                  Manage Accounts
                </FloatingButton>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default ProjectView;