#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const program = new Command();

function getGitLog(since = 'yesterday') {
  try {
    const log = execSync(
      `git log --since="${since}" --until="now" --oneline --all --no-merges`,
      { encoding: 'utf-8', cwd: process.cwd() }
    ).trim();
    return log ? log.split('\n') : [];
  } catch (err) {
    return [];
  }
}

function getChangedFiles() {
  try {
    const diff = execSync(
      'git diff --name-status HEAD~5..HEAD 2>/dev/null || git diff --name-status HEAD',
      { encoding: 'utf-8', cwd: process.cwd() }
    ).trim();
    return diff ? diff.split('\n') : [];
  } catch (err) {
    return [];
  }
}

function categorizeChanges(commits, files) {
  const categories = {
    features: [],
    fixes: [],
    refactoring: [],
    docs: [],
    other: []
  };

  commits.forEach(commit => {
    const lower = commit.toLowerCase();
    if (lower.includes('feat') || lower.includes('add') || lower.includes('new')) {
      categories.features.push(commit);
    } else if (lower.includes('fix') || lower.includes('bug') || lower.includes('patch')) {
      categories.fixes.push(commit);
    } else if (lower.includes('refactor') || lower.includes('clean') || lower.includes('improve')) {
      categories.refactoring.push(commit);
    } else if (lower.includes('doc') || lower.includes('readme') || lower.includes('comment')) {
      categories.docs.push(commit);
    } else {
      categories.other.push(commit);
    }
  });

  return categories;
}

function generateStandup(commits, files, categories) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let report = `## Daily Standup — ${date}\n\n`;

  // Yesterday section
  report += `### Yesterday\n`;
  if (commits.length > 0) {
    if (categories.features.length > 0) {
      report += `**Features:**\n`;
      categories.features.slice(0, 3).forEach(c => {
        const msg = c.replace(/^[a-f0-9]+\s/, '');
        report += `- ${msg}\n`;
      });
    }
    if (categories.fixes.length > 0) {
      report += `**Fixes:**\n`;
      categories.fixes.slice(0, 3).forEach(c => {
        const msg = c.replace(/^[a-f0-9]+\s/, '');
        report += `- ${msg}\n`;
      });
    }
    if (categories.refactoring.length > 0) {
      report += `**Refactoring:**\n`;
      categories.refactoring.slice(0, 3).forEach(c => {
        const msg = c.replace(/^[a-f0-9]+\s/, '');
        report += `- ${msg}\n`;
      });
    }
    if (categories.other.length > 0) {
      report += `**Other:**\n`;
      categories.other.slice(0, 3).forEach(c => {
        const msg = c.replace(/^[a-f0-9]+\s/, '');
        report += `- ${msg}\n`;
      });
    }
  } else {
    report += `- No commits found since yesterday\n`;
  }

  report += `\n### Today\n`;
  report += `- Continue current work\n`;
  report += `- Review pending PRs\n`;
  report += `- Address any blockers\n`;

  report += `\n### Blockers\n`;
  report += `- None reported\n`;

  return report;
}

program
  .name('standup')
  .description('Generate daily standup report from git activity')
  .option('-d, --days <days>', 'Number of days to look back', '1')
  .option('-o, --output <file>', 'Output to file instead of console')
  .action(async (options) => {
    const since = `${options.days} days ago`;
    const commits = getGitLog(since);
    const files = getChangedFiles();
    const categories = categorizeChanges(commits, files);
    const report = generateStandup(commits, files, categories);

    if (options.output) {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.output, report);
      console.log(`Standup report saved to ${options.output}`);
    } else {
      console.log(report);
    }
  });

program.parse();
