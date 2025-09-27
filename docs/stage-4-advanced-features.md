# GitSwitch Stage 4: Advanced Repository Features

## Overview

Stage 4 introduces advanced repository management capabilities that extend GitSwitch's core identity management with powerful cloning and transfer features. These features leverage GitHub OAuth authentication to provide seamless access to private repositories and enable sophisticated repository migration workflows.

## Feature 1: Private Repository Cloning with Account Selection

### Problem Statement

Developers working with multiple GitHub accounts often struggle with:
- Cloning private repositories that require specific account credentials
- Managing different SSH keys and OAuth tokens for different accounts
- Switching between personal and work accounts for repository access
- Manual credential configuration for each repository

### Solution: Enhanced Clone Command

GitSwitch will provide intelligent repository cloning with automatic account-based authentication.

### Technical Specifications

#### CLI Interface

```bash
# Basic cloning with account selection
gitswitch clone https://github.com/company/private-repo.git --account work

# Clone with custom destination
gitswitch clone git@github.com:user/private.git --account personal --path ./projects/personal

# Interactive mode with account picker
gitswitch clone --interactive

# Clone and auto-configure project
gitswitch clone https://github.com/org/repo.git --account work --auto-configure

# Batch clone multiple repositories
gitswitch clone --batch --config ./clone-config.json
```

#### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--account` | Account name to use for authentication | Interactive selection |
| `--path` | Destination directory | Repository name in current directory |
| `--branch` | Specific branch to clone | Default branch |
| `--depth` | Shallow clone depth | Full clone |
| `--interactive` | Show account selection UI | false |
| `--auto-configure` | Auto-add project to GitSwitch | true |
| `--ssh` | Force SSH cloning | Auto-detect from URL |
| `--https` | Force HTTPS cloning | Auto-detect from URL |

#### Desktop UI Components

1. **Clone Repository Dialog**
   - Repository URL input with validation
   - Account selection dropdown (GitHub authenticated accounts)
   - Destination folder picker
   - Advanced options (branch, depth, etc.)
   - Real-time clone progress with cancellation

2. **Account Authentication Status**
   - Visual indicators for OAuth token status
   - One-click token refresh
   - SSH key status per account

3. **Clone History**
   - Recent clones with quick re-clone options
   - Favorite repositories list
   - Clone templates and presets

### Implementation Architecture

#### Enhanced GitManager

```typescript
interface CloneOptions {
  accountId: string;
  destinationPath: string;
  branch?: string;
  depth?: number;
  sshKey?: string;
  oauthToken?: string;
}

class EnhancedGitManager extends GitManager {
  async cloneRepository(repoUrl: string, options: CloneOptions): Promise<CloneResult> {
    // 1. Validate account and authentication
    // 2. Prepare authentication (OAuth token or SSH key)
    // 3. Execute clone with proper credentials
    // 4. Auto-configure git identity
    // 5. Register project in GitSwitch
  }

  async authenticateUrl(repoUrl: string, account: GitAccount): Promise<string> {
    // Transform URL with OAuth token or return SSH URL with key config
  }
}
```

#### Authentication Flow

```typescript
interface CloneResult {
  success: boolean;
  projectPath?: string;
  projectId?: string;
  error?: string;
  authenticationUsed: 'oauth' | 'ssh' | 'public';
}

// OAuth HTTPS Authentication
async function cloneWithOAuth(repoUrl: string, account: GitAccount): Promise<CloneResult> {
  const authenticatedUrl = `https://${account.oauthToken}@github.com/owner/repo.git`;
  return executeClone(authenticatedUrl, options);
}

// SSH Key Authentication  
async function cloneWithSSH(repoUrl: string, account: GitAccount): Promise<CloneResult> {
  const sshEnv = {
    GIT_SSH_COMMAND: `ssh -i ${account.sshKeyPath} -o StrictHostKeyChecking=no`
  };
  return executeClone(repoUrl, { ...options, env: sshEnv });
}
```

## Feature 2: Repository Transfer Between Accounts

### Problem Statement

Developers need to transfer repositories between different accounts for various reasons:
- Moving personal projects to work accounts
- Transferring repositories between organizations
- Migrating from one hosting platform to another
- Changing repository ownership while preserving history

### Solution: Repository Transfer System

GitSwitch will provide comprehensive repository transfer capabilities with metadata preservation.

### Technical Specifications

#### CLI Interface

```bash
# Transfer to different account (same platform)
gitswitch transfer --from personal --to work ./my-project

