import React from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Typography,
  Avatar,
  Tooltip,
  Badge,
  Collapse
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { GitAccount } from '@gitswitch/types';

// Icons
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import ComputerIcon from '@mui/icons-material/Computer';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';

const drawerWidth = 280;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: '#1a1a1a',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2),
  background: 'linear-gradient(135deg, #007acc 0%, #005a9e 100%)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const NavItem = styled(ListItem)(({ theme }) => ({
  borderRadius: 12,
  margin: theme.spacing(0.5, 1),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: 'translateX(4px)',
  },
  '&.Mui-selected': {
    backgroundColor: alpha('#007acc', 0.25),
    '& .MuiListItemIcon-root': {
      color: '#007acc',
    },
    '& .MuiListItemText-primary': {
      color: '#ffffff',
      fontWeight: 700,
    },
  },
}));

const navItems = [
  { text: 'Dashboard', icon: <BarChartIcon />, key: 'dashboard' },
  { text: 'Project', icon: <FolderIcon />, key: 'project' },
  { text: 'Accounts', icon: <PersonIcon />, key: 'accounts' },
  { text: 'Analytics', icon: <BarChartIcon />, key: 'analytics' },
  { text: 'Hooks', icon: <SettingsIcon />, key: 'hooks' },
  { text: 'Teams', icon: <BusinessIcon />, key: 'teams' },
  { text: 'Tray', icon: <ComputerIcon />, key: 'tray' },
  { text: 'UI Demo', icon: <DesignServicesIcon />, key: 'demo' },
];

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  accounts: GitAccount[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, accounts }) => {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    security: false,
    settings: false
  });
  
  const defaultAccounts = accounts.filter(acc => acc.isDefault).length;
  
  const handleClick = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  return (
    <StyledDrawer variant="permanent">
      <SidebarHeader>
        <Avatar 
          sx={{ 
            bgcolor: '#ffffff',
            color: '#007acc',
            width: 48,
            height: 48,
            fontSize: '1.5rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          GS
        </Avatar>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.4rem', fontWeight: 800 }}>
            GitSwitch
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Account Manager
          </Typography>
        </Box>
      </SidebarHeader>
      
      <List sx={{ pt: 2, px: 1 }}>
        {navItems.map((item) => (
          <NavItem
            key={item.text}
            onClick={() => onViewChange(item.key)}
            selected={currentView === item.key}
          >
            <ListItemIcon 
              sx={{ 
                color: currentView === item.key ? '#007acc' : 'rgba(255, 255, 255, 0.7)',
                minWidth: 44
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                sx: { 
                  color: currentView === item.key ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: currentView === item.key ? 700 : 500,
                  fontSize: '1rem'
                }
              }}
            />
            {item.key === 'accounts' && defaultAccounts > 0 && (
              <Badge 
                badgeContent={defaultAccounts} 
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#007acc',
                    fontWeight: 700
                  }
                }}
              />
            )}
          </NavItem>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      
      <List sx={{ p: 1 }}>
        <NavItem onClick={() => handleClick('security')}>
          <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 44 }}>
            <SecurityIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Security" 
            primaryTypographyProps={{ 
              sx: { 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500
              } 
            }}
          />
          {openSections.security ? <ExpandLess /> : <ExpandMore />}
        </NavItem>
        <Collapse in={openSections.security} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <NavItem sx={{ pl: 4 }}>
              <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 44 }}>
                <LockIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Password" 
                primaryTypographyProps={{ 
                  sx: { 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 500
                  } 
                }}
              />
            </NavItem>
          </List>
        </Collapse>
        
        <NavItem>
          <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 44 }}>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Notifications" 
            primaryTypographyProps={{ 
              sx: { 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500
              } 
            }}
          />
        </NavItem>
        <NavItem>
          <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 44 }}>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Profile" 
            primaryTypographyProps={{ 
              sx: { 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500
              } 
            }}
          />
        </NavItem>
      </List>
    </StyledDrawer>
  );
};

export default Sidebar;