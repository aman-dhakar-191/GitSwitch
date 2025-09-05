import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Fab,
  Tooltip,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import ComputerIcon from '@mui/icons-material/Computer';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GitHubIcon from '@mui/icons-material/GitHub';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UIDemo: React.FC = () => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h2" gutterBottom>
        GitSwitch Material UI Demo
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Material Design Implementation</AlertTitle>
        This demo showcases the new Material UI components integrated into GitSwitch
      </Alert>
      
      {/* Navigation Demo */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Navigation
        </Typography>
        <AppBar position="static" sx={{ mb: 2 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              GitSwitch
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button color="inherit" startIcon={<FolderIcon />}>Project</Button>
              <Button color="inherit" startIcon={<PersonIcon />}>Accounts</Button>
              <Button color="inherit" startIcon={<BarChartIcon />}>Analytics</Button>
              <Button color="inherit" startIcon={<SettingsIcon />}>Hooks</Button>
              <Button color="inherit" startIcon={<BusinessIcon />}>Teams</Button>
              <Button color="inherit" startIcon={<ComputerIcon />}>Tray</Button>
            </Box>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              sx={{ display: { xs: 'flex', md: 'none' } }}
              onClick={handleMenuOpen}
            >
              <MoreVertIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          <MenuItem onClick={handleMenuClose}>
            <FolderIcon sx={{ mr: 1 }} /> Project
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <PersonIcon sx={{ mr: 1 }} /> Accounts
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <BarChartIcon sx={{ mr: 1 }} /> Analytics
          </MenuItem>
        </Menu>
      </Box>
      
      {/* Cards Demo */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Account Cards
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    J
                  </Avatar>
                  <Typography variant="h4">John Developer</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Email:</strong> john@company.com
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Git Name:</strong> John Developer
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Work Account" size="small" variant="outlined" />
                  <Chip label="Usage: 12" size="small" variant="outlined" />
                </Box>
              </CardContent>
              <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" startIcon={<EditIcon />}>Edit</Button>
                <Button size="small" startIcon={<DeleteIcon />} color="error">Delete</Button>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    P
                  </Avatar>
                  <Typography variant="h4">Personal Account</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Email:</strong> john.personal@gmail.com
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Git Name:</strong> John Personal
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Personal" size="small" variant="outlined" />
                  <Chip label="Usage: 5" size="small" variant="outlined" />
                  <Chip label="Default" size="small" color="primary" variant="outlined" />
                </Box>
              </CardContent>
              <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" startIcon={<EditIcon />}>Edit</Button>
                <Button size="small" startIcon={<DeleteIcon />} color="error">Delete</Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* FAB Demo */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Floating Action Button
        </Typography>
        <Tooltip title="Add Account">
          <Fab 
            color="primary" 
            aria-label="add account"
            onClick={() => setOpenDialog(true)}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>
      
      {/* Dialog Demo */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Account
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Connect your Git provider account</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<GitHubIcon />}
                  sx={{ 
                    bgcolor: '#24292e',
                    '&:hover': { bgcolor: '#1a1e22' },
                    textTransform: 'none'
                  }}
                >
                  Connect GitHub
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ textTransform: 'none' }}
                >
                  GitLab
                </Button>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }}>
              <Chip label="OR" size="small" />
            </Divider>
          </Box>
          
          <TextField
            fullWidth
            label="Display Name"
            placeholder="e.g., John Developer"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            placeholder="e.g., john@company.com"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Git Name"
            placeholder="e.g., John Developer"
            helperText="This will be used as git user.name"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Description"
            placeholder="e.g., Work Account, Personal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button variant="contained" color="primary">
            Add Account
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* List Demo */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Account List
        </Typography>
        <Card>
          <CardContent>
            <List>
              <ListItem sx={{ bgcolor: 'action.selected', borderRadius: 1, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  J
                </Avatar>
                <ListItemText 
                  primary="John Developer"
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        john@company.com
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Work Account
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip label="Current" color="success" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem sx={{ borderRadius: 1, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  P
                </Avatar>
                <ListItemText 
                  primary="Personal Account"
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        john.personal@gmail.com
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Personal projects
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Button variant="contained" size="small">
                    Switch
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default UIDemo;