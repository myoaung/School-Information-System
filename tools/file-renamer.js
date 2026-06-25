#!/usr/bin/env node

import { Command } from 'commander';
import { readdirSync, renameSync, statSync } from 'fs';
import { join, extname, basename, dirname } from 'path';

const program = new Command();

function getFiles(dir, recursive = false) {
  const files = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isFile()) {
      files.push({ path: fullPath, name: item, dir });
    } else if (recursive && stat.isDirectory()) {
      files.push(...getFiles(fullPath, recursive));
    }
  }

  return files;
}

function applyPattern(filename, pattern, options) {
  const ext = extname(filename);
  const name = basename(filename, ext);

  switch (pattern) {
    case 'prefix':
      return `${options.value}${filename}`;

    case 'suffix':
      return `${name}${options.value}${ext}`;

    case 'replace':
      return filename.replace(new RegExp(options.find, 'g'), options.replace || '');

    case 'lowercase':
      return filename.toLowerCase();

    case 'uppercase':
      return filename.toUpperCase();

    case 'kebab':
      return name
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase() + ext;

    case 'snake':
      return name
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase() + ext;

    case 'number':
      const num = String(options.start || 1).padStart(options.pad || 3, '0');
      options.start = (options.start || 1) + 1;
      return `${num}_${filename}`;

    case 'date':
      const date = new Date().toISOString().split('T')[0];
      return options.position === 'suffix'
        ? `${name}_${date}${ext}`
        : `${date}_${filename}`;

    default:
      return filename;
  }
}

program
  .name('file-renamer')
  .description('Batch rename files with patterns')
  .argument('<directory>', 'Directory containing files to rename')
  .option('-p, --pattern <pattern>', 'Rename pattern (prefix, suffix, replace, lowercase, uppercase, kebab, snake, number, date)')
  .option('-v, --value <value>', 'Value for prefix/suffix/replace')
  .option('-f, --find <find>', 'Text to find (for replace pattern)')
  .option('-r, --replace <replace>', 'Text to replace with')
  .option('-s, --start <number>', 'Start number for numbering', '1')
  .option('--pad <number>', 'Zero-padding for numbers', '3')
  .option('--position <position>', 'Position for date (prefix or suffix)', 'prefix')
  .option('--recursive', 'Process subdirectories')
  .option('--dry-run', 'Preview changes without applying')
  .option('--ext <extension>', 'Filter by file extension')
  .action((directory, options) => {
    try {
      const files = getFiles(directory, options.recursive);

      // Filter by extension if specified
      const filtered = options.ext
        ? files.filter(f => f.name.endsWith(options.ext))
        : files;

      if (filtered.length === 0) {
        console.log('No files found to rename.');
        return;
      }

      console.log(`Found ${filtered.length} files to process.\n`);

      const state = { start: parseInt(options.start) };
      const changes = [];

      for (const file of filtered) {
        const newName = applyPattern(file.name, options.pattern, {
          value: options.value,
          find: options.find,
          replace: options.replace,
          start: state.start,
          pad: parseInt(options.pad),
          position: options.position
        });

        if (newName !== file.name) {
          changes.push({
            oldPath: file.path,
            newPath: join(file.dir, newName),
            oldName: file.name,
            newName
          });
        }

        state.start++;
      }

      if (changes.length === 0) {
        console.log('No changes to apply.');
        return;
      }

      // Preview changes
      console.log('Preview of changes:');
      changes.forEach(c => {
        console.log(`  ${c.oldName} → ${c.newName}`);
      });

      if (options.dryRun) {
        console.log(`\nDry run complete. ${changes.length} files would be renamed.`);
        return;
      }

      // Apply changes
      let success = 0;
      let errors = 0;

      for (const change of changes) {
        try {
          renameSync(change.oldPath, change.newPath);
          success++;
        } catch (err) {
          console.error(`Error renaming ${change.oldName}: ${err.message}`);
          errors++;
        }
      }

      console.log(`\nComplete: ${success} files renamed, ${errors} errors.`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
