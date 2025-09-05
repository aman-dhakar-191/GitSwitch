import React, { useState } from 'react';
import { GitAccount } from '@gitswitch/types';
import './AccountManager.css';

interface AccountManagerProps {
  accounts: GitAccount[];
  onAccountAdded: (account: GitAccount) => void;
  onAccountUpdated: (account: GitAccount) => void;
  onAccountDeleted: (accountId: string) => void;
}

interface AccountFormData {
  name: string;
  email: string;
  gitName: string;
  description: string;
}

const AccountManager: React.FC<AccountManagerProps> = ({
  accounts,
  onAccountAdded,
  onAccountUpdated,
  onAccountDeleted
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<GitAccount | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [deviceCodeInfo, setDeviceCodeInfo] = useState<{code: string, url: string} | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    email: '',
    gitName: '',
    description: ''
  });

  const resetForm = () => {
    console.log('🔄 resetForm called');
    console.log('Resetting form data and hiding form');
    
    setFormData({
      name: '',
      email: '',
      gitName: '',
      description: ''
    });
    setEditingAccount(null);
    setShowForm(false);
    
    console.log('✅ resetForm completed - showForm should now be false');
  };

  const handleAddAccount = () => {
    console.log('🚀 Add Account button clicked!');
    console.log('Current showForm state:', showForm);
    console.log('About to set showForm to true and clear form for new account');
    
    // Clear form data for new account (but don't hide the form!)
    setFormData({
      name: '',
      email: '',
      gitName: '',
      description: ''
    });
    setEditingAccount(null);
    setShowForm(true);
    
    console.log('✅ handleAddAccount completed - showForm should now be true');
  };

  const handleOAuthLogin = async (provider: 'github' | 'gitlab' | 'bitbucket' | 'azure') => {
    try {
      console.log(`🔐 Starting ${provider} authentication...`);
      setOauthLoading(provider);
      
      // Show different message for GitHub device flow
      if (provider === 'github') {
        // Show immediate feedback for device flow
        const confirmDialog = window.confirm(
          `GitHub Authentication Process:\n\n` +
          `✨ We'll use GitHub's secure device flow:\n` +
          `1. We'll show you a device code\n` +
          `2. GitHub will open in your browser\n` +
          `3. Enter the device code on GitHub\n` +
          `4. Authorize GitSwitch\n\n` +
          `Ready to start?`
        );
        
        if (!confirmDialog) {
          setOauthLoading(null);
          return;
        }
      }
      
      const response = await window.electronAPI.invoke({
        type: 'START_OAUTH_FLOW',
        payload: { provider }
      });
      
      if (response.success && response.data) {
        console.log('✅ OAuth account added successfully:', response.data);
        onAccountAdded(response.data);
        setShowForm(false);
        setDeviceCodeInfo(null);
        
        // Show success message with account details
        const account = response.data;
        alert(`✅ Successfully connected!\n\nAccount: ${account.name}\nEmail: ${account.email}\nProvider: ${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
      } else {
        console.log('❌ OAuth authentication failed:', response.error);
        const errorMsg = response.error || 'Unknown error';
        
        // Provide better error messages
        let userFriendlyError = errorMsg;
        if (errorMsg.includes('not configured')) {
          userFriendlyError = `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not configured. Please contact support or use manual account creation.`;
        } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          userFriendlyError = 'Authentication timed out. Please try again and make sure to complete the authorization on GitHub.';
        } else if (errorMsg.includes('access_denied') || errorMsg.includes('cancelled')) {
          userFriendlyError = 'You cancelled the authentication. Please try again if you want to connect your account.';
        } else if (errorMsg.includes('authorization_pending')) {
          userFriendlyError = 'Please complete the authorization on GitHub and try again.';
        }
        
        alert('❌ Authentication failed: ' + userFriendlyError);
        setDeviceCodeInfo(null);
      }
    } catch (error) {
      console.error('❌ Error in OAuth flow:', error);
      alert('Failed to authenticate: ' + error);
      setDeviceCodeInfo(null);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleEditAccount = (account: GitAccount) => {
    setFormData({
      name: account.name,
      email: account.email,
      gitName: account.gitName,
      description: account.description || ''
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        const response = await window.electronAPI.invoke({
          type: 'DELETE_ACCOUNT',
          payload: { id: accountId }
        });
        
        if (response.success) {
          onAccountDeleted(accountId);
        } else {
          alert('Failed to delete account: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Failed to delete account: ' + error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('📝 Form submitted!');
    console.log('Form data:', formData);
    console.log('Editing account:', editingAccount);
    
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.gitName) {
      console.log('❌ Validation failed - missing required fields');
      alert('Please fill in all required fields');
      return;
    }

    console.log('✅ Form validation passed, proceeding with submission');

    try {
      if (editingAccount) {
        // Update existing account
        const response = await window.electronAPI.invoke({
          type: 'UPDATE_ACCOUNT',
          payload: {
            id: editingAccount.id,
            account: {
              name: formData.name,
              email: formData.email,
              gitName: formData.gitName,
              description: formData.description || undefined
            }
          }
        });
        
        if (response.success) {
          const updatedAccount: GitAccount = {
            ...editingAccount,
            name: formData.name,
            email: formData.email,
            gitName: formData.gitName,
            description: formData.description || undefined,
            updatedAt: new Date()
          };
          onAccountUpdated(updatedAccount);
          resetForm();
        } else {
          alert('Failed to update account: ' + (response.error || 'Unknown error'));
        }
      } else {
        // Add new account
        console.log('🆕 Adding new account via IPC...');
        
        const accountData = {
          name: formData.name,
          email: formData.email,
          gitName: formData.gitName,
          description: formData.description || undefined,
          // Stage 2 enhanced fields with defaults
          patterns: [],
          priority: 5,
          color: '#3b82f6',
          isDefault: false,
          usageCount: 0,
          lastUsed: new Date()
        };
        
        console.log('Account data to send:', accountData);
        
        const response = await window.electronAPI.invoke({
          type: 'ADD_ACCOUNT',
          payload: {
            account: accountData
          }
        });
        
        console.log('IPC response received:', response);
        
        if (response.success && response.data) {
          console.log('✅ Account added successfully:', response.data);
          onAccountAdded(response.data);
          resetForm();
        } else {
          console.log('❌ Failed to add account:', response.error);
          alert('Failed to add account: ' + (response.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Failed to save account: ' + error);
    }
  };

  // Debug logging
  React.useEffect(() => {
    console.log('🔄 AccountManager render - showForm:', showForm, 'accounts:', accounts.length);
  }, [showForm, accounts.length]);

  return (
    <div className="account-manager">
      <div className="account-header">
        <h2>Manage Git Accounts</h2>
        <button 
          className="btn btn-primary"
          onClick={handleAddAccount}
        >
          + Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="no-accounts">
          <p>No accounts configured yet.</p>
          <p>Add your first git account to get started.</p>
        </div>
      ) : (
        <div className="account-list">
          {accounts.map(account => (
            <div key={account.id} className="account-card card">
              <div className="account-info">
                <h3>{account.name}</h3>
                <div className="account-details">
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{account.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Git Name:</span>
                    <span className="value">{account.gitName}</span>
                  </div>
                  {account.description && (
                    <div className="detail-item">
                      <span className="label">Description:</span>
                      <span className="value">{account.description}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="account-actions">
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => handleEditAccount(account)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-error btn-small"
                  onClick={() => handleDeleteAccount(account.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
              <button 
                className="close-button"
                onClick={resetForm}
              >
                ✕
              </button>
            </div>
            
            {!editingAccount && (
              <div className="oauth-section">
                <h4>Connect your Git provider account</h4>
                <p className="oauth-description">
                  ✨ <strong>GitHub</strong>: One-click connection with secure device authentication (no setup needed)
                </p>
                <div className="oauth-providers">
                  <button 
                    type="button"
                    className="btn btn-oauth btn-github"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={oauthLoading !== null}
                  >
                    {oauthLoading === 'github' ? (
                      <span>🔄 Connecting...</span>
                    ) : (
                      <span>🐙 Connect GitHub Account</span>
                    )}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-oauth btn-gitlab"
                    onClick={() => handleOAuthLogin('gitlab')}
                    disabled={oauthLoading !== null}
                  >
                    {oauthLoading === 'gitlab' ? (
                      <span>🔄 Connecting...</span>
                    ) : (
                      <span>🦊 Sign in with GitLab</span>
                    )}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-oauth btn-bitbucket"
                    onClick={() => handleOAuthLogin('bitbucket')}
                    disabled={oauthLoading !== null}
                  >
                    {oauthLoading === 'bitbucket' ? (
                      <span>🔄 Connecting...</span>
                    ) : (
                      <span>🪣 Sign in with Bitbucket</span>
                    )}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-oauth btn-azure"
                    onClick={() => handleOAuthLogin('azure')}
                    disabled={oauthLoading !== null}
                  >
                    {oauthLoading === 'azure' ? (
                      <span>🔄 Connecting...</span>
                    ) : (
                      <span>🔷 Sign in with Azure DevOps</span>
                    )}
                  </button>
                </div>
                
                <div className="divider">
                  <span>or add manually</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Display Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., John Developer"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="e.g., john@company.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Git Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.gitName}
                  onChange={(e) => setFormData({...formData, gitName: e.target.value})}
                  placeholder="e.g., John Developer"
                  required
                />
                <small className="form-help">
                  This will be used as git user.name
                </small>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Description
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g., Work Account, Personal"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingAccount ? 'Update Account' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
