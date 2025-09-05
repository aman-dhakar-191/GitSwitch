import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Badge,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Box,
  Button,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'rgba(30, 30, 30, 0.9)',
  boxShadow: '0 2px 15px rgba(0, 0, 0, 0.3)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(12px)',
}));

const SearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  padding: theme.spacing(0.5, 1.5),
  marginRight: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const SearchInput = styled('input')(({ theme }) => ({
  background: 'transparent',
  border: 'none',
  color: '#ffffff',
  padding: theme.spacing(0.5, 1),
  fontSize: '0.9rem',
  width: 200,
  '&:focus': {
    outline: 'none',
  },
  '&::placeholder': {
    color: 'rgba(255, 255, 255, 0.6)',
  },
}));

const TopAppBar: React.FC<{
  onMenuToggle: () => void;
  onViewChange: (view: string) => void;
}> = ({ onMenuToggle, onViewChange }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = React.useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = React.useState(true);
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <>
      <StyledAppBar position="fixed">
        <Toolbar sx={{ pr: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuToggle}
            sx={{ 
              mr: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'rotate(10deg)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h1"
            noWrap
            component="div"
            sx={{ 
              display: { xs: 'none', sm: 'block' }, 
              fontWeight: 800,
              background: 'linear-gradient(90deg, #007acc, #3399dd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.8rem'
            }}
          >
            GitSwitch
          </Typography>
          
          <SearchBox>
            <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.2rem' }} />
            <SearchInput placeholder="Search projects, accounts..." />
          </SearchBox>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton 
              color="inherit"
              onClick={toggleDarkMode}
              sx={{ 
                mr: 1,
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'rotate(15deg)',
                }
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit"
              onClick={handleNotificationMenuOpen}
              sx={{ 
                mr: 1,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                  },
                }
              }}
            >
              <Badge badgeContent={3} color="primary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <IconButton 
              color="inherit"
              onClick={() => onViewChange('settings')}
              sx={{ 
                mr: 1,
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'rotate(10deg)',
                }
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Help">
            <IconButton 
              color="inherit"
              sx={{ 
                mr: 1,
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'rotate(10deg)',
                }
              }}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account">
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: '#007acc',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                JD
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </StyledAppBar>
      
      <Menu
        anchorEl={notificationAnchor}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        id="notification-menu"
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(notificationAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1.5,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(145deg, #1e1e1e, #252525)',
          }
        }}
      >
        <MenuItem>
          <Box sx={{ maxWidth: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>New account added</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              John's work account was successfully added
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              2 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem>
          <Box sx={{ maxWidth: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Identity switched</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Git identity changed for project "my-app"
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              15 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem>
          <Box sx={{ maxWidth: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Backup completed</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Your account settings were backed up successfully
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              1 hour ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem>
          <Button 
            fullWidth 
            variant="outlined" 
            size="small"
            sx={{ 
              borderRadius: 2,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#007acc',
              '&:hover': {
                borderColor: '#007acc',
                backgroundColor: 'rgba(0, 122, 204, 0.1)'
              }
            }}
          >
            View All Notifications
          </Button>
        </MenuItem>
      </Menu>
      
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        id="primary-search-account-menu"
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1.5,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(145deg, #1e1e1e, #252525)',
            minWidth: 240
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48, 
                bgcolor: '#007acc',
                fontSize: '1.2rem',
                fontWeight: 700,
                mr: 1.5
              }}
            >
              JD
            </Avatar>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>John Developer</Typography>
              <Typography variant="body2" color="text.secondary">john@example.com</Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.2 }}>
          <AccountCircleIcon sx={{ mr: 1.5, color: 'rgba(255, 255, 255, 0.7)' }} /> Profile
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.2 }}>
          <SettingsIcon sx={{ mr: 1.5, color: 'rgba(255, 255, 255, 0.7)' }} /> Settings
        </MenuItem>
        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.2 }}>
          <ExitToAppIcon sx={{ mr: 1.5, color: 'rgba(255, 255, 255, 0.7)' }} /> Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default TopAppBar;