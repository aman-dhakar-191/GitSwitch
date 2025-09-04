import React, { useState } from 'react';
import { IPCEvent } from '@gitswitch/types';
import './SystemTrayControls.css';

interface SystemTrayControlsProps {
  currentProject?: any;
}

const SystemTrayControls: React.FC<SystemTrayControlsProps> = ({ currentProject }) => {
  const [notifications, setNotifications] = useState({
    enabled: true,
    silent: false
  });

  const updateTrayMenu = async () => {
    try {
      await window.electronAPI.invoke({
        type: 'UPDATE_TRAY_MENU',
        payload: { currentProject }
      });
    } catch (error) {
      console.error('Failed to update tray menu:', error);
    }
  };

  const showTestNotification = async () => {
    try {
      await window.electronAPI.invoke({
        type: 'SHOW_TRAY_NOTIFICATION',
        payload: {
          title: 'GitSwitch Test',
          content: 'This is a test notification from GitSwitch',
          silent: notifications.silent
        }
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

  const minimizeToTray = async () => {
    try {
      await window.electronAPI.invoke({
        type: 'MINIMIZE_TO_TRAY',
        payload: null
      });
    } catch (error) {
      console.error('Failed to minimize to tray:', error);
    }
  };

  return (
    <div className="system-tray-controls">
      <h3>🖥️ System Tray Integration</h3>
      
      <div className="tray-status">
        <div className="status-item">
          <span className="status-icon">✅</span>
          <span>System tray is active</span>
        </div>
        
        {currentProject && (
          <div className="status-item">
            <span className="status-icon">📁</span>
            <span>Current project: {currentProject.name}</span>
          </div>
        )}
      </div>

      <div className="tray-controls">
        <div className="control-section">
          <h4>Quick Actions</h4>
          <div className="button-group">
            <button 
              className="btn-secondary"
              onClick={updateTrayMenu}
              title="Refresh the system tray menu"
            >
              🔄 Update Tray Menu
            </button>
            
            <button 
              className="btn-secondary"
              onClick={minimizeToTray}
              title="Minimize GitSwitch to system tray"
            >
              📥 Minimize to Tray
            </button>
          </div>
        </div>

        <div className="control-section">
          <h4>Notifications</h4>
          <div className="notification-controls">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.enabled}
                onChange={(e) => setNotifications(prev => ({ ...prev, enabled: e.target.checked }))}
              />
              Enable tray notifications
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.silent}
                onChange={(e) => setNotifications(prev => ({ ...prev, silent: e.target.checked }))}
                disabled={!notifications.enabled}
              />
              Silent notifications (no sound)
            </label>
            
            <button 
              className="btn-primary"
              onClick={showTestNotification}
              disabled={!notifications.enabled}
            >
              🔔 Test Notification
            </button>
          </div>
        </div>

        <div className="control-section">
          <h4>Tray Features</h4>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <div className="feature-text">
                <strong>Quick Account Switching</strong>
                <p>Switch git identities directly from the tray menu</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <div className="feature-text">
                <strong>Recent Projects</strong>
                <p>Access your 5 most recent projects instantly</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <div className="feature-text">
                <strong>Quick Actions</strong>
                <p>Scan projects, manage accounts, view analytics</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🔔</span>
              <div className="feature-text">
                <strong>Smart Notifications</strong>
                <p>Get notified about identity switches and important events</p>
              </div>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h4>Usage Tips</h4>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-number">1</span>
              <span>Right-click the tray icon to access the context menu</span>
            </div>
            <div className="tip-item">
              <span className="tip-number">2</span>
              <span>Double-click to quickly show the main GitSwitch window</span>
            </div>
            <div className="tip-item">
              <span className="tip-number">3</span>
              <span>Closing the main window minimizes to tray (app keeps running)</span>
            </div>
            <div className="tip-item">
              <span className="tip-number">4</span>
              <span>Use 'Quit GitSwitch' from tray menu to completely exit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTrayControls;