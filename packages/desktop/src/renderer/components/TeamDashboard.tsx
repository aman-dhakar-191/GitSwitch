import React, { useState, useEffect } from 'react';
import { TeamConfiguration, TeamMember, ProjectRule, SecurityPolicy, IPCEvent } from '@gitswitch/types';

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
            createdBy: 'current-user'
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#a0a0a0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTop: '4px solid #00d4ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite, pulse 2s ease-in-out infinite',
          marginBottom: '24px'
        }}></div>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading team management...</p>
      </div>
    );
  }

  const styles = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    @keyframes slideInUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        position: 'relative',
        overflow: 'hidden',
        padding: '32px'
      }}>
        {/* Floating Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '15%',
          right: '8%',
          width: '100px',
          height: '100px',
          background: 'rgba(0,212,255,0.1)',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite reverse'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          left: '15%',
          width: '60px',
          height: '60px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          animation: 'float 12s ease-in-out infinite'
        }}></div>

        {/* Header Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '40px',
          animation: 'fadeIn 0.8s ease-out'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 16px 0',
              fontSize: '48px',
              fontWeight: '800',
              background: 'linear-gradient(45deg, #ffffff, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              🏢 Team Management
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '18px',
              margin: 0,
              fontWeight: '500'
            }}>
              Manage your teams, members, and collaboration settings
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 212, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 212, 255, 0.3)';
            }}
          >
            ➕ Create New Team
          </button>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '80px 40px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'slideInUp 0.6s ease-out'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              margin: '0 auto 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              animation: 'float 4s ease-in-out infinite'
            }}>
              🏢
            </div>
            <h2 style={{
              marginBottom: '16px',
              color: 'white',
              fontSize: '28px',
              fontWeight: '700'
            }}>
              No Teams Yet
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '18px',
              marginBottom: '32px',
              maxWidth: '500px',
              margin: '0 auto 32px'
            }}>
              Create your first team to start collaborating with your colleagues and managing git identities together.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)'
              }}
            >
              Create Your First Team
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {teams.map((team, index) => (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                style={{
                  background: selectedTeam?.id === team.id 
                    ? 'rgba(0, 212, 255, 0.2)' 
                    : 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: selectedTeam?.id === team.id 
                    ? '2px solid rgba(0, 212, 255, 0.5)' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  padding: '32px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                  boxShadow: selectedTeam?.id === team.id 
                    ? '0 16px 48px rgba(0, 212, 255, 0.2)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (selectedTeam?.id !== team.id) {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTeam?.id !== team.id) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    fontSize: '32px'
                  }}>
                    🏢
                  </div>
                  {selectedTeam?.id === team.id && (
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#10b981',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Active
                    </div>
                  )}
                </div>
                
                <h3 style={{
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '8px',
                  fontSize: '24px'
                }}>
                  {team.name}
                </h3>
                
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '20px'
                }}>
                  {team.organization}
                </p>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px'
                  }}>
                    <span>👥</span>
                    {team.members.length} members
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateShareCode(team.id);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      📤 Share
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeam(team);
                        setShowInviteForm(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0, 212, 255, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ➕ Invite
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Team Details */}
        {selectedTeam && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'slideInUp 0.6s ease-out 0.3s both'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '800',
                background: 'linear-gradient(45deg, #ffffff, #00d4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {selectedTeam.name} Team
              </h2>
              
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                {selectedTeam.organization}
              </span>
            </div>

            {/* Team Members Section */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '700',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                👥 Team Members ({selectedTeam.members.length})
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {selectedTeam.members.map((member, index) => (
                  <div
                    key={member.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '16px',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <span style={{
                        fontSize: '24px',
                        marginRight: '16px'
                      }}>
                        {getRoleIcon(member.role)}
                      </span>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: 'white',
                          marginBottom: '4px',
                          fontSize: '16px'
                        }}>
                          {member.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}>
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        textTransform: 'capitalize',
                        fontWeight: '500'
                      }}>
                        {member.role}
                      </span>
                      <span style={{
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}>
                        Joined {formatDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Activity Stats */}
            <div>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '700',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                📊 Team Activity
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                {[
                  { value: selectedTeam.accounts.length, label: 'Configured Accounts', icon: '👤' },
                  { value: selectedTeam.projectRules.length, label: 'Project Rules', icon: '📋' },
                  { value: selectedTeam.policies.length, label: 'Security Policies', icon: '🛡️' },
                  { value: `v${selectedTeam.version}`, label: 'Configuration Version', icon: '⚙️' }
                ].map((stat, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '16px',
                      padding: '24px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 212, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      fontSize: '32px',
                      marginBottom: '8px'
                    }}>
                      {stat.icon}
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      background: 'linear-gradient(45deg, #00d4ff, #ffffff)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '8px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              width: '100%',
              maxWidth: '480px',
              animation: 'slideInUp 0.4s ease-out'
            }}>
              <div style={{
                padding: '32px 32px 0 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#333'
                }}>
                  Create New Team
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    background: 'rgba(0, 0, 0, 0.1)',
                    color: '#666',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: '24px 32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Frontend Team, DevOps Team"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#333',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00d4ff';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 212, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={{ marginBottom: '32px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Organization
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g., Acme Corp, GitSwitch Inc"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#333',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00d4ff';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 212, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              <div style={{
                padding: '20px 32px 32px 32px',
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                <button
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(0, 0, 0, 0.1)',
                    color: '#666',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 212, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 212, 255, 0.3)';
                  }}
                >
                  Create Team
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
        {showInviteForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              width: '100%',
              maxWidth: '480px',
              animation: 'slideInUp 0.4s ease-out'
            }}>
              <div style={{
                padding: '32px 32px 0 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#333'
                }}>
                  Invite Team Member
                </h3>
                <button
                  onClick={() => setShowInviteForm(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    background: 'rgba(0, 0, 0, 0.1)',
                    color: '#666',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: '24px 32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#333',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00d4ff';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 212, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={{ marginBottom: '32px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#333',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00d4ff';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 212, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="viewer">👁️ Viewer - Read-only access</option>
                    <option value="member">👤 Member - Standard access</option>
                    <option value="admin">👑 Admin - Full access</option>
                  </select>
                </div>
              </div>
              <div style={{
                padding: '20px 32px 32px 32px',
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                <button
                  onClick={() => setShowInviteForm(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(0, 0, 0, 0.1)',
                    color: '#666',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 212, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 212, 255, 0.3)';
                  }}
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TeamDashboard;