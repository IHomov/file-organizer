import path from 'path';
import { Scanner } from './lib/scanner.js';
import { DuplicateFinder } from './lib/duplicates.js';
import { Organizer } from './lib/organizer.js';
import { Cleanup } from './lib/cleanup.js';

const args = process.argv.slice(2);
const command = args[0]; 

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function gatherFiles(directoryPath) {
  return new Promise((resolve) => {
    const scanner = new Scanner();
    const files = [];
    scanner.on('file-found', ({ file }) => files.push(file));
    scanner.on('scan-complete', () => resolve(files));
    scanner.scan(directoryPath).catch(() => resolve([]));
  });
}

if (command === 'scan') {
  const targetDir = args[1];
  if (!targetDir) {
    console.log('Error: Please provide a directory path.');
    process.exit(1);
  }

  const fileScanner = new Scanner();

  fileScanner.on('scan-start', (data) => {
    console.log(`Scanning: ${data.directory}`);
    process.stdout.write('Processing... ');
  });

  fileScanner.on('file-found', ({ currentCount }) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Processing... Files found: ${currentCount}`);
  });

  fileScanner.on('scan-complete', (stats) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);

    console.log('\nScan Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total files: ${stats.totalFiles}`);
    console.log(`Total size:  ${formatBytes(stats.totalSize)}`);
    
    console.log('\nBy File Type:');
    for (const [ext, data] of Object.entries(stats.types)) {
      console.log(`  ${ext.padEnd(7)} ${data.count.toString().padEnd(4)} files   ${formatBytes(data.totalSize)}`);
    }

    console.log('\nFile Age:');
    console.log(`  Last 7 days:    ${stats.age.last7Days} files`);
    console.log(`  Last 30 days:   ${stats.age.last30Days} files`);
    console.log(`  Older than 90:  ${stats.age.olderThan90} files`);

    console.log('\nLargest files:');
    stats.largestFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name.padEnd(20)} ${formatBytes(file.size)}`);
    });

    if (stats.oldestFile) {
      console.log(`\nOldest file: ${stats.oldestFile.name} (modified ${stats.oldestFile.daysAgo} days ago)`);
    } else {
      console.log('\nOldest file: No files found.');
    }
  });

fileScanner.scan(path.resolve(targetDir)).catch((error) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    
    if (error.code === 'ENOENT') {
      console.error(`❌ Error: Directory not found: ${path.resolve(targetDir)}`);
    } else if (error.code === 'EACCES') {
      console.error(`❌ Error: Permission denied: ${path.resolve(targetDir)}`);
    } else {
      console.error(`❌ Unexpected error: ${error.message}`);
    }
    process.exit(1);
  });

} else if (command === 'duplicates') {
  const targetDir = args[1];
  if (!targetDir) {
    console.log('Error: Please provide a directory path.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(targetDir);
  console.log(`Searching for duplicates in: ${resolvedPath}`);
  process.stdout.write('Gathering file list... ');

  gatherFiles(resolvedPath).then((fileList) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);

    if (fileList.length === 0) {
      console.log('No files found to process.');
      return;
    }

    const finder = new DuplicateFinder();
    process.stdout.write(`Calculating hashes... 0/${fileList.length} files`);

    finder.on('file-processed', ({ currentCount }) => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`Calculating hashes... ${currentCount}/${fileList.length} files`);
    });

    finder.on('duplicates-found', ({ duplicateGroups, totalWastedSpace }) => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);

      console.log(`\nFound ${duplicateGroups.length} duplicate groups (${formatBytes(totalWastedSpace)} wasted):`);

      if (duplicateGroups.length === 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('No duplicate files found.');
        return;
      }

      duplicateGroups.forEach((group, index) => {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Group ${index + 1} (${group.copiesCount} copies, ${formatBytes(group.singleFileSize)} each):`);
        console.log(`  SHA-256: ${group.hash.substring(0, 12)}...`);
        console.log('');
        
        group.files.forEach(filePath => {
          console.log(`  ${filePath}`);
        });
        
        console.log(`\n  Wasted space: ${formatBytes(group.wastedSpace)}`);
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total wasted space: ${formatBytes(totalWastedSpace)}`);
    });

    finder.findDuplicates(fileList);
  });

} else if (command === 'organize') {
  const sourceDir = args[1];
  const outputIdx = args.indexOf('--output');
  const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : null;

  if (!sourceDir || !outputDir) {
    console.log('Error: Invalid usage. Expected syntax:');
    console.log('node file-organizer.js organize <source-dir> --output <target-dir>');
    process.exit(1);
  }

  const resolvedSource = path.resolve(sourceDir);
  const resolvedOutput = path.resolve(outputDir);

  console.log(`Organizing: ${resolvedSource}`);
  console.log(`Target: ${resolvedOutput}\n`);
  console.log('Creating folders...');
  console.log('  ✓ Documents/');
  console.log('  ✓ Images/');
  console.log('  ✓ Archives/');
  console.log('  ✓ Code/');
  console.log('  ✓ Videos/');
  console.log('  ✓ Other/\n');

  process.stdout.write('Gathering file list... ');

  gatherFiles(resolvedSource).then((fileList) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);

    if (fileList.length === 0) {
      console.log('No files found to organize.');
      return;
    }

    const organizer = new Organizer();

    organizer.on('copy-complete', ({ currentCount }) => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`Copying files... ${currentCount}/${fileList.length}`);
    });

    organizer.organize(fileList, resolvedOutput).then((result) => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);

      console.log('\nOrganization complete!\n');
      console.log('Summary:');
      
      for (const [category, data] of Object.entries(result.stats)) {
        console.log(`  ${category.padEnd(11)}: ${data.count.toString().padEnd(4)} files -> ${data.path}`);
      }

      console.log(`\nTotal copied: ${result.totalFiles} files (${formatBytes(result.totalSize)})`);
    }).catch(err => {
      console.error(`\nFatal error during organization: ${err.message}`);
    });
  });

} else if (command === 'cleanup') {
  const targetDir = args[1];
  const olderThanIdx = args.indexOf('--older-than');
  const confirmDelete = args.includes('--confirm');

  if (!targetDir || olderThanIdx === -1 || !args[olderThanIdx + 1]) {
    console.log('Error: Invalid usage. Expected syntax:');
    console.log('node file-organizer.js cleanup <directory> --older-than <days> [--confirm]');
    process.exit(1);
  }

  const thresholdDays = parseInt(args[olderThanIdx + 1], 10);
  if (isNaN(thresholdDays)) {
    console.log('Error: --older-than parameter must be a valid number of days.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(targetDir);
  console.log(`Cleanup: ${resolvedPath}`);
  console.log(`Looking for files older than ${thresholdDays} days...`);
  process.stdout.write('Analyzing directory structure... ');

  gatherFiles(resolvedPath).then((fileList) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);

    const cleaner = new Cleanup();

    cleaner.on('cleanup-complete', (result) => {
      if (result.totalFiles === 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('No files matched the cleanup criteria.');
        return;
      }

      console.log(`\nFound ${result.totalFiles} files to delete:\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      result.filesFound.forEach(file => {
        console.log(`${file.name}`);
        console.log(`  Size: ${formatBytes(file.size)}`);
        console.log(`  Modified: ${file.daysOld} days ago (${file.formattedDate})`);
        console.log('');
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total: ${result.totalFiles} files (${formatBytes(result.totalSize)})`);

      if (!result.confirmDelete) {
        console.log('\nDRY RUN MODE: No files were deleted.');
        console.log('To actually delete these files, run with --confirm flag.');
      } else {
        console.log(`\nDELETING ${result.totalFiles} files (${formatBytes(result.totalSize)}). This action cannot be undone!`);
        console.log('Deleting...');
        console.log('\nCleanup complete!');
        console.log(`Deleted: ${result.deletedCount} files (${formatBytes(result.freedSpace)} freed)`);
      }
    });

    cleaner.runCleanup(fileList, thresholdDays, confirmDelete).catch(err => {
      console.error(`\nFatal error during cleanup execution: ${err.message}`);
    });
  });

} else {
  console.log('Error: Unknown command. Available commands: scan, duplicates, organize, cleanup');
}