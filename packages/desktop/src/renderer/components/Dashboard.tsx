import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AutorenewIcon from '@mui/icons-material/Autorenew';

// Import your types
import { GitAccount, Project } from '@gitswitch/types';

// Optimized keyframes - reduced complexity
const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

// Simplified background - no expensive blur effects
const BackgroundContainer = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: `
    radial-gradient(circle at 20% 80%, rgba(0, 122, 204, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(51, 153, 221, 0.08) 0%, transparent 50%),
    linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)
  `,
  zIndex: -1,
});

// Optimized glass styles - reduced blur intensity
const glassBaseStyles = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(8px)', // Reduced from 20px
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)', // Simplified shadow
};

// Performance-optimized StatCard
const StatCard = styled(Card)(({ theme }) => ({
  ...glassBaseStyles,
  borderRadius: 20, // Reduced from 24
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Faster transition
  willChange: 'transform', // GPU optimization hint
  '&:hover': {
    transform: 'translateY(-4px)', // Reduced movement
    background: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  // Removed expensive pseudo-elements
}));

// Optimized Quick Action Card
const QuickActionCard = styled(Card)(({ theme }) => ({
  ...glassBaseStyles,
  borderRadius: 20,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(3),
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-6px)', // Reduced movement
    background: 'rgba(0, 122, 204, 0.1)',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
  },
  // Removed expensive hover effects
}));

