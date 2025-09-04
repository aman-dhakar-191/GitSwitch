import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TeamConfiguration, TeamMember, ProjectRule, SecurityPolicy, RuleCondition } from '@gitswitch/types';
import { StorageManager } from './StorageManager';

/**
 * TeamManager - Stage 3 Enterprise Team Configuration Management
 * Handles team creation, member management, and project rules
 */
export class TeamManager {
  private storageManager: StorageManager;
  private readonly teamsFile: string;

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
    const dataDir = path.join(require('os').homedir(), '.gitswitch');
    this.teamsFile = path.join(dataDir, 'teams.json');
  }

  /**
   * Create a new team configuration
   */
  createTeam(teamData: Omit<TeamConfiguration, 'id' | 'sharedAt' | 'version' | 'updatedAt'>): TeamConfiguration {
    const teams = this.getTeams();
    
    const newTeam: TeamConfiguration = {
      ...teamData,
      id: this.generateId(),
      sharedAt: new Date(),
      version: 1,
      updatedAt: new Date()
    };

    teams.push(newTeam);
    this.saveTeams(teams);
    
    console.log(`✅ Created team: ${newTeam.name} (${newTeam.organization})`);
    return newTeam;
  }

  /**
   * Get all teams for current user
   */
  getTeams(): TeamConfiguration[] {
    try {
      if (!fs.existsSync(this.teamsFile)) {
        return [];
      }
      const data = fs.readFileSync(this.teamsFile, 'utf8');
      const teams = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return teams.map((team: any) => ({
        ...team,
        sharedAt: new Date(team.sharedAt),
        updatedAt: new Date(team.updatedAt),
        members: team.members.map((member: any) => ({
          ...member,
          joinedAt: new Date(member.joinedAt),
          lastActive: new Date(member.lastActive)
        })),
        projectRules: team.projectRules.map((rule: any) => ({
          ...rule,
          createdAt: new Date(rule.createdAt)
        })),
        policies: team.policies.map((policy: any) => ({
          ...policy,
          createdAt: new Date(policy.createdAt),
          updatedAt: new Date(policy.updatedAt)
        }))
      }));
    } catch (error) {
      console.error('Failed to load teams:', error);
      return [];
    }
  }

  /**
   * Update an existing team
   */
  updateTeam(teamId: string, updates: Partial<TeamConfiguration>): boolean {
    const teams = this.getTeams();
    const index = teams.findIndex(team => team.id === teamId);
    
    if (index === -1) {
      return false;
    }

    teams[index] = {
      ...teams[index],
      ...updates,
      id: teamId, // Ensure ID doesn't change
      version: teams[index].version + 1,
      updatedAt: new Date()
    };

    this.saveTeams(teams);
    console.log(`✅ Updated team: ${teams[index].name}`);
    return true;
  }

  /**
   * Delete a team
   */
  deleteTeam(teamId: string): boolean {
    const teams = this.getTeams();
    const filtered = teams.filter(team => team.id !== teamId);
    
    if (filtered.length === teams.length) {
      return false; // Team not found
    }

    this.saveTeams(filtered);
    console.log(`✅ Deleted team: ${teamId}`);
    return true;
  }

  /**
   * Add a member to a team
   */
  addTeamMember(teamId: string, memberData: Omit<TeamMember, 'id' | 'joinedAt' | 'lastActive'>): boolean {
    const teams = this.getTeams();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      return false;
    }

    const newMember: TeamMember = {
      ...memberData,
      id: this.generateId(),
      joinedAt: new Date(),
      lastActive: new Date()
    };

    team.members.push(newMember);
    team.version++;
    team.updatedAt = new Date();

    this.saveTeams(teams);
    console.log(`✅ Added member ${newMember.email} to team ${team.name}`);
    return true;
  }

  /**
   * Remove a member from a team
   */
  removeTeamMember(teamId: string, memberId: string): boolean {
    const teams = this.getTeams();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      return false;
    }

    const originalLength = team.members.length;
    team.members = team.members.filter(member => member.id !== memberId);
    
    if (team.members.length === originalLength) {
      return false; // Member not found
    }

    team.version++;
    team.updatedAt = new Date();

    this.saveTeams(teams);
    console.log(`✅ Removed member ${memberId} from team ${team.name}`);
    return true;
  }

  /**
   * Update a team member's role or permissions
   */
  updateTeamMember(teamId: string, memberId: string, updates: Partial<TeamMember>): boolean {
    const teams = this.getTeams();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      return false;
    }

    const memberIndex = team.members.findIndex(member => member.id === memberId);
    if (memberIndex === -1) {
      return false;
    }

    team.members[memberIndex] = {
      ...team.members[memberIndex],
      ...updates,
      id: memberId, // Ensure ID doesn't change
      lastActive: new Date()
    };

    team.version++;
    team.updatedAt = new Date();

    this.saveTeams(teams);
    console.log(`✅ Updated member ${memberId} in team ${team.name}`);
    return true;
  }

  /**
   * Add a project rule to a team
   */
  addProjectRule(teamId: string, ruleData: Omit<ProjectRule, 'id' | 'createdAt' | 'createdBy'>): boolean {
    const teams = this.getTeams();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      return false;
    }

    const newRule: ProjectRule = {
      ...ruleData,
      id: this.generateId(),
      createdAt: new Date(),
      createdBy: 'current-user' // Would get from auth context
    };

    team.projectRules.push(newRule);
    team.version++;
    team.updatedAt = new Date();

    this.saveTeams(teams);
    console.log(`✅ Added project rule to team ${team.name}: ${newRule.pattern}`);
    return true;
  }

  /**
   * Remove a project rule from a team
   */
  removeProjectRule(teamId: string, ruleId: string): boolean {
    const teams = this.getTeams();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      return false;
    }

    const originalLength = team.projectRules.length;
    team.projectRules = team.projectRules.filter(rule => rule.id !== ruleId);
    
    if (team.projectRules.length === originalLength) {
      return false; // Rule not found
    }

    team.version++;
    team.updatedAt = new Date();

    this.saveTeams(teams);
    console.log(`✅ Removed project rule ${ruleId} from team ${team.name}`);
    return true;
  }

  /**
   * Evaluate project rules for a given project
   */
  evaluateProjectRules(projectPath: string, remoteUrl?: string): ProjectRule[] {
    const teams = this.getTeams();
    const applicableRules: ProjectRule[] = [];

    for (const team of teams) {
      for (const rule of team.projectRules) {
        if (this.doesRuleMatch(rule, projectPath, remoteUrl)) {
          applicableRules.push(rule);
        }
      }
    }

    // Sort by priority (higher priority first)
    return applicableRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate a team share code for inviting members
   */
  generateShareCode(teamId: string): string {
    const team = this.getTeams().find(t => t.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const shareData = {
      teamId: team.id,
      teamName: team.name,
      organization: team.organization,
      invitedAt: new Date().toISOString()
    };

    const encoded = Buffer.from(JSON.stringify(shareData)).toString('base64');
    const signature = crypto.createHmac('sha256', 'gitswitch-team-secret')
      .update(encoded)
      .digest('hex')
      .substring(0, 8);

    return `${encoded}.${signature}`;
  }

  /**
   * Parse and validate a team share code
   */
  parseShareCode(shareCode: string): { teamId: string; teamName: string; organization: string; invitedAt: Date } | null {
    try {
      const [encoded, signature] = shareCode.split('.');
      
      // Verify signature
      const expectedSignature = crypto.createHmac('sha256', 'gitswitch-team-secret')
        .update(encoded)
        .digest('hex')
        .substring(0, 8);

      if (signature !== expectedSignature) {
        return null;
      }

      const shareData = JSON.parse(Buffer.from(encoded, 'base64').toString());
      return {
        ...shareData,
        invitedAt: new Date(shareData.invitedAt)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if current user has permission for a team action
   */
  hasPermission(teamId: string, userId: string, action: 'read' | 'write' | 'admin'): boolean {
    const team = this.getTeams().find(t => t.id === teamId);
    if (!team) {
      return false;
    }

    const member = team.members.find(m => m.id === userId);
    if (!member) {
      return false;
    }

    switch (action) {
      case 'read':
        return ['viewer', 'member', 'admin'].includes(member.role);
      case 'write':
        return ['member', 'admin'].includes(member.role);
      case 'admin':
        return member.role === 'admin';
      default:
        return false;
    }
  }

  // Private helper methods

  private saveTeams(teams: TeamConfiguration[]): boolean {
    try {
      const data = JSON.stringify(teams, null, 2);
      fs.writeFileSync(this.teamsFile, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save teams:', error);
      return false;
    }
  }

  private doesRuleMatch(rule: ProjectRule, projectPath: string, remoteUrl?: string): boolean {
    // Check main pattern
    const pathLower = projectPath.toLowerCase();
    const patternLower = rule.pattern.toLowerCase();

    let matches = false;

    if (remoteUrl && rule.pattern.includes('://')) {
      // URL pattern matching
      matches = remoteUrl.toLowerCase().includes(patternLower);
    } else {
      // Path pattern matching
      matches = pathLower.includes(patternLower) || 
                this.matchesGlobPattern(pathLower, patternLower);
    }

    if (!matches) {
      return false;
    }

    // Check additional conditions
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, projectPath, remoteUrl)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: RuleCondition, projectPath: string, remoteUrl?: string): boolean {
    let testValue = '';

    switch (condition.type) {
      case 'path_contains':
        testValue = projectPath;
        break;
      case 'remote_url':
        testValue = remoteUrl || '';
        break;
      case 'branch_name':
        // Would need to check current git branch
        testValue = 'main'; // Simplified for now
        break;
      case 'file_exists':
        testValue = fs.existsSync(path.join(projectPath, condition.value)) ? 'true' : 'false';
        break;
      case 'time_range':
        // Would implement time-based conditions
        return true; // Simplified for now
      default:
        return false;
    }

    if (!condition.caseSensitive) {
      testValue = testValue.toLowerCase();
    }

    switch (condition.operator) {
      case 'equals':
        return testValue === condition.value;
      case 'contains':
        return testValue.includes(condition.value);
      case 'matches':
        return new RegExp(condition.value).test(testValue);
      case 'not_equals':
        return testValue !== condition.value;
      default:
        return false;
    }
  }

  private matchesGlobPattern(text: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(text);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default TeamManager;