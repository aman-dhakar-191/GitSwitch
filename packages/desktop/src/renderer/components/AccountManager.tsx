import React, { useState } from 'react';
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
  keyframes
} from '@mui/material';
import { styled } from '@mui/material/styles';

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

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'linear-gradient(145deg, #1e1e1e, #252525)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(5),
  right: theme.spacing(5),
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
  background: 'linear-gradient(135deg, #007acc 0%, #3399dd 100%)',
  '&:hover': {
    boxShadow: '0 12px 25px rgba(0, 0, 0, 0.4)',
    background: 'linear-gradient(135deg, #005a9e 0%, #007acc 100%)',
    transform: 'translateY(-3px)',
  },
  animation: `${float} 3s ease-in-out infinite`,
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
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<GitAccount | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [deviceCodeInfo, setDeviceCodeInfo] = useState<{code: string, url: string} | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    email: '',
    gitName: '',
    description: '',
    isDefault: false,
    priority: 5,
    color: '#007acc'
  });

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
      
      // Show different message for GitHub device flow
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
      
      const response = await window.electronAPI.invoke({
        type: 'START_OAUTH_FLOW',
        payload: { provider }
      });
      
      if (response.success && response.data) {
        onAccountAdded(response.data);
        setShowForm(false);
        setDeviceCodeInfo(null);
        
        const account = response.data;
        alert(`✅ Successfully connected!\n\nAccount: ${account.name}\nEmail: ${account.email}\nProvider: ${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
      } else {
        const errorMsg = response.error || 'Unknown error';
        
        let userFriendlyError = errorMsg;
        if (errorMsg.includes('not configured')) {
          userFriendlyError = `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not configured. Please contact support or use manual account creation.`;
        } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          userFriendlyError = 'Authentication timed out. Please try again and make sure to complete the authorization on GitHub.';
        } else if (errorMsg.includes('access_denied') || errorMsg.includes('cancelled')) {
          userFriendlyError = 'You cancelled the authentication. Please try again if you want to connect your account.';
        } else if (errorMsg.includes('authorization_pending')) {
          userFriendlyError = 'Please complete the authorization on GitHub and try again.';
        }
        
        alert('❌ Authentication failed: ' + userFriendlyError);
        setDeviceCodeInfo(null);
      }
    } catch (error) {
      alert('Failed to authenticate: ' + error);
      setDeviceCodeInfo(null);
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
      try {
        const response = await window.electronAPI.invoke({
          type: 'DELETE_ACCOUNT',
          payload: { id: accountId }
        });
        
        if (response.success) {
          onAccountDeleted(accountId);
        } else {
          alert('Failed to delete account: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Failed to delete account: ' + error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.gitName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingAccount) {
        const response = await window.electronAPI.invoke({
          type: 'UPDATE_ACCOUNT',
          payload: {
            id: editingAccount.id,
            account: {
              name: formData.name,
              email: formData.email,
              gitName: formData.gitName,
              description: formData.description || undefined,
              isDefault: formData.isDefault,
              priority: formData.priority,
              color: formData.color
            }
          }
        });
        
        if (response.success) {
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
          resetForm();
        } else {
          alert('Failed to update account: ' + (response.error || 'Unknown error'));
        }
      } else {
        const accountData = {
          name: formData.name,
          email: formData.email,
          gitName: formData.gitName,
          description: formData.description || undefined,
          isDefault: formData.isDefault,
          priority: formData.priority,
          color: formData.color,
          patterns: [],
          usageCount: 0,
          lastUsed: new Date()
        };
        
        const response = await window.electronAPI.invoke({
          type: 'ADD_ACCOUNT',
          payload: {
            account: accountData
          }
        });
        
        if (response.success && response.data) {
          onAccountAdded(response.data);
          resetForm();
        } else {
          alert('Failed to add account: ' + (response.error || 'Unknown error'));
        }
      }
    } catch (error) {
      alert('Failed to save account: ' + error);
    }
  };

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
            Account Manager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your Git accounts and credentials
          </Typography>
        </Box>
        <Tooltip title="Add Account">
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddAccount}
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
            Add Account
          </Button>
        </Tooltip>
      </Box>

      {accounts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box sx={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            bgcolor: alpha('#007acc', 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: `${float} 4s ease-in-out infinite`
          }}>
            <SecurityIcon sx={{ fontSize: 60, color: '#007acc' }} />
          </Box>
          <Typography variant="h2" sx={{ mb: 2, fontWeight: 700 }}>No accounts configured</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Get started by adding your first Git account. You can connect via OAuth or add accounts manually.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddAccount}
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
          >
            Add Your First Account
          </Button>
        </Box>
      ) : (
        <>
          <Alert 
            severity="info" 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              background: 'linear-gradient(145deg, #1e1e1e, #252525)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
            icon={<TrendingUpIcon />}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>Account Management</AlertTitle>
            You have {accounts.length} account{accounts.length !== 1 ? 's' : ''} configured. 
            {accounts.filter(acc => acc.isDefault).length} account{accounts.filter(acc => acc.isDefault).length !== 1 ? 's are' : ' is'} currently set as default.
          </Alert>
          
          <Grid container spacing={3}>
            {accounts.map(account => (
              <Grid item xs={12} sm={6} md={4} key={account.id}>
                <StyledCard>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: account.color || '#007acc', 
                            mr: 2,
                            width: 64,
                            height: 64,
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          {account.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h3" component="h3" sx={{ fontWeight: 700 }}>
                            {account.name}
                          </Typography>
                          {account.isDefault && (
                            <Chip 
                              icon={<StarIcon />}
                              label="Default" 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                              sx={{ mt: 0.5, fontWeight: 700 }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Chip 
                        label={account.isDefault ? 'Default' : 'Active'} 
                        size="small" 
                        color={account.isDefault ? 'primary' : 'success'} 
                        variant="outlined" 
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ mr: 1, fontSize: '1rem' }} /> {account.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, fontSize: '1rem' }} /> {account.gitName}
                      </Typography>
                      {account.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <DescriptionIcon sx={{ mr: 1, fontSize: '1rem' }} /> {account.description}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip 
                        label={`Usage: ${account.usageCount || 0}`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip 
                        label={`Priority: ${account.priority || 5}`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontWeight: 600 }}
                      />
                      {account.lastUsed && (
                        <Chip 
                          label={`Last used: ${new Date(account.lastUsed).toLocaleDateString()}`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 600 }}
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
                        borderRadius: 6,
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
                        borderRadius: 6,
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: alpha('#f44336', 0.1)
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <StyledFab 
        color="primary" 
        onClick={handleAddAccount}
        aria-label="add account"
      >
        <AddIcon />
      </StyledFab>

      <Dialog 
        open={showForm} 
        onClose={resetForm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 15px 50px rgba(0, 0, 0, 0.4)',
            background: 'linear-gradient(145deg, #1e1e1e, #252525)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 700 }}>
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </Typography>
            <IconButton onClick={resetForm}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ pt: 1 }}>
          {!editingAccount && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>Connect your Git provider account</Typography>
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
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<GitHubIcon />}
                    onClick={() => handleOAuthLogin('github')}
                    disabled={oauthLoading !== null}
                    sx={{ 
                      bgcolor: '#24292e',
                      textTransform: 'none',
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(36, 41, 46, 0.3)',
                      '&:hover': {
                        bgcolor: '#1a1e22',
                        boxShadow: '0 6px 16px rgba(36, 41, 46, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {oauthLoading === 'github' ? 'Connecting...' : 'Connect GitHub'}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<StorageIcon />}
                    onClick={() => handleOAuthLogin('gitlab')}
                    disabled={oauthLoading !== null}
                    sx={{ 
                      bgcolor: '#fc6d26',
                      textTransform: 'none',
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(252, 109, 38, 0.3)',
                      '&:hover': {
                        bgcolor: '#e85d1f',
                        boxShadow: '0 6px 16px rgba(252, 109, 38, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {oauthLoading === 'gitlab' ? 'Connecting...' : 'GitLab'}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AccountTreeIcon />}
                    onClick={() => handleOAuthLogin('bitbucket')}
                    disabled={oauthLoading !== null}
                    sx={{ 
                      bgcolor: '#0052cc',
                      textTransform: 'none',
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)',
                      '&:hover': {
                        bgcolor: '#004bb3',
                        boxShadow: '0 6px 16px rgba(0, 82, 204, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {oauthLoading === 'bitbucket' ? 'Connecting...' : 'Bitbucket'}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CloudIcon />}
                    onClick={() => handleOAuthLogin('azure')}
                    disabled={oauthLoading !== null}
                    sx={{ 
                      bgcolor: '#0078d4',
                      textTransform: 'none',
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0, 120, 212, 0.3)',
                      '&:hover': {
                        bgcolor: '#106ebe',
                        boxShadow: '0 6px 16px rgba(0, 120, 212, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {oauthLoading === 'azure' ? 'Connecting...' : 'Azure DevOps'}
                  </Button>
                </Grid>
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
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={resetForm} 
            color="secondary" 
            sx={{ 
              borderRadius: 6,
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit as any}
            variant="contained"
            color="primary"
            sx={{ 
              borderRadius: 6, 
              px: 3,
              background: 'linear-gradient(90deg, #007acc, #3399dd)',
              boxShadow: '0 4px 12px rgba(0, 122, 204, 0.3)',
              '&:hover': {
                background: 'linear-gradient(90deg, #005a9e, #007acc)',
                boxShadow: '0 6px 16px rgba(0, 122, 204, 0.4)',
              },
              transition: 'all 0.3s ease',
              fontWeight: 600
            }}
          >
            {editingAccount ? 'Update Account' : 'Add Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountManager;
