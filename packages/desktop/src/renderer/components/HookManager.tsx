import React, { useState, useEffect } from 'react';
import { Project, GitHookConfig, GitHookInstallConfig } from '@gitswitch/types';

// Material-UI imports
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  AlertTitle,
  Chip,
  Avatar,
  Grid,
  Divider,
  alpha,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Icons
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import BuildIcon from '@mui/icons-material/Build';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoIcon from '@mui/icons-material/Info';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CodeIcon from '@mui/icons-material/Code';

// Keyframes for animations
const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
`;

const pulseGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
  }
  50% { 
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.5);
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
    radial-gradient(circle at 25% 25%, rgba(76, 175, 80, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 152, 0, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 50% 10%, rgba(0, 122, 204, 0.05) 0%, transparent 50%),
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

// Status Card with dynamic styling
const StatusCard = styled(Card)<{ status: 'installed' | 'not-installed' }>(({ theme, status }) => {
  const statusStyles = {
    installed: {
      background: 'rgba(76, 175, 80, 0.1)',
      border: '1px solid rgba(76, 175, 80, 0.3)',
      animation: `${pulseGlow} 3s ease-in-out infinite`,
    },
    'not-installed': {
      background: 'rgba(255, 152, 0, 0.1)',
      border: '1px solid rgba(255, 152, 0, 0.3)',
    }
  };

  return {
    ...glassBaseStyles,
    ...statusStyles[status],
    borderRadius: 16,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };
});

// Type for button variants
type ButtonVariant = 'install' | 'remove' | 'test';

// Action Button with enhanced styling
const ActionButton = styled(Button)<{ buttonvariant?: ButtonVariant }>(({ theme, buttonvariant = 'install' }) => {
  const variants: Record<ButtonVariant, any> = {
    install: {
      background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
      '&:hover': { background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)' }
    },
    remove: {
      background: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
      '&:hover': { background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)' }
    },
    test: {
      background: 'linear-gradient(135deg, #007acc 0%, #3399dd 100%)',
      '&:hover': { background: 'linear-gradient(135deg, #005a9e 0%, #007acc 100%)' }
    }
  };

  const selectedVariant = variants[buttonvariant];

  return {
    borderRadius: 12,
    padding: '12px 24px',
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
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.5)',
      transform: 'none',
    },
  };
});

// Feature Card for "How it Works" section
const FeatureCard = styled(Paper)(({ theme }) => ({
  ...glassBaseStyles,
  borderRadius: 16,
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateX(8px)',
    background: 'rgba(255, 255, 255, 0.08)',
  },
}));

interface HookManagerProps {
  projects: Project[];
  currentProject: Project | null;
}

const HookManager: React.FC<HookManagerProps> = ({ projects, currentProject }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(currentProject);
  const [hookConfig, setHookConfig] = useState<GitHookConfig | null>(null);
  const [hooksInstalled, setHooksInstalled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationLevel, setValidationLevel] = useState<'strict' | 'warning' | 'off'>('strict');
  const [autoFix, setAutoFix] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadHookStatus(selectedProject.path);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (currentProject && !selectedProject) {
      setSelectedProject(currentProject);
    }
  }, [currentProject, selectedProject]);

  const loadHookStatus = async (projectPath: string) => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate checking hook status
      const mockInstalled = Math.random() > 0.5;
      setHooksInstalled(mockInstalled);
      
    } catch (error) {
      console.error('Failed to load hook status:', error);
      setHooksInstalled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallHooks = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      // Mock installation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setHooksInstalled(true);
      alert('✅ Git hooks installed successfully!\nHooks will now validate git identity before each commit.');
      
    } catch (error) {
      console.error('Failed to install hooks:', error);
      alert('❌ Failed to install git hooks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHooks = async () => {
    if (!selectedProject) return;
    
    if (!confirm('Are you sure you want to remove GitSwitch git hooks from this project?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Mock removal
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setHooksInstalled(false);
      alert('✅ Git hooks removed successfully!');
      
    } catch (error) {
      console.error('Failed to remove hooks:', error);
      alert('❌ Failed to remove git hooks');
    } finally {
      setLoading(false);
    }
  };

  const handleTestValidation = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      // Mock validation test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResult = {
        valid: Math.random() > 0.3,
        message: Math.random() > 0.3 ? 'Identity matches expected account for this project' : 'Identity mismatch detected'
      };
      
      const icon = mockResult.valid ? '✅' : '❌';
      alert(`${icon} Validation Result:\n\n${mockResult.message}`);
      
    } catch (error) {
      console.error('Failed to test validation:', error);
      alert('❌ Validation test failed');
    } finally {
      setLoading(false);
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
                background: 'linear-gradient(135deg, #4caf50 0%, #007acc 50%, #ff9800 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Git Hook Management
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
              }}
            >
              Manage git hooks that prevent wrong identity commits and provide intelligent suggestions.
            </Typography>
          </Box>
          
          <Tooltip title="Refresh Hook Status">
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
              <AutorenewIcon sx={{ color: '#4caf50' }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* Project Selection */}
          <Grid item xs={12}>
            <GlassCard sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.1s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#007acc', 0.15), 
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}>
                    <FolderIcon sx={{ color: '#007acc' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Select Project
                  </Typography>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel>Choose a project to manage hooks</InputLabel>
                  <Select
                    value={selectedProject?.id || ''}
                    label="Choose a project to manage hooks"
                    onChange={(e) => {
                      const project = projects.find(p => p.id === e.target.value);
                      setSelectedProject(project || null);
                    }}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Select a project...</em>
                    </MenuItem>
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {project.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {project.path}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </GlassCard>
          </Grid>

          {selectedProject && (
            <>
              {/* Hook Status */}
              <Grid item xs={12} md={6}>
                <StatusCard 
                  status={hooksInstalled ? 'installed' : 'not-installed'}
                  sx={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: '0.2s'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: hooksInstalled ? alpha('#4caf50', 0.2) : alpha('#ff9800', 0.2),
                        mr: 2,
                        width: 56,
                        height: 56,
                        animation: hooksInstalled ? `${subtleFloat} 3s ease-in-out infinite` : 'none',
                      }}>
                        {hooksInstalled ? 
                          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '2rem' }} /> :
                          <ErrorIcon sx={{ color: '#ff9800', fontSize: '2rem' }} />
                        }
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Hook Status
                        </Typography>
                        <Chip 
                          label={hooksInstalled ? 'Hooks Installed' : 'Hooks Not Installed'}
                          color={hooksInstalled ? 'success' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {selectedProject.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {selectedProject.path}
                      </Typography>
                    </Box>
                  </CardContent>
                </StatusCard>
              </Grid>

              {/* Hook Configuration */}
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
                        bgcolor: alpha('#007acc', 0.15), 
                        mr: 2,
                        width: 48,
                        height: 48,
                      }}>
                        <SettingsIcon sx={{ color: '#007acc' }} />
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Hook Configuration
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Validation Level</InputLabel>
                        <Select
                          value={validationLevel}
                          label="Validation Level"
                          onChange={(e) => setValidationLevel(e.target.value as 'strict' | 'warning' | 'off')}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="strict">Strict - Block commits with wrong identity</MenuItem>
                          <MenuItem value="warning">Warning - Show warning but allow commits</MenuItem>
                          <MenuItem value="off">Off - Disable validation</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <Paper sx={{ 
                        ...glassBaseStyles, 
                        borderRadius: 2, 
                        p: 2,
                        background: 'rgba(255, 255, 255, 0.03)',
                      }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={autoFix}
                              onChange={(e) => setAutoFix(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AutoFixHighIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  Auto-fix Identity
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Automatically correct git identity before commit
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </Paper>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>

              {/* Actions */}
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
                        bgcolor: alpha('#ff9800', 0.15), 
                        mr: 2,
                        width: 48,
                        height: 48,
                      }}>
                        <BuildIcon sx={{ color: '#ff9800' }} />
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Actions
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {!hooksInstalled ? (
                        <ActionButton
                          buttonvariant="install"
                          startIcon={<BuildIcon />}
                          onClick={handleInstallHooks}
                          disabled={loading}
                          size="large"
                        >
                          {loading ? 'Installing...' : 'Install Git Hooks'}
                        </ActionButton>
                      ) : (
                        <>
                          <ActionButton
                            buttonvariant="remove"
                            startIcon={<DeleteIcon />}
                            onClick={handleRemoveHooks}
                            disabled={loading}
                          >
                            {loading ? 'Removing...' : 'Remove Git Hooks'}
                          </ActionButton>
                          
                          <ActionButton
                            buttonvariant="test"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleTestValidation}
                            disabled={loading}
                          >
                            {loading ? 'Testing...' : 'Test Validation'}
                          </ActionButton>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>

              {/* How it Works */}
              <Grid item xs={12}>
                <GlassCard sx={{
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: '0.5s'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha('#9c27b0', 0.15), 
                        mr: 2,
                        width: 48,
                        height: 48,
                      }}>
                        <InfoIcon sx={{ color: '#9c27b0' }} />
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        How it Works
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      {[
                        {
                          icon: SecurityIcon,
                          title: 'Identity Validation',
                          description: 'Before each commit, hooks check if your current git identity matches the expected account for this project based on smart suggestions.',
                          color: '#4caf50',
                          delay: '0.6s'
                        },
                        {
                          icon: BugReportIcon,
                          title: 'Error Prevention',
                          description: 'Prevents accidental commits with the wrong identity, saving time and avoiding embarrassing mistakes in professional projects.',
                          color: '#f44336',
                          delay: '0.7s'
                        },
                        {
                          icon: AutoFixHighIcon,
                          title: 'Auto-Fix',
                          description: 'When enabled, automatically switches to the correct identity before committing, making the process seamless.',
                          color: '#007acc',
                          delay: '0.8s'
                        }
                      ].map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                          <FeatureCard sx={{
                            animation: `${slideIn} 0.6s ease-out`,
                            animationDelay: feature.delay,
                            animationFillMode: 'backwards',
                          }}>
                            <Avatar sx={{ 
                              bgcolor: alpha(feature.color, 0.15),
                              border: `2px solid ${alpha(feature.color, 0.3)}`,
                              width: 56,
                              height: 56,
                            }}>
                              <feature.icon sx={{ color: feature.color, fontSize: '1.8rem' }} />
                            </Avatar>
                            <Box>
                              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                {feature.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
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
            </>
          )}
        </Grid>
      </Box>
    </>
  );
};

export default HookManager;