import React, { useState } from 'react';

interface TopAppBarProps {
  onMenuToggle: () => void;
  onViewChange: (view: string) => void;
}

const TopAppBar: React.FC<TopAppBarProps> = ({ onMenuToggle, onViewChange }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const styles = `
    @keyframes slideInDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  const notifications = [
    {
      title: 'New account added',
      description: "John's work account was successfully added",
      time: '2 minutes ago'
    },
    {
      title: 'Identity switched',
      description: 'Git identity changed for project "my-app"',
      time: '15 minutes ago'
    },
    {
      title: 'Backup completed',
      description: 'Your account settings were backed up successfully',
      time: '1 hour ago'
    }
  ];

  return (
    <>
      <style>{styles}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: '280px',
        right: 0,
        height: '64px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overflow: 'hidden',
        zIndex: 1100
      }}>
        {/* Floating Background Elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '30px',
          height: '30px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '20%',
          width: '25px',
          height: '25px',
          background: 'rgba(0,212,255,0.1)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        <div style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          animation: 'slideInDown 0.6s ease-out'
        }}>
          {/* Menu Toggle */}
          <button
            onClick={onMenuToggle}
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px',
              transition: 'all 0.3s ease',
              fontSize: '18px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            ☰
          </button>

          {/* Title */}
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '800',
            background: 'linear-gradient(90deg, #00d4ff, #ffffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginRight: '24px'
          }}>
            GitSwitch
          </h1>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '8px 16px',
            marginRight: '24px',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            minWidth: '300px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 212, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <span style={{
              fontSize: '16px',
              marginRight: '12px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search projects, accounts..."
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                flex: 1,
                fontWeight: '500'
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                fontSize: '18px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'rotate(15deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  fontSize: '18px',
                  position: 'relative',
                  animation: 'pulse 2s infinite'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                🔔
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#00d4ff',
                  color: 'white',
                  borderRadius: '10px',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  3
                </div>
              </button>

              {/* Notifications Dropdown */}
              {showNotificationMenu && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  width: '350px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  animation: 'slideInDown 0.3s ease-out',
                  zIndex: 2000
                }}>
                  {notifications.map((notification, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '16px 20px',
                        borderBottom: index < notifications.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none'
                      }}
                    >
                      <h4 style={{
                        margin: '0 0 4px 0',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#333'
                      }}>
                        {notification.title}
                      </h4>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '12px',
                        color: '#666',
                        lineHeight: '1.4'
                      }}>
                        {notification.description}
                      </p>
                      <span style={{
                        fontSize: '11px',
                        color: '#999'
                      }}>
                        {notification.time}
                      </span>
                    </div>
                  ))}
                  <div style={{ padding: '12px 20px' }}>
                    <button style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}>
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              onClick={() => onViewChange('settings')}
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                fontSize: '18px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ⚙️
            </button>

            {/* Help */}
            <button
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                fontSize: '18px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ❓
            </button>

            {/* Profile */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  fontSize: '16px',
                  fontWeight: '700',
                  boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 212, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 212, 255, 0.3)';
                }}
              >
                JD
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  width: '280px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  animation: 'slideInDown 0.3s ease-out',
                  zIndex: 2000
                }}>
                  <div style={{ padding: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '700',
                        marginRight: '12px'
                      }}>
                        JD
                      </div>
                      <div>
                        <                        h3 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#333'
                        }}>
                          John Developer
                        </h3>
                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          john@example.com
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                    {[
                      { icon: '👤', text: 'Profile' },
                      { icon: '⚙️', text: 'Settings' },
                      { icon: '🚪', text: 'Logout' }
                    ].map((item, index) => (
                      <div
                        key={item.text}
                        style={{
                          padding: '12px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderBottom: index < 2 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{
                          fontSize: '16px',
                          marginRight: '12px'
                        }}>
                          {item.icon}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#333'
                        }}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopAppBar;