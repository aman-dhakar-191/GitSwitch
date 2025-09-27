/**
 * OAuth Authentication Manager for GitSwitch
 * Handles browser-based OAuth flow for Git hosting providers
 */

import { GitAccount } from '@gitswitch/types';
import { StorageManager } from './StorageManager';

export interface OAuthProvider {
  name: string;
  displayName: string;
  authUrl: string;
  tokenUrl: string;
  deviceAuthUrl: string;  // For device flow
  userUrl: string;
  clientId: string;
  clientSecret?: string;
  scope: string[];
  redirectUri: string;
  icon: string;
}

export interface OAuthAccount extends GitAccount {
  oauthProvider?: 'github' | 'gitlab' | 'bitbucket' | 'azure';
  oauthToken?: string;        // Encrypted access token
  oauthRefreshToken?: string; // Encrypted refresh token
  oauthExpiry?: Date;         // Token expiration
  avatarUrl?: string;         // User avatar from OAuth provider
  profileUrl?: string;        // User profile URL
  verified: boolean;          // Email verification status
}

export interface OAuthConfig {
  github: OAuthProvider;
  gitlab: OAuthProvider;
  bitbucket: OAuthProvider;
  azure: OAuthProvider;
}

export interface OAuthUserInfo {
  id: string;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
  profileUrl: string;
  verified: boolean;
}

export interface DeviceFlowResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope: string;
}

export class OAuthManager {
  private storageManager: StorageManager;
  private providers: OAuthConfig;
  private pendingAuth: Map<string, { resolve: Function; reject: Function }> = new Map();
  private callbackServer?: any;
  private callbackPort: number = 8080;

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
    this.providers = this.initializeProviders();
    this.callbackPort = 8080; // Use consistent port
  }

  private initializeProviders(): OAuthConfig {
    return {
      github: {
        name: 'github',
        displayName: 'GitHub',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        deviceAuthUrl: 'https://github.com/login/device/code',
        userUrl: 'https://api.github.com/user',
        clientId: 'Iv1.b507a08c87ecfe98', // GitHub CLI's public client ID (supports device flow)
        scope: ['user:email', 'read:user'],
        redirectUri: '', // Not needed for device flow
        icon: '🐙'
      },
      gitlab: {
        name: 'gitlab',
        displayName: 'GitLab',
        authUrl: 'https://gitlab.com/oauth/authorize',
        tokenUrl: 'https://gitlab.com/oauth/token',
        deviceAuthUrl: '', // GitLab doesn't support device flow yet
        userUrl: 'https://gitlab.com/api/v4/user',
        clientId: process.env.GITLAB_CLIENT_ID || 'your-gitlab-client-id',
        clientSecret: process.env.GITLAB_CLIENT_SECRET,
        scope: ['read_user'],
        redirectUri: `http://localhost:${this.callbackPort}/auth/callback`,
        icon: '🦊'
      },
      bitbucket: {
        name: 'bitbucket',
        displayName: 'Bitbucket',
        authUrl: 'https://bitbucket.org/site/oauth2/authorize',
        tokenUrl: 'https://bitbucket.org/site/oauth2/access_token',
        deviceAuthUrl: '', // Bitbucket doesn't support device flow
        userUrl: 'https://api.bitbucket.org/2.0/user',
        clientId: process.env.BITBUCKET_CLIENT_ID || 'your-bitbucket-client-id',
        clientSecret: process.env.BITBUCKET_CLIENT_SECRET,
        scope: ['account'],
        redirectUri: `http://localhost:${this.callbackPort}/auth/callback`,
        icon: '🪣'
      },
      azure: {
        name: 'azure',
        displayName: 'Azure DevOps',
        authUrl: 'https://app.vssps.visualstudio.com/oauth2/authorize',
        tokenUrl: 'https://app.vssps.visualstudio.com/oauth2/token',
        deviceAuthUrl: '', // Azure DevOps has different device flow
        userUrl: 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me',
        clientId: process.env.AZURE_CLIENT_ID || 'your-azure-client-id',
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        scope: ['vso.identity', 'vso.profile'],
        redirectUri: `http://localhost:${this.callbackPort}/auth/callback`,
        icon: '🔷'
      }
    };
  }

  /**
   * Get available OAuth providers
   */
  getProviders(): OAuthProvider[] {
    return Object.values(this.providers);
  }

  /**
   * Start OAuth authentication flow using GitHub Device Flow (no callback URL needed)
   */
  async authenticateWithProvider(providerName: keyof OAuthConfig): Promise<OAuthAccount> {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Unsupported OAuth provider: ${providerName}`);
    }

    // Use device flow for GitHub (more user-friendly, no callback URL needed)
    if (providerName === 'github' && provider.deviceAuthUrl) {
      return this.authenticateWithDeviceFlow(provider);
    }

    // Fallback to traditional OAuth flow for other providers
    return this.authenticateWithTraditionalFlow(provider);
  }

  /**
   * GitHub Device Flow Authentication (Recommended)
   */
  private async authenticateWithDeviceFlow(provider: OAuthProvider): Promise<OAuthAccount> {
    try {
      // Step 1: Request device and user codes
      const deviceResponse = await this.requestDeviceCode(provider);
      
      // Step 2: Show user code and open GitHub for authentication
      console.log(`🔐 GitHub Device Flow started`);
      console.log(`User code: ${deviceResponse.user_code}`);
      console.log(`Please visit: ${deviceResponse.verification_uri}`);
      
      // Show user-friendly dialog with device code
      const message = `GitHub Authentication Started!\n\n` +
                     `Device Code: ${deviceResponse.user_code}\n\n` +
                     `Steps:\n` +
                     `1. GitHub will open in your browser\n` +
                     `2. Enter the device code: ${deviceResponse.user_code}\n` +
                     `3. Click "Authorize GitSwitch" on GitHub\n` +
                     `4. Return to GitSwitch\n\n` +
                     `The code expires in ${Math.floor(deviceResponse.expires_in / 60)} minutes.`;
      
      console.log('\n' + '='.repeat(60));
      console.log(message);
      console.log('='.repeat(60) + '\n');
      
      // Open browser to GitHub's device verification page
      await this.openBrowser(deviceResponse.verification_uri);
      
      // Step 3: Poll for access token
      const tokenResponse = await this.pollForDeviceToken(provider, deviceResponse);
      
      // Step 4: Get user information
      const userInfo = await this.getUserInfo('github', tokenResponse.access_token);
      
      // Step 5: Create GitSwitch account
      const account = await this.createAccountFromOAuth('github', tokenResponse, userInfo);
      
      console.log(`✅ GitHub authentication successful for ${userInfo.login}`);
      return account;
      
    } catch (error) {
      console.error('❌ GitHub Device Flow failed:', error);
      throw error;
    }
  }

  /**
   * Request device code from GitHub
   */
  private async requestDeviceCode(provider: OAuthProvider): Promise<DeviceFlowResponse> {
    const response = await fetch(provider.deviceAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'GitSwitch/1.0',
      },
      body: JSON.stringify({
        client_id: provider.clientId,
        scope: provider.scope.join(' '),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to request device code: ${response.status} ${errorText}`);
    }

    return await response.json() as DeviceFlowResponse;
  }

  /**
   * Poll GitHub for access token after user authentication
   */
  private async pollForDeviceToken(provider: OAuthProvider, deviceResponse: DeviceFlowResponse): Promise<OAuthTokenResponse> {
    const pollInterval = Math.max(deviceResponse.interval * 1000, 5000); // Minimum 5 seconds
    const expirationTime = Date.now() + (deviceResponse.expires_in * 1000);
    
    console.log(`⏳ Polling for authorization completion every ${pollInterval/1000} seconds...`);
    
    return new Promise((resolve, reject) => {
      const pollTimer = setInterval(async () => {
        try {
          if (Date.now() > expirationTime) {
            clearInterval(pollTimer);
            reject(new Error('Authentication timed out. Please try again.'));
            return;
          }

          console.log('🔄 Checking authorization status...');
          
          const response = await fetch(provider.tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
              'User-Agent': 'GitSwitch/1.0',
            },
            body: new URLSearchParams({
              client_id: provider.clientId,
              device_code: deviceResponse.device_code,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
          });

          const responseText = await response.text();
          console.log('📡 Poll response status:', response.status);
          console.log('📡 Poll response body:', responseText);
          
          let result: any;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            // Handle URL-encoded response
            if (responseText.includes('access_token=')) {
              const urlParams = new URLSearchParams(responseText);
              result = {
                access_token: urlParams.get('access_token'),
                token_type: urlParams.get('token_type') || 'bearer',
                scope: urlParams.get('scope'),
                error: urlParams.get('error'),
                error_description: urlParams.get('error_description')
              };
            } else {
              console.error('❌ Failed to parse response:', responseText);
              return; // Continue polling
            }
          }

          if (result.error) {
            if (result.error === 'authorization_pending') {
              console.log('⏳ Authorization still pending...');
              return; // Continue polling
            } else if (result.error === 'slow_down') {
              console.log('🐌 Slowing down polling...');
              clearInterval(pollTimer);
              setTimeout(() => {
                this.pollForDeviceToken(provider, deviceResponse)
                  .then(resolve)
                  .catch(reject);
              }, pollInterval * 2);
              return;
            } else {
              console.error('❌ OAuth error:', result.error, result.error_description);
              clearInterval(pollTimer);
              reject(new Error(`Authentication failed: ${result.error_description || result.error}`));
              return;
            }
          }

          // Success!
          if (result.access_token) {
            console.log('✅ Authorization successful! Got access token.');
            clearInterval(pollTimer);
            resolve({
              access_token: result.access_token,
              token_type: result.token_type || 'bearer',
              scope: result.scope || provider.scope.join(' '),
            });
          } else {
            console.log('⚠️ No access token in response, continuing to poll...');
          }
          
        } catch (error) {
          console.error('❌ Error during polling:', error);
          clearInterval(pollTimer);
          reject(error);
        }
      }, pollInterval);
    });
  }

  /**
   * Traditional OAuth flow (fallback for non-GitHub providers)
   */
  private async authenticateWithTraditionalFlow(provider: OAuthProvider): Promise<OAuthAccount> {
    // Check if client ID is configured
    if (!provider.clientId || provider.clientId.includes('your-')) {
      throw new Error(`${provider.displayName} OAuth is not configured. Please set up your OAuth app credentials.`);
    }

    const state = this.generateState(provider.name);
    const authUrl = this.buildAuthUrl(provider, state);

    // Start local callback server if not already running
    if (!this.callbackServer) {
      await this.startCallbackServer();
    }

    return new Promise((resolve, reject) => {
      // Store promise handlers for callback
      this.pendingAuth.set(state, { resolve, reject });

      // Open browser with OAuth URL
      this.openBrowser(authUrl);

      // Set timeout for auth flow
      setTimeout(() => {
        if (this.pendingAuth.has(state)) {
          this.pendingAuth.delete(state);
          reject(new Error('OAuth authentication timeout. Please try again.'));
        }
      }, 300000); // 5 minutes timeout
    });
  }

  /**
   * Handle OAuth callback from browser
   */
  async handleOAuthCallback(code: string, state: string, provider: keyof OAuthConfig): Promise<void> {
    const pendingAuth = this.pendingAuth.get(state);
    if (!pendingAuth) {
      throw new Error('Invalid or expired OAuth state');
    }

    try {
      // Exchange code for token
      const tokenResponse = await this.exchangeCodeForToken(provider, code);
      
      // Get user information
      const userInfo = await this.getUserInfo(provider, tokenResponse.access_token);
      
      // Create GitSwitch account
      const account = await this.createAccountFromOAuth(provider, tokenResponse, userInfo);
      
      // Resolve the pending promise
      pendingAuth.resolve(account);
      this.pendingAuth.delete(state);
      
      // Keep server running for potential future auth flows
      
    } catch (error) {
      pendingAuth.reject(error);
      this.pendingAuth.delete(state);
      throw error;
    }
  }

  private async startCallbackServer(): Promise<void> {
    // Import Express dynamically to avoid loading it unless needed
    const express = require('express');
    const app = express();

    app.get('/auth/callback', async (req: any, res: any) => {
      const { code, state, error, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        const pendingAuth = this.pendingAuth.get(state);
        if (pendingAuth) {
          pendingAuth.reject(new Error(`OAuth error: ${error_description || error}`));
          this.pendingAuth.delete(state);
        }
        
        res.status(400).send(`
          <html>
            <head><title>GitSwitch - Authentication Error</title></head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
              <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                <h2 style="color: #d32f2f; margin-bottom: 20px;">❌ Authentication Error</h2>
                <p style="color: #666; margin-bottom: 20px;">${error_description || 'Authentication was cancelled or failed.'}</p>
                <button onclick="window.close()" style="background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
                <script>setTimeout(() => window.close(), 5000);</script>
              </div>
            </body>
          </html>
        `);
        return;
      }

      if (!code || !state) {
        res.status(400).send(`
          <html>
            <head><title>GitSwitch - Authentication Error</title></head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
              <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                <h2 style="color: #d32f2f; margin-bottom: 20px;">❌ Authentication Error</h2>
                <p style="color: #666; margin-bottom: 20px;">Missing required parameters. Please try again.</p>
                <button onclick="window.close()" style="background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
                <script>setTimeout(() => window.close(), 5000);</script>
              </div>
            </body>
          </html>
        `);
        return;
      }

      try {
        // Determine provider from state or default to github
        const provider = (state.includes('_') ? state.split('_')[0] : 'github') as keyof OAuthConfig;
        
        await this.handleOAuthCallback(code as string, state as string, provider);
        
        res.send(`
          <html>
            <head><title>GitSwitch - Authentication Successful</title></head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
              <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                <h2 style="color: #4caf50; margin-bottom: 20px;">✅ Authentication Successful!</h2>
                <p style="color: #666; margin-bottom: 10px;">Your GitHub account has been added to GitSwitch.</p>
                <p style="color: #999; margin-bottom: 20px;">You can now close this window and return to GitSwitch.</p>
                <button onclick="window.close()" style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
                <script>setTimeout(() => window.close(), 3000);</script>
              </div>
            </body>
          </html>
        `);
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        const pendingAuth = this.pendingAuth.get(state);
        if (pendingAuth) {
          pendingAuth.reject(error);
          this.pendingAuth.delete(state);
        }
        
        res.status(500).send(`
          <html>
            <head><title>GitSwitch - Authentication Failed</title></head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
              <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                <h2 style="color: #d32f2f; margin-bottom: 20px;">❌ Authentication Failed</h2>
                <p style="color: #666; margin-bottom: 10px;">Error: ${error.message}</p>
                <p style="color: #999; margin-bottom: 20px;">Please try again or contact support if the problem persists.</p>
                <button onclick="window.close()" style="background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
                <script>setTimeout(() => window.close(), 5000);</script>
              </div>
            </body>
          </html>
        `);
      }
    });

    return new Promise((resolve, reject) => {
      this.callbackServer = app.listen(this.callbackPort, (err?: Error) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`🔐 OAuth callback server started on http://localhost:${this.callbackPort}`);
        resolve();
      });
    });
  }

  private stopCallbackServer(): void {
    if (this.callbackServer) {
      this.callbackServer.close();
      this.callbackServer = null;
      console.log('🔐 OAuth callback server stopped');
    }
  }

  private generateState(provider?: string): string {
    const randomId = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
    return provider ? `${provider}_${randomId}` : randomId;
  }

  private buildAuthUrl(provider: OAuthProvider, state: string): string {
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      scope: provider.scope.join(' '),
      state: state,
      response_type: 'code',
    });

    return `${provider.authUrl}?${params.toString()}`;
  }

  private async openBrowser(url: string): Promise<void> {
    // Open URL using Node.js child_process
    const { exec } = require('child_process');
    const platform = require('os').platform();
    
    let command = '';
    if (platform === 'darwin') {
      command = `open "${url}"`;
    } else if (platform === 'win32') {
      command = `start "" "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }
    
    exec(command, (error: any) => {
      if (error) {
        console.error('Failed to open URL:', error);
        console.log('Please open this URL in your browser:', url);
      }
    });
  }

  private async exchangeCodeForToken(
    providerName: keyof OAuthConfig, 
    code: string
  ): Promise<OAuthTokenResponse> {
    const provider = this.providers[providerName];
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: provider.clientId,
      code: code,
      redirect_uri: provider.redirectUri,
    });

    // Add client secret if available (for confidential clients)
    if (provider.clientSecret) {
      params.append('client_secret', provider.clientSecret);
    }

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'GitSwitch/1.0',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange error:', errorText);
      
      // Handle specific GitHub errors
      if (errorText.includes('bad_verification_code')) {
        throw new Error('Invalid authorization code. Please try signing in again.');
      } else if (errorText.includes('incorrect_client_credentials')) {
        throw new Error('OAuth app configuration error. Please check your client credentials.');
      } else {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
    }

    const responseText = await response.text();
    try {
      return JSON.parse(responseText) as OAuthTokenResponse;
    } catch (parseError) {
      // GitHub sometimes returns URL-encoded response
      if (responseText.includes('access_token=')) {
        const urlParams = new URLSearchParams(responseText);
        return {
          access_token: urlParams.get('access_token') || '',
          refresh_token: urlParams.get('refresh_token') || undefined,
          expires_in: urlParams.get('expires_in') ? parseInt(urlParams.get('expires_in')!) : undefined,
          token_type: urlParams.get('token_type') || 'bearer',
          scope: urlParams.get('scope') || '',
        };
      }
      throw new Error('Invalid token response format');
    }
  }

  private async getUserInfo(
    providerName: keyof OAuthConfig, 
    accessToken: string
  ): Promise<OAuthUserInfo> {
    const provider = this.providers[providerName];
    
    const response = await fetch(provider.userUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitSwitch/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('User info error:', errorText);
      throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
    }

    const userData: any = await response.json();
    
    // For GitHub, also fetch email if not public
    if (providerName === 'github' && !(userData as any).email) {
      try {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitSwitch/1.0',
          },
        });
        
        if (emailResponse.ok) {
          const emails = await emailResponse.json() as any[];
          const primaryEmail = emails.find((email: any) => email.primary);
          if (primaryEmail) {
            (userData as any).email = primaryEmail.email;
            (userData as any).verified = primaryEmail.verified;
          }
        }
      } catch (emailError) {
        console.warn('Could not fetch user email:', emailError);
      }
    }
    
    // Normalize user data across different providers
    return this.normalizeUserData(providerName, userData);
  }

  private normalizeUserData(
    providerName: keyof OAuthConfig, 
    userData: any
  ): OAuthUserInfo {
    switch (providerName) {
      case 'github':
        return {
          id: userData.id.toString(),
          login: userData.login,
          name: userData.name || userData.login,
          email: userData.email,
          avatarUrl: userData.avatar_url,
          profileUrl: userData.html_url,
          verified: userData.verified || false,
        };
      
      case 'gitlab':
        return {
          id: userData.id.toString(),
          login: userData.username,
          name: userData.name || userData.username,
          email: userData.email,
          avatarUrl: userData.avatar_url,
          profileUrl: userData.web_url,
          verified: userData.confirmed_at !== null,
        };
      
      case 'bitbucket':
        return {
          id: userData.account_id,
          login: userData.username,
          name: userData.display_name || userData.username,
          email: userData.email,
          avatarUrl: userData.links?.avatar?.href,
          profileUrl: userData.links?.html?.href,
          verified: userData.email_verified || false,
        };
      
      case 'azure':
        return {
          id: userData.id,
          login: userData.emailAddress,
          name: userData.displayName,
          email: userData.emailAddress,
          avatarUrl: userData.coreAttributes?.Avatar?.value?.value,
          profileUrl: userData._links?.self?.href,
          verified: true, // Azure accounts are typically verified
        };
      
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }

  private async createAccountFromOAuth(
    providerName: keyof OAuthConfig,
    tokenResponse: OAuthTokenResponse,
    userInfo: OAuthUserInfo
  ): Promise<OAuthAccount> {
    const provider = this.providers[providerName];
    
    // Use email if available, otherwise use login@github.com as fallback
    const email = userInfo.email || `${userInfo.login}@users.noreply.github.com`;
    
    console.log(`📧 Using email: ${email} (original: ${userInfo.email || 'not provided'})`);
    
    const account: OAuthAccount = {
      id: this.generateAccountId(),
      name: userInfo.name || userInfo.login,
      email: email,
      gitName: userInfo.name || userInfo.login,
      description: `${provider.displayName} Account (${userInfo.login})`,
      
      // OAuth specific fields
      oauthProvider: providerName,
      oauthToken: tokenResponse.access_token,
      oauthRefreshToken: tokenResponse.refresh_token,
      oauthExpiry: tokenResponse.expires_in ? 
        new Date(Date.now() + tokenResponse.expires_in * 1000) : undefined,
      avatarUrl: userInfo.avatarUrl,
      profileUrl: userInfo.profileUrl,
      verified: userInfo.verified,
      
      // GitSwitch enhanced fields
      sshKeyPath: undefined,
      patterns: this.generateInitialPatterns(providerName, userInfo),
      priority: 5,
      color: this.getProviderColor(providerName),
      isDefault: false,
      usageCount: 0,
      lastUsed: new Date(),
      
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save the account
    const savedAccount = this.storageManager.addAccount(account) as OAuthAccount;
    
    console.log(`✅ OAuth account created successfully for ${userInfo.login} (${email})`);
    
    return savedAccount;
  }

  private generateAccountId(): string {
    return 'oauth_' + Math.random().toString(36).substring(2, 15);
  }

  private generateInitialPatterns(
    providerName: keyof OAuthConfig,
    userInfo: OAuthUserInfo
  ): string[] {
    const patterns: string[] = [];
    
    switch (providerName) {
      case 'github':
        patterns.push(`*github.com/${userInfo.login}/*`);
        patterns.push(`*github.com/*/${userInfo.login}/*`);
        break;
      case 'gitlab':
        patterns.push(`*gitlab.com/${userInfo.login}/*`);
        patterns.push(`*gitlab.com/*/${userInfo.login}/*`);
        break;
      case 'bitbucket':
        patterns.push(`*bitbucket.org/${userInfo.login}/*`);
        break;
      case 'azure':
        patterns.push(`*dev.azure.com/*`);
        patterns.push(`*visualstudio.com/*`);
        break;
    }
    
    return patterns;
  }

  private getProviderColor(providerName: keyof OAuthConfig): string {
    const colors = {
      github: '#24292e',
      gitlab: '#fc6d26',
      bitbucket: '#0052cc',
      azure: '#0078d4',
    };
    
    return colors[providerName] || '#3b82f6';
  }

  /**
   * Refresh OAuth token if expired
   */
  async refreshToken(account: OAuthAccount): Promise<OAuthAccount> {
    if (!account.oauthProvider || !account.oauthRefreshToken) {
      throw new Error('Account does not support token refresh');
    }

    const provider = this.providers[account.oauthProvider];
    if (!provider) {
      throw new Error(`Provider ${account.oauthProvider} not found`);
    }

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.oauthRefreshToken,
          client_id: provider.clientId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokenData: OAuthTokenResponse = await response.json() as OAuthTokenResponse;
      
      // Update account with new tokens
      const updatedAccount: OAuthAccount = {
        ...account,
        oauthToken: tokenData.access_token,
        oauthRefreshToken: tokenData.refresh_token || account.oauthRefreshToken,
        oauthExpiry: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
        updatedAt: new Date()
      };

      // Save updated account
      this.storageManager.updateAccount(updatedAccount.id, updatedAccount);
      
      return updatedAccount;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Validate if OAuth token is still valid
   */
  async validateToken(account: OAuthAccount): Promise<boolean> {
    if (!account.oauthToken || !account.oauthProvider) {
      return false;
    }

    // Check expiry if available
    if (account.oauthExpiry && account.oauthExpiry < new Date()) {
      return false;
    }

    const provider = this.providers[account.oauthProvider];
    if (!provider) {
      return false;
    }

    try {
      const response = await fetch(provider.userUrl, {
        headers: {
          'Authorization': `Bearer ${account.oauthToken}`,
          'Accept': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(account: OAuthAccount): Promise<void> {
    if (!account.oauthToken || !account.oauthProvider) {
      return;
    }

    const provider = this.providers[account.oauthProvider];
    if (!provider) {
      return;
    }

    try {
      // Different providers have different revocation endpoints
      let revokeUrl: string | null = null;
      switch (account.oauthProvider) {
        case 'github':
          revokeUrl = `https://api.github.com/applications/${provider.clientId}/token`;
          break;
        case 'gitlab':
          revokeUrl = 'https://gitlab.com/oauth/revoke';
          break;
        default:
          // For providers without specific revoke endpoints, just clear locally
          break;
      }

      if (revokeUrl) {
        await fetch(revokeUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.oauthToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: account.oauthToken,
          }),
        });
      }
    } catch (error) {
      console.warn('Token revocation failed:', error);
    }
  }
}

export default OAuthManager;