// Optimized Chart Card
const ChartCard = styled(Card)(({ theme }) => ({
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

// Simplified Floating Button
const FloatingButton = styled(Button)(({ theme }) => ({
  borderRadius: 16,
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #007acc 0%, #3399dd 100%)',
  boxShadow: '0 4px 16px rgba(0, 122, 204, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  fontWeight: 700,
  fontSize: '1.1rem',
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-2px)',
    background: 'linear-gradient(135deg, #005a9e 0%, #007acc 100%)',
    boxShadow: '0 8px 24px rgba(0, 122, 204, 0.4)',
  },
  // Removed expensive animations
}));

// Simplified Progress Bar
const OptimizedProgressBar = styled(LinearProgress)<{ progressColor?: string }>(({ theme, progressColor }) => ({
  height: 12,
  borderRadius: 8,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  overflow: 'hidden',
  '& .MuiLinearProgress-bar': {
    borderRadius: 8,
    background: progressColor || 'linear-gradient(90deg, #007acc, #3399dd)',
    transition: 'width 0.8s ease',
  },
}));

// Props interface
interface DashboardProps {
  accounts: GitAccount[];
  projects: Project[];
  onAddAccount: () => void;
  onViewChange: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  accounts = [], 
  projects = [], 
  onAddAccount, 
  onViewChange 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Delayed load for smoother initial render
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const activeAccounts = accounts.filter(acc => acc.isDefault !== false).length;
  const totalProjects = projects.length;
  
  const accountUsage = [
    { name: 'Work Account', usage: 65, color: 'linear-gradient(90deg, #007acc, #3399dd)' },
    { name: 'Personal', usage: 35, color: 'linear-gradient(90deg, #4caf50, #81c784)' },
    { name: 'Open Source', usage: 20, color: 'linear-gradient(90deg, #ff9800, #ffc947)' },
  ];
  
  return (
    <>
      <BackgroundContainer />
      <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          ...glassBaseStyles,
          borderRadius: 2,
          p: 2.5,
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
              Dashboard
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
              }}
            >
              Welcome back! Here's what's happening with your Git accounts.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Refresh Dashboard">
              <IconButton 
                sx={{ 
                  ...glassBaseStyles,
                  borderRadius: 2,
                  width: 44,
                  height: 44,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    transform: 'rotate(90deg)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <AutorenewIcon sx={{ color: '#007acc', fontSize: '1.25rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Stats Grid - Reduced animation complexity */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              icon: PersonIcon,
              value: accounts.length,
              label: 'Total Accounts',
              trend: '+12%',
              color: '#007acc',
              delay: 0
            },
            {
              icon: CheckCircleIcon,
              value: activeAccounts,
              label: 'Active Accounts',
              trend: 'All active',
              color: '#4caf50',
              delay: 0.1
            },
            {
              icon: FolderIcon,
              value: totalProjects,
              label: 'Projects',
              trend: '+5%',
              color: '#2196f3',
              delay: 0.2
            },
            {
              icon: BarChartIcon,
              value: '87%',
              label: 'Efficiency',
              trend: 'Good',
              color: '#ff9800',
              delay: 0.3
            }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard sx={{ 
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: `${stat.delay}s`,
                // Only animate on hover, not continuously
                '&:hover': {
                  animation: `${subtleFloat} 2s ease-in-out`,
                }
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(stat.color, 0.15), 
                      mr: 2,
                      width: 56,
                      height: 56,
                      border: `1px solid ${alpha(stat.color, 0.2)}`,
                    }}>
                      <stat.icon sx={{ color: stat.color, fontSize: '1.75rem' }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h2" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 800,
                          fontSize: '2rem',
                          color: stat.color,
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    icon={<TrendingUpIcon sx={{ fontSize: '0.875rem' }} />} 
                    label={stat.trend}
                    size="small" 
                    sx={{ 
                      bgcolor: alpha(stat.color, 0.15),
                      color: stat.color,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 24,
                    }} 
                  />
                </CardContent>
              </StatCard>
            </Grid>
          ))}
        </Grid>
        
        {/* Main Content Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Account Usage Chart */}
          <Grid item xs={12} md={8}>
            <ChartCard sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.3s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1.25rem',
                    }}
                  >
                    Account Usage
                  </Typography>
                  <Chip 
                    label="Last 30 days" 
                    size="small" 
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
                
                {accountUsage.map((account, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {account.name}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {account.usage}%
                      </Typography>
                    </Box>
                    <OptimizedProgressBar 
                      variant="determinate" 
                      value={account.usage}
                      progressColor={account.color}
                    />
                  </Box>
                ))}
              </CardContent>
            </ChartCard>
          </Grid>
          
          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <ChartCard sx={{ 
              height: '100%',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.4s'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 3,
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '1.25rem',
                  }}
                >
                  Quick Actions
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <QuickActionCard onClick={() => onViewChange('accounts')}>
                    <Avatar sx={{ 
                      bgcolor: alpha('#007acc', 0.15), 
                      mb: 2, 
                      width: 64, 
                      height: 64,
                      border: '1px solid rgba(0, 122, 204, 0.2)',
                    }}>
                      <PersonIcon sx={{ fontSize: 32, color: '#007acc' }} />
                    </Avatar>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        mb: 1, 
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '1.1rem',
                      }}
                    >
                      Manage Accounts
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 2,
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.875rem',
                      }}
                    >
                      Add, edit, or remove Git accounts
                    </Typography>
                    <Button 
                      variant="contained" 
                      endIcon={<ArrowForwardIcon />}
                      size="small"
                      sx={{ 
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        background: 'linear-gradient(135deg, #007acc, #3399dd)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #005a9e, #007acc)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Go
                    </Button>
                  </QuickActionCard>
                  
                  <QuickActionCard onClick={() => onViewChange('project')}>
                    <Avatar sx={{ 
                      bgcolor: alpha('#4caf50', 0.15), 
                      mb: 2, 
                      width: 64, 
                      height: 64,
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                    }}>
                      <FolderIcon sx={{ fontSize: 32, color: '#4caf50' }} />
                    </Avatar>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        mb: 1, 
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '1.1rem',
                      }}
                    >
                      Switch Identity
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 2,
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.875rem',
                      }}
                    >
                      Change Git identity for current project
                    </Typography>
                    <Button 
                      variant="contained" 
                      endIcon={<ArrowForwardIcon />}
                      size="small"
                      sx={{ 
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        background: 'linear-gradient(135deg, #4caf50, #81c784)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #388e3c, #4caf50)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Go
                    </Button>
                  </QuickActionCard>
                </Box>
              </CardContent>
            </ChartCard>
          </Grid>
        </Grid>
        
        {/* Call to Action */}
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <FloatingButton
            startIcon={<AddIcon />}
            size="large"
            onClick={onAddAccount}
          >
            Add New Account
          </FloatingButton>
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;