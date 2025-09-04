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
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    email: '',
    gitName: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      gitName: '',
      description: ''
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleAddAccount = () => {
    setShowForm(true);
    resetForm();
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
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.gitName) {
      alert('Please fill in all required fields');
      return;
    }

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
        const response = await window.electronAPI.invoke({
          type: 'ADD_ACCOUNT',
          payload: {
            account: {
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
            }
          }
        });
        
        if (response.success && response.data) {
          onAccountAdded(response.data);
          resetForm();
        } else {
          alert('Failed to add account: ' + (response.error || 'Unknown error'));
        }
      }
    } catch (error) {
      alert('Failed to save account: ' + error);
    }
  };

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
