import React, { useState } from 'react';
import { GitAccount } from '@gitswitch/types';

const navItems = [
  { text: 'Dashboard', icon: '📊', key: 'dashboard' },
  { text: 'Project', icon: '📁', key: 'project' },
  { text: 'Accounts', icon: '👤', key: 'accounts' },
  { text: 'Analytics', icon: '📈', key: 'analytics' },
  { text: 'Hooks', icon: '🔗', key: 'hooks' },
  { text: 'Teams', icon: '🏢', key: 'teams' },
  { text: 'Tray', icon: '💻', key: 'tray' },
  { text: 'UI Demo', icon: '🎨', key: 'demo' },
];

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  accounts: GitAccount[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, accounts }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    security: false,
    settings: false
  });
  
  const defaultAccounts = accounts.filter(acc => acc.isDefault).length;
  
  const handleSectionClick = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const styles = `
    @keyframes slideInLeft {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div style={{
        width: '280px',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '60px',
          height: '60px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '40px',
          height: '40px',
          background: 'rgba(0,212,255,0.1)',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite reverse'
        }}></div>

        <div style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRight: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 20px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '800',
              color: '#00d4ff',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              animation: 'float 3s ease-in-out infinite'
            }}>
              GS
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '800',
                color: 'white',
                lineHeight: 1
              }}>
                GitSwitch
              </h1>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '500'
              }}>
                Account Manager
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div style={{
            flex: 1,
            padding: '16px 8px',
            overflowY: 'auto'
          }}>
            {navItems.map((item, index) => (
              <div
                key={item.key}
                onClick={() => onViewChange(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  margin: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: currentView === item.key 
                    ? 'rgba(0, 212, 255, 0.25)' 
                    : 'transparent',
                  border: currentView === item.key 
                    ? '1px solid rgba(0, 212, 255, 0.5)' 
                    : '1px solid transparent',
                  animation: `slideInLeft 0.6s ease-out ${index * 0.05}s both`,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (currentView !== item.key) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== item.key) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span style={{
                  fontSize: '20px',
                  marginRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px'
                }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: currentView === item.key ? '700' : '500',
                  color: currentView === item.key ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  flex: 1
                }}>
                  {item.text}
                </span>
                {item.key === 'accounts' && defaultAccounts > 0 && (
                  <div style={{
                    background: '#00d4ff',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {defaultAccounts}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px'
          }}>
            {/* Security Section */}
            <div
              onClick={() => handleSectionClick('security')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 8px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '20px', marginRight: '12px' }}>🛡️</span>
              <span style={{
                fontSize: '16px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                flex: 1
              }}>
                Security
              </span>
              <span style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.6)',
                transform: openSections.security ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </span>
            </div>

            {/* Security Submenu */}
            {openSections.security && (
              <div style={{
                paddingLeft: '20px',
                animation: 'slideInLeft 0.3s ease-out'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  margin: '2px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}>
                  <span style={{ fontSize: '16px', marginRight: '12px' }}>🔒</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    Password
                  </span>
                </div>
              </div>
            )}

            {/* Other Menu Items */}
            {[
              { icon: '🔔', text: 'Notifications' },
              { icon: '👤', text: 'Profile' }
            ].map((item, index) => (
              <div
                key={item.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  margin: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '20px', marginRight: '12px' }}>{item.icon}</span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;