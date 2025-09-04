import React from 'react';
import { Project, GitConfig, GitAccount } from '@gitswitch/types';
import './ProjectView.css';

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
      <div className="project-view">
        <div className="no-project">
          <h2>No Project Selected</h2>
          <p>Run <code>gitswitch .</code> from a git repository to get started.</p>
          <button 
            className="btn btn-primary"
            onClick={onOpenAccountManager}
          >
            Manage Accounts
          </button>
        </div>
      </div>
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
    <div className="project-view">
      <div className="project-header">
        <h2>Current Project</h2>
      </div>

      <div className="project-info card">
        <div className="project-details">
          <div className="detail-row">
            <span className="label">📁 Project:</span>
            <span className="value">{project.name}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">📍 Path:</span>
            <span className="value path">{project.path}</span>
          </div>
          
          {project.remoteUrl && (
            <div className="detail-row">
              <span className="label">🔗 Remote:</span>
              <span className="value">{project.remoteUrl}</span>
            </div>
          )}
        </div>
      </div>

      <div className="git-identity-section">
        <h3>Git Identity</h3>
        
        <div className="git-identity card">
          {gitConfig ? (
            <div className="current-identity">
              <div className="identity-info">
                <div className="identity-row">
                  <span className="label">👤 Name:</span>
                  <span className="value">{gitConfig.name}</span>
                </div>
                <div className="identity-row">
                  <span className="label">📧 Email:</span>
                  <span className="value">{gitConfig.email}</span>
                </div>
                
                {currentAccount && (
                  <div className="identity-row">
                    <span className="label">🏷️ Account:</span>
                    <span className="value">{currentAccount.description || currentAccount.name}</span>
                  </div>
                )}
              </div>
              
              <div className="identity-status">
                {isConfigCorrect ? (
                  <div className="status-good">
                    <span className="status-indicator status-success"></span>
                    Identity looks good!
                  </div>
                ) : (
                  <div className="status-warning">
                    <span className="status-indicator status-warning"></span>
                    Identity not recognized
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-identity">
              <span className="status-indicator status-error"></span>
              No git identity configured
            </div>
          )}
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="account-selection">
          <h3>Switch Identity</h3>
          
          <div className="account-list">
            {accounts.map(account => (
              <div 
                key={account.id} 
                className={`account-item ${currentAccount?.id === account.id ? 'current' : ''}`}
              >
                <div className="account-info">
                  <div className="account-name">{account.name}</div>
                  <div className="account-email">{account.email}</div>
                  {account.description && (
                    <div className="account-description">{account.description}</div>
                  )}
                </div>
                
                <div className="account-actions">
                  {currentAccount?.id === account.id ? (
                    <span className="current-badge">Current</span>
                  ) : (
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => onSwitchIdentity(account.id)}
                    >
                      Switch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="project-actions">
        <button 
          className="btn btn-secondary"
          onClick={onOpenAccountManager}
        >
          ⚙️ Manage Accounts
        </button>
      </div>
    </div>
  );
};

export default ProjectView;