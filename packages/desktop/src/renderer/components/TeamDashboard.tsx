import React, { useState, useEffect } from 'react';
import { TeamConfiguration, TeamMember, ProjectRule, SecurityPolicy, IPCEvent } from '@gitswitch/types';
import './TeamDashboard.css';

interface TeamDashboardProps {
  onCreateTeam?: () => void;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ onCreateTeam }) => {
  const [teams, setTeams] = useState<TeamConfiguration[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.invoke({
        type: 'GET_TEAMS',
        payload: null
      });

      if (response.success) {
        const teamsList = response.data || [];
        setTeams(teamsList);
        if (teamsList.length > 0 && !selectedTeam) {
          setSelectedTeam(teamsList[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !organizationName.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await window.electronAPI.invoke({
        type: 'CREATE_TEAM',
        payload: {
          team: {
            name: newTeamName.trim(),
            organization: organizationName.trim(),
            accounts: [],
            projectRules: [],
            policies: [],
            members: [],
            createdBy: 'current-user' // Would be replaced with actual user ID
          }
        }
      });

      if (response.success) {
        setNewTeamName('');
        setOrganizationName('');
        setShowCreateForm(false);
        await loadTeams();
      } else {
        alert('Failed to create team: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team');
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await window.electronAPI.invoke({
        type: 'INVITE_MEMBER',
        payload: {
          teamId: selectedTeam.id,
          email: inviteEmail.trim(),
          role: inviteRole
        }
      });

      if (response.success) {
        setInviteEmail('');
        setShowInviteForm(false);
        await loadTeams();
        // Update selected team with latest data
        const updatedTeam = teams.find(t => t.id === selectedTeam.id);
        if (updatedTeam) {
          setSelectedTeam(updatedTeam);
        }
      } else {
        alert('Failed to invite member: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
      alert('Failed to invite member');
    }
  };

  const generateShareCode = async (teamId: string) => {
    try {
      const response = await window.electronAPI.invoke({
        type: 'GENERATE_SHARE_CODE',
        payload: { teamId }
      });

      if (response.success) {
        const shareCode = response.data;
        navigator.clipboard.writeText(shareCode);
        alert(`Share code copied to clipboard: ${shareCode}`);
      }
    } catch (error) {
      console.error('Failed to generate share code:', error);
      alert('Failed to generate share code');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'member': return '👤';
      case 'viewer': return '👁️';
      default: return '👤';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="team-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading team dashboard...</p>
      </div>
    );
  }

  return (
    <div className="team-dashboard">
      <div className="team-sidebar">
        <div className="team-sidebar-header">
          <h2>🏢 Teams</h2>
          <button 
            className="btn-create-team"
            onClick={() => setShowCreateForm(true)}
            title="Create New Team"
          >
            ➕
          </button>
        </div>

        <div className="team-list">
          {teams.length === 0 ? (
            <div className="no-teams">
              <p>No teams found</p>
              <button 
                className="btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                Create Your First Team
              </button>
            </div>
          ) : (
            teams.map(team => (
              <div
                key={team.id}
                className={`team-item ${selectedTeam?.id === team.id ? 'active' : ''}`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="team-name">{team.name}</div>
                <div className="team-org">{team.organization}</div>
                <div className="team-stats">
                  👥 {team.members.length} members
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="team-main">
        {selectedTeam ? (
          <>
            <div className="team-header">
              <div className="team-title">
                <h1>{selectedTeam.name}</h1>
                <span className="team-org-badge">{selectedTeam.organization}</span>
              </div>
              <div className="team-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => generateShareCode(selectedTeam.id)}
                >
                  📤 Share
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => setShowInviteForm(true)}
                >
                  ➕ Invite
                </button>
              </div>
            </div>

            <div className="team-content">
              <div className="team-section">
                <h3>👥 Team Members ({selectedTeam.members.length})</h3>
                <div className="members-grid">
                  {selectedTeam.members.map(member => (
                    <div key={member.id} className="member-card">
                      <div className="member-info">
                        <span className="member-role-icon">
                          {getRoleIcon(member.role)}
                        </span>
                        <div>
                          <div className="member-name">{member.name}</div>
                          <div className="member-email">{member.email}</div>
                        </div>
                      </div>
                      <div className="member-meta">
                        <span className="member-role">{member.role}</span>
                        <span className="member-joined">
                          Joined {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="team-section">
                <h3>📋 Project Rules ({selectedTeam.projectRules.length})</h3>
                <div className="rules-list">
                  {selectedTeam.projectRules.length === 0 ? (
                    <p className="empty-state">No project rules configured</p>
                  ) : (
                    selectedTeam.projectRules.map(rule => (
                      <div key={rule.id} className="rule-card">
                        <div className="rule-pattern">{rule.pattern}</div>
                        <div className="rule-enforcement">
                          <span className={`enforcement-badge ${rule.enforcement}`}>
                            {rule.enforcement}
                          </span>
                        </div>
                        <div className="rule-description">{rule.description}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="team-section">
                <h3>🛡️ Security Policies ({selectedTeam.policies.length})</h3>
                <div className="policies-grid">
                  {selectedTeam.policies.length === 0 ? (
                    <p className="empty-state">No security policies configured</p>
                  ) : (
                    selectedTeam.policies.map(policy => (
                      <div key={policy.id} className="policy-card">
                        <h4>{policy.name}</h4>
                        <div className="policy-details">
                          {policy.requireSignedCommits && (
                            <div className="policy-item">✓ Signed commits required</div>
                          )}
                          {policy.requiredSSHKeys && (
                            <div className="policy-item">✓ SSH keys required</div>
                          )}
                          {policy.auditLogging && (
                            <div className="policy-item">✓ Audit logging enabled</div>
                          )}
                          {policy.allowedDomains.length > 0 && (
                            <div className="policy-item">
                              🌐 Allowed domains: {policy.allowedDomains.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="team-section">
                <h3>📊 Team Activity</h3>
                <div className="activity-stats">
                  <div className="stat-card">
                    <div className="stat-value">{selectedTeam.accounts.length}</div>
                    <div className="stat-label">Configured Accounts</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{selectedTeam.projectRules.length}</div>
                    <div className="stat-label">Project Rules</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{selectedTeam.policies.length}</div>
                    <div className="stat-label">Security Policies</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">v{selectedTeam.version}</div>
                    <div className="stat-label">Configuration Version</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-team-selected">
            <h2>Select a team to view details</h2>
            <p>Choose a team from the sidebar or create a new one</p>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Team</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="teamName">Team Name</label>
                <input
                  id="teamName"
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Frontend Team, DevOps Team"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="orgName">Organization</label>
                <input
                  id="orgName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g., Acme Corp, GitSwitch Inc"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateTeam}
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Invite Team Member</h3>
              <button 
                className="modal-close"
                onClick={() => setShowInviteForm(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="inviteEmail">Email Address</label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="inviteRole">Role</label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                >
                  <option value="viewer">👁️ Viewer - Read-only access</option>
                  <option value="member">👤 Member - Standard access</option>
                  <option value="admin">👑 Admin - Full access</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleInviteMember}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;