import React from 'react';
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

const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  height: '100%',
  background: 'linear-gradient(145deg, #1e1e1e, #252525)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    '&::before': {
      opacity: 0.15,
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #007acc, #3399dd)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
}));

const QuickActionCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(4),
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'linear-gradient(145deg, #1e1e1e, #252525)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    backgroundColor: 'rgba(0, 122, 204, 0.1)',
  },
}));

const ChartCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  background: 'linear-gradient(145deg, #1e1e1e, #252525)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
  },
}));

const Dashboard: React.FC<{
  accounts: any[];
  projects: any[];
  onAddAccount: () => void;
  onViewChange: (view: string) => void;
}> = ({ accounts, projects, onAddAccount, onViewChange }) => {
  const activeAccounts = accounts.filter(acc => acc.isDefault !== false).length;
  const totalProjects = projects.length;
  
  // Mock data for charts
  const accountUsage = [
    { name: 'Work Account', usage: 65 },
    { name: 'Personal', usage: 35 },
    { name: 'Open Source', usage: 20 },
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 800, 
              mb: 1,
              background: 'linear-gradient(90deg, #007acc, #3399dd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with your Git accounts.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  transform: 'rotate(45deg)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha('#007acc', 0.2), 
                  mr: 2,
                  width: 56,
                  height: 56
                }}>
                  <PersonIcon sx={{ color: '#007acc', fontSize: '2rem' }} />
                </Avatar>
                <Box>
                  <Typography variant="h1" component="h3" sx={{ fontWeight: 800 }}>
                    {accounts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Accounts
                  </Typography>
                </Box>
              </Box>
              <Chip 
                icon={<TrendingUpIcon />} 
                label="+12% from last month" 
                size="small" 
                sx={{ 
                  bgcolor: alpha('#4caf50', 0.2),
                  color: '#4caf50',
                  fontWeight: 600
                }} 
              />
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha('#4caf50', 0.2), 
                  mr: 2,
                  width: 56,
                  height: 56
                }}>
                  <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '2rem' }} />
                </Avatar>
                <Box>
                  <Typography variant="h1" component="h3" sx={{ fontWeight: 800 }}>
                    {activeAccounts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Accounts
                  </Typography>
                </Box>
              </Box>
              <Chip 
                icon={<CheckCircleIcon />} 
                label="All active" 
                size="small" 
                sx={{ 
                  bgcolor: alpha('#4caf50', 0.2),
                  color: '#4caf50',
                  fontWeight: 600
                }} 
              />
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha('#2196f3', 0.2), 
                  mr: 2,
                  width: 56,
                  height: 56
                }}>
                  <FolderIcon sx={{ color: '#2196f3', fontSize: '2rem' }} />
                </Avatar>
                <Box>
                  <Typography variant="h1" component="h3" sx={{ fontWeight: 800 }}>
                    {totalProjects}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Projects
                  </Typography>
                </Box>
              </Box>
              <Chip 
                icon={<TrendingUpIcon />} 
                label="+5% from last week" 
                size="small" 
                sx={{ 
                  bgcolor: alpha('#4caf50', 0.2),
                  color: '#4caf50',
                  fontWeight: 600
                }} 
              />
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha('#ff9800', 0.2), 
                  mr: 2,
                  width: 56,
                  height: 56
                }}>
                  <BarChartIcon sx={{ color: '#ff9800', fontSize: '2rem' }} />
                </Avatar>
                <Box>
                  <Typography variant="h1" component="h3" sx={{ fontWeight: 800 }}>
                    87%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Efficiency
                  </Typography>
                </Box>
              </Box>
              <Chip 
                icon={<WarningIcon />} 
                label="Good performance" 
                size="small" 
                sx={{ 
                  bgcolor: alpha('#ff9800', 0.2),
                  color: '#ff9800',
                  fontWeight: 600
                }} 
              />
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <ChartCard>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h2" sx={{ fontWeight: 700 }}>Account Usage</Typography>
                <Chip label="Last 30 days" size="small" variant="outlined" />
              </Box>
              
              {accountUsage.map((account, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{account.name}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{account.usage}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={account.usage} 
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        bgcolor: index === 0 ? '#007acc' : index === 1 ? '#4caf50' : '#ff9800',
                        backgroundImage: index === 0 
                          ? 'linear-gradient(90deg, #007acc, #3399dd)' 
                          : index === 1 
                            ? 'linear-gradient(90deg, #4caf50, #81c784)' 
                            : 'linear-gradient(90deg, #ff9800, #ffc947)',
                      },
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </ChartCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <ChartCard sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>Quick Actions</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <QuickActionCard onClick={() => onViewChange('accounts')} sx={{ animation: `${pulse} 3s infinite` }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#007acc', 0.2), 
                    mb: 2, 
                    width: 64, 
                    height: 64,
                    '&:hover': {
                      bgcolor: alpha('#007acc', 0.3),
                    }
                  }}>
                    <PersonIcon sx={{ fontSize: 32, color: '#007acc' }} />
                  </Avatar>
                  <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>Manage Accounts</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add, edit, or remove Git accounts
                  </Typography>
                  <Button 
                    variant="contained" 
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      borderRadius: 6,
                      px: 3,
                      py: 1,
                      background: 'linear-gradient(90deg, #007acc, #3399dd)',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #005a9e, #007acc)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Go
                  </Button>
                </QuickActionCard>
                
                <QuickActionCard onClick={() => onViewChange('project')} sx={{ animation: `${pulse} 4s infinite` }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#4caf50', 0.2), 
                    mb: 2, 
                    width: 64, 
                    height: 64,
                    '&:hover': {
                      bgcolor: alpha('#4caf50', 0.3),
                    }
                  }}>
                    <FolderIcon sx={{ fontSize: 32, color: '#4caf50' }} />
                  </Avatar>
                  <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>Switch Identity</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Change Git identity for current project
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="success"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      borderRadius: 6,
                      px: 3,
                      py: 1,
                      '&:hover': {
                        transform: 'translateY(-2px)',
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
      
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          size="large"
          sx={{ 
            borderRadius: 12, 
            px: 5, 
            py: 2,
            background: 'linear-gradient(90deg, #007acc, #3399dd)',
            boxShadow: '0 6px 16px rgba(0, 122, 204, 0.4)',
            '&:hover': {
              background: 'linear-gradient(90deg, #005a9e, #007acc)',
              boxShadow: '0 8px 20px rgba(0, 122, 204, 0.6)',
              transform: 'translateY(-3px)',
            },
            transition: 'all 0.3s ease',
            fontWeight: 700,
            fontSize: '1.1rem'
          }}
          onClick={onAddAccount}
        >
          Add New Account
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;