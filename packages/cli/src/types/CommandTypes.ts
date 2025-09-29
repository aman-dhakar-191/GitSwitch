import { Command } from 'commander';

/**
 * Interface for all CLI command classes
 */
export interface ICommand {
  /**
   * Register the command and its subcommands with the commander program
   */
  register(program: Command): void;
}

/**
 * Configuration for command registration
 */
export interface CommandConfig {
  name: string;
  description: string;
  aliases?: string[];
}

/**
 * Standard command options
 */
export interface CommandOptions {
  help?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  account?: any;
  error?: string;
}

/**
 * Import result interface
 */
export interface ImportResult {
  projectsImported: number;
  accountsCreated: number;
  patternsCreated: number;
  errors: string[];
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  message: string;
  suggestedAccount?: any;
}

/**
 * Project analysis result interface
 */
export interface ProjectAnalysis {
  project: any;
  gitConfig?: any;
  suggestions: any[];
  healthScore: number;
  issues: string[];
}

/**
 * Base command action function signature
 */
export type CommandAction<T = any> = (options: T, ...args: any[]) => Promise<void> | void;