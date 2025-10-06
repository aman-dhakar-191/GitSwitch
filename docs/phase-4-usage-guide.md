# Phase 4 Features Usage Guide

This guide demonstrates how to use the newly implemented Phase 4 Enterprise Features in GitSwitch.

## 🎯 Workflow Templates

Workflow templates allow you to create reusable sequences of git and identity operations.

### Creating a Workflow Template

```bash
# Interactive creation
gitswitch workflow template create

# With options
gitswitch workflow template create --name "Deploy Workflow" --description "Standard deployment process" --category custom
```

### Applying a Workflow Template

```bash
# List available templates
gitswitch workflow template list

# Apply a template
gitswitch workflow template apply <template-id>

# Apply to specific project
gitswitch workflow template apply <template-id> --project /path/to/project
```

### Recording Workflows

Record your workflow actions and convert them into reusable templates:

```bash
# Start recording
gitswitch workflow record --name "My Workflow"

# Perform your git operations...
# (commit, push, switch identities, etc.)

# Stop recording
gitswitch workflow record --stop
```

### Example: Creating a Deploy Workflow Template

```bash
# 1. Create the template
gitswitch workflow template create \
  --name "Production Deploy" \
  --description "Switch to prod account and deploy" \
  --category deploy

# 2. The template is now available for reuse across projects
gitswitch workflow template list

# 3. Apply it whenever you need to deploy
gitswitch workflow template apply <template-id>
```

## 🤖 Automation Templates

Pre-built automation rules for common scenarios with guided quickstart wizards.

### Viewing Available Templates

```bash
# List all automation templates
gitswitch auto template list

# Filter by category
gitswitch auto template list --category security
```

### Default Templates Available

1. **Auto-switch Work Account** - Automatically switch to work account for work projects
2. **Pre-Commit Identity Validation** - Validate git identity before each commit
3. **Auto-Sign Commits** - Automatically sign all commits with GPG/SSH

### Applying Automation Templates

```bash
# Interactive selection
gitswitch auto template apply

# Apply specific template by ID
gitswitch auto template apply <template-id>
```

### Searching Templates

```bash
# Search for specific templates
gitswitch auto template search "signing"
gitswitch auto template search "work"
gitswitch auto template search "validation"
```

### Quickstart Wizard

The quickstart wizard guides you through common automation scenarios:

```bash
gitswitch auto quickstart
```

Available quickstart scenarios:
- 👔 **Work & Personal Account Split** (3 min, easy)
- 🔒 **Commit Signing Setup** (5 min, moderate)
- 🛡️ **Git Hooks Validation** (2 min, easy)
- 📦 **Monorepo Management** (7 min, advanced)

### Example: Setting Up Work/Personal Split

```bash
# 1. Run quickstart
gitswitch auto quickstart

# 2. Select "Work & Personal Account Split"
# 3. Follow the prompts to configure:
#    - Work account selection
#    - Personal account selection
#    - Work project patterns (e.g., github.com/company-name)
#    - Confirmation

# 4. Done! Your automation rules are now active
```

## 🔧 History Rewriting

Safely rewrite git history with identity corrections and backup management.

### Analyzing Git History

Check your git history for identity issues:

```bash
# Analyze recent commits (default: last 10)
gitswitch git history analyze

# Analyze specific range
gitswitch git history analyze --range HEAD~20..HEAD

# Analyze all commits in a branch
gitswitch git history analyze --range main..feature-branch
```

Example output:
```
📊 History Analysis:
   Total commits: 15
   Commits needing fixes: 3
   Clean commits: 12

🔧 Commits needing fixes:

  abc1234: Fixed bug in login
    Current: old-email@example.com
    Suggested: correct-email@work.com

  def5678: Updated documentation
    Current: personal@gmail.com
    ⚠️  No matching account found
```

### Interactive History Rewriting

Fix identity issues in your git history:

```bash
# Interactive mode (prompts for confirmation)
gitswitch git history fix --interactive

# Specify commit range
gitswitch git history fix --interactive --range HEAD~5..HEAD

# Dry run (preview changes without applying)
gitswitch git history fix --dry-run --range HEAD~10..HEAD

# Skip backup (not recommended)
gitswitch git history fix --interactive --no-backup
```

The interactive mode will:
1. Analyze commits in the specified range
2. Identify commits with wrong identities
3. Suggest correct identities based on your accounts
4. Create a backup before rewriting
5. Apply the fixes
6. Show you how to restore if needed

### Verifying Commit Signatures

Check which commits are signed and valid:

```bash
# Verify recent commits
gitswitch git history verify-signatures

# Verify specific range
gitswitch git history verify-signatures --range HEAD~20..HEAD
```

Example output:
```
🔍 Signature Verification Results:

  ✅ abc1234: Valid
     Signer: John Doe <john@example.com>
  ⚠️  def5678: Invalid
     Signer: Unknown
  ❌ ghi9012: Not signed

📊 Summary:
   Total commits: 15
   Signed: 10
   Valid signatures: 8
   Unsigned: 5
```

### Managing History Backups

Before rewriting history, GitSwitch creates backups:

```bash
# List available backups
gitswitch git history backups

# Restore from a backup
git reset --hard refs/backups/gitswitch-2024-11-06T12-00-00-000Z
```

### Example: Fixing Recent Commits

```bash
# 1. Analyze your recent commits
gitswitch git history analyze --range HEAD~5..HEAD

# 2. Preview what will be fixed
gitswitch git history fix --dry-run --range HEAD~5..HEAD

# 3. Apply fixes with backup
gitswitch git history fix --interactive --range HEAD~5..HEAD

# 4. Verify the changes
git log --format="%h %an <%ae> %s" HEAD~5..HEAD

# 5. If needed, restore from backup
gitswitch git history backups
git reset --hard <backup-ref>
```

## 💡 Best Practices

### Workflow Templates
- Create templates for repetitive workflows
- Use meaningful names and descriptions
- Test templates in non-critical projects first
- Share templates across your team

### Automation Templates
- Start with the quickstart wizard for common scenarios
- Review default templates before applying
- Customize templates to match your workflow
- Monitor automation rules to ensure they work as expected

### History Rewriting
- Always create backups (use `--no-backup` only if you know what you're doing)
- Test with `--dry-run` first
- Work on a separate branch when possible
- Coordinate with your team before rewriting shared history
- Use `git history analyze` regularly to catch issues early

## 🚨 Important Notes

### History Rewriting Warnings
- **Never rewrite public/shared history** without team coordination
- **Always create backups** before rewriting history
- **Test in a separate branch** when possible
- **Force push carefully** after rewriting history (use `git push --force-with-lease`)
- **Communicate with your team** before and after history rewrites

### Automation Rules
- Test automation rules in a safe environment first
- Review rules periodically to ensure they still match your workflow
- Be careful with auto-fix settings in strict validation mode
- Monitor automation rule logs for unexpected behavior

### Workflow Templates
- Template variables should be clearly documented
- Test templates thoroughly before sharing with team
- Keep templates simple and focused on one workflow
- Update templates when workflows change

## 📚 Additional Resources

- Run `gitswitch --help` for full command reference
- Run `gitswitch <command> --help` for command-specific help
- Check the main README for overview and installation
- Review the project documentation for advanced features

## 🤝 Getting Help

If you encounter issues or need help:
1. Check command help: `gitswitch <command> --help`
2. Review error messages carefully
3. Try `--dry-run` or analyze mode first
4. Check your git configuration
5. Open an issue on GitHub with details
