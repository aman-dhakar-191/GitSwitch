import { OAuthManager } from '@gitswitch/core';
import { CLIUtils } from '../utils/CLIUtils';

/**
 * Common authentication utilities for CLI commands
 */
export class AuthUtils {
  private oauthManager: OAuthManager;

  constructor(oauthManager: OAuthManager) {
    this.oauthManager = oauthManager;
  }

  /**
   * Handle GitHub OAuth login flow
   */
  async loginWithGitHub(): Promise<void> {
    console.log('🚀 Starting GitHub authentication...\n');

    try {
      const account = await this.oauthManager.authenticateWithProvider(
        'github',
        async (userCode: string, verificationUri: string) => {
          console.log('🔗 Opening GitHub authorization in your browser...');
          console.log(`📋 User Code: ${userCode}`);
          console.log(`🌐 Verification URL: ${verificationUri}\n`);
          
          // Copy user code to clipboard
          await CLIUtils.copyToClipboard(userCode);
          
          console.log('👆 Please complete the authorization in your browser');
          console.log('🔄 Waiting for authorization...\n');
        }
      );
      
      console.log('✅ GitHub authentication successful!');
      console.log(`👤 Authenticated as: ${account.name} (${account.email})`);
      console.log('🔐 GitHub access token saved securely');
      
    } catch (error: any) {
      console.error('❌ Authentication error:', error.message);
      console.error('💡 Please try again or check your internet connection');
    }
  }

  /**
   * Logout from authentication providers
   */
  async handleLogout(storageManager: any): Promise<void> {
    const accounts = storageManager.getAccounts();
    const githubAccounts = accounts.filter((account: any) =>
      account.oauthProvider === 'github' && account.oauthToken
    );

    if (githubAccounts.length === 0) {
      console.log('❌ Not logged in to any providers');
      return;
    }

    // Create choices with "All accounts" option first, then individual accounts
    const choices = [
      { name: `🗑️  All accounts (${githubAccounts.length} accounts)`, value: 'all' },
      CLIUtils.createSeparator(),
      ...githubAccounts.map((account: any) => ({
        name: `👤 ${account.name} (${account.email})`,
        value: account.id
      })),
      CLIUtils.createSeparator(),
      { name: '🚫 Cancel', value: 'cancel' }
    ];

    const selectedOption = await CLIUtils.selectFromList(
      '🔐 Select accounts to logout from:',
      choices,
      15
    );

    if (selectedOption === 'cancel') {
      console.log('🚫 Logout cancelled');
      return;
    }

    let accountsToLogout: any[] = [];
    let confirmMessage = '';

    if (selectedOption === 'all') {
      accountsToLogout = githubAccounts;
      confirmMessage = `Are you sure you want to logout from all ${githubAccounts.length} account(s)?`;
    } else {
      // Single account selected
      const selectedAccount = githubAccounts.find((account: any) => account.id === selectedOption);
      if (!selectedAccount) {
        console.error('❌ Selected account not found');
        return;
      }
      accountsToLogout = [selectedAccount];
      confirmMessage = `Are you sure you want to logout from "${selectedAccount.name}" (${selectedAccount.email})?`;
    }

    // Final confirmation
    const shouldLogout = await CLIUtils.confirmAction(confirmMessage, false);

    if (!shouldLogout) {
      console.log('🚫 Logout cancelled');
      return;
    }

    // Perform logout for selected accounts
    console.log(`\n🔄 Logging out from ${accountsToLogout.length} account(s)...\n`);
    
    for (const account of accountsToLogout) {
      const updatedAccount = { ...account };
      delete updatedAccount.oauthToken;
      delete updatedAccount.oauthRefreshToken;
      delete updatedAccount.oauthExpiry;

      storageManager.deleteAccount(account.id);
      console.log(`  ✅ Logged out: ${account.name} (${account.email})`);
    }

    console.log(`\n✅ Successfully logged out from ${accountsToLogout.length} account(s)`);
  }

  /**
   * Show authentication status for all providers
   */
  showAuthStatus(storageManager: any): void {
    console.log('🔐 Authentication Status\n');

    const accounts = storageManager.getAccounts();
    const githubAccounts = accounts.filter((account: any) =>
      account.oauthProvider === 'github' && account.oauthToken
    );

    if (githubAccounts.length === 0) {
      console.log('❌ Not logged in to GitHub');
      console.log('💡 Run `gitswitch account login` to authenticate');
    } else {
      console.log(`✅ Logged in to GitHub (${githubAccounts.length} account${githubAccounts.length > 1 ? 's' : ''})\n`);

      githubAccounts.forEach((account: any, index: number) => {
        console.log(`  ${index + 1}. ${account.name} (${account.email})`);
        if (account.isDefault) {
          console.log(`     🌟 Default account`);
        }
        console.log(`     🔗 Provider: GitHub`);
        console.log('');
      });
    }
  }
}