# Transfer with new remote URL
gitswitch transfer --repo ./project --new-owner "company" --new-remote git@github.com:company/project.git

# Interactive transfer wizard
gitswitch transfer --interactive

# Cross-platform transfer
gitswitch transfer --from github-personal --to gitlab-work --create-remote

# Batch transfer multiple projects
gitswitch transfer --batch --config ./transfer-config.json

# Preview transfer changes (dry-run)
gitswitch transfer --preview --from work --to personal ./project
```

#### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--from` | Source account identifier | Current project account |
| `--to` | Target account identifier | Required |
| `--new-remote` | New remote URL | Generate from account |
| `--new-owner` | New repository owner | Target account name |
| `--preserve-history` | Keep full git history | true |
| `--create-remote` | Create new remote repository | false |
| `--interactive` | Show transfer wizard | false |
| `--preview` | Show changes without executing | false |
| `--backup` | Create backup before transfer | true |

#### Desktop UI Components

1. **Repository Transfer Wizard**
   - Project selection with current account info
   - Target account selection
   - Transfer type selection (same platform vs. cross-platform)
   - New repository settings (name, visibility, etc.)
   - Preview of all changes before execution

2. **Transfer Progress Dashboard**
   - Real-time progress tracking
   - Step-by-step status updates
   - Error handling with retry options
   - Rollback capabilities

3. **Transfer History**
   - Log of all transfers performed
   - Success/failure tracking
   - Easy rollback for recent transfers

### Implementation Architecture

#### Transfer Operations Manager

```typescript
interface TransferOptions {
  sourceAccountId: string;
  targetAccountId: string;
  newRemoteUrl?: string;
  newOwner?: string;
  preserveHistory: boolean;
  createRemote: boolean;
  backupFirst: boolean;
}

interface TransferStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
  canRetry: boolean;
  canRollback: boolean;
}

class RepositoryTransferManager {
  async transferRepository(
    projectPath: string, 
    options: TransferOptions
  ): Promise<TransferResult> {
    const steps: TransferStep[] = [
      { name: 'Validate Accounts', status: 'pending', progress: 0, canRetry: true, canRollback: false },
      { name: 'Create Backup', status: 'pending', progress: 0, canRetry: true, canRollback: true },
      { name: 'Update Remote URL', status: 'pending', progress: 0, canRetry: true, canRollback: true },
      { name: 'Switch Git Identity', status: 'pending', progress: 0, canRetry: false, canRollback: true },
      { name: 'Test Connectivity', status: 'pending', progress: 0, canRetry: true, canRollback: true },
      { name: 'Update Project Records', status: 'pending', progress: 0, canRetry: true, canRollback: true },
    ];

    return this.executeTransferSteps(projectPath, options, steps);
  }

  async rollbackTransfer(transferId: string): Promise<boolean> {
    // Restore from backup and revert all changes
  }
}
```

#### Transfer Workflow

