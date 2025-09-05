import React, { useState, useEffect } from 'react';
import { UsageAnalytics, GitAccount, Project } from '@gitswitch/types';

// Material-UI imports
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
  Button,
  LinearProgress,
  Avatar,
  Chip,
  alpha,
  keyframes
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import BarChartIcon from '@mui/icons-material/BarChart';
import TimerIcon from '@mui/icons-material/Timer';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  height: '100%',
  background: 'linear-gradient(145deg, #1e1e1e, #252525)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  background: 'linear-gradient(145deg, #1e1e1e, #252525)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
  },
}));

const AccountUsageItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 12,
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: 'translateX(4px)',
  },
}));

const ProjectItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 12,
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: 'translateX(4px)',
  },
}));

const AccuracyCircle = styled(Box)(({ theme }) => ({
  width: 100,
  height: 100,
  borderRadius: '50%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(145deg, #1e1e1e, #252525)',
  border: '4px solid #007acc',
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: '50%',
    background: 'conic-gradient(#007acc 70%, rgba(0, 122, 204, 0.2) 70% 100%)',
    zIndex: -1,
  },
}));

interface AnalyticsProps {
  accounts: GitAccount[];
}

const Analytics: React.FC<AnalyticsProps> = ({ accounts }) => {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.invoke({
        type: 'GET_ANALYTICS',
        payload: null
      });
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getMostUsedAccount = () => {
    if (!analytics || Object.keys(analytics.accountUsage).length === 0) {
      return null;
    }
    
    const maxUsage = Math.max(...Object.values(analytics.accountUsage));
    const accountId = Object.keys(analytics.accountUsage).find(
      id => analytics.accountUsage[id] === maxUsage
    );
    
    return accounts.find(acc => acc.id === accountId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          bgcolor: alpha('#007acc', 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          animation: `${float} 3s ease-in-out infinite`
        }}>
          <CircularProgress size={40} sx={{ color: '#007acc' }} />
        </Box>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
          Loading Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Crunching your GitSwitch data...
        </Typography>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Box sx={{ 
          width: 100, 
          height: 100, 
          borderRadius: '50%', 
          bgcolor: alpha('#007acc', 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          animation: `${float} 4s ease-in-out infinite`
        }}>
          <BarChartIcon sx={{ fontSize: 50, color: '#007acc' }} />
        </Box>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
          No Analytics Data
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
          Start using GitSwitch to see usage statistics and insights about your Git workflow!
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={loadAnalytics}
          sx={{ 
            borderRadius: 12,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(90deg, #007acc, #3399dd)',
            boxShadow: '0 4px 12px rgba(0, 122, 204, 0.3)',
            '&:hover': {
              background: 'linear-gradient(90deg, #005a9e, #007acc)',
              boxShadow: '0 6px 16px rgba(0, 122, 204, 0.4)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          Refresh Data
        </Button>
      </Box>
    );
  }

  const mostUsedAccount = getMostUsedAccount();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
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
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Insights into your Git workflow and account usage
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Overview Cards */}
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Typography variant="h2" sx={{ mb: 3, fontWeight: 700 }}>Overview</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: alpha('#007acc', 0.2), 
                        width: 56, 
                        height: 56, 
                        mx: 'auto', 
                        mb: 1.5 
                      }}>
                        <FolderIcon sx={{ color: '#007acc', fontSize: '2rem' }} />
                      </Avatar>
                      <Typography variant="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {analytics.totalProjects}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Projects
                      </Typography>
                    </CardContent>
                  </StatCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: alpha('#4caf50', 0.2), 
                        width: 56, 
                        height: 56, 
                        mx: 'auto', 
                        mb: 1.5 
                      }}>
                        <PersonIcon sx={{ color: '#4caf50', fontSize: '2rem' }} />
                      </Avatar>
                      <Typography variant="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {analytics.totalAccounts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Accounts
                      </Typography>
                    </CardContent>
                  </StatCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: alpha('#ff9800', 0.2), 
                        width: 56, 
                        height: 56, 
                        mx: 'auto', 
                        mb: 1.5 
                      }}>
                        <RefreshIcon sx={{ color: '#ff9800', fontSize: '2rem' }} />
                      </Avatar>
                      <Typography variant="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {analytics.projectSwitches}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Switches
                      </Typography>
                    </CardContent>
                  </StatCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: alpha('#2196f3', 0.2), 
                        width: 56, 
                        height: 56, 
                        mx: 'auto', 
                        mb: 1.5 
                      }}>
                        <CheckCircleIcon sx={{ color: '#2196f3', fontSize: '2rem' }} />
                      </Avatar>
                      <Typography variant="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {analytics.errorsPrevented}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Errors Prevented
                      </Typography>
                    </CardContent>
                  </StatCard>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Time Saved and Pattern Accuracy */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h2" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                <TimerIcon sx={{ mr: 1, color: '#4caf50' }} /> Time Saved
              </Typography>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%', 
                  bgcolor: alpha('#4caf50', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                }}>
                  <Typography variant="h1" sx={{ fontWeight: 800, color: '#4caf50' }}>
                    {formatTime(analytics.timesSaved)}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  Estimated time saved from automated switching and error prevention
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h2" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1, color: '#007acc' }} /> Smart Suggestions
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                <AccuracyCircle>
                  <Typography variant="h1" sx={{ fontWeight: 800, color: '#007acc' }}>
                    {Math.round(analytics.patternAccuracy * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Accuracy
                  </Typography>
                </AccuracyCircle>
                <Box sx={{ ml: 4, maxWidth: 200 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    How often our smart suggestions match your choices
                  </Typography>
                  <Chip 
                    label="AI-Powered" 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Account Usage */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h2" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: '#ff9800' }} /> Account Usage
              </Typography>
              {Object.keys(analytics.accountUsage).length > 0 ? (
                <Box>
                  {Object.entries(analytics.accountUsage).map(([accountId, usage]) => {
                    const account = accounts.find(acc => acc.id === accountId);
                    if (!account) return null;
                    
                    const percentage = analytics.projectSwitches > 0 
                      ? Math.round((usage / analytics.projectSwitches) * 100)
                      : 0;
                    
                    return (
                      <AccountUsageItem key={accountId}>
                        <Avatar sx={{ 
                          bgcolor: account.color || '#007acc', 
                          width: 48, 
                          height: 48,
                          fontSize: '1rem',
                          fontWeight: 700
                        }}>
                          {account.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {account.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {account.email}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={percentage} 
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    bgcolor: account.color || '#007acc',
                                  },
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 60 }}>
                              {usage} ({percentage}%)
                            </Typography>
                          </Box>
                        </Box>
                      </AccountUsageItem>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No account usage data yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Top Projects and Most Used Account */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h2" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                    <FolderIcon sx={{ mr: 1, color: '#2196f3' }} /> Top Projects
                  </Typography>
                  {analytics.topProjects.length > 0 ? (
                    <Box>
                      {analytics.topProjects.slice(0, 3).map((project, index) => (
                        <ProjectItem key={project.id}>
                          <Avatar sx={{ 
                            bgcolor: alpha('#2196f3', 0.2), 
                            width: 40, 
                            height: 40,
                            fontWeight: 700
                          }}>
                            #{index + 1}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {project.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-all' }}>
                              {project.path}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Last accessed: {new Date(project.lastAccessed).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </ProjectItem>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No project data yet
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>
            
            {mostUsedAccount && (
              <Grid item xs={12}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h2" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                      <StarIcon sx={{ mr: 1, color: '#ffeb3b' }} /> Most Used Account
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(255, 235, 59, 0.1)', borderRadius: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: mostUsedAccount.color || '#ffeb3b', 
                        width: 64, 
                        height: 64,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(255, 235, 59, 0.3)'
                      }}>
                        {mostUsedAccount.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {mostUsedAccount.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {mostUsedAccount.email}
                        </Typography>
                        <Chip 
                          label={`${analytics.accountUsage[mostUsedAccount.id]} switches`} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#ffeb3b', 0.2),
                            color: '#ffeb3b',
                            fontWeight: 700
                          }} 
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={loadAnalytics}
          sx={{ 
            borderRadius: 12,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(90deg, #007acc, #3399dd)',
            boxShadow: '0 4px 12px rgba(0, 122, 204, 0.3)',
            '&:hover': {
              background: 'linear-gradient(90deg, #005a9e, #007acc)',
              boxShadow: '0 6px 16px rgba(0, 122, 204, 0.4)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          Refresh Analytics
        </Button>
      </Box>
    </Box>
  );
};

export default Analytics;