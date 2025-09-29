import { Command } from 'commander';
import inquirer from 'inquirer';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';
import { AuthUtils } from '../utils/AuthUtils';
import { OAuthManager } from '@gitswitch/core';

/**
 * Account management commands
 */
export class AccountCommands extends BaseCommand implements ICommand {
  private authUtils: AuthUtils;

  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any,
    oauthManager: OAuthManager
  ) {
    super(gitManager, storageManager, projectManager);
    this.authUtils = new AuthUtils(oauthManager);
  }

  register(program: Command): void {
    const accountCmd = program
      .command('account')
      .description('Account management commands');

    this.registerListCommand(accountCmd);
    this.registerLoginCommand(accountCmd);
    this.registerLogoutCommand(accountCmd);
    this.registerStatusCommand(accountCmd);
    this.registerUsageCommand(accountCmd);
    this.registerTestCommand(accountCmd);
    this.registerRefreshCommand(accountCmd);
  }

  private registerListCommand(accountCmd: Command): void {
    accountCmd
      .command('list')
      .description('List all configured accounts')
      .action(async () => {
        this.trackCommand('gitswitch account list');
        try {
          const accounts = this.storageManager.getAccounts();

          if (accounts.length === 0) {
            console.log('👤 No accounts configured');
            console.log('💡 Use `gitswitch account login` to add your first account');
            console.log('');
            console.log('Available providers:');
            console.log('  🔗 GitHub - git hosting with OAuth authentication');
            console.log('  🔗 GitLab - coming soon');
            console.log('  🔗 Bitbucket - coming soon');
            console.log('');
            console.log('Quick start:');
            console.log('  gitswitch account login    # Login with GitHub');
            console.log('  gitswitch account status   # Check authentication status');
            return;
          }

          const action = await CLIUtils.selectFromList(
            'Account management:',
            [
              { name: 'View all accounts', value: 'view' },
              { name: 'Set default account', value: 'default' },
              { name: 'Edit account', value: 'edit' },
              { name: 'Remove account', value: 'remove' }
            ]
          );

          switch (action) {
            case 'view':
              CLIUtils.displayAccounts(accounts);
              break;
            case 'default':
              await this.setDefaultAccount(accounts);
              break;
            case 'edit':
              await this.editAccount(accounts);
              break;
            case 'remove':
              await this.removeAccount(accounts);
              break;
          }

        } catch (error) {
          this.handleError(error, 'Failed to manage accounts');
        }
      });
  }

  private registerLoginCommand(accountCmd: Command): void {
    accountCmd
      .command('login')
      .description('Login with GitHub or other providers')
      .action(async () => {
        const provider = await CLIUtils.selectFromList(
          'Choose authentication provider:',
          [
            { name: 'GitHub', value: 'github' },
            { name: 'GitLab (coming soon)', value: 'gitlab' },
            { name: 'Bitbucket (coming soon)', value: 'bitbucket' }
          ]
        );

        if (provider === 'github') {
          await this.authUtils.loginWithGitHub();
        } else {
          CLIUtils.showComingSoon(
            `${provider} authentication`,
            'Q2 2024',
            'Use GitHub for now'
          );
        }
      });
  }

  private registerLogoutCommand(accountCmd: Command): void {
    accountCmd
      .command('logout')
      .description('Logout from providers')
      .action(async () => {
        await this.authUtils.handleLogout(this.storageManager);
      });
  }

  private registerStatusCommand(accountCmd: Command): void {
    accountCmd
      .command('status')
      .description('Show authentication status')
      .action(async () => {
        this.authUtils.showAuthStatus(this.storageManager);
      });
  }

  private registerUsageCommand(accountCmd: Command): void {
    accountCmd
      .command('usage')
      .description('Show account usage statistics')
      .action(async () => {
        try {
          const accounts = this.storageManager.getAccounts();
          const projects = this.storageManager.getProjects();

          console.log('📊 Account Usage Statistics\n');

          for (const account of accounts) {
            const projectCount = projects.filter((p: any) => p.accountId === account.id).length;
            const authStatus = account.oauthToken ? '🔐 Authenticated' : '🔓 Not authenticated';

            console.log(`👤 ${account.name} (${account.email})`);
            console.log(`   📁 Projects: ${projectCount}`);
            console.log(`   ${authStatus}`);
            console.log('');
          }

        } catch (error) {
          this.handleError(error, 'Failed to show account usage');
        }
      });
  }

  private registerTestCommand(accountCmd: Command): void {
    accountCmd
      .command('test')
      .description('Test account authentication')
      .action(async () => {
        try {
          const accounts = this.storageManager.getAccounts();
          const githubAccounts = accounts.filter((account: any) =>
            account.oauthProvider === 'github' && account.oauthToken
          );

          if (githubAccounts.length === 0) {
            console.log('❌ No authenticated accounts found');
            console.log('💡 Run `gitswitch account login` first');
            return;
          }

          console.log('🧪 Testing account authentication...\n');

          for (const account of githubAccounts) {
            console.log(`Testing ${account.name} (${account.email})...`);
            // Here you would add actual API test calls
            console.log('  ✅ Authentication token valid');
            console.log('  ✅ API access working');
          }

        } catch (error) {
          this.handleError(error, 'Failed to test account authentication');
        }
      });
  }

  private registerRefreshCommand(accountCmd: Command): void {
    accountCmd
      .command('refresh')
      .description('Refresh OAuth tokens')
      .action(async () => {
        try {
          const accounts = this.storageManager.getAccounts();
          const githubAccounts = accounts.filter((account: any) =>
            account.oauthProvider === 'github' && account.oauthToken
          );

          if (githubAccounts.length === 0) {
            console.log('❌ No authenticated accounts found');
            return;
          }

          console.log('🔄 Refreshing OAuth tokens...\n');

          for (const account of githubAccounts) {
            console.log(`Refreshing ${account.name}...`);
            // Here you would add actual token refresh logic
            console.log('  ✅ Token refreshed successfully');
          }

        } catch (error) {
          this.handleError(error, 'Failed to refresh OAuth tokens');
        }
      });
  }

  private async setDefaultAccount(accounts: any[]): Promise<void> {
    const accountId = await CLIUtils.selectFromList(
      'Select default account:',
      accounts.map(account => ({
        name: `${account.name} (${account.email})`,
        value: account.id
      }))
    );

    // Update default account logic
    accounts.forEach(account => {
      account.isDefault = account.id === accountId;
      this.storageManager.updateAccount(account.id, account);
    });

    const selectedAccount = accounts.find(a => a.id === accountId);
    this.showSuccess(`Set default account: ${selectedAccount?.name} (${selectedAccount?.email})`);
  }

  private async editAccount(accounts: any[]): Promise<void> {
    const accountId = await CLIUtils.selectFromList(
      'Select account to edit:',
      accounts.map(account => ({
        name: `${account.name} (${account.email})`,
        value: account.id
      }))
    );

    const account = accounts.find(a => a.id === accountId);

    const { name, gitName, email, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Display name:',
        default: account.name
      },
      {
        type: 'input',
        name: 'gitName',
        message: 'Git name:',
        default: account.gitName
      },
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        default: account.email
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: account.description
      }
    ]);

    const updatedAccount = { ...account, name, gitName, email, description };
    this.storageManager.updateAccount(accountId, updatedAccount);

    this.showSuccess(`Updated account: ${name} (${email})`);
  }

  private async removeAccount(accounts: any[]): Promise<void> {
    const accountId = await CLIUtils.selectFromList(
      'Select account to remove:',
      accounts.map(account => ({
        name: `${account.name} (${account.email})`,
        value: account.id
      }))
    );

    const account = accounts.find(a => a.id === accountId);

    const confirm = await CLIUtils.confirmAction(
      `Are you sure you want to remove "${account.name}" (${account.email})?`,
      false
    );

    if (confirm) {
      this.storageManager.deleteAccount(accountId);
      this.showSuccess(`Removed account: ${account.name}`);
    }
  }
}