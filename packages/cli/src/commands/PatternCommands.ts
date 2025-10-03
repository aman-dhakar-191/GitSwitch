import { Command } from 'commander';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';
import { SmartDetector } from '@gitswitch/core';

/**
 * AI-powered pattern learning commands (Phase 3 - Q3 2024)
 */
export class PatternCommands extends BaseCommand implements ICommand {
  private smartDetector: SmartDetector;

  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any,
    smartDetector: SmartDetector
  ) {
    super(gitManager, storageManager, projectManager);
    this.smartDetector = smartDetector;
  }

  register(program: Command): void {
    const patternCmd = program
      .command('pattern')
      .description('AI-powered pattern learning and management');

    this.registerLearnCommand(patternCmd);
    this.registerSuggestCommand(patternCmd);
    this.registerExportCommand(patternCmd);
    this.registerImportCommand(patternCmd);
    this.registerListCommand(patternCmd);
  }

  private registerLearnCommand(patternCmd: Command): void {
    patternCmd
      .command('learn')
      .description('Learn patterns from current repository usage')
      .option('--analyze-all', 'Analyze all tracked projects')
      .option('--min-confidence <value>', 'Minimum confidence threshold', '0.7')
      .action(async (options) => {
        try {
          console.log(`🧠 Learning patterns from repository usage...`);

          const projects = this.storageManager.getProjects();
          const accounts = this.storageManager.getAccounts();

          if (projects.length === 0) {
            console.log('⚠️  No projects tracked yet');
            console.log('   Scan projects first: gitswitch project scan');
            return;
          }

          console.log(`\n📊 Analyzing ${projects.length} projects...`);

          // Learn patterns
          const patterns = await this.smartDetector.learnPatternsFromUsage();

          console.log(`\n✅ Pattern learning complete`);
          console.log(`\n📈 Learned Patterns:`);

          patterns.forEach((pattern, idx) => {
            console.log(`\n${idx + 1}. Pattern: ${pattern.pattern}`);
            console.log(`   Type: ${pattern.type}`);
            console.log(`   Account: ${pattern.accountEmail}`);
            console.log(`   Confidence: ${Math.round(pattern.confidence * 100)}%`);
            console.log(`   Usage count: ${pattern.usageCount}`);
            console.log(`   Examples:`);
            pattern.examples?.slice(0, 3).forEach((ex: string) => {
              console.log(`      • ${ex}`);
            });
          });

          console.log(`\n💡 Tips:`);
          console.log(`   • Patterns improve as you use more repositories`);
          console.log(`   • Review patterns: gitswitch pattern list`);
          console.log(`   • Export patterns: gitswitch pattern export`);

        } catch (error: any) {
          CLIUtils.showError('Pattern learning failed', error);
        }
      });
  }

  private registerSuggestCommand(patternCmd: Command): void {
    patternCmd
      .command('suggest')
      .description('Get pattern-based account suggestions')
      .argument('[url-or-path]', 'URL or path to analyze', process.cwd())
      .option('--explain', 'Show detailed explanation')
      .option('--json', 'Output as JSON')
      .action(async (urlOrPath, options) => {
        try {
          console.log(`🔍 Analyzing patterns for: ${urlOrPath}`);

          // Determine if it's a URL or path
          const isUrl = urlOrPath.includes('://') || urlOrPath.includes('@');
          
          let suggestions;
          if (isUrl) {
            suggestions = await this.smartDetector.suggestAccountForUrl(urlOrPath);
          } else {
            suggestions = await this.smartDetector.suggestAccountForPath(urlOrPath);
          }

          if (options.json) {
            console.log(JSON.stringify(suggestions, null, 2));
            return;
          }

          if (suggestions.length === 0) {
            console.log(`\n⚠️  No pattern matches found`);
            console.log(`   Consider adding more account patterns or using more repositories`);
            return;
          }

          console.log(`\n🎯 Account Suggestions (${suggestions.length}):`);
          console.log(`${'='.repeat(50)}`);

          suggestions.forEach((suggestion, idx) => {
            const confidence = Math.round(suggestion.confidence * 100);
            const stars = '★'.repeat(Math.ceil(confidence / 20));
            
            console.log(`\n${idx + 1}. ${suggestion.account.name} <${suggestion.account.email}>`);
            console.log(`   Confidence: ${confidence}% ${stars}`);
            console.log(`   Reason: ${suggestion.reason}`);
            
            if (options.explain) {
              console.log(`   Usage history: ${suggestion.usageHistory} times`);
              console.log(`   Pattern match: ${suggestion.patternMatch || 'N/A'}`);
            }
          });

          const top = suggestions[0];
          console.log(`\n✅ Recommended: ${top.account.email}`);

        } catch (error: any) {
          CLIUtils.showError('Pattern suggestion failed', error);
        }
      });
  }

  private registerExportCommand(patternCmd: Command): void {
    patternCmd
      .command('export')
      .description('Export learned patterns')
      .option('-o, --output <file>', 'Output file', 'gitswitch-patterns.json')
      .option('--format <type>', 'Export format (json, yaml)', 'json')
      .action(async (options) => {
        try {
          console.log(`📤 Exporting patterns...`);

          const patterns = await this.smartDetector.getLearnedPatterns();
          const accounts = this.storageManager.getAccounts();

          const exportData = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            accounts: accounts.map(acc => ({
              email: acc.email,
              name: acc.name,
              // Don't export sensitive data
            })),
            patterns: patterns.map(p => ({
              pattern: p.pattern,
              type: p.type,
              accountEmail: p.accountEmail,
              confidence: p.confidence,
              usageCount: p.usageCount,
              examples: p.examples
            }))
          };

          let content: string;
          let filename = options.output;

          if (options.format === 'yaml') {
            // Simple YAML conversion (not using external lib for minimal changes)
            content = this.convertToYaml(exportData);
            if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
              filename = filename.replace('.json', '.yaml');
            }
          } else {
            content = JSON.stringify(exportData, null, 2);
          }

          fs.writeFileSync(filename, content, 'utf8');

          console.log(`✅ Patterns exported successfully`);
          console.log(`📁 Location: ${path.resolve(filename)}`);
          console.log(`\n📊 Export summary:`);
          console.log(`   Accounts: ${exportData.accounts.length}`);
          console.log(`   Patterns: ${exportData.patterns.length}`);
          console.log(`   Format: ${options.format}`);

        } catch (error: any) {
          CLIUtils.showError('Pattern export failed', error);
        }
      });
  }

  private registerImportCommand(patternCmd: Command): void {
    patternCmd
      .command('import')
      .description('Import patterns from file')
      .argument('<file>', 'File to import from')
      .option('--merge', 'Merge with existing patterns', true)
      .option('--overwrite', 'Overwrite existing patterns')
      .action(async (file, options) => {
        try {
          if (!fs.existsSync(file)) {
            console.log(`⚠️  File not found: ${file}`);
            return;
          }

          console.log(`📥 Importing patterns from: ${file}`);

          const content = fs.readFileSync(file, 'utf8');
          let importData;

          try {
            // Try JSON first
            importData = JSON.parse(content);
          } catch (e) {
            // Could try YAML parsing here
            console.log('⚠️  Failed to parse import file. Ensure it is valid JSON.');
            return;
          }

          if (!importData.patterns || !Array.isArray(importData.patterns)) {
            console.log('⚠️  Invalid import format. Missing patterns array.');
            return;
          }

          console.log(`\n📊 Import preview:`);
          console.log(`   Patterns: ${importData.patterns.length}`);
          console.log(`   Accounts: ${importData.accounts?.length || 0}`);

          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Import these patterns?',
              default: true
            }
          ]);

          if (!confirm) {
            console.log('Import cancelled');
            return;
          }

          // Import patterns
          const imported = await this.smartDetector.importPatterns(
            importData.patterns,
            options.merge && !options.overwrite
          );

          console.log(`\n✅ Patterns imported successfully`);
          console.log(`   Imported: ${imported.success} patterns`);
          
          if (imported.skipped > 0) {
            console.log(`   Skipped: ${imported.skipped} (duplicates)`);
          }

          if (imported.errors > 0) {
            console.log(`   Errors: ${imported.errors}`);
          }

        } catch (error: any) {
          CLIUtils.showError('Pattern import failed', error);
        }
      });
  }

  private registerListCommand(patternCmd: Command): void {
    patternCmd
      .command('list')
      .description('List all learned patterns')
      .option('--account <email>', 'Filter by account')
      .option('--type <type>', 'Filter by type (url, path, domain)')
      .option('--min-confidence <value>', 'Minimum confidence', '0.0')
      .action(async (options) => {
        try {
          let patterns = await this.smartDetector.getLearnedPatterns();

          // Apply filters
          if (options.account) {
            patterns = patterns.filter(p => p.accountEmail === options.account);
          }

          if (options.type) {
            patterns = patterns.filter(p => p.type === options.type);
          }

          if (options.minConfidence) {
            const minConf = parseFloat(options.minConfidence);
            patterns = patterns.filter(p => p.confidence >= minConf);
          }

          if (patterns.length === 0) {
            console.log('No patterns found matching criteria');
            console.log('\n💡 Learn patterns: gitswitch pattern learn');
            return;
          }

          console.log(`\n📋 Learned Patterns (${patterns.length})`);
          console.log(`${'='.repeat(50)}`);

          // Group by account
          const byAccount = new Map<string, typeof patterns>();
          patterns.forEach(p => {
            if (!byAccount.has(p.accountEmail)) {
              byAccount.set(p.accountEmail, []);
            }
            byAccount.get(p.accountEmail)!.push(p);
          });

          byAccount.forEach((accountPatterns, email) => {
            console.log(`\n📧 ${email}`);
            
            accountPatterns.forEach((pattern, idx) => {
              const confidence = Math.round(pattern.confidence * 100);
              console.log(`   ${idx + 1}. ${pattern.pattern}`);
              console.log(`      Type: ${pattern.type}`);
              console.log(`      Confidence: ${confidence}%`);
              console.log(`      Usage: ${pattern.usageCount} times`);
            });
          });

          console.log(`\n💡 Commands:`);
          console.log(`   • Test pattern: gitswitch pattern suggest <url>`);
          console.log(`   • Export patterns: gitswitch pattern export`);

        } catch (error: any) {
          CLIUtils.showError('Pattern list failed', error);
        }
      });
  }

  private convertToYaml(obj: any, indent: number = 0): string {
    const spaces = ' '.repeat(indent);
    let yaml = '';

    for (const key in obj) {
      const value = obj[key];
      
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.convertToYaml(item, indent + 4)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n${this.convertToYaml(value, indent + 2)}`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }
}
