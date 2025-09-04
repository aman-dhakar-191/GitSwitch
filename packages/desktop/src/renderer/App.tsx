import React, { useState, useEffect } from 'react';
import { GitAccount, Project, GitConfig, IPCEvent } from '@gitswitch/types';
import ProjectView from './components/ProjectView';
import AccountManager from './components/AccountManager';
import Analytics from './components/Analytics';
import HookManager from './components/HookManager';
import TeamDashboard from './components/TeamDashboard';
import SystemTrayControls from './components/SystemTrayControls';
import './styles/App.css';

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

type View = 'project' | 'accounts' | 'analytics' | 'hooks' | 'teams' | 'tray' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('project');
  const [accounts, setAccounts] = useState<GitAccount[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentGitConfig, setCurrentGitConfig] = useState<GitConfig | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading GitSwitch...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">GitSwitch</h1>
        <nav className="app-nav">
          <button
            className={`nav-button ${currentView === 'project' ? 'active' : ''}`}
            onClick={() => setCurrentView('project')}
          >
            📁 Project
          </button>
          <button
            className={`nav-button ${currentView === 'accounts' ? 'active' : ''}`}
            onClick={() => setCurrentView('accounts')}
          >
            👤 Accounts
          </button>
          <button
            className={`nav-button ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
          >
            📊 Analytics
          </button>
          <button
            className={`nav-button ${currentView === 'hooks' ? 'active' : ''}`}
            onClick={() => setCurrentView('hooks')}
          >
            ⚙️ Hooks
          </button>
          <button
            className={`nav-button ${currentView === 'teams' ? 'active' : ''}`}
            onClick={() => setCurrentView('teams')}
          >
            🏢 Teams
          </button>
          <button
            className={`nav-button ${currentView === 'tray' ? 'active' : ''}`}
            onClick={() => setCurrentView('tray')}
          >
            🖥️ Tray
          </button>
        </nav>
      </header>

      <main className="app-content">
        {currentView === 'project' && (
          <ProjectView
            project={currentProject}
            gitConfig={currentGitConfig}
            accounts={accounts}
            onSwitchIdentity={handleGitIdentityChanged}
            onOpenAccountManager={() => setCurrentView('accounts')}
          />
        )}
        
        {currentView === 'accounts' && (
          <AccountManager
            accounts={accounts}
            onAccountAdded={handleAccountAdded}
            onAccountUpdated={handleAccountUpdated}
            onAccountDeleted={handleAccountDeleted}
          />
        )}
        
        {currentView === 'analytics' && (
          <Analytics
            accounts={accounts}
          />
        )}
        
        {currentView === 'hooks' && (
          <HookManager
            projects={projects}
            currentProject={currentProject}
          />
        )}
        
        {currentView === 'teams' && (
          <TeamDashboard />
        )}
        
        {currentView === 'tray' && (
          <SystemTrayControls currentProject={currentProject} />
        )}
      </main>
    </div>
  );
};

export default App;