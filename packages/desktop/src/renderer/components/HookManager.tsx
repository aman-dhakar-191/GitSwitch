import React, { useState, useEffect } from 'react';
import { Project, GitHookConfig, GitHookInstallConfig } from '@gitswitch/types';
import './HookManager.css';

interface HookManagerProps {
  projects: Project[];
  currentProject: Project | null;
}

const HookManager: React.FC<HookManagerProps> = ({ projects, currentProject }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(currentProject);
  const [hookConfig, setHookConfig] = useState<GitHookConfig | null>(null);
  const [hooksInstalled, setHooksInstalled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationLevel, setValidationLevel] = useState<'strict' | 'warning' | 'off'>('strict');
  const [autoFix, setAutoFix] = useState(true);

  useEffect(() => {
    if (selectedProject) {
      loadHookStatus(selectedProject.path);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (currentProject && !selectedProject) {
      setSelectedProject(currentProject);
    }
  }, [currentProject, selectedProject]);

  const loadHookStatus = async (projectPath: string) => {
    try {
      setLoading(true);
      
      // Check if hooks are installed (this would need to be implemented in IPC)
      // For now, we'll simulate the check
      const response = await window.electronAPI.invoke({
        type: 'VALIDATE_COMMIT',
        payload: { projectPath }
      });
      
      if (response.success) {
        // Hook exists and validation works
        setHooksInstalled(true);
        // Load hook configuration if available
        // This would require a new IPC event to get hook config
      } else {
        setHooksInstalled(false);
      }
    } catch (error) {
      console.error('Failed to load hook status:', error);
      setHooksInstalled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallHooks = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      const config: GitHookInstallConfig = {
        validationLevel,
        autoFix,
        preCommitEnabled: true
      };
      
      const response = await window.electronAPI.invoke({
        type: 'INSTALL_GIT_HOOKS',
        payload: {
          projectPath: selectedProject.path,
          config
        }
      });
      
      if (response.success) {
        setHooksInstalled(true);
        alert('✅ Git hooks installed successfully!\\nHooks will now validate git identity before each commit.');
      } else {
        alert('❌ Failed to install git hooks: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to install hooks:', error);
      alert('❌ Failed to install git hooks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHooks = async () => {
    if (!selectedProject) return;
    
    if (!confirm('Are you sure you want to remove GitSwitch git hooks from this project?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await window.electronAPI.invoke({
        type: 'REMOVE_GIT_HOOKS',
        payload: { projectPath: selectedProject.path }
      });
      
      if (response.success) {
        setHooksInstalled(false);
        alert('✅ Git hooks removed successfully!');
      } else {
        alert('❌ Failed to remove git hooks: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to remove hooks:', error);
      alert('❌ Failed to remove git hooks');
    } finally {
      setLoading(false);
    }
  };

  const handleTestValidation = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      const response = await window.electronAPI.invoke({
        type: 'VALIDATE_COMMIT',
        payload: { projectPath: selectedProject.path }
      });
      
      if (response.success && response.data) {
        const result = response.data;
        const icon = result.valid ? '✅' : '❌';
        alert(`${icon} Validation Result:\\n\\n${result.message}`);
      } else {
        alert('❌ Validation test failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to test validation:', error);
      alert('❌ Validation test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hook-manager">
      <h2 className="hook-manager-title">⚙️ Git Hook Management</h2>
      <p className="hook-manager-description">
        Manage git hooks that prevent wrong identity commits and provide intelligent suggestions.
      </p>

      {/* Project Selection */}
      <div className="hook-section">
        <h3>📁 Select Project</h3>
        <div className="project-selector">
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project || null);
            }}
            className="project-select"
          >
            <option value="">Select a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.path})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProject && (
        <>
          {/* Hook Status */}
          <div className="hook-section">
            <h3>🔗 Hook Status</h3>
            <div className="hook-status">
              <div className="status-indicator">
                <div className={`status-dot ${hooksInstalled ? 'active' : 'inactive'}`}></div>
                <span className="status-text">
                  {hooksInstalled ? 'Hooks Installed' : 'Hooks Not Installed'}
                </span>
              </div>
              
              <div className="project-info">
                <div className="project-name">{selectedProject.name}</div>
                <div className="project-path">{selectedProject.path}</div>
              </div>
            </div>
          </div>

          {/* Hook Configuration */}
          <div className="hook-section">
            <h3>⚙️ Hook Configuration</h3>
            <div className="hook-config">
              <div className="config-group">
                <label htmlFor="validation-level">Validation Level:</label>
                <select
                  id="validation-level"
                  value={validationLevel}
                  onChange={(e) => setValidationLevel(e.target.value as 'strict' | 'warning' | 'off')}
                  className="config-select"
                >
                  <option value="strict">Strict - Block commits with wrong identity</option>
                  <option value="warning">Warning - Show warning but allow commits</option>
                  <option value="off">Off - Disable validation</option>
                </select>
              </div>

              <div className="config-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={autoFix}
                    onChange={(e) => setAutoFix(e.target.checked)}
                    className="config-checkbox"
                  />
                  <span className="checkbox-text">
                    Auto-fix identity - Automatically correct git identity before commit
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Hook Actions */}
          <div className="hook-section">
            <h3>🛠️ Actions</h3>
            <div className="hook-actions">
              {!hooksInstalled ? (
                <button
                  onClick={handleInstallHooks}
                  disabled={loading}
                  className="action-btn install-btn"
                >
                  {loading ? '⏳ Installing...' : '🔧 Install Git Hooks'}
                </button>
              ) : (
                <div className="installed-actions">
                  <button
                    onClick={handleRemoveHooks}
                    disabled={loading}
                    className="action-btn remove-btn"
                  >
                    {loading ? '⏳ Removing...' : '🗑️ Remove Git Hooks'}
                  </button>
                  
                  <button
                    onClick={handleTestValidation}
                    disabled={loading}
                    className="action-btn test-btn"
                  >
                    {loading ? '⏳ Testing...' : '🧪 Test Validation'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Help Information */}
          <div className="hook-section">
            <h3>💡 How it Works</h3>
            <div className="hook-help">
              <div className="help-item">
                <div className="help-icon">🔍</div>
                <div className="help-content">
                  <div className="help-title">Identity Validation</div>
                  <div className="help-description">
                    Before each commit, hooks check if your current git identity matches 
                    the expected account for this project based on smart suggestions.
                  </div>
                </div>
              </div>

              <div className="help-item">
                <div className="help-icon">🛡️</div>
                <div className="help-content">
                  <div className="help-title">Error Prevention</div>
                  <div className="help-description">
                    Prevents accidental commits with the wrong identity, saving time 
                    and avoiding embarrassing mistakes in professional projects.
                  </div>
                </div>
              </div>

              <div className="help-item">
                <div className="help-icon">🤖</div>
                <div className="help-content">
                  <div className="help-title">Auto-Fix</div>
                  <div className="help-description">
                    When enabled, automatically switches to the correct identity 
                    before committing, making the process seamless.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HookManager;