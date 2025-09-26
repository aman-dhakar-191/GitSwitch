import React, { useState, useEffect } from 'react';
import { GitAccount } from '@gitswitch/types';

// Material-UI imports
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Chip,
  Avatar,
  Alert,
  AlertTitle,
  alpha,
  CircularProgress
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Icons
import GitHubIcon from '@mui/icons-material/GitHub';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';

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

// GitHub Login Button
const GitHubButton = styled(Button)(({ theme }) => ({
  ...glassBaseStyles,
  backgroundColor: '#24292e',
  borderRadius: 16,
  padding: '16px 24px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1.1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  '&:hover': {
    backgroundColor: '#1a1e22',
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 20px ${alpha('#24292e', 0.4)}`,
  },
  '&:disabled': {
    backgroundColor: alpha('#24292e', 0.5),
    transform: 'none',
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

const AccountManager: React.FC<AccountManagerProps> = ({
  accounts,
  onAccountAdded,
  onAccountUpdated,
  onAccountDeleted
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGitHubLogin, setShowGitHubLogin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Listen for OAuth results from main process
  useEffect(() => {
    const handleOAuthSuccess = (event: any, account: GitAccount) => {
      console.log('✅ OAuth success received:', account);
      setIsConnecting(false);
      onAccountAdded(account);
      alert(`Successfully connected GitHub account: ${account.name || account.email}`);
    };

    const handleOAuthResult = (event: any, result: { success: boolean; message: string }) => {
      console.log('🔔 OAuth result received:', result);
      setIsConnecting(false);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    };

    // Register event listeners
    if ((window as any).electronAPI?.on) {
      (window as any).electronAPI.on('oauth-success', handleOAuthSuccess);
      (window as any).electronAPI.on('oauth-result', handleOAuthResult);
    }

    // Cleanup
    return () => {
      if ((window as any).electronAPI?.removeListener) {
        (window as any).electronAPI.removeListener('oauth-success', handleOAuthSuccess);
        (window as any).electronAPI.removeListener('oauth-result', handleOAuthResult);
      }
    };
  }, [onAccountAdded]);

  const handleGitHubLogin = async () => {
    try {
      setIsConnecting(true);
      
      // Show user the GitHub authentication process
      const confirmDialog = window.confirm(
        `GitHub Authentication Process:\n\n` +
        `🌐 Secure Browser Authentication:\n` +
        `1. GitHub will open in your browser\n` +
        `2. Sign in with your GitHub account\n` +
        `3. Authorize GitSwitch\n` +
        `4. Return to the app automatically\n\n` +
        `Your credentials will be stored securely using system encryption.\n\n` +
        `Ready to start?`
      );
      
      if (!confirmDialog) {
        setIsConnecting(false);
        return;
      }

      // Start the redirect flow
      const response = await (window as any).electronAPI.invoke({
        type: 'GITHUB_START_REDIRECT_FLOW',
        payload: null
      });

      if (response.success) {
        // Browser opened, user will complete auth there
        // The app will receive the callback via custom protocol
        alert('Browser opened for GitHub authentication. Complete the process in your browser.');
      } else {
        alert(`Failed to start GitHub authentication: ${response.error || 'Unknown error'}`);
        setIsConnecting(false);
      }
      
    } catch (error: any) {
      alert(`Failed to authenticate with GitHub: ${error.message}`);
      setIsConnecting(false);
    }
    // Note: Don't reset isConnecting here - it will be reset when we get the protocol callback
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to remove this GitHub account? This will also revoke access tokens.')) {
      try {
        // Call IPC to revoke token and delete account
        const response = await (window as any).electronAPI.invoke({
          type: 'DELETE_GITHUB_ACCOUNT',
          payload: { accountId }
        });

        if (response.success) {
          onAccountDeleted(accountId);
        } else {
          alert(`Failed to delete account: ${response.error}`);
        }
      } catch (error: any) {
        alert(`Error deleting account: ${error.message}`);
      }
    }
  };

  const githubAccounts = accounts.filter(account => 
    account.email?.includes('github') || 
    account.description?.toLowerCase().includes('github') ||
    (account as any).oauthProvider === 'github'
  );

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
              GitHub Accounts
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
              }}
            >
              Connect your GitHub account for secure git identity management
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<GitHubIcon />}
              onClick={() => setShowGitHubLogin(true)}
              sx={{ 
                borderRadius: 3,
                px: 3,
                py: 1.5,
                background: '#24292e',
                fontWeight: 600,
                '&:hover': {
                  background: '#1a1e22',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Connect GitHub
            </Button>
          </Box>
        </Box>

        {githubAccounts.length === 0 ? (
          <EmptyStateContainer sx={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.2s'
          }}>
            <Avatar sx={{ 
              width: 120, 
              height: 120, 
              bgcolor: '#24292e',
              border: '3px solid rgba(36, 41, 46, 0.3)',
              animation: `${subtleFloat} 4s ease-in-out infinite`,
            }}>
              <GitHubIcon sx={{ fontSize: 60, color: 'white' }} />
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
                No GitHub account connected
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
                Connect your GitHub account to automatically use the correct git identity for your repositories. 
                GitSwitch will securely store your credentials and automatically switch between accounts based on your projects.
              </Typography>
            </Box>
            
            <GitHubButton 
              startIcon={<GitHubIcon />}
              onClick={() => setShowGitHubLogin(true)}
              size="large"
              sx={{ 
                px: 5,
                py: 2,
                boxShadow: '0 8px 24px rgba(36, 41, 46, 0.4)',
                fontSize: '1.1rem',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 32px rgba(36, 41, 46, 0.6)',
                },
              }}
            >
              Connect GitHub Account
            </GitHubButton>
          </EmptyStateContainer>
        ) : (
          <>
            {/* Info Alert */}
            <Alert 
              severity="success" 
              sx={{ 
                mb: 4,
                ...glassBaseStyles,
                borderRadius: 3,
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: '0.1s'
              }}
              icon={<CheckCircleIcon />}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>GitHub Connected</AlertTitle>
              You have {githubAccounts.length} GitHub account{githubAccounts.length !== 1 ? 's' : ''} connected. 
              GitSwitch will automatically use the appropriate identity for GitHub repositories.
            </Alert>
            
            {/* Accounts Grid */}
            <Grid container spacing={3}>
              {githubAccounts.map((account, index) => (
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
                              bgcolor: '#24292e', 
                              mr: 2,
                              width: 64,
                              height: 64,
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              border: '2px solid rgba(36, 41, 46, 0.3)',
                              boxShadow: '0 4px 12px rgba(36, 41, 46, 0.3)',
                            }}
                          >
                            <GitHubIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {account.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                icon={<GitHubIcon />}
                                label="GitHub" 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                              <Chip 
                                label="Connected" 
                                size="small" 
                                color="success" 
                                variant="outlined" 
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                            </Box>
                          </Box>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteAccount(account.id)}
                          color="error"
                          size="small"
                          sx={{ 
                            '&:hover': {
                              backgroundColor: alpha('#f44336', 0.1)
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SecurityIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Securely stored with system encryption
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          label={`Usage: ${account.usageCount || 0}`} 
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
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
            
            {/* Add Another Account Button */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <GitHubButton
                startIcon={<GitHubIcon />}
                onClick={() => setShowGitHubLogin(true)}
                sx={{ fontSize: '1rem' }}
              >
                Add Another GitHub Account
              </GitHubButton>
            </Box>
          </>
        )}

        {/* GitHub Login Dialog */}
        <GlassDialog 
          open={showGitHubLogin} 
          onClose={() => !isConnecting && setShowGitHubLogin(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GitHubIcon sx={{ mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  Connect GitHub Account
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setShowGitHubLogin(false)}
                disabled={isConnecting}
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
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.2)'
              }}
            >
              <AlertTitle>Secure Authentication</AlertTitle>
              We use GitHub's device flow for secure authentication. No passwords are stored - only encrypted access tokens using your system's secure storage.
            </Alert>

            <Box sx={{ textAlign: 'center', py: 4 }}>
              <GitHubButton
                fullWidth
                startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <GitHubIcon />}
                onClick={handleGitHubLogin}
                disabled={isConnecting}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  animation: isConnecting ? 'none' : `${pulseGlow} 2s ease-in-out infinite`,
                }}
              >
                {isConnecting ? 'Connecting to GitHub...' : 'Connect with GitHub'}
              </GitHubButton>
            </Box>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ textAlign: 'center', mt: 2 }}
            >
              By connecting, you agree to GitHub's terms of service and allow GitSwitch to manage your git identity for repositories.
            </Typography>
          </DialogContent>
        </GlassDialog>
      </Box>
    </>
  );
};

export default AccountManager;