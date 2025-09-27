/**
 * GitSwitch - Git Identity Management Tool
 * 
 * This package provides CLI application for managing
 * git identities across multiple projects and accounts.
 */

module.exports = {
  name: 'GitSwitch',
  version: require('./package.json').version,
  description: 'Git identity management tool',
  
  // Expose core functionality for programmatic usage
  core: {
    GitManager: require('@gitswitch/core').GitManager,
    StorageManager: require('@gitswitch/core').StorageManager,
    ProjectManager: require('@gitswitch/core').ProjectManager
  },
  
  // CLI path for advanced usage
  cliPath: require.resolve('./lib/cli.js')
};