import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';

/**
 * Performance monitoring and optimization commands (Phase 3 - Q3 2024)
 */
export class PerfCommands extends BaseCommand implements ICommand {
  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any
  ) {
    super(gitManager, storageManager, projectManager);
  }

  register(program: Command): void {
    const perfCmd = program
      .command('perf')
      .description('Performance monitoring and optimization');

    this.registerAnalyzeCommand(perfCmd);
    this.registerOptimizeCommand(perfCmd);
    this.registerBenchmarkCommand(perfCmd);
  }

  private registerAnalyzeCommand(perfCmd: Command): void {
    perfCmd
      .command('analyze')
      .description('Analyze GitSwitch performance')
      .option('--detailed', 'Show detailed analysis')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          console.log(`📊 Analyzing GitSwitch performance...`);

          const startTime = Date.now();

          // Collect performance metrics
          const metrics: any = {
            timestamp: new Date().toISOString(),
            system: {
              platform: process.platform,
              nodeVersion: process.version,
              memory: process.memoryUsage(),
              uptime: process.uptime()
            },
            storage: {},
            operations: {}
          };

          // Storage metrics
          const dataDir = path.join(require('os').homedir(), '.gitswitch');
          if (fs.existsSync(dataDir)) {
            const files = fs.readdirSync(dataDir);
            let totalSize = 0;
            
            files.forEach(file => {
              const filePath = path.join(dataDir, file);
              try {
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                  totalSize += stats.size;
                }
              } catch (e) {
                // Skip files we can't read
              }
            });

            metrics.storage = {
              files: files.length,
              totalSize: totalSize,
              totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
              location: dataDir
            };
          }

          // Operation metrics
          const accounts = this.storageManager.getAccounts();
          const projects = this.storageManager.getProjects();
          
          metrics.operations = {
            accounts: accounts.length,
            projects: projects.length,
            averageProjectSize: projects.length > 0 
              ? (metrics.storage.totalSize / projects.length).toFixed(0) 
              : 0
          };

          // Benchmark key operations
          const benchmarks: any = {};
          
          // Test account loading
          const accountLoadStart = Date.now();
          this.storageManager.getAccounts();
          benchmarks.accountLoad = Date.now() - accountLoadStart;

          // Test project loading
          const projectLoadStart = Date.now();
          this.storageManager.getProjects();
          benchmarks.projectLoad = Date.now() - projectLoadStart;

          metrics.benchmarks = benchmarks;
          metrics.analysisDuration = Date.now() - startTime;

          // Output results
          if (options.json) {
            console.log(JSON.stringify(metrics, null, 2));
            return;
          }

          console.log(`\n📈 Performance Analysis Results`);
          console.log(`${'='.repeat(50)}`);

          console.log(`\n💾 System Information:`);
          console.log(`   Platform: ${metrics.system.platform}`);
          console.log(`   Node version: ${metrics.system.nodeVersion}`);
          console.log(`   Memory usage: ${(metrics.system.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

          console.log(`\n📁 Storage Metrics:`);
          console.log(`   Files: ${metrics.storage.files}`);
          console.log(`   Total size: ${metrics.storage.totalSizeMB} MB`);
          console.log(`   Location: ${metrics.storage.location}`);

          console.log(`\n🎯 Operations:`);
          console.log(`   Accounts: ${metrics.operations.accounts}`);
          console.log(`   Projects: ${metrics.operations.projects}`);

          console.log(`\n⚡ Performance Benchmarks:`);
          console.log(`   Account load: ${benchmarks.accountLoad}ms`);
          console.log(`   Project load: ${benchmarks.projectLoad}ms`);

          // Performance assessment
          console.log(`\n🎭 Performance Assessment:`);
          
          const issues = [];
          if (benchmarks.accountLoad > 100) {
            issues.push('Account loading is slow (>100ms)');
          }
          if (benchmarks.projectLoad > 200) {
            issues.push('Project loading is slow (>200ms)');
          }
          if (metrics.storage.totalSize > 10 * 1024 * 1024) {
            issues.push('Storage size is large (>10MB)');
          }

          if (issues.length === 0) {
            console.log(`   ✅ All operations performing well`);
          } else {
            console.log(`   ⚠️  Performance issues detected:`);
            issues.forEach(issue => console.log(`      • ${issue}`));
            console.log(`\n   💡 Run: gitswitch perf optimize`);
          }

          if (options.detailed) {
            console.log(`\n📊 Detailed Metrics:`);
            console.log(`   Analysis duration: ${metrics.analysisDuration}ms`);
            console.log(`   Memory (RSS): ${(metrics.system.memory.rss / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Memory (Heap): ${(metrics.system.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Memory (Used): ${(metrics.system.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
          }

        } catch (error: any) {
          CLIUtils.showError('Performance analysis failed', error);
        }
      });
  }

  private registerOptimizeCommand(perfCmd: Command): void {
    perfCmd
      .command('optimize')
      .description('Optimize GitSwitch performance')
      .option('--clean-cache', 'Clean cached data')
      .option('--compact-storage', 'Compact storage files')
      .option('--dry-run', 'Show what would be done without making changes')
      .action(async (options) => {
        try {
          console.log(`🔧 Optimizing GitSwitch performance...`);

          const actions = [];
          const dataDir = path.join(require('os').homedir(), '.gitswitch');

          // Clean cache
          if (options.cleanCache || !options.compactStorage) {
            const cacheDir = path.join(dataDir, 'cache');
            if (fs.existsSync(cacheDir)) {
              const files = fs.readdirSync(cacheDir);
              actions.push({
                action: 'Clean cache',
                files: files.length,
                execute: () => {
                  files.forEach(file => {
                    fs.unlinkSync(path.join(cacheDir, file));
                  });
                }
              });
            }
          }

          // Compact storage
          if (options.compactStorage || !options.cleanCache) {
            actions.push({
              action: 'Compact accounts',
              execute: () => {
                const accounts = this.storageManager.getAccounts();
                this.storageManager.saveAccounts(accounts);
              }
            });

            actions.push({
              action: 'Compact projects',
              execute: () => {
                const projects = this.storageManager.getProjects();
                this.storageManager.saveProjects(projects);
              }
            });
          }

          // Remove duplicate entries
          actions.push({
            action: 'Remove duplicate projects',
            execute: () => {
              const projects = this.storageManager.getProjects();
              const seen = new Set();
              const unique = projects.filter((p: any) => {
                if (seen.has(p.path)) {
                  return false;
                }
                seen.add(p.path);
                return true;
              });
              
              if (unique.length < projects.length) {
                this.storageManager.saveProjects(unique);
                return projects.length - unique.length;
              }
              return 0;
            }
          });

          if (options.dryRun) {
            console.log(`\n📋 Optimization plan (dry run):`);
            actions.forEach((action, idx) => {
              console.log(`   ${idx + 1}. ${action.action}`);
            });
            console.log(`\n💡 Run without --dry-run to apply changes`);
            return;
          }

          // Execute optimizations
          console.log(`\n🚀 Executing optimizations...`);
          
          const results: any[] = [];
          for (const action of actions) {
            try {
              console.log(`   • ${action.action}...`);
              const result = action.execute ? action.execute() : 0;
              results.push({ action: action.action, success: true, result });
            } catch (error: any) {
              results.push({ action: action.action, success: false, error: error.message });
            }
          }

          console.log(`\n✅ Optimization complete`);
          console.log(`\n📊 Results:`);
          
          results.forEach(result => {
            if (result.success) {
              console.log(`   ✅ ${result.action}`);
              if (result.result) {
                console.log(`      Cleaned: ${result.result} items`);
              }
            } else {
              console.log(`   ❌ ${result.action}`);
              console.log(`      Error: ${result.error}`);
            }
          });

          console.log(`\n💡 Run: gitswitch perf analyze`);

        } catch (error: any) {
          CLIUtils.showError('Optimization failed', error);
        }
      });
  }

  private registerBenchmarkCommand(perfCmd: Command): void {
    perfCmd
      .command('benchmark')
      .description('Run performance benchmarks')
      .option('--iterations <n>', 'Number of iterations', '100')
      .option('--operation <type>', 'Operation to benchmark (all, account, project)', 'all')
      .action(async (options) => {
        try {
          const iterations = parseInt(options.iterations);
          console.log(`⚡ Running performance benchmarks (${iterations} iterations)...`);

          const results: any = {};

          // Benchmark account operations
          if (options.operation === 'all' || options.operation === 'account') {
            console.log(`\n📧 Benchmarking account operations...`);
            
            const accountTimes: number[] = [];
            for (let i = 0; i < iterations; i++) {
              const start = Date.now();
              this.storageManager.getAccounts();
              accountTimes.push(Date.now() - start);
            }

            results.accountOperations = {
              iterations,
              min: Math.min(...accountTimes),
              max: Math.max(...accountTimes),
              avg: accountTimes.reduce((a, b) => a + b, 0) / accountTimes.length,
              median: accountTimes.sort((a, b) => a - b)[Math.floor(accountTimes.length / 2)]
            };
          }

          // Benchmark project operations
          if (options.operation === 'all' || options.operation === 'project') {
            console.log(`\n📁 Benchmarking project operations...`);
            
            const projectTimes: number[] = [];
            for (let i = 0; i < iterations; i++) {
              const start = Date.now();
              this.storageManager.getProjects();
              projectTimes.push(Date.now() - start);
            }

            results.projectOperations = {
              iterations,
              min: Math.min(...projectTimes),
              max: Math.max(...projectTimes),
              avg: projectTimes.reduce((a, b) => a + b, 0) / projectTimes.length,
              median: projectTimes.sort((a, b) => a - b)[Math.floor(projectTimes.length / 2)]
            };
          }

          // Display results
          console.log(`\n📊 Benchmark Results`);
          console.log(`${'='.repeat(50)}`);

          for (const [operation, metrics] of Object.entries(results)) {
            const m = metrics as any;
            console.log(`\n${operation}:`);
            console.log(`   Iterations: ${m.iterations}`);
            console.log(`   Min:        ${m.min.toFixed(2)}ms`);
            console.log(`   Max:        ${m.max.toFixed(2)}ms`);
            console.log(`   Average:    ${m.avg.toFixed(2)}ms`);
            console.log(`   Median:     ${m.median.toFixed(2)}ms`);

            // Performance rating
            const avgTime = m.avg;
            let rating = '';
            if (avgTime < 10) {
              rating = '🚀 Excellent';
            } else if (avgTime < 50) {
              rating = '✅ Good';
            } else if (avgTime < 100) {
              rating = '⚠️  Fair';
            } else {
              rating = '❌ Needs optimization';
            }
            console.log(`   Rating:     ${rating}`);
          }

          console.log(`\n💡 Tips:`);
          console.log(`   • Run more iterations for accurate results`);
          console.log(`   • Optimize if operations take >100ms`);
          console.log(`   • Use: gitswitch perf optimize`);

        } catch (error: any) {
          CLIUtils.showError('Benchmark failed', error);
        }
      });
  }
}