```typescript
interface TransferResult {
  success: boolean;
  transferId: string;
  projectPath: string;
  oldAccount: GitAccount;
  newAccount: GitAccount;
  oldRemoteUrl?: string;
  newRemoteUrl?: string;
  backupPath?: string;
  steps: TransferStep[];
  rollbackAvailable: boolean;
  error?: string;
}

// Main transfer process
async function executeTransfer(projectPath: string, options: TransferOptions): Promise<TransferResult> {
  const transferId = generateTransferId();
  
  try {
    // Step 1: Validate accounts and permissions
    await validateAccounts(options.sourceAccountId, options.targetAccountId);
    
    // Step 2: Create backup if requested
    const backupPath = options.backupFirst 
      ? await createProjectBackup(projectPath)
      : undefined;
    
    // Step 3: Update remote URL
    if (options.newRemoteUrl) {
      await updateRemoteUrl(projectPath, options.newRemoteUrl);
    }
    
    // Step 4: Switch git identity
    const targetAccount = await getAccount(options.targetAccountId);
    await switchGitIdentity(projectPath, targetAccount);
    
    // Step 5: Test connectivity with new account
    await testRepositoryConnectivity(projectPath, targetAccount);
    
    // Step 6: Update GitSwitch project records
    await updateProjectRecord(projectPath, {
      accountId: options.targetAccountId,
      remoteUrl: options.newRemoteUrl
    });
    
    return {
      success: true,
      transferId,
      projectPath,
      oldAccount: await getAccount(options.sourceAccountId),
      newAccount: targetAccount,
      backupPath,
      rollbackAvailable: true
    };
    
  } catch (error) {
    // Automatic rollback on failure
    if (backupPath) {
      await restoreFromBackup(projectPath, backupPath);
    }
    
    throw error;
  }
}
```

## GitHub Authentication Improvements

### Current OAuth Implementation Enhancement

The existing `OAuthManager` provides a solid foundation but needs enhancement for these features:

#### Enhanced OAuth Flow

```typescript
interface EnhancedOAuthAccount extends GitAccount {
  // Enhanced GitHub-specific fields
  githubUsername: string;
  githubId: number;
  publicRepos: number;
  privateRepos: number;
  repositoryAccess: 'all' | 'selected';
  organizationMemberships: string[];
  scopes: string[];
  rateLimit: {
    remaining: number;
    resetTime: Date;
  };
}

class EnhancedOAuthManager extends OAuthManager {
  async authenticateForCloning(): Promise<EnhancedOAuthAccount> {
    // Request specific scopes: repo, read:org, user:email
    // Enhanced token with repository access verification
  }

  async verifyRepositoryAccess(repoUrl: string, account: EnhancedOAuthAccount): Promise<boolean> {
    // Pre-verify access before attempting clone
  }

  async refreshTokenIfNeeded(account: EnhancedOAuthAccount): Promise<boolean> {
    // Auto-refresh expired tokens
  }
}
```

#### GitHub API Integration

```typescript
interface GitHubAPIClient {
  async getUserRepositories(account: EnhancedOAuthAccount): Promise<Repository[]>;
  async getOrganizationRepositories(org: string, account: EnhancedOAuthAccount): Promise<Repository[]>;
  async createRepository(name: string, options: CreateRepoOptions, account: EnhancedOAuthAccount): Promise<Repository>;
  async transferRepository(owner: string, repo: string, newOwner: string, account: EnhancedOAuthAccount): Promise<boolean>;
  async checkRateLimit(account: EnhancedOAuthAccount): Promise<RateLimit>;
}

// Usage in transfer operations
async function createRemoteRepository(repoName: string, targetAccount: EnhancedOAuthAccount): Promise<string> {
  const github = new GitHubAPIClient();
  const newRepo = await github.createRepository(repoName, {
    private: true,
    description: 'Transferred from GitSwitch'
  }, targetAccount);
  
  return newRepo.cloneUrl;
}
```

### SSH Key Management Enhancement

```typescript
interface SSHKeyManager {
  async detectSSHKeys(account: GitAccount): Promise<string[]>;
  async validateSSHKey(keyPath: string, account: GitAccount): Promise<boolean>;
  async generateSSHKey(account: GitAccount): Promise<string>;
  async addSSHKeyToGitHub(keyPath: string, account: EnhancedOAuthAccount): Promise<boolean>;
}
```

## IPC Events Extension

### New IPC Events for Stage 4

