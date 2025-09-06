import React, { useState, useEffect } from 'react';
import { GitAccount } from '@gitswitch/types';

// Material-UI imports
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Chip,
  Avatar,
  Divider,
  Fab,
  Tooltip,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  alpha,
  Paper,
  Skeleton
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CloudIcon from '@mui/icons-material/Cloud';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';

// Keyframes for animations
const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
`;

const slideInUp = keyframes`
  0% { 
    transform: translateY(30px);
    opacity: 0;
  }
  100% { 
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulseGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 4px 16px rgba(0, 122, 204, 0.3);
  }
  50% { 
    box-shadow: 0 8px 24px rgba(0, 122, 204, 0.5);
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
    radial-gradient(circle at 15% 25%, rgba(0, 122, 204, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 85% 75%, rgba(76, 175, 80, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 50% 10%, rgba(255, 152, 0, 0.05) 0%, transparent 50%),
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

// Enhanced Glass Card for Accounts
const GlassCard = styled(Card)(({ theme }) => ({
  ...glassBaseStyles,
  borderRadius: 20,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    background: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

// OAuth Provider Button
const OAuthButton = styled(Button)<{ provider: string }>(({ theme, provider }) => {
  const providerColors = {
    github: { bg: '#24292e', hover: '#1a1e22' },
    gitlab: { bg: '#fc6d26', hover: '#e85d1f' },
    bitbucket: { bg: '#0052cc', hover: '#004bb3' },
    azure: { bg: '#0078d4', hover: '#106ebe' }
  };

  const colors = providerColors[provider as keyof typeof providerColors] || providerColors.github;

  return {
    ...glassBaseStyles,
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: '12px 20px',
    textTransform: 'none',
    fontWeight: 600,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform',
    '&:hover': {
      backgroundColor: colors.hover,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 20px ${alpha(colors.bg, 0.4)}`,
    },
    '&:disabled': {
      backgroundColor: alpha(colors.bg, 0.5),
      transform: 'none',
    },
  };
});

// Floating Action Button
const FloatingFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  background: 'linear-gradient(135deg, #007acc 0%, #3399dd 100%)',
  boxShadow: '0 8px 20px rgba(0, 122, 204, 0.4)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: `${pulseGlow} 3s ease-in-out infinite`,
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-3px) scale(1.1)',
    background: 'linear-gradient(135deg, #005a9e 0%, #007acc 100%)',
    boxShadow: '0 12px 30px rgba(0, 122, 204, 0.6)',
  },
}));

// Enhanced Dialog
const GlassDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    ...glassBaseStyles,
    borderRadius: 20,
    background: 'rgba(30, 30, 30, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
}));

// Empty State Container
const EmptyStateContainer = styled(Box)(({ theme }) => ({
  ...glassBaseStyles,
  borderRadius: 20,
  padding: theme.spacing(8),
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  minHeight: '400px',
  justifyContent: 'center',
}));

interface AccountManagerProps {
  accounts: GitAccount[];
  onAccountAdded: (account: GitAccount) => void;
  onAccountUpdated: (account: GitAccount) => void;
  onAccountDeleted: (accountId: string) => void;
}

interface AccountFormData {
  name: string;
  email: string;
  gitName: string;
  description: string;
  isDefault: boolean;
  priority: number;
  color: string;
}

const AccountManager: React.FC<AccountManagerProps> = ({
  accounts,
  onAccountAdded,
  onAccountUpdated,
  onAccountDeleted
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<GitAccount | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    email: '',
    gitName: '',
    description: '',
    isDefault: false,
    priority: 5,
    color: '#007acc'
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      gitName: '',
      description: '',
      isDefault: false,
      priority: 5,
      color: '#007acc'
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleAddAccount = () => {
    setFormData({
      name: '',
      email: '',
      gitName: '',
      description: '',
      isDefault: false,
      priority: 5,
      color: '#007acc'
    });
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleOAuthLogin = async (provider: 'github' | 'gitlab' | 'bitbucket' | 'azure') => {
    try {
      setOauthLoading(provider);
      
      if (provider === 'github') {
        const confirmDialog = window.confirm(
          `GitHub Authentication Process:\n\n` +
          `✨ We'll use GitHub's secure device flow:\n` +
          `1. We'll show you a device code\n` +
          `2. GitHub will open in your browser\n` +
          `3. Enter the device code on GitHub\n` +
          `4. Authorize GitSwitch\n\n` +
          `Ready to start?`
        );
        
        if (!confirmDialog) {
          setOauthLoading(null);
          return;
        }
      }
      
      // Mock OAuth response for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAccount: GitAccount = {
        id: Date.now().toString(),
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        email: `user@${provider}.com`,
        gitName: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        description: `Connected via ${provider}`,
        isDefault: accounts.length === 0,
        priority: 5,
        color: provider === 'github' ? '#24292e' : provider === 'gitlab' ? '#fc6d26' : provider === 'bitbucket' ? '#0052cc' : '#0078d4',
        patterns: [],
        usageCount: 0,
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      onAccountAdded(mockAccount);
      setShowForm(false);
      
    } catch (error) {
      alert('Failed to authenticate: ' + error);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleEditAccount = (account: GitAccount) => {
    setFormData({
      name: account.name,
      email: account.email,
      gitName: account.gitName,
      description: account.description || '',
      isDefault: account.isDefault,
      priority: account.priority || 5,
      color: account.color || '#007acc'
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      onAccountDeleted(accountId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.gitName) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingAccount) {
      const updatedAccount: GitAccount = {
        ...editingAccount,
        name: formData.name,
        email: formData.email,
        gitName: formData.gitName,
        description: formData.description || undefined,
        isDefault: formData.isDefault,
        priority: formData.priority,
        color: formData.color,
        updatedAt: new Date()
      };
      onAccountUpdated(updatedAccount);
    } else {
      const newAccount: GitAccount = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        gitName: formData.gitName,
        description: formData.description || undefined,
        isDefault: formData.isDefault,
        priority: formData.priority,
        color: formData.color,
        patterns: [],
        usageCount: 0,
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      onAccountAdded(newAccount);
    }
    resetForm();
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
                background: 'linear-gradient(135deg, #007acc 0%, #3399dd 50%, #4caf50 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Account Manager
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
              }}
            >
              Manage your Git accounts and credentials
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh Accounts">
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
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddAccount}
              sx={{ 
                borderRadius: 3,
                px: 3,
                py: 1.5,
                background: 'linear-gradient(135deg, #007acc, #3399dd)',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #005a9e, #007acc)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Add Account
            </Button>
          </Box>
        </Box>

        {accounts.length === 0 ? (
          <EmptyStateContainer sx={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.2s'
          }}>
            <Avatar sx={{ 
              width: 120, 
              height: 120, 
              bgcolor: alpha('#007acc', 0.15),
              border: '3px solid rgba(0, 122, 204, 0.3)',
              animation: `${subtleFloat} 4s ease-in-out infinite`,
            }}>
              <SecurityIcon sx={{ fontSize: 60, color: '#007acc' }} />
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
                No accounts configured
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 4,
                  maxWidth: 500,
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                Get started by adding your first Git account. You can connect via OAuth or add accounts manually.
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddAccount}
              size="large"
              sx={{ 
                borderRadius: 4,
                px: 5,
                py: 2,
                background: 'linear-gradient(135deg, #007acc, #3399dd)',
                boxShadow: '0 8px 24px rgba(0, 122, 204, 0.4)',
                fontWeight: 700,
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #005a9e, #007acc)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 32px rgba(0, 122, 204, 0.6)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Add Your First Account
            </Button>
          </EmptyStateContainer>
        ) : (
          <>
            {/* Summary Alert */}
            <Alert 
              severity="info" 
              sx={{ 
                mb: 4,
                ...glassBaseStyles,
                borderRadius: 3,
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.2)',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: '0.1s'
              }}
              icon={<TrendingUpIcon />}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>Account Management</AlertTitle>
              You have {accounts.length} account{accounts.length !== 1 ? 's' : ''} configured. 
              {' '}{accounts.filter(acc => acc.isDefault).length} account{accounts.filter(acc => acc.isDefault).length !== 1 ? 's are' : ' is'} currently set as default.
            </Alert>
            
            {/* Accounts Grid */}
            <Grid container spacing={3}>
              {accounts.map((account, index) => (
                <Grid item xs={12} sm={6} lg={4} key={account.id}>
                  <GlassCard sx={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: `${0.2 + index * 0.1}s`,
                    animation: `${slideInUp} 0.6s ease-out`,
                    animationDelay: `${0.2 + index * 0.1}s`,
                    animationFillMode: 'backwards',
                  }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: account.color || '#007acc', 
                              mr: 2,
                              width: 64,
                              height: 64,
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              border: `2px solid ${alpha(account.color || '#007acc', 0.3)}`,
                              boxShadow: `0 4px 12px ${alpha(account.color || '#007acc', 0.3)}`,
                            }}
                          >
                            {account.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {account.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {account.isDefault && (
                                <Chip 
                                  icon={<StarIcon />}
                                  label="Default" 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined" 
                                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                />
                              )}
                              <Chip 
                                label="Active" 
                                size="small" 
                                color="success" 
                                variant="outlined" 
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmailIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {account.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PersonIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {account.gitName}
                          </Typography>
                        </Box>
                        {account.description && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DescriptionIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {account.description}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          label={`Usage: ${account.usageCount || 0}`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                        <Chip 
                          label={`Priority: ${account.priority || 5}`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                        {account.lastUsed && (
                          <Chip 
                            label={`Last: ${new Date(account.lastUsed).toLocaleDateString()}`} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleEditAccount(account)}
                        sx={{ 
                          borderRadius: 2,
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: alpha('#007acc', 0.1)
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteAccount(account.id)}
                        color="error"
                        sx={{ 
                          borderRadius: 2,
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: alpha('#f44336', 0.1)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Floating Action Button */}
        <FloatingFab 
          color="primary" 
          onClick={handleAddAccount}
          aria-label="add account"
        >
          <AddIcon />
        </FloatingFab>

        {/* Dialog */}
        <GlassDialog 
          open={showForm} 
          onClose={resetForm}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </Typography>
              <IconButton 
                onClick={resetForm}
                sx={{ 
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'rotate(90deg)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers sx={{ pt: 2 }}>
            {!editingAccount && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                  Connect your Git provider account
                </Typography>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    background: 'rgba(33, 150, 243, 0.1)',
                    border: '1px solid rgba(33, 150, 243, 0.2)'
                  }}
                >
                  <AlertTitle>OAuth Connection</AlertTitle>
                  Connect your account securely with one-click authentication. No passwords required.
                </Alert>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {[
                    { provider: 'github', icon: GitHubIcon, label: 'Connect GitHub' },
                    { provider: 'gitlab', icon: StorageIcon, label: 'GitLab' },
                    { provider: 'bitbucket', icon: AccountTreeIcon, label: 'Bitbucket' },
                    { provider: 'azure', icon: CloudIcon, label: 'Azure DevOps' }
                  ].map(({ provider, icon: Icon, label }) => (
                    <Grid item xs={12} sm={6} key={provider}>
                      <OAuthButton
                        fullWidth
                        provider={provider}
                        startIcon={<Icon />}
                        onClick={() => handleOAuthLogin(provider as any)}
                        disabled={oauthLoading !== null}
                      >
                        {oauthLoading === provider ? 'Connecting...' : label}
                      </OAuthButton>
                    </Grid>
                  ))}
                </Grid>
                
                <Divider sx={{ my: 3 }}>
                  <Chip label="OR" size="small" variant="outlined" />
                </Divider>
              </Box>
            )}
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Display Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., John Developer"
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g., john@company.com"
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Git Name *"
                    value={formData.gitName}
                    onChange={(e) => setFormData({...formData, gitName: e.target.value})}
                    placeholder="e.g., John Developer"
                    required
                    variant="outlined"
                    helperText="This will be used as git user.name"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g., Work Account, Personal"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <MenuItem key={num} value={num}>Level {num}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isDefault}
                          onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StarIcon sx={{ mr: 1, fontSize: '1rem' }} />
                          <span>Default Account</span>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={resetForm} 
              color="secondary" 
              sx={{ 
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit as any}
              variant="contained"
              color="primary"
              sx={{ 
                borderRadius: 2,
                px: 4,
                background: 'linear-gradient(135deg, #007acc, #3399dd)',
                boxShadow: '0 4px 12px rgba(0, 122, 204, 0.3)',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #005a9e, #007acc)',
                  boxShadow: '0 6px 16px rgba(0, 122, 204, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              {editingAccount ? 'Update Account' : 'Add Account'}
            </Button>
          </DialogActions>
        </GlassDialog>
      </Box>
    </>
  );
};

export default AccountManager;