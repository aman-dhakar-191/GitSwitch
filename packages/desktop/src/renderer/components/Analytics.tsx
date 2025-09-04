import React, { useState, useEffect } from 'react';
import { UsageAnalytics, GitAccount, Project } from '@gitswitch/types';
import './Analytics.css';

interface AnalyticsProps {
  accounts: GitAccount[];
}

const Analytics: React.FC<AnalyticsProps> = ({ accounts }) => {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.invoke({
        type: 'GET_ANALYTICS',
        payload: null
      });
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getMostUsedAccount = () => {
    if (!analytics || Object.keys(analytics.accountUsage).length === 0) {
      return null;
    }
    
    const maxUsage = Math.max(...Object.values(analytics.accountUsage));
    const accountId = Object.keys(analytics.accountUsage).find(
      id => analytics.accountUsage[id] === maxUsage
    );
    
    return accounts.find(acc => acc.id === accountId);
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-error">
        <p>📊 No analytics data available</p>
        <p>Start using GitSwitch to see usage statistics!</p>
      </div>
    );
  }

  const mostUsedAccount = getMostUsedAccount();

  return (
    <div className="analytics">
      <h2 className="analytics-title">📊 Usage Analytics</h2>
      
      <div className="analytics-grid">
        {/* Overview Cards */}
        <div className="analytics-section">
          <h3>Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analytics.totalProjects}</div>
              <div className="stat-label">Projects</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{analytics.totalAccounts}</div>
              <div className="stat-label">Accounts</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{analytics.projectSwitches}</div>
              <div className="stat-label">Switches</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{analytics.errorsPrevented}</div>
              <div className="stat-label">Errors Prevented</div>
            </div>
          </div>
        </div>

        {/* Time Saved */}
        <div className="analytics-section">
          <h3>⏱️ Time Saved</h3>
          <div className="time-saved">
            <div className="time-saved-value">{formatTime(analytics.timesSaved)}</div>
            <div className="time-saved-description">
              Estimated time saved from automated switching and error prevention
            </div>
          </div>
        </div>

        {/* Account Usage */}
        <div className="analytics-section">
          <h3>👤 Account Usage</h3>
          {Object.keys(analytics.accountUsage).length > 0 ? (
            <div className="account-usage">
              {Object.entries(analytics.accountUsage).map(([accountId, usage]) => {
                const account = accounts.find(acc => acc.id === accountId);
                if (!account) return null;
                
                const percentage = analytics.projectSwitches > 0 
                  ? Math.round((usage / analytics.projectSwitches) * 100)
                  : 0;
                
                return (
                  <div key={accountId} className="account-usage-item">
                    <div className="account-info">
                      <span className="account-name">{account.name}</span>
                      <span className="account-email">{account.email}</span>
                    </div>
                    <div className="usage-stats">
                      <div className="usage-bar">
                        <div 
                          className="usage-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="usage-text">{usage} uses ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-data">No account usage data yet</p>
          )}
        </div>

        {/* Top Projects */}
        <div className="analytics-section">
          <h3>📁 Top Projects</h3>
          {analytics.topProjects.length > 0 ? (
            <div className="top-projects">
              {analytics.topProjects.slice(0, 5).map((project, index) => (
                <div key={project.id} className="project-item">
                  <div className="project-rank">#{index + 1}</div>
                  <div className="project-info">
                    <div className="project-name">{project.name}</div>
                    <div className="project-path">{project.path}</div>
                    <div className="project-meta">
                      Last accessed: {project.lastAccessed.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No project data yet</p>
          )}
        </div>

        {/* Pattern Accuracy */}
        <div className="analytics-section">
          <h3>🎯 Smart Suggestions</h3>
          <div className="pattern-accuracy">
            <div className="accuracy-circle">
              <div className="accuracy-value">
                {Math.round(analytics.patternAccuracy * 100)}%
              </div>
              <div className="accuracy-label">Accuracy</div>
            </div>
            <div className="accuracy-description">
              How often our smart suggestions match your choices
            </div>
          </div>
        </div>

        {/* Most Used Account */}
        {mostUsedAccount && (
          <div className="analytics-section">
            <h3>⭐ Most Used Account</h3>
            <div className="favorite-account">
              <div className="account-avatar">
                {mostUsedAccount.name.charAt(0).toUpperCase()}
              </div>
              <div className="account-details">
                <div className="account-name">{mostUsedAccount.name}</div>
                <div className="account-email">{mostUsedAccount.email}</div>
                <div className="account-usage">
                  {analytics.accountUsage[mostUsedAccount.id]} switches
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="analytics-footer">
        <button 
          className="refresh-btn"
          onClick={loadAnalytics}
        >
          🔄 Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default Analytics;