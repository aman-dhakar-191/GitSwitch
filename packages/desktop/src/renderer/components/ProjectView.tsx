import React from 'react';
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
  keyframes
} from '@mui/material';
import { styled } from '@mui/material/styles';

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
  background: 'linear-gradient(145deg, #1e1e1e, #252525)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
  },
}));

const IdentityCard = styled(Card)(({ theme }) => ({
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

const SwitchCard = styled(Card)(({ theme }) => ({
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
  if (!project) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
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
          <FolderIcon sx={{ fontSize: 50, color: '#007acc' }} />
        </Box>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            background: 'linear-gradient(145deg, #1e1e1e, #252525)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <AlertTitle>No Project Selected</AlertTitle>
          Run <code>gitswitch .</code> from a git repository to get started.
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<SettingsIcon />}
          onClick={onOpenAccountManager}
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
          Manage Accounts
        </Button>
      </Box>
    );
  }

  const currentAccount = gitConfig ? 
    accounts.find(acc => acc.email === gitConfig.email && acc.gitName === gitConfig.name) : 
    null;

  const isConfigCorrect = currentAccount && gitConfig;
  const suggestedAccount = project.accountId ? 
    accounts.find(acc => acc.id === project.accountId) : 
    null;

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
          Current Project
        </Typography>
        
        <StyledCard>
          <CardContent>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: alpha('#007acc', 0.2), 
                        mr: 2,
                        width: 48,
                        height: 48
                      }}>
                        <FolderIcon sx={{ color: '#007acc' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h2" component="span" sx={{ fontWeight: 700 }}>{project.name}</Typography>
                        <Chip 
                          label={project.status || 'active'} 
                          size="small" 
                          color={project.status === 'active' ? 'success' : project.status === 'archived' ? 'default' : 'warning'} 
                          sx={{ ml: 2, fontWeight: 700 }}
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              
              <Divider component="li" sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <ListItem disableGutters>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <LocationOnIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary', fontSize: '1.5rem' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Path</Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all', fontWeight: 500 }}>
                          {project.path}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              
              {project.remoteUrl && (
                <>
                  <Divider component="li" sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <ListItem disableGutters>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <LinkIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary', fontSize: '1.5rem' }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Remote</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{project.remoteUrl}</Typography>
                            <Chip 
                              icon={<CodeIcon />} 
                              label={project.platform || 'unknown'} 
                              size="small" 
                              variant="outlined" 
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </>
              )}
              
              <Divider component="li" sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <ListItem disableGutters>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <HistoryIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary', fontSize: '1.5rem' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Project Stats</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Chip 
                            icon={<TrendingUpIcon />} 
                            label={`${project.commitCount || 0} commits`} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip 
                            label={`Confidence: ${(project.confidence * 100).toFixed(0)}%`} 
                            size="small" 
                            color={project.confidence > 0.8 ? 'success' : project.confidence > 0.5 ? 'warning' : 'error'} 
                            variant="outlined" 
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip 
                            label={`Last accessed: ${project.lastAccessed ? new Date(project.lastAccessed).toLocaleDateString() : 'N/A'}`} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </List>
          </CardContent>
        </StyledCard>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" sx={{ mb: 2, fontWeight: 700 }}>Git Identity</Typography>
        
        <IdentityCard>
          <CardContent>
            {gitConfig ? (
              <Box>
                <List disablePadding>
                  <ListItem disableGutters>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <PersonIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary', fontSize: '1.5rem' }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Name</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{gitConfig.name}</Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  <Divider component="li" sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  
                  <ListItem disableGutters>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <EmailIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary', fontSize: '1.5rem' }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Email</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{gitConfig.email}</Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {currentAccount && (
                    <>
                      <Divider component="li" sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      <ListItem disableGutters>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <LabelIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary', fontSize: '1.5rem' }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Account</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {currentAccount.description || currentAccount.name}
                                </Typography>
                                {currentAccount.isDefault && (
                                  <Chip 
                                    label="Default Account" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                    sx={{ mt: 1, fontWeight: 600 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    </>
                  )}
                </List>
                
                <Box sx={{ mt: 3 }}>
                  {isConfigCorrect ? (
                    <Alert 
                      icon={<CheckCircleIcon fontSize="inherit" />} 
                      severity="success"
                      variant="outlined"
                      sx={{ 
                        borderRadius: 2,
                        border: '2px solid',
                        '& .MuiAlert-icon': {
                          color: '#4caf50'
                        }
                      }}
                    >
                      <AlertTitle sx={{ fontWeight: 700 }}>Identity looks good!</AlertTitle>
                      Your Git identity is correctly configured for this project.
                    </Alert>
                  ) : (
                    <Alert 
                      icon={<WarningIcon fontSize="inherit" />} 
                      severity="warning"
                      variant="outlined"
                      sx={{ 
                        borderRadius: 2,
                        border: '2px solid',
                        '& .MuiAlert-icon': {
                          color: '#ff9800'
                        }
                      }}
                    >
                      <AlertTitle sx={{ fontWeight: 700 }}>Identity not recognized</AlertTitle>
                      The current Git identity doesn't match any of your configured accounts.
                    </Alert>
                  )}
                </Box>
              </Box>
            ) : (
              <Alert 
                icon={<ErrorIcon fontSize="inherit" />} 
                severity="error"
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  border: '2px solid',
                  '& .MuiAlert-icon': {
                    color: '#f44336'
                  }
                }}
              >
                <AlertTitle sx={{ fontWeight: 700 }}>No git identity configured</AlertTitle>
                This project doesn't have a Git identity configured yet.
              </Alert>
            )}
          </CardContent>
        </IdentityCard>
      </Box>

      {accounts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ mb: 2, fontWeight: 700 }}>Switch Identity</Typography>
          
          <SwitchCard>
            <CardContent>
              <List>
                {accounts.map(account => (
                  <ListItem 
                    key={account.id} 
                    disableGutters
                    sx={{ 
                      mb: 2, 
                      bgcolor: currentAccount?.id === account.id ? alpha('#007acc', 0.15) : 'transparent',
                      borderRadius: 2,
                      p: 2,
                      border: currentAccount?.id === account.id ? `2px solid ${alpha('#007acc', 0.5)}` : '2px solid transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: alpha('#ffffff', 0.05),
                        transform: 'translateX(5px)',
                      }
                    }}
                  >
                    <ListItem>
                      <Avatar sx={{ 
                        bgcolor: account.color || '#007acc', 
                        mr: 2,
                        width: 56,
                        height: 56,
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                      }}>
                        {account.name.charAt(0)}
                      </Avatar>
                      <ListItemText 
                        primary={
                          <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            {account.name}
                            {account.isDefault && (
                              <Chip 
                                label="Default" 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                                sx={{ ml: 1, fontWeight: 700 }}
                              />
                            )}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {account.email}
                            </Typography>
                            {account.description && (
                              <Typography variant="body2" color="text.secondary">
                                {account.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
                            </Box>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        {currentAccount?.id === account.id ? (
                          <Chip 
                            icon={<CheckCircleIcon />} 
                            label="Current" 
                            color="success" 
                            size="small" 
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => onSwitchIdentity(account.id)}
                            sx={{ 
                              borderRadius: 6,
                              px: 2,
                              py: 1,
                              background: 'linear-gradient(90deg, #007acc, #3399dd)',
                              boxShadow: '0 4px 8px rgba(0, 122, 204, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(90deg, #005a9e, #007acc)',
                                boxShadow: '0 6px 12px rgba(0, 122, 204, 0.4)',
                                transform: 'translateY(-2px)',
                              },
                              transition: 'all 0.3s ease',
                              fontWeight: 600
                            }}
                          >
                            Switch
                          </Button>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </SwitchCard>
        </Box>
      )}

      <Box sx={{ textAlign: 'center' }}>
        <Tooltip title="Manage your Git accounts">
          <Button 
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={onOpenAccountManager}
            sx={{ 
              borderRadius: 12,
              px: 4,
              py: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#007acc',
              '&:hover': {
                borderColor: '#007acc',
                backgroundColor: alpha('#007acc', 0.1),
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
              fontWeight: 600
            }}
          >
            Manage Accounts
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ProjectView;