```typescript
// Clone Operations
| { type: 'CLONE_REPOSITORY'; payload: { 
    repoUrl: string; 
    accountId: string; 
    options: CloneOptions 
  } }
| { type: 'GET_CLONE_HISTORY'; payload: null }
| { type: 'VALIDATE_REPOSITORY_ACCESS'; payload: { 
    repoUrl: string; 
    accountId: string 
  } }

// Transfer Operations  
| { type: 'TRANSFER_REPOSITORY'; payload: {
    projectPath: string;
    options: TransferOptions;
  } }
| { type: 'PREVIEW_TRANSFER'; payload: {
    projectPath: string;
    options: TransferOptions;
  } }
| { type: 'ROLLBACK_TRANSFER'; payload: { transferId: string } }
| { type: 'GET_TRANSFER_HISTORY'; payload: null }

// Enhanced Authentication
| { type: 'REFRESH_GITHUB_TOKEN'; payload: { accountId: string } }
| { type: 'VERIFY_ACCOUNT_ACCESS'; payload: { accountId: string } }
| { type: 'GET_GITHUB_REPOSITORIES'; payload: { 
    accountId: string; 
    includePrivate: boolean 
  } }
```

## Database Schema Extensions

### New Storage Models

```typescript
interface CloneRecord {
  id: string;
  repoUrl: string;
  localPath: string;
  accountId: string;
  clonedAt: Date;
  success: boolean;
  authMethod: 'oauth' | 'ssh' | 'public';
}

interface TransferRecord {
  id: string;
  projectPath: string;
  sourceAccountId: string;
  targetAccountId: string;
  oldRemoteUrl?: string;
  newRemoteUrl?: string;
  backupPath?: string;
  transferredAt: Date;
  success: boolean;
  rollbackAvailable: boolean;
  steps: TransferStep[];
}
```

## Success Criteria

### Feature 1: Private Repository Cloning
- [ ] Clone private repositories using GitHub OAuth tokens
- [ ] Clone private repositories using SSH keys
- [ ] Support for multiple account selection
- [ ] Real-time progress tracking in desktop app
- [ ] Automatic project registration in GitSwitch
- [ ] Error handling with helpful messages
- [ ] Clone history tracking and management

### Feature 2: Repository Transfer
- [ ] Transfer repositories between GitHub accounts
- [ ] Update remote URLs and git identity
- [ ] Preserve complete git history
- [ ] Backup and rollback capabilities
- [ ] Cross-platform transfer support (future)
- [ ] Batch transfer operations
- [ ] Transfer progress tracking with step details

### GitHub Authentication
- [ ] Enhanced OAuth scopes for repository access
- [ ] Automatic token refresh
- [ ] Pre-validation of repository access
- [ ] SSH key management integration
- [ ] Rate limit awareness and handling

## Implementation Timeline

### Phase 1: Core Infrastructure (Week 1-2)
- Extend GitManager with clone capabilities
- Enhance OAuthManager for repository operations
- Add new IPC events and handlers
- Create basic CLI commands

### Phase 2: Desktop UI (Week 3-4)
- Build clone repository dialog
- Create transfer wizard interface
- Add progress tracking components
- Implement account authentication status

### Phase 3: Advanced Features (Week 5-6)
- Add batch operations support
- Implement transfer rollback system
- Create GitHub API integration
- Add comprehensive error handling

### Phase 4: Testing & Polish (Week 7-8)
- Comprehensive unit testing
- Integration testing with real repositories
- UI/UX refinements
- Documentation and help system

## Technical Considerations

### Security
- OAuth tokens stored encrypted
- SSH keys secured with proper permissions
- No credentials logged or cached insecurely
- Rate limiting to prevent API abuse

### Performance  
- Efficient clone progress streaming
- Background token refresh
- Cached repository metadata
- Optimized git operations

### Cross-Platform
- Windows, macOS, Linux support
- PowerShell, Bash, Zsh compatibility
- Native file dialogs and notifications
- Platform-specific SSH key handling

### Error Recovery
- Graceful authentication failures
- Network interruption handling
- Partial clone recovery
- Transfer rollback mechanisms

## Future Enhancements

### Stage 5 Possibilities
- Multi-platform repository transfer (GitHub ↔ GitLab)
- Repository synchronization between accounts
- Advanced repository templates and scaffolding
- Team-based repository management
- Repository analytics and insights

This comprehensive feature set positions GitSwitch as the definitive solution for developers managing multiple git accounts and repositories across different platforms and organizations.