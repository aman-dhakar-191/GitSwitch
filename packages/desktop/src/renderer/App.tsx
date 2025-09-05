import React, { useState, useEffect } from 'react';
import { GitAccount, Project, GitConfig, IPCEvent } from '@gitswitch/types';
import ProjectView from './components/ProjectView';
import AccountManager from './components/AccountManager';
import Analytics from './components/Analytics';
import HookManager from './components/HookManager';
import TeamDashboard from './components/TeamDashboard';
import SystemTrayControls from './components/SystemTrayControls';
import UIDemo from './components/UIDemo';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import TopAppBar from './components/TopAppBar';

// Material-UI imports
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slide from '@mui/material/Slide';
import theme from './theme';

// Extend the window interface to include our electron API
declare global {
  interface Window {
    electronAPI: {
      invoke: (event: IPCEvent) => Promise<{ success: boolean; data?: any; error?: string }>;
      platform: string;
      version: string;
    };
  }
}

type View = 'dashboard' | 'project' | 'accounts' | 'analytics' | 'hooks' | 'teams' | 'tray' | 'settings' | 'demo';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [accounts, setAccounts] = useState<GitAccount[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentGitConfig, setCurrentGitConfig] = useState<GitConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load accounts
      const accountsResponse = await window.electronAPI.invoke({
        type: 'GET_ACCOUNTS',
        payload: null
      });
      
      if (accountsResponse.success) {
        setAccounts(accountsResponse.data || []);
      }
      
      // Load projects
      const projectsResponse = await window.electronAPI.invoke({
        type: 'GET_PROJECT_LIST',
        payload: {}
      });
      
      if (projectsResponse.success) {
        setProjects(projectsResponse.data || []);
      }
      
      // Check for initial project from CLI
      const initialProjectResponse = await window.electronAPI.invoke({
        type: 'GET_INITIAL_PROJECT',
        payload: null
      });
      
      if (initialProjectResponse.success && initialProjectResponse.data) {
        console.log('🎯 Loading initial project from CLI:', initialProjectResponse.data);
        setCurrentProject(initialProjectResponse.data);
        
        // Load git config for the initial project
        await loadProject(initialProjectResponse.data.path);
      }
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (projectPath: string) => {
    try {
      const projectResponse = await window.electronAPI.invoke({
        type: 'OPEN_PROJECT',
        payload: { projectPath }
      });
      
      if (projectResponse.success && projectResponse.data) {
        setCurrentProject(projectResponse.data);
        
        // Load current git config
        const gitConfigResponse = await window.electronAPI.invoke({
          type: 'GET_GIT_CONFIG',
          payload: { projectPath }
        });
        
        if (gitConfigResponse.success) {
          setCurrentGitConfig(gitConfigResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const handleAccountAdded = (account: GitAccount) => {
    setAccounts(prev => [...prev, account]);
  };

  const handleAccountUpdated = (updatedAccount: GitAccount) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      )
    );
  };

  const handleAccountDeleted = (accountId: string) => {
    setAccounts(prev => prev.filter(account => account.id !== accountId));
  };

  const handleGitIdentityChanged = async (accountId: string) => {
    if (!currentProject) return;
    
    try {
      const response = await window.electronAPI.invoke({
        type: 'SWITCH_GIT_IDENTITY',
        payload: {
          projectPath: currentProject.path,
          accountId
        }
      });
      
      if (response.success) {
        // Reload git config to show updated identity
        const gitConfigResponse = await window.electronAPI.invoke({
          type: 'GET_GIT_CONFIG',
          payload: { projectPath: currentProject.path }
        });
        
        if (gitConfigResponse.success) {
          setCurrentGitConfig(gitConfigResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to switch git identity:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as View);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Slide direction="up" in={currentView === 'dashboard'} mountOnEnter unmountOnExit>
            <div>
              <Dashboard
                accounts={accounts}
                projects={projects}
                onAddAccount={() => setCurrentView('accounts')}
                onViewChange={handleViewChange}
              />
            </div>
          </Slide>
        );
      case 'project':
        return (
          <Slide direction="up" in={currentView === 'project'} mountOnEnter unmountOnExit>
            <div>
              <ProjectView
                project={currentProject}
                gitConfig={currentGitConfig}
                accounts={accounts}
                onSwitchIdentity={handleGitIdentityChanged}
                onOpenAccountManager={() => setCurrentView('accounts')}
              />
            </div>
          </Slide>
        );
      case 'accounts':
        return (
          <Slide direction="up" in={currentView === 'accounts'} mountOnEnter unmountOnExit>
            <div>
              <AccountManager
                accounts={accounts}
                onAccountAdded={handleAccountAdded}
                onAccountUpdated={handleAccountUpdated}
                onAccountDeleted={handleAccountDeleted}
              />
            </div>
          </Slide>
        );
      case 'analytics':
        return (
          <Slide direction="up" in={currentView === 'analytics'} mountOnEnter unmountOnExit>
            <div>
              <Analytics accounts={accounts} />
            </div>
          </Slide>
        );
      case 'hooks':
        return (
          <Slide direction="up" in={currentView === 'hooks'} mountOnEnter unmountOnExit>
            <div>
              <HookManager
                projects={projects}
                currentProject={currentProject}
              />
            </div>
          </Slide>
        );
      case 'teams':
        return (
          <Slide direction="up" in={currentView === 'teams'} mountOnEnter unmountOnExit>
            <div>
              <TeamDashboard />
            </div>
          </Slide>
        );
      case 'tray':
        return (
          <Slide direction="up" in={currentView === 'tray'} mountOnEnter unmountOnExit>
            <div>
              <SystemTrayControls currentProject={currentProject} />
            </div>
          </Slide>
        );
      case 'demo':
        return (
          <Slide direction="up" in={currentView === 'demo'} mountOnEnter unmountOnExit>
            <div>
              <UIDemo />
            </div>
          </Slide>
        );
      default:
        return (
          <Slide direction="up" in={true} mountOnEnter unmountOnExit>
            <div>
              <Dashboard
                accounts={accounts}
                projects={projects}
                onAddAccount={() => setCurrentView('accounts')}
                onViewChange={handleViewChange}
              />
            </div>
          </Slide>
        );
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            color: 'text.secondary',
            background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
          }}
        >
          <Box sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            bgcolor: 'rgba(0, 122, 204, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              border: '3px solid #007acc',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
                '100%': { transform: 'scale(1)' },
              }
            }} />
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
            GitSwitch
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Loading your Git identity manager...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <TopAppBar 
          onMenuToggle={handleDrawerToggle}
          onViewChange={handleViewChange}
        />
        <Sidebar 
          currentView={currentView}
          onViewChange={handleViewChange}
          accounts={accounts}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - 280px)` },
            minHeight: '100vh',
            bgcolor: 'background.default',
            pt: { sm: 8 },
            transition: 'all 0.3s ease',
          }}
        >
          {renderView()}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;